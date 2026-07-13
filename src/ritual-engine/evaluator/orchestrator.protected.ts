import { deterministicDigest } from "../commands/digests";
import type { ParticipantCommandResult } from "../commands/result";
import type { ProtectedCommandEnvelope } from "../commands/protectedSchemas.protected";
import type { ParticipantManifest } from "../compiler/types";
import type { RitualGateRuntime, RitualRuntimeRoot } from "../domain/runtime";
import type { Gate1CanonicalManifest } from "../manifest/sceneTypes";
import type { RitualTransactionalPersistenceAdapter } from "../persistence/transactionalAdapter";
import type { ProtectedMappingProvider } from "../protected-store/mappingProvider.protected";
import {
  hydrateSessionResponses,
  type SessionResponseStore,
} from "../session/sessionResponseStore";
import { Gate1SceneConductor } from "../conductor/index.protected";
import {
  MemoryAdaptiveThreadStore,
  type AdaptiveThreadStore,
  type ParticipantAdaptiveThread,
} from "./adaptiveThreads";
import { normalizeProtectedEvaluationDecision } from "./decisionNormalizer.protected";
import type { ProtectedEvaluationDecision } from "./decisionSchema.protected";
import { getGate1EvaluationPolicy } from "./policies.gate1.protected";
import { protectedRenderGuidance } from "./guidanceRegistry.protected";
import {
  MemoryProtectedEvaluationLedger,
  type ProtectedEvaluationLedger,
  type ProtectedEvaluationLedgerEntry,
  type ProtectedEvaluationLedgerTransaction,
} from "./ledger.protected";
import type { Gate1EvaluationPolicy } from "./policyTypes.protected";
import type { ProtectedEvaluationProvider } from "./provider.protected";
import {
  ProtectedEvaluationRequestSchema,
  type ProtectedEvaluationRequest,
  type ProtectedEvaluationTarget,
} from "./requestSchema.protected";
import { runStructuralPreflight } from "./structuralPreflight.protected";
import {
  AdaptiveEvaluationApplicationResultSchema,
  type AdaptiveEvaluationApplicationResult,
} from "./participantResult";

function activeRun(root: RitualRuntimeRoot | null): RitualGateRuntime | undefined {
  return root?.activeGateRunId ? root.gateRuns[root.activeGateRunId] : undefined;
}

function targetRuntimeId(target: ProtectedEvaluationTarget): string {
  switch (target.kind) {
    case "reflection":
    case "readiness":
      return target.responseId;
    case "gate_act":
      return target.gateActId;
    case "evidence":
      return target.evidenceEventId;
    case "stance_selection":
      return `stance-${target.selectedOptionIndex}`;
  }
}

function requestThreadTargetId(request: ProtectedEvaluationRequest): string {
  return (
    request.runtimeQuestionId ?? request.runtimeInteractionId ?? targetRuntimeId(request.target)
  );
}

function activeGateActEvaluationView(run: RitualGateRuntime) {
  const gateAct = run.gateAct;
  if (!gateAct) return undefined;
  const revision = gateAct.revisions[gateAct.activeRevision];
  if (!revision) return undefined;
  return {
    gateActId: gateAct.gateActId,
    act: revision.act,
    immediateMicroAct: revision.immediateMicroAct,
    context: revision.context,
    continuationAction: revision.continuationAction,
    status: gateAct.status,
    routeBindingRevision: gateAct.routeBindingRevision,
    stale: gateAct.stale,
  };
}

function qualifyingEvidenceSummaries(run: RitualGateRuntime) {
  const activeRevision = run.activeManifest?.routeBindingRevision;
  return run.evidenceEvents
    .filter(
      (evidence) =>
        evidence.eventType === "micro_act_completed" &&
        evidence.participantAttestation === "occurred_outside_reflection" &&
        evidence.routeBindingRevision === activeRevision &&
        !evidence.stale,
    )
    .map((evidence) => ({
      evidenceEventId: evidence.evidenceEventId,
      gateActId: evidence.gateActId,
      eventType: "micro_act_completed" as const,
      participantAttestation: "occurred_outside_reflection" as const,
      mode: evidence.mode,
      description: evidence.description,
      routeBindingRevision: evidence.routeBindingRevision,
      stale: evidence.stale,
    }));
}

