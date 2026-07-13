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
import type { ProtectedMappingProvider } from "../protected-store/mappingProvider.protected";
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
  ) {
    this.coordinator = new RitualTransactionCoordinator(adapter);
  }

  private async commitPlan(
    root: RitualRuntimeRoot,
    plan: ConductorPlan,
    nowUtc: string,
  ): Promise<ParticipantCommandResult> {
    const nextRuntime = applyRootPlan(root, plan);
    const committed = await this.coordinator.commit({
      expectedStateRevision: plan.expectedStateRevision,
      gateRunId: plan.gateRunId,
      privacyMode: root.privacyMode,
      nextRuntime,
      confirmStableScene: plan.sceneChanged,
      confirmedAtUtc: nowUtc,
    });
    return safeResult({
      commandId: "internal",
      status: plan.status,
      participantMessageCode: plan.participantMessageCode,
      run: committed.runtime.gateRuns[plan.gateRunId],
    });
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
    const root = RitualRuntimeRootSchema.safeParse(loaded);
    if (!parsed.success || !root.success) {
      return safeResult({
        commandId,
        status: "rejected_invalid",
        participantMessageCode: "command_invalid",
        run: root.success ? activeRun(root.data) : undefined,
      });
    }

    try {
      const bound = bindParticipantCommand({
        envelope: parsed.data,
        root: root.data,
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
      const result = await this.commitPlan(root.data, plan, input.nowUtc);
      return { ...result, commandId };
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
        run: activeRun(root.data),
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
    const root = loaded.data;
    const run = activeRun(root);
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
      let oldManifestId: string | undefined;
      if (command.kind === "activate_compilation") {
        validateProtectedParticipantManifestMapping(command.compilation, this.canonicalManifest);
        this.mappingProvider.put(command.compilation.protectedMapping);
        plan = planCompilationActivation({
          run,
          compilation: command.compilation,
          canonicalManifest: this.canonicalManifest,
          activationReason: command.activationReason,
          nowUtc: input.nowUtc,
          sceneVisitId: input.sceneVisitId,
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
        this.mappingProvider.put(command.reassessmentCompilation.protectedMapping);
        plan = planRouteReassessmentApplication({
          run,
          sourceCommandId: command.sourceCommandId,
          reassessmentCompilation: command.reassessmentCompilation,
          nowUtc: input.nowUtc,
          sceneVisitId: input.sceneVisitId,
        });
      } else {
        plan = planSafetyDirective({
          run,
          state: command.state,
          protectedReasonCodes: command.protectedReasonCodes,
          nowUtc: input.nowUtc,
        });
      }

      const result = await this.commitPlan(root, plan, input.nowUtc);
      if (oldManifestId) this.mappingProvider.retire(oldManifestId, input.nowUtc);
      return { ...result, commandId: protectedCommandId };
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
