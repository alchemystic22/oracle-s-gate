import { describe, expect, it } from "vitest";
import type { ParticipantCommand, ParticipantCommandEnvelope } from "../commands";
import type { ProtectedEvaluationDecision } from "../evaluator/index.protected";
import type { ProtectedEvaluationRequest } from "../evaluator/index.protected";
import {
  FixtureEvaluationProvider,
  GATE1_EVALUATION_POLICIES,
  Gate1AdaptiveEvaluationOrchestrator,
  MemoryAdaptiveThreadStore,
  MemoryProtectedEvaluationLedger,
  ProtectedEvaluationDecisionSchema,
  ProtectedEvaluationRequestSchema,
  getGate1EvaluationPolicy,
  isExactNotYetFormed,
  normalizeProtectedEvaluationDecision,
} from "../evaluator/index.protected";
import * as participantEvaluator from "../evaluator";
import { FALSE_ARRIVAL_ROUTE_ID } from "../gate1/constants";
import { GATE1_CANONICAL_MANIFEST } from "../gate1/manifest";
import { GATE1_QUESTIONS } from "../gate1/questions";
import { MemoryRitualTransactionalPersistenceAdapter } from "../persistence/transactionalMemory";
import { MemoryProtectedMappingProvider } from "../protected-store/memoryMappingProvider.protected";
import { MemorySessionResponseStore } from "../session/sessionResponseStore";
import { Gate1SceneConductor } from "../conductor/index.protected";
import { makeActiveHarness, makeParticipantEnvelope, PASS3_IDS, PASS3_NOW } from "./pass3Fixture";

async function activeRun(adapter: MemoryRitualTransactionalPersistenceAdapter) {
  const root = (await adapter.loadActive())!;
  return root.gateRuns[root.activeGateRunId!]!;
}

function envelopeFromRun(
  harness: ReturnType<typeof makeActiveHarness>,
  command: ParticipantCommand,
  commandId: string,
): ParticipantCommandEnvelope {
  const run = harness.root.gateRuns["gate-run-1"]!;
  return makeParticipantEnvelope(harness, command, {
    commandId,
    expectedStateRevision: run.stateRevision,
  });
}

async function submitAndEvaluate(input: {
  harness: ReturnType<typeof makeActiveHarness>;
  command: ParticipantCommand;
  commandId: string;
  provider?: FixtureEvaluationProvider;
  sessionResponses?: MemorySessionResponseStore;
  threadStore?: MemoryAdaptiveThreadStore;
}) {
  const envelope = envelopeFromRun(input.harness, input.command, input.commandId);
  const participantResult = await input.harness.conductor.executeParticipant({
    envelope,
    participantManifest: input.harness.manifest,
    nowUtc: PASS3_NOW,
    ids: PASS3_IDS,
  });
  expect(participantResult.status).toBe("awaiting_protected_resolution");
  const orchestrator = new Gate1AdaptiveEvaluationOrchestrator({
    adapter: input.harness.adapter,
    mappingProvider: input.harness.mappingProvider,
    canonicalManifest: GATE1_CANONICAL_MANIFEST,
    participantManifest: input.harness.manifest,
    conductor: input.harness.conductor,
    provider: input.provider ?? new FixtureEvaluationProvider(),
    sessionResponses: input.sessionResponses,
    threadStore: input.threadStore,
  });
  const result = await orchestrator.evaluateParticipantCommand({
    sourceParticipantCommandId: input.commandId,
    nowUtc: PASS3_NOW,
    sceneVisitId: "opaquevisitpass4000001",
  });
  return { envelope, orchestrator, result };
}

function reflectionCommand(
  harness: ReturnType<typeof makeActiveHarness>,
  text: string,
  responseId = "response-pass4",
): ParticipantCommand {
  return {
    kind: "submit_response",
    runtimeInteractionId: harness.scene.interaction!.runtimeInteractionId,
    runtimeQuestionId: harness.scene.interaction!.runtimeQuestionId!,
    responseId,
    text,
    declaredState: "draft",
  };
}