function guidanceKind(
  outcome: ProtectedEvaluationDecision["outcome"],
): "follow_up" | "not_yet_formed" | "rescale" | "safety_pause" | undefined {
  if (outcome === "needs_follow_up") return "follow_up";
  if (outcome === "not_yet_formed") return "not_yet_formed";
  if (outcome === "rescale_required") return "rescale";
  if (outcome === "blocked") return "safety_pause";
  return undefined;
}

function threadStateForOutcome(
  outcome: ProtectedEvaluationDecision["outcome"],
): ParticipantAdaptiveThread["state"] {
  return outcome === "needs_follow_up" ? "follow_up_issued" : outcome;
}

function findTarget(run: RitualGateRuntime, sourceCommandId: string): ProtectedEvaluationTarget {
  const response = Object.values(run.responses).find(
    (candidate) => candidate.sourceCommandId === sourceCommandId,
  );
  if (response) {
    const selectedOptionIndex = response.structuredSummary?.selectedOptionIndex;
    if (typeof selectedOptionIndex === "number") {
      return { kind: "stance_selection", selectedOptionIndex };
    }
    return {
      kind: "reflection",
      responseId: response.responseId,
      text: response.text,
      structuredSummary: response.structuredSummary,
      storageClass: response.storageClass,
      responseState: response.state,
    };
  }
  if (run.gateAct?.sourceCommandId === sourceCommandId) {
    const revision = run.gateAct.revisions[run.gateAct.activeRevision]!;
    return {
      kind: "gate_act",
      gateActId: run.gateAct.gateActId,
      act: revision.act,
      context: revision.context,
      immediateMicroAct: revision.immediateMicroAct,
      continuationAction: revision.continuationAction,
      safetySelfReport: revision.participantSafetySelfReport,
    };
  }
  const evidence = run.evidenceEvents.find(
    (candidate) => candidate.sourceCommandId === sourceCommandId,
  );
  if (evidence) {
    const activeGateAct = activeGateActEvaluationView(run);
    return {
      kind: "evidence",
      evidenceEventId: evidence.evidenceEventId,
      gateActId: evidence.gateActId,
      eventType: evidence.eventType,
      participantAttestation: evidence.participantAttestation,
      mode: evidence.mode,
      description: evidence.description,
      routeBindingRevision: evidence.routeBindingRevision,
      stale: evidence.stale,
      activeGateAct,
      activeRouteBindingRevision: run.activeManifest?.routeBindingRevision,
    };
  }
  throw new Error("Evaluation source target is unavailable");
}

function sourceRuntimeIds(run: RitualGateRuntime, sourceCommandId: string) {
  const response = Object.values(run.responses).find(
    (candidate) => candidate.sourceCommandId === sourceCommandId,
  );
  if (response) {
    return {
      runtimeInteractionId: response.runtimeInteractionId,
      runtimeQuestionId: response.runtimeQuestionId,
      responseId: response.responseId,
    };
  }
  if (run.gateAct?.sourceCommandId === sourceCommandId) {
    return {
      runtimeInteractionId: run.gateAct.runtimeInteractionId,
      gateActId: run.gateAct.gateActId,
    };
  }
  const evidence = run.evidenceEvents.find(
    (candidate) => candidate.sourceCommandId === sourceCommandId,
  );
  if (evidence) {
    return {
      runtimeInteractionId: evidence.runtimeInteractionId,
      evidenceEventId: evidence.evidenceEventId,
    };
  }
  return {};
}

export class Gate1AdaptiveEvaluationOrchestrator {
  readonly threadStore: AdaptiveThreadStore;
  readonly ledger: ProtectedEvaluationLedger;

  constructor(
    private readonly input: {
      adapter: RitualTransactionalPersistenceAdapter;
      mappingProvider: ProtectedMappingProvider;
      canonicalManifest: Gate1CanonicalManifest;
      participantManifest: ParticipantManifest;
      conductor: Gate1SceneConductor;
      provider: ProtectedEvaluationProvider;
      sessionResponses?: SessionResponseStore;
      threadStore?: AdaptiveThreadStore;
      ledger?: ProtectedEvaluationLedger;
    },
  ) {
    this.threadStore = input.threadStore ?? new MemoryAdaptiveThreadStore();
    this.ledger = input.ledger ?? new MemoryProtectedEvaluationLedger();
  }

