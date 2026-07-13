import { ParticipantCommandEnvelopeSchema } from "../commands";
import { deterministicDigest } from "../commands/digests";
import {
  ProtectedCommandEnvelopeSchema,
  type ProtectedCommandEnvelope,
} from "../commands/protectedSchemas.protected";
import {
  ParticipantCommandResultSchema,
  type ParticipantCommandResult,
  type ParticipantCommandStatus,
} from "../commands/result";
import { validateProtectedParticipantManifestMapping } from "../compiler/index.protected";
import type { ParticipantManifest } from "../compiler/types";
import {
  RitualRuntimeRootSchema,
  type RitualGateRuntime,
  type RitualRuntimeRoot,
} from "../domain/runtime";
import type { Gate1CanonicalManifest } from "../manifest/sceneTypes";
import { recoverTransactionalRuntime } from "../persistence/recovery";
import type { RitualTransactionalPersistenceAdapter } from "../persistence/transactionalAdapter";
import { RitualTransactionCoordinator } from "../persistence/transactionCoordinator";
import type {
  ProtectedMappingProvider,
  ProtectedMappingTransaction,
} from "../protected-store/mappingProvider.protected";
import type { ProtectedEvaluationLedger } from "../evaluator/ledger.protected";
import {
  captureSessionResponses,
  hydrateSessionResponses,
  MemorySessionResponseStore,
  type SessionResponseStore,
} from "../session/sessionResponseStore";
import { applyRootPlan } from "./applyPlan";
import { ConductorAuthorizationError } from "./authorization";
import { bindParticipantCommand } from "./binding.protected";
import { planParticipantCommand, type ParticipantPlannerIds } from "./participantPlanner.protected";
import type { ConductorPlan } from "./planner";
import { planProtectedSceneResolution, planSafetyDirective } from "./protectedPlanner.protected";
import { planRouteReassessmentApplication } from "./routeReassessment.protected";
import { planCompilationActivation } from "./stageActivation.protected";

export type ConductorExecutionIds = ParticipantPlannerIds & {
  sceneVisitId: string;
};

function activeRun(root: RitualRuntimeRoot | null): RitualGateRuntime | undefined {
  return root?.activeGateRunId ? root.gateRuns[root.activeGateRunId] : undefined;
}

function safeResult(input: {
  commandId: string;
  status: ParticipantCommandStatus;
  participantMessageCode: string;
  run?: RitualGateRuntime;
}): ParticipantCommandResult {
  return ParticipantCommandResultSchema.parse({
    commandId: input.commandId,
    status: input.status,
    stateRevision: input.run?.stateRevision ?? 0,
    currentRuntimeSceneId: input.run?.currentRuntimeSceneId,
    lastStableRuntimeSceneId: input.run?.lastStableRuntimeSceneId,
    activeManifestInstanceId: input.run?.activeManifest?.manifestInstanceId,
    activeManifestStage: input.run?.activeManifest?.manifestStage,
    participantMessageCode: input.participantMessageCode,
  });
}

export class Gate1SceneConductor {
  private readonly coordinator: RitualTransactionCoordinator;

  constructor(
    private readonly adapter: RitualTransactionalPersistenceAdapter,
    private readonly mappingProvider: ProtectedMappingProvider,
    private readonly canonicalManifest: Gate1CanonicalManifest,
    private readonly sessionResponses: SessionResponseStore = new MemorySessionResponseStore(),
    private readonly evaluationLedger?: ProtectedEvaluationLedger,
  ) {
    this.coordinator = new RitualTransactionCoordinator(adapter);
  }

  private async commitPlan(
    root: RitualRuntimeRoot,
    plan: ConductorPlan,
    nowUtc: string,
  ): Promise<{ result: ParticipantCommandResult; volatileRuntime: RitualRuntimeRoot }> {
    const nextRuntime = applyRootPlan(root, plan);
    const committed = await this.coordinator.commit({
      expectedStateRevision: plan.expectedStateRevision,
      gateRunId: plan.gateRunId,
      privacyMode: root.privacyMode,
      nextRuntime,
      confirmStableScene: plan.sceneChanged,
      confirmedAtUtc: nowUtc,
    });
    return {
      result: safeResult({
        commandId: "internal",
        status: plan.status,
        participantMessageCode: plan.participantMessageCode,
        run: committed.runtime.gateRuns[plan.gateRunId],
      }),
      volatileRuntime: nextRuntime,
    };
  }