describe("Gate 1 Pass 4 schemas, policies, and boundaries", () => {
  it("uses strict protected request and decision schemas", () => {
    const request = {
      schemaVersion: 1,
      evaluationRequestId: "evalreq1",
      sourceParticipantCommandId: "cmd1",
      commandKind: "submit_response",
      expectedStateRevision: 1,
      runtimeSceneId: "opaquescene000000001",
      runtimeInteractionId: "opaqueinteraction1",
      runtimeQuestionId: "opaquequestion00001",
      canonicalSceneId: "G1-03",
      policyId: "gate1.G1-03.v1",
      policyVersion: 1,
      targetKind: "reflection",
      runtimeBinding: {
        manifestInstanceId: "opaquemanifest0001",
        manifestDigest: "digest",
        gateManifestVersion: "1.0.0",
        stage: "pre_route",
      },
      target: {
        kind: "reflection",
        responseId: "response1",
        text: "one specific event and one expected promise",
        storageClass: "persistent_private",
      },
      inputDigest: "evalinput1",
      issuedAtUtc: PASS3_NOW,
    };
    expect(ProtectedEvaluationRequestSchema.parse(request).canonicalSceneId).toBe("G1-03");
    expect(
      ProtectedEvaluationRequestSchema.safeParse({ ...request, routeTitle: "False Arrival" })
        .success,
    ).toBe(false);

    const decision = {
      schemaVersion: 1,
      evaluationRequestId: "evalreq1",
      evaluationDecisionId: "decision1",
      outcome: "satisfied",
      responseState: "grounded",
      confidence: "high",
      reasonCodes: ["directly_answers_prompt"],
      safety: { state: "clear", codes: [], emergency: false },
      provider: { kind: "fixture", providerId: "fixture" },
      decidedAtUtc: PASS3_NOW,
    };
    expect(ProtectedEvaluationDecisionSchema.parse(decision).outcome).toBe("satisfied");
    expect(
      ProtectedEvaluationDecisionSchema.safeParse({ ...decision, rationale: "free text" }).success,
    ).toBe(false);
  });

  it("keeps protected evaluator members out of the participant-safe barrel", () => {
    expect(Object.keys(participantEvaluator)).not.toContain("Gate1AdaptiveEvaluationOrchestrator");
    expect(Object.keys(participantEvaluator)).not.toContain("GATE1_EVALUATION_POLICIES");
    expect(Object.keys(participantEvaluator)).not.toContain("FixtureEvaluationProvider");
    expect(Object.keys(participantEvaluator)).not.toContain("ProtectedEvaluationRequestSchema");
  });

  it("covers all Gate 1 adaptive policies with exact major prompts", () => {
    expect(GATE1_EVALUATION_POLICIES).toHaveLength(19);
    expect(new Set(GATE1_EVALUATION_POLICIES.map((policy) => policy.canonicalSceneId)).size).toBe(
      19,
    );
    expect(getGate1EvaluationPolicy("G1-09" as never)?.semanticProviderRequired).toBe(false);
    expect(getGate1EvaluationPolicy("G1-06" as never)?.exactPrompt).toBe(
      GATE1_QUESTIONS.bridge.prompt,
    );
    expect(getGate1EvaluationPolicy("G1-07" as never)?.exactPrompt).toBe(
      GATE1_QUESTIONS.gateAxis.prompt,
    );
    expect(getGate1EvaluationPolicy("G1-12" as never)?.targetKind).toBe("readiness");
    for (const policy of GATE1_EVALUATION_POLICIES) {
      expect(policy.version).toBe(1);
      expect(policy.maxFollowups).toBe(1);
      expect(policy.allowedReasonCodes.length).toBeGreaterThan(0);
    }
  });

  it("normalizes unsafe or contradictory provider decisions", () => {
    const request = ProtectedEvaluationRequestSchema.parse({
      schemaVersion: 1,
      evaluationRequestId: "evalreq2",
      sourceParticipantCommandId: "cmd2",
      commandKind: "submit_response",
      expectedStateRevision: 1,
      runtimeSceneId: "opaquescene000000001",
      canonicalSceneId: "G1-03",
      policyId: "gate1.G1-03.v1",
      policyVersion: 1,
      targetKind: "reflection",
      runtimeBinding: {
        manifestInstanceId: "opaquemanifest0001",
        manifestDigest: "digest",
        gateManifestVersion: "1.0.0",
        stage: "pre_route",
      },
      target: {
        kind: "reflection",
        responseId: "response1",
        text: "specific grounded answer",
        storageClass: "persistent_private",
      },
      inputDigest: "evalinput1",
      issuedAtUtc: PASS3_NOW,
    });
    const policy = getGate1EvaluationPolicy("G1-03" as never)!;
    const lowSatisfied: ProtectedEvaluationDecision = {
      schemaVersion: 1,
      evaluationRequestId: request.evaluationRequestId,
      evaluationDecisionId: "decision-low",
      outcome: "satisfied",
      responseState: "grounded",
      confidence: "low",
      reasonCodes: ["directly_answers_prompt"],
      safety: { state: "clear", codes: [], emergency: false },
      provider: { kind: "fixture", providerId: "fixture" },
      decidedAtUtc: PASS3_NOW,
    };
    expect(
      normalizeProtectedEvaluationDecision({ request, policy, decision: lowSatisfied }).outcome,
    ).toBe("not_yet_formed");
  });
});