  private async loadRuntime(): Promise<RitualRuntimeRoot> {
    const loaded = await this.input.adapter.loadActive();
    if (!loaded) throw new Error("Runtime is unavailable");
    return this.input.sessionResponses
      ? hydrateSessionResponses(loaded, this.input.sessionResponses)
      : loaded;
  }

  private buildRequest(input: {
    root: RitualRuntimeRoot;
    run: RitualGateRuntime;
    sourceParticipantCommandId: string;
    nowUtc: string;
  }): {
    request: ProtectedEvaluationRequest;
    policy: Gate1EvaluationPolicy;
    thread?: ParticipantAdaptiveThread;
  } {
    const receipt = input.run.commandReceipts.find(
      (candidate) => candidate.commandId === input.sourceParticipantCommandId,
    );
    if (!receipt || receipt.resolutionState !== "unresolved") {
      throw new Error("Evaluation source receipt is unavailable");
    }
    const manifestRef = input.run.activeManifest;
    if (!manifestRef) throw new Error("Active manifest is unavailable");
    const mappingRecord = this.input.mappingProvider.getByManifestInstanceId(
      manifestRef.manifestInstanceId,
    );
    if (!mappingRecord || mappingRecord.retiredAtUtc) {
      throw new Error("Protected mapping is unavailable");
    }
    const sceneMapping = mappingRecord.mapping.scenes[receipt.runtimeSceneId];
    if (!sceneMapping) throw new Error("Protected scene mapping is unavailable");
    const canonicalScene = this.input.canonicalManifest.scenes.find(
      (scene) => scene.canonicalSceneId === sceneMapping.canonicalSceneId,
    );
    const policy = getGate1EvaluationPolicy(sceneMapping.canonicalSceneId);
    if (!canonicalScene || !policy) throw new Error("Evaluation policy is unavailable");

    const rawTarget = findTarget(input.run, input.sourceParticipantCommandId);
    const target: ProtectedEvaluationTarget =
      policy.targetKind === "readiness" && rawTarget.kind === "reflection"
        ? {
            ...rawTarget,
            kind: "readiness",
            activeGateAct: activeGateActEvaluationView(input.run),
            qualifyingEvidence: qualifyingEvidenceSummaries(input.run),
          }
        : rawTarget;
    if (target.kind !== policy.targetKind) throw new Error("Evaluation target kind mismatch");
    const ids = sourceRuntimeIds(input.run, input.sourceParticipantCommandId);
    const inputDigest = deterministicDigest(target, "evalinput");
    const evaluationRequestId = deterministicDigest(
      {
        sourceParticipantCommandId: input.sourceParticipantCommandId,
        inputDigest,
        manifestInstanceId: manifestRef.manifestInstanceId,
        stateRevision: input.run.stateRevision,
      },
      "evalreq",
    );
    const threadTargetId =
      ids.runtimeQuestionId ?? ids.runtimeInteractionId ?? targetRuntimeId(target);
    const thread = Object.values(input.run.adaptiveThreads).find(
      (candidate) => candidate.targetRuntimeId === threadTargetId && candidate.state !== "stale",
    );
    const request = ProtectedEvaluationRequestSchema.parse({
      schemaVersion: 1,
      evaluationRequestId,
      sourceParticipantCommandId: input.sourceParticipantCommandId,
      commandKind: receipt.commandKind,
      participantId: input.root.participantId,
      journeyCycleId: input.run.journeyCycleId,
      gateRunId: input.run.gateRunId,
      gateId: input.run.gateId,
      expectedStateRevision: input.run.stateRevision,
      runtimeSceneId: receipt.runtimeSceneId,
      runtimeInteractionId: ids.runtimeInteractionId,
      runtimeQuestionId: ids.runtimeQuestionId,
      canonicalSceneId: sceneMapping.canonicalSceneId,
      canonicalQuestionId: ids.runtimeQuestionId
        ? mappingRecord.mapping.questions[ids.runtimeQuestionId]?.canonicalQuestionId
        : undefined,
      policyId: policy.policyId,
      policyVersion: policy.version,
      targetKind: policy.targetKind,
      runtimeBinding: {
        manifestInstanceId: manifestRef.manifestInstanceId,
        manifestDigest: manifestRef.manifestDigest,
        gateManifestVersion: manifestRef.canonicalManifestVersion,
        stage: manifestRef.manifestStage,
        routeBinding: mappingRecord.mapping.routeBinding,
      },
      routeToken: manifestRef.routeToken,
      routeBindingRevision: manifestRef.routeBindingRevision,
      target,
      inputDigest,
      issuedAtUtc: input.nowUtc,
    });
    return { request, policy, thread };
  }