  private async commitWithPreparedMapping(input: {
    persistentRoot: RitualRuntimeRoot;
    volatileRoot: RitualRuntimeRoot;
    plan: ConductorPlan;
    transaction: ProtectedMappingTransaction;
    proposedManifestInstanceId: string;
    retiredManifestInstanceId?: string;
    nowUtc: string;
  }): Promise<{ result: ParticipantCommandResult; volatileRuntime: RitualRuntimeRoot }> {
    let committed: Awaited<ReturnType<Gate1SceneConductor["commitPlan"]>>;
    try {
      committed = await this.commitPlan(input.volatileRoot, input.plan, input.nowUtc);
    } catch (error) {
      await this.adapter.restoreActiveForCompensation(input.persistentRoot);
      try {
        input.transaction.rollback();
      } catch {
        // Prepared mappings are non-authorizing even when rollback reporting fails.
      }
      throw error;
    }

    try {
      input.transaction.commit();
      const proposed = this.mappingProvider.getByManifestInstanceId(
        input.proposedManifestInstanceId,
      );
      if (!proposed || proposed.retiredAtUtc) {
        throw new Error("Activated runtime mapping is unavailable");
      }
      if (input.retiredManifestInstanceId) {
        const retired = this.mappingProvider.getByManifestInstanceId(
          input.retiredManifestInstanceId,
        );
        if (!retired?.retiredAtUtc) {
          throw new Error("Prior protected mapping remains active");
        }
      }
      return committed;
    } catch (error) {
      await this.adapter.restoreActiveForCompensation(input.persistentRoot);
      try {
        input.transaction.rollback();
      } catch {
        // Runtime compensation already removed the proposed manifest authority.
      }
      throw error;
    }
  }

  async executeParticipant(input: {
    envelope: unknown;
    participantManifest: ParticipantManifest;
    nowUtc: string;
    ids: ConductorExecutionIds;
  }): Promise<ParticipantCommandResult> {
    const parsed = ParticipantCommandEnvelopeSchema.safeParse(input.envelope);
    const commandId =
      input.envelope && typeof input.envelope === "object" && "commandId" in input.envelope
        ? String(input.envelope.commandId)
        : "invalid-command";
    const loaded = await this.adapter.loadActive().catch(() => null);
    const persistedRoot = RitualRuntimeRootSchema.safeParse(loaded);
    if (!parsed.success || !persistedRoot.success) {
      return safeResult({
        commandId,
        status: "rejected_invalid",
        participantMessageCode: "command_invalid",
        run: persistedRoot.success ? activeRun(persistedRoot.data) : undefined,
      });
    }
    const root = hydrateSessionResponses(persistedRoot.data, this.sessionResponses);

    try {
      const bound = bindParticipantCommand({
        envelope: parsed.data,
        root,
        participantManifest: input.participantManifest,
        mappingProvider: this.mappingProvider,
        canonicalManifest: this.canonicalManifest,
      });
      const plan = planParticipantCommand(bound, input.nowUtc, input.ids);
      if (plan.status === "duplicate") {
        return safeResult({
          commandId,
          status: "duplicate",
          participantMessageCode: plan.participantMessageCode,
          run: bound.run,
        });
      }
      const committed = await this.commitPlan(root, plan, input.nowUtc);
      captureSessionResponses(committed.volatileRuntime, this.sessionResponses);
      return { ...committed.result, commandId };
    } catch (error) {
      const status = error instanceof ConductorAuthorizationError ? error.code : "rejected_invalid";
      return safeResult({
        commandId,
        status,
        participantMessageCode:
          status === "rejected_stale"
            ? "command_stale"
            : status === "rejected_unauthorized"
              ? "command_unauthorized"
              : "command_invalid",
        run: activeRun(root),
      });
    }
  }