describe("Gate 1 Pass 4 adaptive orchestration", () => {
  it("honors exact not-yet-formed without provider, validation, or advancement", async () => {
    expect(isExactNotYetFormed(" I cannot name this clearly yet. ")).toBe(true);
    const harness = makeActiveHarness({ sceneIndex: 3 });
    const { result } = await submitAndEvaluate({
      harness,
      command: reflectionCommand(harness, "I cannot name this clearly yet."),
      commandId: "command-not-yet",
    });
    const run = await activeRun(harness.adapter);
    expect(result.status).toBe("applied");
    expect(result.guidance?.templateId).toBe("not_yet_formed_permission");
    expect(run.currentRuntimeSceneId).toBe(harness.scene.runtimeSceneId);
    expect(run.validation["g1.event_promise_separated"]).toBeUndefined();
    expect(Object.values(run.responses)[0]?.state).toBe("not_yet_formed");
  });

  it("advances grounded reflection only through protected conductor resolution", async () => {
    const harness = makeActiveHarness({ sceneIndex: 3 });
    const { result, orchestrator } = await submitAndEvaluate({
      harness,
      command: reflectionCommand(
        harness,
        "A specific grounded answer names the event and the expected promise.",
      ),
      commandId: "command-grounded",
    });
    const run = await activeRun(harness.adapter);
    expect(result.conductorResult?.status).toBe("advanced");
    expect(run.currentRuntimeSceneId).toBe(harness.scene.transitions[0]!.targetRuntimeSceneId);
    expect(run.validation["g1.event_promise_separated"]?.value).toBe(true);
    expect(JSON.stringify(orchestrator.ledger.all())).not.toContain("specific grounded answer");
    expect(JSON.stringify(result)).not.toContain("canonicalSceneId");
  });

  it("enforces one automated follow-up and then normalizes to not-yet-formed", async () => {
    const harness = makeActiveHarness({ sceneIndex: 3 });
    const threadStore = new MemoryAdaptiveThreadStore();
    const first = await submitAndEvaluate({
      harness,
      command: reflectionCommand(harness, "abstract philosophy", "response-followup-1"),
      commandId: "command-followup-1",
      threadStore,
    });
    expect(first.result.guidance?.kind).toBe("follow_up");
    expect(first.orchestrator.threadStore.all()[0]?.followupCount).toBe(1);

    const current = await activeRun(harness.adapter);
    harness.root.gateRuns["gate-run-1"] = current;
    const second = await submitAndEvaluate({
      harness,
      command: reflectionCommand(harness, "abstract philosophy again", "response-followup-2"),
      commandId: "command-followup-2",
      threadStore,
    });
    expect(second.result.guidance?.kind).toBe("not_yet_formed");
    expect((await activeRun(harness.adapter)).currentRuntimeSceneId).toBe(
      harness.scene.runtimeSceneId,
    );
  });

  it("blocks immediate safety language and does not expose protected reason codes", async () => {
    const harness = makeActiveHarness({ sceneIndex: 3 });
    const { result } = await submitAndEvaluate({
      harness,
      command: reflectionCommand(harness, "I might self harm tonight."),
      commandId: "command-safety",
    });
    const run = await activeRun(harness.adapter);
    expect(result.guidance?.kind).toBe("safety_pause");
    expect(run.status).toBe("blocked");
    expect(JSON.stringify(result)).not.toContain("immediate_self_harm_risk");
  });

  it("does not pathologize symbolic language by itself", async () => {
    const harness = makeActiveHarness({ sceneIndex: 3 });
    const { result } = await submitAndEvaluate({
      harness,
      command: reflectionCommand(harness, "One day reality cracked."),
      commandId: "command-symbolic",
    });
    const run = await activeRun(harness.adapter);
    expect(result.guidance?.kind).toBe("follow_up");
    expect(run.status).toBe("active");
    expect(run.safety.state).toBe("clear");
    expect(JSON.stringify(result)).not.toContain("severe_disorientation");
  });

  it("rescales unsafe Gate Acts without creating Sovereign Action material", async () => {
    const harness = makeActiveHarness({
      stage: "active_route",
      routeId: FALSE_ARRIVAL_ROUTE_ID,
      sceneIndex: 8,
    });
    const gateAct: ParticipantCommand = {
      kind: "submit_gate_act",
      runtimeInteractionId: harness.scene.interaction!.runtimeInteractionId,
      gateActId: "gate-act-pass4",
      act: "Confront them until they admit it",
      immediateMicroAct: "Confront them today",
      safetySelfReport: "safe",
    };
    const { result } = await submitAndEvaluate({
      harness,
      command: gateAct,
      commandId: "command-gate-act-rescale",
    });
    const run = await activeRun(harness.adapter);
    expect(result.guidance?.kind).toBe("rescale");
    expect(run.status).toBe("paused");
    expect(run.safety.state).toBe("rescale_required");
    expect(JSON.stringify(run)).not.toMatch(/sovereign|mark|grace|gift/i);
  });

  it("treats readiness understanding as one clarification, not completion", async () => {
    const harness = makeActiveHarness({
      stage: "active_route",
      routeId: FALSE_ARRIVAL_ROUTE_ID,
      sceneIndex: 10,
    });
    const { result } = await submitAndEvaluate({
      harness,
      command: reflectionCommand(harness, "I understood the page and plan to change."),
      commandId: "command-readiness",
    });
    const run = await activeRun(harness.adapter);
    expect(result.guidance?.templateId).toBe("clarify_outside_change");
    expect(run.currentRuntimeSceneId).toBe(harness.scene.runtimeSceneId);
    expect(run.validation["g1.readiness_confirmed"]).toBeUndefined();
  });

  it("rejects scheduled-only evidence as non-qualifying reality contact", async () => {
    const base = makeActiveHarness({
      stage: "active_route",
      routeId: FALSE_ARRIVAL_ROUTE_ID,
      sceneIndex: 9,
    });
    const root = structuredClone(base.root);
    root.gateRuns["gate-run-1"]!.gateAct = {
      gateActId: "gate-act-pass4-evidence",
      runtimeSceneId: base.manifest.scenes[8]!.runtimeSceneId,
      runtimeInteractionId: base.manifest.scenes[8]!.interaction!.runtimeInteractionId,
      sourceCommandId: "prior-gate-act",
      routeBindingRevision: base.manifest.routeBindingRevision,
      status: "accepted",
      activeRevision: 0,
      revisions: [
        {
          revision: 0,
          act: "Take one bounded action",
          immediateMicroAct: "Complete one observable step",
          participantSafetySelfReport: "safe",
          createdAtUtc: PASS3_NOW,
        },
      ],
      createdAtUtc: PASS3_NOW,
      updatedAtUtc: PASS3_NOW,
    };
    const adapter = new MemoryRitualTransactionalPersistenceAdapter(root);
    const mappingProvider = new MemoryProtectedMappingProvider();
    mappingProvider.put(base.compilation.protectedMapping);
    const conductor = new Gate1SceneConductor(adapter, mappingProvider, GATE1_CANONICAL_MANIFEST);
    const harness = { ...base, adapter, mappingProvider, conductor, root };
    const evidence: ParticipantCommand = {
      kind: "record_evidence",
      runtimeInteractionId: harness.scene.interaction!.runtimeInteractionId,
      evidenceEventId: "evidence-scheduled-pass4",
      gateActId: "gate-act-pass4-evidence",
      eventType: "continuation_scheduled",
      mode: "completion_marker",
      participantAttestation: "scheduled_only",
      occurredAtUtc: PASS3_NOW,
    };
    const { result } = await submitAndEvaluate({
      harness,
      command: evidence,
      commandId: "command-scheduled-evidence",
    });
    const run = await activeRun(adapter);
    expect(result.guidance?.templateId).toBe("evidence_requires_occurrence");
    expect(run.currentRuntimeSceneId).toBe(harness.scene.runtimeSceneId);
    expect(run.validation["g1.active_route_qualifying_evidence"]).toBeUndefined();
  });

  it("keeps session-only raw reflections volatile while still evaluable", async () => {
    const base = makeActiveHarness({ sceneIndex: 3 });
    const root = structuredClone(base.root);
    root.privacyMode = "session_only_reflections";
    const adapter = new MemoryRitualTransactionalPersistenceAdapter(root);
    const mappingProvider = new MemoryProtectedMappingProvider();
    mappingProvider.put(base.compilation.protectedMapping);
    const sessionResponses = new MemorySessionResponseStore();
    const conductor = new Gate1SceneConductor(
      adapter,
      mappingProvider,
      GATE1_CANONICAL_MANIFEST,
      sessionResponses,
    );
    const harness = { ...base, adapter, mappingProvider, conductor, root };
    const { result } = await submitAndEvaluate({
      harness,
      command: reflectionCommand(
        harness,
        "A specific grounded answer names the event and expected promise.",
      ),
      commandId: "command-session-only",
      sessionResponses,
    });
    const persisted = (await adapter.loadActive())!;
    expect(result.status).toBe("applied");
    expect(JSON.stringify(persisted)).not.toContain("specific grounded answer");
    const freshConductor = new Gate1SceneConductor(
      adapter,
      mappingProvider,
      GATE1_CANONICAL_MANIFEST,
    );
    expect(freshConductor).toBeInstanceOf(Gate1SceneConductor);
  });

  it("fails stale provider decisions closed after concurrent state movement", async () => {
    const harness = makeActiveHarness({ sceneIndex: 3 });
    const provider = {
      providerId: "staling-fixture",
      evaluate: async (request: ProtectedEvaluationRequest) => {
        const run = await activeRun(harness.adapter);
        await harness.conductor.executeParticipant({
          envelope: makeParticipantEnvelope(
            harness,
            { kind: "pause_run" },
            {
              commandId: "command-concurrent-pause",
              expectedStateRevision: run.stateRevision,
            },
          ),
          participantManifest: harness.manifest,
          nowUtc: PASS3_NOW,
          ids: PASS3_IDS,
        });
        return {
          schemaVersion: 1,
          evaluationRequestId: request.evaluationRequestId,
          evaluationDecisionId: "stale-decision",
          outcome: "satisfied",
          responseState: "grounded",
          confidence: "high",
          reasonCodes: ["directly_answers_prompt"],
          safety: { state: "clear", codes: [], emergency: false },
          provider: { kind: "fixture", providerId: "staling-fixture" },
          decidedAtUtc: PASS3_NOW,
        } as ProtectedEvaluationDecision;
      },
    };
    const envelope = envelopeFromRun(
      harness,
      reflectionCommand(harness, "specific grounded answer"),
      "command-stale-source",
    );
    const participantResult = await harness.conductor.executeParticipant({
      envelope,
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      ids: PASS3_IDS,
    });
    expect(participantResult.status).toBe("awaiting_protected_resolution");
    const orchestrator = new Gate1AdaptiveEvaluationOrchestrator({
      adapter: harness.adapter,
      mappingProvider: harness.mappingProvider,
      canonicalManifest: GATE1_CANONICAL_MANIFEST,
      participantManifest: harness.manifest,
      conductor: harness.conductor,
      provider,
    });
    const result = await orchestrator.evaluateParticipantCommand({
      sourceParticipantCommandId: "command-stale-source",
      nowUtc: PASS3_NOW,
      sceneVisitId: "opaquevisitstale0001",
    });
    expect(result.status).toBe("stale");
  });

  it("conceals inactive-route and protected evaluation material from participant output", async () => {
    const harness = makeActiveHarness({
      stage: "active_route",
      routeId: FALSE_ARRIVAL_ROUTE_ID,
      sceneIndex: 4,
    });
    const { result } = await submitAndEvaluate({
      harness,
      command: reflectionCommand(
        harness,
        "A specific grounded answer that should not reveal Splintered Trust.",
      ),
      commandId: "command-concealment",
    });
    const text = JSON.stringify(result);
    expect(text).not.toContain("Splintered Trust");
    expect(text).not.toContain("False Arrival");
    expect(text).not.toContain("false_arrival");
    expect(text).not.toContain("protectedRouteId");
  });
});