  private createThread(input: {
    request: ProtectedEvaluationRequest;
    decision: ProtectedEvaluationDecision;
    policy: Gate1EvaluationPolicy;
    prior?: ParticipantAdaptiveThread;
    nowUtc: string;
  }): ParticipantAdaptiveThread {
    const targetId = requestThreadTargetId(input.request);
    const prior = input.prior;
    const guidance =
      input.decision.guidanceTemplateId && input.decision.outcome !== "satisfied"
        ? {
            templateId: input.decision.guidanceTemplateId,
            prompt: protectedRenderGuidance(input.policy, input.decision.guidanceTemplateId),
            renderedAtUtc: input.nowUtc,
          }
        : undefined;
    return {
      schemaVersion: 1,
      threadId: prior?.threadId ?? deterministicDigest({ targetId }, "thread"),
      targetRuntimeId: targetId,
      runtimeSceneId: input.request.runtimeSceneId,
      runtimeInteractionId: input.request.runtimeInteractionId,
      runtimeQuestionId: input.request.runtimeQuestionId,
      sourceParticipantCommandId: input.request.sourceParticipantCommandId,
      responseId:
        input.request.target.kind === "reflection" || input.request.target.kind === "readiness"
          ? input.request.target.responseId
          : undefined,
      state:
        input.decision.outcome === "needs_follow_up" ? "follow_up_issued" : input.decision.outcome,
      attemptCount: (prior?.attemptCount ?? 0) + 1,
      followupCount: input.decision.outcome === "needs_follow_up" ? 1 : (prior?.followupCount ?? 0),
      guidance,
      routeBindingRevision: input.request.runtimeBinding.routeBinding?.routeBindingRevision,
      createdAtUtc: prior?.createdAtUtc ?? input.nowUtc,
      updatedAtUtc: input.nowUtc,
    };
  }

  private ledgerEntry(input: {
    request: ProtectedEvaluationRequest;
    decision: ProtectedEvaluationDecision;
    policy: Gate1EvaluationPolicy;
    status: ProtectedEvaluationLedgerEntry["applicationStatus"];
    nowUtc: string;
  }): ProtectedEvaluationLedgerEntry {
    return {
      schemaVersion: 1,
      evaluationRequestId: input.request.evaluationRequestId,
      evaluationDecisionId: input.decision.evaluationDecisionId,
      sourceParticipantCommandId: input.request.sourceParticipantCommandId,
      manifestInstanceId: input.request.runtimeBinding.manifestInstanceId,
      manifestDigest: input.request.runtimeBinding.manifestDigest,
      manifestStage: input.request.runtimeBinding.stage,
      stateRevisionEvaluated: input.request.expectedStateRevision,
      runtimeSceneId: input.request.runtimeSceneId,
      runtimeInteractionId: input.request.runtimeInteractionId,
      runtimeQuestionId: input.request.runtimeQuestionId,
      canonicalSceneId: input.request.canonicalSceneId,
      protectedRouteId: input.request.runtimeBinding.routeBinding?.protectedRouteId,
      routeBindingRevision: input.request.runtimeBinding.routeBinding?.routeBindingRevision,
      policyId: input.policy.policyId,
      policyVersion: input.policy.version,
      inputDigest: input.request.inputDigest,
      decisionDigest: deterministicDigest(input.decision, "evaldecision"),
      providerId: input.decision.providerId,
      providerVersion: input.decision.providerVersion,
      applicationStatus: input.status,
      outcome: input.decision.outcome,
      confidence: input.decision.confidence,
      reasonCodes: input.decision.reasonCodes,
      safetyCodes: input.decision.safety.codes,
      createdAtUtc: input.nowUtc,
    };
  }