  async executeProtected(input: {
    envelope: unknown;
    participantManifest?: ParticipantManifest;
    nowUtc: string;
    sceneVisitId: string;
  }): Promise<ParticipantCommandResult> {
    const parsed = ProtectedCommandEnvelopeSchema.safeParse(input.envelope);
    const protectedCommandId =
      input.envelope && typeof input.envelope === "object" && "protectedCommandId" in input.envelope
        ? String(input.envelope.protectedCommandId)
        : "invalid-protected-command";
    if (!parsed.success) {
      return safeResult({
        commandId: protectedCommandId,
        status: "rejected_invalid",
        participantMessageCode: "protected_command_invalid",
      });
    }
    if (parsed.data.command.kind === "recover_runtime") {
      const recovered = await recoverTransactionalRuntime(this.adapter);
      return safeResult({
        commandId: protectedCommandId,
        status: recovered.runtime ? "accepted" : "rejected_invalid",
        participantMessageCode: recovered.runtime ? "runtime_recovered" : "runtime_unrecoverable",
        run: activeRun(recovered.runtime),
      });
    }

    const loaded = RitualRuntimeRootSchema.safeParse(await this.adapter.loadActive());
    if (!loaded.success) {
      return safeResult({
        commandId: protectedCommandId,
        status: "rejected_invalid",
        participantMessageCode: "runtime_invalid",
      });
    }
    const persistentRoot = loaded.data;
    const root = hydrateSessionResponses(persistentRoot, this.sessionResponses);
    const run = activeRun(root);
    const replayProtectedCommand = [
      "activate_compilation",
      "apply_route_reassessment",
      "apply_safety_directive",
    ].includes(parsed.data.command.kind);
    const protectedCommandDigest = replayProtectedCommand
      ? deterministicDigest(parsed.data.command, "protected-command")
      : undefined;
    if (protectedCommandDigest) {
      const replay = this.mappingProvider.checkProtectedCommand(
        protectedCommandId,
        protectedCommandDigest,
      );
      if (replay !== "new") {
        return safeResult({
          commandId: protectedCommandId,
          status: replay === "duplicate" ? "duplicate" : "rejected_invalid",
          participantMessageCode:
            replay === "duplicate" ? "protected_command_duplicate" : "protected_command_conflict",
          run,
        });
      }
    }
    if (run && parsed.data.command.kind === "apply_scene_resolution") {
      const resolutionCommand = parsed.data.command;
      const receipt = run.commandReceipts.find(
        (candidate) => candidate.commandId === resolutionCommand.sourceCommandId,
      );
      if (receipt?.resolutionDigest) {
        const digest = deterministicDigest(resolutionCommand, "resolution");
        return safeResult({
          commandId: protectedCommandId,
          status: receipt.resolutionDigest === digest ? "duplicate" : "rejected_invalid",
          participantMessageCode:
            receipt.resolutionDigest === digest
              ? "resolution_already_applied"
              : "resolution_conflict",
          run,
        });
      }
    }
    if (!run || run.stateRevision !== parsed.data.expectedStateRevision) {
      return safeResult({
        commandId: protectedCommandId,
        status: "rejected_stale",
        participantMessageCode: "protected_command_stale",
        run,
      });
    }

    try {
      let plan: ConductorPlan;
      const command: ProtectedCommandEnvelope["command"] = parsed.data.command;
      let mappingTransaction: ProtectedMappingTransaction | undefined;
      let proposedManifestId: string | undefined;
      let oldManifestId: string | undefined;
      let retiredRouteBindingRevision: number | undefined;
      if (command.kind === "activate_compilation") {
        validateProtectedParticipantManifestMapping(command.compilation, this.canonicalManifest);
        const currentRecord = run.activeManifest
          ? this.mappingProvider.getByManifestInstanceId(run.activeManifest.manifestInstanceId)
          : null;
        if (run.activeManifest && (!currentRecord || currentRecord.retiredAtUtc)) {
          throw new Error("Current protected mapping unavailable");
        }
        plan = planCompilationActivation({
          run,
          compilation: command.compilation,
          canonicalManifest: this.canonicalManifest,
          activationReason: command.activationReason,
          currentMapping: currentRecord?.mapping,
          nowUtc: input.nowUtc,
          sceneVisitId: input.sceneVisitId,
        });
        oldManifestId = run.activeManifest?.manifestInstanceId;
        proposedManifestId = command.compilation.participantManifest.manifestInstanceId;
        mappingTransaction = this.mappingProvider.prepare({
          put: command.compilation.protectedMapping,
          retire: oldManifestId
            ? { manifestInstanceId: oldManifestId, retiredAtUtc: input.nowUtc }
            : undefined,
        });
      } else if (command.kind === "apply_scene_resolution") {
        if (!input.participantManifest) throw new Error("Participant manifest is required");
        const record = run.activeManifest
          ? this.mappingProvider.getByManifestInstanceId(run.activeManifest.manifestInstanceId)
          : null;
        if (!record || record.retiredAtUtc) throw new Error("Protected mapping unavailable");
        plan = planProtectedSceneResolution({
          run,
          participantManifest: input.participantManifest,
          mapping: record.mapping,
          canonicalManifest: this.canonicalManifest,
          command,
          nowUtc: input.nowUtc,
          sceneVisitId: input.sceneVisitId,
        });
        if (plan.status === "duplicate") {
          return safeResult({
            commandId: protectedCommandId,
            status: "duplicate",
            participantMessageCode: plan.participantMessageCode,
            run,
          });
        }
      } else if (command.kind === "apply_route_reassessment") {
        validateProtectedParticipantManifestMapping(
          command.reassessmentCompilation,
          this.canonicalManifest,
        );
        oldManifestId = run.activeManifest?.manifestInstanceId;
        retiredRouteBindingRevision = run.activeManifest?.routeBindingRevision;
        const previousRecord = oldManifestId
          ? this.mappingProvider.getByManifestInstanceId(oldManifestId)
          : null;
        if (!previousRecord || previousRecord.retiredAtUtc) {
          throw new Error("Previous protected mapping unavailable");
        }
        plan = planRouteReassessmentApplication({
          run,
          sourceCommandId: command.sourceCommandId,
          reassessmentCompilation: command.reassessmentCompilation,
          previousMapping: previousRecord.mapping,
          nowUtc: input.nowUtc,
          sceneVisitId: input.sceneVisitId,
        });
        proposedManifestId = command.reassessmentCompilation.participantManifest.manifestInstanceId;
        mappingTransaction = this.mappingProvider.prepare({
          put: command.reassessmentCompilation.protectedMapping,
          retire: {
            manifestInstanceId: oldManifestId!,
            retiredAtUtc: input.nowUtc,
          },
        });
      } else {
        plan = planSafetyDirective({
          run,
          state: command.state,
          protectedReasonCodes: command.protectedReasonCodes,
          nowUtc: input.nowUtc,
        });
      }

      const committed =
        mappingTransaction && proposedManifestId
          ? await this.commitWithPreparedMapping({
              persistentRoot,
              volatileRoot: root,
              plan,
              transaction: mappingTransaction,
              proposedManifestInstanceId: proposedManifestId,
              retiredManifestInstanceId: oldManifestId,
              nowUtc: input.nowUtc,
            })
          : await this.commitPlan(root, plan, input.nowUtc);
      captureSessionResponses(committed.volatileRuntime, this.sessionResponses);
      if (protectedCommandDigest) {
        this.mappingProvider.recordProtectedCommand(protectedCommandId, protectedCommandDigest);
      }
      if (
        command.kind === "apply_route_reassessment" &&
        retiredRouteBindingRevision !== undefined
      ) {
        this.evaluationLedger?.markRouteRevisionStale(retiredRouteBindingRevision, input.nowUtc);
      }
      return { ...committed.result, commandId: protectedCommandId };
    } catch {
      return safeResult({
        commandId: protectedCommandId,
        status: "rejected_invalid",
        participantMessageCode: "protected_command_invalid",
        run,
      });
    }
  }
}