  async evaluateParticipantCommand(input: {
    sourceParticipantCommandId: string;
    nowUtc: string;
    sceneVisitId: string;
  }): Promise<AdaptiveEvaluationApplicationResult> {
    let request: ProtectedEvaluationRequest;
    let policy: Gate1EvaluationPolicy;
    let thread: ParticipantAdaptiveThread | undefined;
    let before: RitualRuntimeRoot | undefined;
    let run: RitualGateRuntime | undefined;
    try {
      before = await this.loadRuntime();
      run = activeRun(before)!;
      if (!run) throw new Error("Active run is unavailable");
      ({ request, policy, thread } = this.buildRequest({
        root: before,
        run,
        sourceParticipantCommandId: input.sourceParticipantCommandId,
        nowUtc: input.nowUtc,
      }));
    } catch {
      if (run) {
        const receipt = run.commandReceipts.find(
          (candidate) => candidate.commandId === input.sourceParticipantCommandId,
        );
        const prepared = this.ledger
          .all()
          .find(
            (entry) =>
              entry.sourceParticipantCommandId === input.sourceParticipantCommandId &&
              entry.applicationStatus === "prepared",
          );
        const expectedThread = prepared
          ? Object.values(run.adaptiveThreads).find(
              (candidate) =>
                candidate.sourceParticipantCommandId === input.sourceParticipantCommandId &&
                candidate.state === threadStateForOutcome(prepared.outcome),
            )
          : undefined;
        if (receipt?.resolutionState === "resolved" && prepared && expectedThread) {
          try {
            this.ledger.promotePrepared(
              prepared.evaluationRequestId,
              prepared.inputDigest,
              input.nowUtc,
            );
          } catch {
            return AdaptiveEvaluationApplicationResultSchema.parse({
              schemaVersion: 1,
              evaluationRequestId: prepared.evaluationRequestId,
              evaluationDecisionId: prepared.evaluationDecisionId,
              sourceParticipantCommandId: input.sourceParticipantCommandId,
              status: "rejected",
            });
          }
          return AdaptiveEvaluationApplicationResultSchema.parse({
            schemaVersion: 1,
            evaluationRequestId: prepared.evaluationRequestId,
            evaluationDecisionId: prepared.evaluationDecisionId,
            sourceParticipantCommandId: input.sourceParticipantCommandId,
            status: "duplicate",
          });
        }
      }
      return AdaptiveEvaluationApplicationResultSchema.parse({
        schemaVersion: 1,
        evaluationRequestId: "unavailable",
        sourceParticipantCommandId: input.sourceParticipantCommandId,
        status: "rejected",
      });
    }

    const existing = this.ledger.get(request.evaluationRequestId);
    if (existing?.inputDigest !== undefined && existing.inputDigest !== request.inputDigest) {
      return AdaptiveEvaluationApplicationResultSchema.parse({
        schemaVersion: 1,
        evaluationRequestId: request.evaluationRequestId,
        evaluationDecisionId: existing.evaluationDecisionId,
        sourceParticipantCommandId: input.sourceParticipantCommandId,
        status: "rejected",
      });
    }
    if (existing?.applicationStatus === "applied" || existing?.applicationStatus === "duplicate") {
      return AdaptiveEvaluationApplicationResultSchema.parse({
        schemaVersion: 1,
        evaluationRequestId: request.evaluationRequestId,
        evaluationDecisionId: existing.evaluationDecisionId,
        sourceParticipantCommandId: input.sourceParticipantCommandId,
        status: "duplicate",
      });
    }
    if (existing?.applicationStatus === "stale" || existing?.applicationStatus === "rejected") {
      return AdaptiveEvaluationApplicationResultSchema.parse({
        schemaVersion: 1,
        evaluationRequestId: request.evaluationRequestId,
        evaluationDecisionId: existing.evaluationDecisionId,
        sourceParticipantCommandId: input.sourceParticipantCommandId,
        status: "rejected",
      });
    }
    if (existing?.applicationStatus === "prepared") {
      const receipt = run.commandReceipts.find(
        (candidate) => candidate.commandId === input.sourceParticipantCommandId,
      );
      const expectedThreadState = threadStateForOutcome(existing.outcome);
      const expectedThread = Object.values(run.adaptiveThreads).find(
        (candidate) =>
          candidate.sourceParticipantCommandId === input.sourceParticipantCommandId &&
          candidate.state === expectedThreadState,
      );
      if (receipt?.resolutionState === "resolved" && expectedThread) {
        try {
          this.ledger.promotePrepared(
            existing.evaluationRequestId,
            existing.inputDigest,
            input.nowUtc,
          );
        } catch {
          return AdaptiveEvaluationApplicationResultSchema.parse({
            schemaVersion: 1,
            evaluationRequestId: request.evaluationRequestId,
            evaluationDecisionId: existing.evaluationDecisionId,
            sourceParticipantCommandId: input.sourceParticipantCommandId,
            status: "rejected",
          });
        }
        return AdaptiveEvaluationApplicationResultSchema.parse({
          schemaVersion: 1,
          evaluationRequestId: request.evaluationRequestId,
          evaluationDecisionId: existing.evaluationDecisionId,
          sourceParticipantCommandId: input.sourceParticipantCommandId,
          status: "duplicate",
        });
      }
      if (receipt?.resolutionState === "unresolved") {
        try {
          this.ledger.rollbackPrepared(existing.evaluationRequestId, existing.inputDigest);
        } catch {
          // A failed rollback leaves a prepared entry that prepare() can still commit on retry.
        }
      } else {
        return AdaptiveEvaluationApplicationResultSchema.parse({
          schemaVersion: 1,
          evaluationRequestId: request.evaluationRequestId,
          evaluationDecisionId: existing.evaluationDecisionId,
          sourceParticipantCommandId: input.sourceParticipantCommandId,
          status: "rejected",
        });
      }
    }

    let decision: ProtectedEvaluationDecision;
    try {
      const preflight = runStructuralPreflight({
        request,
        policy,
        activeThread: thread,
        decidedAtUtc: input.nowUtc,
      });
      const rawDecision = preflight ?? (await this.input.provider.evaluate(request, policy));
      decision = normalizeProtectedEvaluationDecision({
        request,
        policy,
        decision: rawDecision,
        activeThread: thread,
        expectedProvider: preflight
          ? {
              providerId: "structural-preflight",
              providerVersion: "1",
              deterministic: true,
            }
          : {
              providerId: this.input.provider.providerId,
              providerVersion: this.input.provider.providerVersion,
              deterministic: true,
            },
      });
    } catch {
      return AdaptiveEvaluationApplicationResultSchema.parse({
        schemaVersion: 1,
        evaluationRequestId: request.evaluationRequestId,
        sourceParticipantCommandId: input.sourceParticipantCommandId,
        status: "provider_failed",
      });
    }

    const afterProvider = await this.loadRuntime();
    const afterRun = activeRun(afterProvider);
    const afterManifest = afterRun?.activeManifest;
    let freshRequest: ProtectedEvaluationRequest | undefined;
    try {
      if (afterRun) {
        freshRequest = this.buildRequest({
          root: afterProvider,
          run: afterRun,
          sourceParticipantCommandId: input.sourceParticipantCommandId,
          nowUtc: input.nowUtc,
        }).request;
      }
    } catch {
      freshRequest = undefined;
    }
    if (
      !afterRun ||
      !freshRequest ||
      afterRun.stateRevision !== request.expectedStateRevision ||
      afterRun.currentRuntimeSceneId !== request.runtimeSceneId ||
      afterManifest?.manifestInstanceId !== request.runtimeBinding.manifestInstanceId ||
      afterManifest.manifestDigest !== request.runtimeBinding.manifestDigest ||
      afterManifest.manifestStage !== request.runtimeBinding.stage ||
      afterManifest.routeToken !== request.routeToken ||
      afterManifest.routeBindingRevision !== request.routeBindingRevision ||
      freshRequest.inputDigest !== request.inputDigest ||
      freshRequest.evaluationRequestId !== request.evaluationRequestId
    ) {
      return AdaptiveEvaluationApplicationResultSchema.parse({
        schemaVersion: 1,
        evaluationRequestId: request.evaluationRequestId,
        evaluationDecisionId: decision.evaluationDecisionId,
        sourceParticipantCommandId: input.sourceParticipantCommandId,
        status: "stale",
      });
    }

    const scene = this.input.participantManifest.scenes.find(
      (candidate) => candidate.runtimeSceneId === request.runtimeSceneId,
    );
    const adaptiveThread = this.createThread({
      request,
      decision,
      policy,
      prior: thread,
      nowUtc: input.nowUtc,
    });
    let ledgerTransaction: ProtectedEvaluationLedgerTransaction;
    try {
      ledgerTransaction = this.ledger.prepare(
        this.ledgerEntry({ request, decision, policy, status: "prepared", nowUtc: input.nowUtc }),
      );
    } catch {
      return AdaptiveEvaluationApplicationResultSchema.parse({
        schemaVersion: 1,
        evaluationRequestId: request.evaluationRequestId,
        evaluationDecisionId: decision.evaluationDecisionId,
        sourceParticipantCommandId: input.sourceParticipantCommandId,
        status: "rejected",
      });
    }
    const command: ProtectedCommandEnvelope = {
      schemaVersion: 1,
      protectedCommandId: `${request.evaluationRequestId}.resolution`,
      expectedStateRevision: afterRun.stateRevision,
      issuedAtUtc: input.nowUtc,
      command: {
        kind: "apply_scene_resolution",
        sourceCommandId: input.sourceParticipantCommandId,
        manifestInstanceId: request.runtimeBinding.manifestInstanceId,
        manifestDigest: request.runtimeBinding.manifestDigest,
        runtimeSceneId: request.runtimeSceneId,
        runtimeInteractionId: request.runtimeInteractionId,
        runtimeQuestionId: request.runtimeQuestionId,
        runtimeTransitionId:
          decision.outcome === "satisfied" ? scene?.transitions[0]?.runtimeTransitionId : undefined,
        outcome: decision.outcome,
        adaptiveThread,
      },
    };

    const conductorResult: ParticipantCommandResult = await this.input.conductor.executeProtected({
      envelope: command,
      participantManifest: this.input.participantManifest,
      nowUtc: input.nowUtc,
      sceneVisitId: input.sceneVisitId,
    });
    if (
      conductorResult.status === "rejected_invalid" ||
      conductorResult.status === "rejected_stale"
    ) {
      try {
        ledgerTransaction.rollback();
      } catch {
        // A prepared entry can remain recoverable if rollback reporting fails.
      }
      return AdaptiveEvaluationApplicationResultSchema.parse({
        schemaVersion: 1,
        evaluationRequestId: request.evaluationRequestId,
        evaluationDecisionId: decision.evaluationDecisionId,
        sourceParticipantCommandId: input.sourceParticipantCommandId,
        status: "rejected",
        conductorResult,
      });
    }

    try {
      ledgerTransaction.commitApplied(input.nowUtc);
    } catch {
      // The prepared ledger entry remains recoverable and includes the decision digest.
    }
    this.threadStore.upsert(adaptiveThread);
    const kind = guidanceKind(decision.outcome);
    const guidance =
      kind && decision.guidanceTemplateId
        ? {
            kind,
            templateId: decision.guidanceTemplateId,
            prompt: protectedRenderGuidance(policy, decision.guidanceTemplateId),
          }
        : undefined;
    return AdaptiveEvaluationApplicationResultSchema.parse({
      schemaVersion: 1,
      evaluationRequestId: request.evaluationRequestId,
      evaluationDecisionId: decision.evaluationDecisionId,
      sourceParticipantCommandId: input.sourceParticipantCommandId,
      status: conductorResult.status === "duplicate" ? "duplicate" : "applied",
      conductorResult,
      guidance,
    });
  }
}
