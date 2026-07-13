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
  GATE1_PROTECTED_EVALUATION_PROMPT_CONTRACT,
  createFixtureDecision,
  getGate1EvaluationPolicy,
  isExactNotYetFormed,
  normalizeProtectedEvaluationDecision,
  runStructuralPreflight,
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
  declaredState: "draft" | "not_yet_formed" = "draft",
): ParticipantCommand {
  return {
    kind: "submit_response",
    runtimeInteractionId: harness.scene.interaction!.runtimeInteractionId,
    runtimeQuestionId: harness.scene.interaction!.runtimeQuestionId!,
    responseId,
    text,
    declaredState,
  };
}

function providerWith(input: {
  commandId: string;
  outcome: ProtectedEvaluationDecision["outcome"];
  reasonCodes?: ProtectedEvaluationDecision["reasonCodes"];
  supportedFacets?: "all" | ProtectedEvaluationDecision["supportedFacets"];
  guidanceTemplateId?: ProtectedEvaluationDecision["guidanceTemplateId"];
  safety?: ProtectedEvaluationDecision["safety"];
  confidence?: ProtectedEvaluationDecision["confidence"];
}) {
  return new FixtureEvaluationProvider({
    [input.commandId]: (request, policy) =>
      createFixtureDecision({
        request,
        policy,
        outcome: input.outcome,
        confidence: input.confidence,
        supportedFacets:
          input.supportedFacets === "all" ? policy.requiredFacets : input.supportedFacets,
        reasonCodes: input.reasonCodes ?? ["directly_answers_prompt"],
        guidanceTemplateId: input.guidanceTemplateId,
        safety: input.safety,
        fixtureId: input.commandId,
      }),
  });
}

describe("Gate 1 Pass 4 schemas, policies, and boundaries", () => {
  it("uses strict protected request and decision schemas", () => {
    const request = {
      schemaVersion: 1,
      evaluationRequestId: "evalreq1",
      participantId: "participant-1",
      journeyCycleId: "cycle-1",
      gateRunId: "gate-run-1",
      gateId: 1,
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
        responseState: "draft",
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
      sourceParticipantCommandId: "cmd1",
      inputDigest: "evalinput1",
      policyId: "gate1.G1-03.v1",
      policyVersion: 1,
      providerId: "fixture",
      providerVersion: "1",
      deterministic: true,
      outcome: "satisfied",
      responseState: "grounded",
      confidence: "high",
      supportedFacets: [
        "identifies_event_or_condition",
        "identifies_expected_promise",
        "distinguishes_event_from_promise",
      ],
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
    expect(Object.keys(participantEvaluator)).not.toContain(
      "GATE1_PROTECTED_EVALUATION_PROMPT_CONTRACT",
    );
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
      participantId: "participant-1",
      journeyCycleId: "cycle-1",
      gateRunId: "gate-run-1",
      gateId: 1,
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
        responseState: "draft",
        text: "specific grounded answer",
        storageClass: "persistent_private",
      },
      inputDigest: "evalinput1",
      issuedAtUtc: PASS3_NOW,
    });
    const policy = getGate1EvaluationPolicy("G1-03" as never)!;
    const lowSatisfied = createFixtureDecision({
      request,
      policy,
      fixtureId: "decision-low",
      outcome: "satisfied",
      confidence: "low",
      supportedFacets: policy.requiredFacets,
      reasonCodes: ["directly_answers_prompt"],
    });
    expect(
      normalizeProtectedEvaluationDecision({ request, policy, decision: lowSatisfied }).outcome,
    ).toBe("not_yet_formed");

    const genericSatisfied = createFixtureDecision({
      request,
      policy,
      fixtureId: "decision-generic",
      outcome: "satisfied",
      supportedFacets: ["identifies_event_or_condition"],
      reasonCodes: ["directly_answers_prompt"],
    });
    const normalized = normalizeProtectedEvaluationDecision({
      request,
      policy,
      decision: genericSatisfied,
    });
    expect(normalized.outcome).toBe("needs_follow_up");

    expect(() =>
      normalizeProtectedEvaluationDecision({
        request,
        policy,
        decision: {
          ...genericSatisfied,
          provider: { kind: "fixture", providerId: "other-provider" },
        },
      }),
    ).toThrow();
    expect(() =>
      normalizeProtectedEvaluationDecision({
        request,
        policy,
        decision: {
          ...genericSatisfied,
          outcome: "blocked",
          safety: { state: "clear", codes: [], emergency: false },
        },
      }),
    ).toThrow();
  });

  it("defines a protected future prompt contract without a production provider", () => {
    expect(GATE1_PROTECTED_EVALUATION_PROMPT_CONTRACT.executable).toBe(false);
    expect(GATE1_PROTECTED_EVALUATION_PROMPT_CONTRACT.rules.join(" ")).toContain(
      "Return strict JSON",
    );
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

  it("honors declared not-yet-formed even without the canonical phrase", async () => {
    const harness = makeActiveHarness({ sceneIndex: 3 });
    const { result } = await submitAndEvaluate({
      harness,
      command: reflectionCommand(harness, "", "response-declared-not-yet", "not_yet_formed"),
      commandId: "command-declared-not-yet",
    });
    const run = await activeRun(harness.adapter);
    expect(result.guidance?.templateId).toBe("not_yet_formed_permission");
    expect(run.currentRuntimeSceneId).toBe(harness.scene.runtimeSceneId);
    expect(run.validation["g1.event_promise_separated"]).toBeUndefined();
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
      provider: providerWith({
        commandId: "command-grounded",
        outcome: "satisfied",
        supportedFacets: "all",
      }),
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
      provider: providerWith({
        commandId: "command-followup-1",
        outcome: "needs_follow_up",
        reasonCodes: ["too_abstract"],
        guidanceTemplateId: "clarify_specific_event",
      }),
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
      provider: providerWith({
        commandId: "command-followup-2",
        outcome: "needs_follow_up",
        reasonCodes: ["too_abstract"],
        guidanceTemplateId: "clarify_specific_event",
      }),
    });
    expect(second.result.guidance?.kind).toBe("not_yet_formed");
    expect((await activeRun(harness.adapter)).currentRuntimeSceneId).toBe(
      harness.scene.runtimeSceneId,
    );
  });

  it("allows a grounded second response after the first follow-up", async () => {
    const harness = makeActiveHarness({ sceneIndex: 3 });
    const first = await submitAndEvaluate({
      harness,
      command: reflectionCommand(harness, "abstract philosophy", "response-grounded-second-1"),
      commandId: "command-grounded-second-1",
      provider: providerWith({
        commandId: "command-grounded-second-1",
        outcome: "needs_follow_up",
        reasonCodes: ["too_abstract"],
        guidanceTemplateId: "clarify_specific_event",
      }),
    });
    expect(first.result.guidance?.kind).toBe("follow_up");

    const current = await activeRun(harness.adapter);
    harness.root.gateRuns["gate-run-1"] = current;
    const second = await submitAndEvaluate({
      harness,
      command: reflectionCommand(
        harness,
        "A specific grounded answer names the event and expected promise.",
        "response-grounded-second-2",
      ),
      commandId: "command-grounded-second-2",
      provider: providerWith({
        commandId: "command-grounded-second-2",
        outcome: "satisfied",
        supportedFacets: "all",
      }),
    });
    const run = await activeRun(harness.adapter);
    expect(second.result.conductorResult?.status).toBe("advanced");
    expect(run.validation["g1.event_promise_separated"]?.value).toBe(true);
    expect(Object.values(run.adaptiveThreads)[0]?.state).toBe("satisfied");
  });

  it("blocks immediate safety language and does not expose protected reason codes", async () => {
    const harness = makeActiveHarness({ sceneIndex: 3 });
    const { result } = await submitAndEvaluate({
      harness,
      command: reflectionCommand(harness, "I might self harm tonight."),
      commandId: "command-safety",
      provider: providerWith({
        commandId: "command-safety",
        outcome: "blocked",
        reasonCodes: ["nonresponsive"],
        guidanceTemplateId: "safety_pause",
        safety: {
          state: "blocked",
          codes: ["immediate_self_harm_risk"],
          emergency: true,
        },
      }),
    });
    const run = await activeRun(harness.adapter);
    expect(result.guidance?.kind).toBe("safety_pause");
    expect(run.status).toBe("blocked");
    expect(JSON.stringify(result)).not.toContain("immediate_self_harm_risk");

    harness.root.gateRuns["gate-run-1"] = run;
    const revision = run.stateRevision;
    const revisionAttempt = await harness.conductor.executeParticipant({
      envelope: makeParticipantEnvelope(
        harness,
        reflectionCommand(harness, "I feel clear now.", "response-self-clear"),
        {
          commandId: "command-self-clear",
          expectedStateRevision: revision,
        },
      ),
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      ids: PASS3_IDS,
    });
    expect(revisionAttempt.status).toBe("rejected_unauthorized");
  });

  it("does not pathologize symbolic language by itself", async () => {
    const harness = makeActiveHarness({ sceneIndex: 3 });
    const { result } = await submitAndEvaluate({
      harness,
      command: reflectionCommand(harness, "One day reality cracked."),
      commandId: "command-symbolic",
      provider: providerWith({
        commandId: "command-symbolic",
        outcome: "needs_follow_up",
        reasonCodes: ["too_abstract"],
        guidanceTemplateId: "clarify_specific_event",
      }),
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
      provider: providerWith({
        commandId: "command-gate-act-rescale",
        outcome: "rescale_required",
        reasonCodes: ["act_is_confrontational"],
        guidanceTemplateId: "safety_rescale",
        safety: {
          state: "rescale_required",
          codes: ["dangerous_confrontation"],
          emergency: false,
        },
      }),
    });
    const run = await activeRun(harness.adapter);
    expect(result.guidance?.kind).toBe("rescale");
    expect(run.status).toBe("paused");
    expect(run.safety.state).toBe("rescale_required");
    expect(JSON.stringify(run)).not.toMatch(/sovereign|mark|grace|gift/i);
  });

  it("does not classify negated confrontation text in structural preflight", () => {
    const policy = getGate1EvaluationPolicy("FA-07" as never)!;
    const request = ProtectedEvaluationRequestSchema.parse({
      schemaVersion: 1,
      evaluationRequestId: "evalreq-no-confront-heuristic",
      participantId: "participant-1",
      journeyCycleId: "cycle-1",
      gateRunId: "gate-run-1",
      gateId: 1,
      sourceParticipantCommandId: "command-no-confront-heuristic",
      commandKind: "submit_gate_act",
      expectedStateRevision: 3,
      runtimeSceneId: "opaquescene000000001",
      runtimeInteractionId: "opaqueinteraction1",
      canonicalSceneId: "FA-07",
      policyId: policy.policyId,
      policyVersion: 1,
      targetKind: "gate_act",
      runtimeBinding: {
        manifestInstanceId: "opaquemanifest0001",
        manifestDigest: "digest",
        gateManifestVersion: "1.0.0",
        stage: "active_route",
        routeBinding: {
          protectedRouteId: FALSE_ARRIVAL_ROUTE_ID,
          routeToken: "opaqueroutetoken1",
          routeBindingRevision: 2,
        },
      },
      routeToken: "opaqueroutetoken1",
      routeBindingRevision: 2,
      target: {
        kind: "gate_act",
        gateActId: "gate-act-no-confront",
        act: "I will not confront them.",
        immediateMicroAct: "Write down one action I control.",
        safetySelfReport: "safe",
      },
      inputDigest: "evalinput-no-confront",
      issuedAtUtc: PASS3_NOW,
    });
    expect(runStructuralPreflight({ request, policy, decidedAtUtc: PASS3_NOW })).toBeUndefined();
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
      provider: providerWith({
        commandId: "command-readiness",
        outcome: "needs_follow_up",
        reasonCodes: ["only_understanding"],
        guidanceTemplateId: "clarify_outside_change",
      }),
    });
    const run = await activeRun(harness.adapter);
    expect(result.guidance?.templateId).toBe("clarify_outside_change");
    expect(run.currentRuntimeSceneId).toBe(harness.scene.runtimeSceneId);
    expect(run.validation["g1.readiness_confirmed"]).toBeUndefined();
  });

  it("sends minimized Gate Act and current-route evidence context for readiness", async () => {
    const base = makeActiveHarness({
      stage: "active_route",
      routeId: FALSE_ARRIVAL_ROUTE_ID,
      sceneIndex: 10,
    });
    const root = structuredClone(base.root);
    const run = root.gateRuns["gate-run-1"]!;
    run.gateAct = {
      gateActId: "gate-act-readiness-context",
      runtimeSceneId: base.manifest.scenes[8]!.runtimeSceneId,
      runtimeInteractionId: base.manifest.scenes[8]!.interaction!.runtimeInteractionId,
      sourceCommandId: "prior-gate-act-readiness",
      routeBindingRevision: base.manifest.routeBindingRevision,
      status: "accepted",
      activeRevision: 0,
      revisions: [
        {
          revision: 0,
          act: "Take one bounded action",
          immediateMicroAct: "Complete one observable step",
          continuationAction: "Notice what changed after the step",
          participantSafetySelfReport: "safe",
          createdAtUtc: PASS3_NOW,
        },
      ],
      createdAtUtc: PASS3_NOW,
      updatedAtUtc: PASS3_NOW,
    };
    run.evidenceEvents = [
      {
        evidenceEventId: "evidence-current-readiness",
        gateActId: "gate-act-readiness-context",
        eventType: "micro_act_completed",
        mode: "self_attested_description",
        description: "I completed the observable step.",
        participantAttestation: "occurred_outside_reflection",
        routeBindingRevision: base.manifest.routeBindingRevision,
        occurredAtUtc: PASS3_NOW,
      },
      {
        evidenceEventId: "evidence-inactive-readiness",
        gateActId: "gate-act-old-route",
        eventType: "micro_act_completed",
        mode: "completion_marker",
        participantAttestation: "occurred_outside_reflection",
        routeBindingRevision: 99,
        occurredAtUtc: PASS3_NOW,
      },
    ];
    const adapter = new MemoryRitualTransactionalPersistenceAdapter(root);
    const mappingProvider = new MemoryProtectedMappingProvider();
    mappingProvider.put(base.compilation.protectedMapping);
    const conductor = new Gate1SceneConductor(adapter, mappingProvider, GATE1_CANONICAL_MANIFEST);
    const harness = { ...base, adapter, mappingProvider, conductor, root };
    const { result } = await submitAndEvaluate({
      harness,
      command: reflectionCommand(harness, "I did the step and saw what changed."),
      commandId: "command-readiness-context",
      provider: new FixtureEvaluationProvider({
        "command-readiness-context": (request, policy) => {
          expect(request.target.kind).toBe("readiness");
          if (request.target.kind !== "readiness") throw new Error("Expected readiness target");
          expect(request.target.activeGateAct?.gateActId).toBe("gate-act-readiness-context");
          expect(request.target.activeGateAct?.act).toBe("Take one bounded action");
          expect(request.target.activeGateAct?.continuationAction).toBe(
            "Notice what changed after the step",
          );
          expect(request.target.qualifyingEvidence).toHaveLength(1);
          expect(request.target.qualifyingEvidence[0]?.evidenceEventId).toBe(
            "evidence-current-readiness",
          );
          expect(JSON.stringify(request.target)).not.toContain("evidence-inactive-readiness");
          return createFixtureDecision({
            request,
            policy,
            outcome: "satisfied",
            supportedFacets: policy.requiredFacets,
            reasonCodes: ["identifies_outside_change"],
          });
        },
      }),
    });
    expect(result.status).toBe("applied");
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

  it("applies completed matching evidence through governed provider facets", async () => {
    const base = makeActiveHarness({
      stage: "active_route",
      routeId: FALSE_ARRIVAL_ROUTE_ID,
      sceneIndex: 9,
    });
    const root = structuredClone(base.root);
    root.gateRuns["gate-run-1"]!.gateAct = {
      gateActId: "gate-act-pass4-evidence-match",
      runtimeSceneId: base.manifest.scenes[8]!.runtimeSceneId,
      runtimeInteractionId: base.manifest.scenes[8]!.interaction!.runtimeInteractionId,
      sourceCommandId: "prior-gate-act-match",
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
      evidenceEventId: "evidence-match-pass4",
      gateActId: "gate-act-pass4-evidence-match",
      eventType: "micro_act_completed",
      mode: "completion_marker",
      participantAttestation: "occurred_outside_reflection",
      occurredAtUtc: PASS3_NOW,
    };
    const { result } = await submitAndEvaluate({
      harness,
      command: evidence,
      commandId: "command-evidence-match",
      provider: new FixtureEvaluationProvider({
        "command-evidence-match": (request, policy) => {
          expect(request.target.kind).toBe("evidence");
          if (request.target.kind !== "evidence") throw new Error("Expected evidence target");
          expect(request.target.activeGateAct?.gateActId).toBe("gate-act-pass4-evidence-match");
          expect(request.target.activeGateAct?.act).toBe("Take one bounded action");
          expect(request.target.activeGateAct?.immediateMicroAct).toBe(
            "Complete one observable step",
          );
          expect(request.target.activeGateAct?.routeBindingRevision).toBe(
            base.manifest.routeBindingRevision,
          );
          expect(request.target.activeRouteBindingRevision).toBe(
            base.manifest.routeBindingRevision,
          );
          return createFixtureDecision({
            request,
            policy,
            outcome: "satisfied",
            supportedFacets: policy.requiredFacets,
            reasonCodes: ["completed_outside_reflection", "matches_active_gate_act"],
          });
        },
      }),
    });
    const run = await activeRun(adapter);
    expect(result.conductorResult?.status).toBe("advanced");
    expect(run.validation["g1.active_route_qualifying_evidence"]?.value).toBe(true);
  });

  it("keeps unrelated completed evidence from satisfying the scene", async () => {
    const base = makeActiveHarness({
      stage: "active_route",
      routeId: FALSE_ARRIVAL_ROUTE_ID,
      sceneIndex: 9,
    });
    const root = structuredClone(base.root);
    root.gateRuns["gate-run-1"]!.gateAct = {
      gateActId: "gate-act-pass4-evidence-unrelated",
      sourceCommandId: "prior-gate-act-unrelated",
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
      evidenceEventId: "evidence-unrelated-pass4",
      gateActId: "gate-act-pass4-evidence-unrelated",
      eventType: "micro_act_completed",
      mode: "completion_marker",
      participantAttestation: "occurred_outside_reflection",
      description: "I understood the page.",
      occurredAtUtc: PASS3_NOW,
    };
    const { result } = await submitAndEvaluate({
      harness,
      command: evidence,
      commandId: "command-evidence-unrelated",
      provider: providerWith({
        commandId: "command-evidence-unrelated",
        outcome: "needs_follow_up",
        reasonCodes: ["does_not_match_gate_act"],
        supportedFacets: [
          "evidence_occurred",
          "evidence_outside_reflection",
          "evidence_current_route_revision",
          "evidence_not_stale",
        ],
        guidanceTemplateId: "evidence_link_to_gate_act",
      }),
    });
    const run = await activeRun(adapter);
    expect(result.guidance?.templateId).toBe("evidence_link_to_gate_act");
    expect(run.currentRuntimeSceneId).toBe(harness.scene.runtimeSceneId);
    expect(run.validation["g1.active_route_qualifying_evidence"]).toBeUndefined();
  });

  it("structurally rejects stale and wrong-revision evidence before semantic match", () => {
    const policy = getGate1EvaluationPolicy("FA-08" as never)!;
    const baseRequest = ProtectedEvaluationRequestSchema.parse({
      schemaVersion: 1,
      evaluationRequestId: "evalreq-evidence-structural",
      participantId: "participant-1",
      journeyCycleId: "cycle-1",
      gateRunId: "gate-run-1",
      gateId: 1,
      sourceParticipantCommandId: "command-evidence-structural",
      commandKind: "record_evidence",
      expectedStateRevision: 3,
      runtimeSceneId: "opaquescene000000001",
      runtimeInteractionId: "opaqueinteraction1",
      canonicalSceneId: "FA-08",
      policyId: policy.policyId,
      policyVersion: 1,
      targetKind: "evidence",
      runtimeBinding: {
        manifestInstanceId: "opaquemanifest0001",
        manifestDigest: "digest",
        gateManifestVersion: "1.0.0",
        stage: "active_route",
        routeBinding: {
          protectedRouteId: FALSE_ARRIVAL_ROUTE_ID,
          routeToken: "opaqueroutetoken1",
          routeBindingRevision: 2,
        },
      },
      routeToken: "opaqueroutetoken1",
      routeBindingRevision: 2,
      target: {
        kind: "evidence",
        evidenceEventId: "evidence-structural",
        gateActId: "gate-act-1",
        eventType: "micro_act_completed",
        participantAttestation: "occurred_outside_reflection",
        mode: "completion_marker",
        routeBindingRevision: 1,
        activeRouteBindingRevision: 2,
        activeGateAct: {
          gateActId: "gate-act-1",
          act: "Take one bounded action",
          immediateMicroAct: "Complete one observable step",
          routeBindingRevision: 2,
          status: "accepted",
        },
      },
      inputDigest: "evalinput-evidence",
      issuedAtUtc: PASS3_NOW,
    });
    const wrongRevision = runStructuralPreflight({
      request: baseRequest,
      policy,
      decidedAtUtc: PASS3_NOW,
    });
    expect(wrongRevision?.outcome).toBe("not_yet_formed");
    if (baseRequest.target.kind !== "evidence") throw new Error("Expected evidence target");
    const stale = runStructuralPreflight({
      request: { ...baseRequest, target: { ...baseRequest.target, stale: true } },
      policy,
      decidedAtUtc: PASS3_NOW,
    });
    expect(stale?.outcome).toBe("not_yet_formed");
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
      provider: providerWith({
        commandId: "command-session-only",
        outcome: "satisfied",
        supportedFacets: "all",
      }),
    });
    const persisted = (await adapter.loadActive())!;
    expect(result.status).toBe("applied");
    expect(JSON.stringify(persisted)).not.toContain("specific grounded answer");
    expect(Object.values(persisted.gateRuns)[0]?.adaptiveThreads).toBeDefined();
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
      providerVersion: "1",
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
        const policy = getGate1EvaluationPolicy(request.canonicalSceneId)!;
        return createFixtureDecision({
          request,
          policy,
          fixtureId: "stale-decision",
          outcome: "satisfied",
          supportedFacets: policy.requiredFacets,
          reasonCodes: ["directly_answers_prompt"],
          providerId: "staling-fixture",
        });
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

  it("fails malformed provider output and provider exceptions without mutation", async () => {
    const malformedHarness = makeActiveHarness({ sceneIndex: 3 });
    const malformed = await submitAndEvaluate({
      harness: malformedHarness,
      command: reflectionCommand(malformedHarness, "specific answer"),
      commandId: "command-malformed-provider",
      provider: new FixtureEvaluationProvider({
        "command-malformed-provider": () => ({ bad: "shape" }) as never,
      }),
    });
    expect(malformed.result.status).toBe("provider_failed");
    expect((await activeRun(malformedHarness.adapter)).currentRuntimeSceneId).toBe(
      malformedHarness.scene.runtimeSceneId,
    );

    const failedHarness = makeActiveHarness({ sceneIndex: 3 });
    const failed = await submitAndEvaluate({
      harness: failedHarness,
      command: reflectionCommand(failedHarness, "specific answer"),
      commandId: "command-provider-throws",
      provider: new FixtureEvaluationProvider({
        "command-provider-throws": () => {
          throw new Error("fixture failure");
        },
      }),
    });
    expect(failed.result.status).toBe("provider_failed");
  });

  it("keeps ledger entries recoverable on commit failure and rejects digest conflicts", async () => {
    const harness = makeActiveHarness({ sceneIndex: 3 });
    const ledger = new MemoryProtectedEvaluationLedger();
    ledger.failNextAt("commit");
    const commandId = "command-ledger-commit-failure";
    const envelope = envelopeFromRun(
      harness,
      reflectionCommand(harness, "specific grounded answer"),
      commandId,
    );
    await harness.conductor.executeParticipant({
      envelope,
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      ids: PASS3_IDS,
    });
    const orchestrator = new Gate1AdaptiveEvaluationOrchestrator({
      adapter: harness.adapter,
      mappingProvider: harness.mappingProvider,
      canonicalManifest: GATE1_CANONICAL_MANIFEST,
      participantManifest: harness.manifest,
      conductor: harness.conductor,
      provider: providerWith({
        commandId,
        outcome: "satisfied",
        supportedFacets: "all",
      }),
      ledger,
    });
    const result = await orchestrator.evaluateParticipantCommand({
      sourceParticipantCommandId: commandId,
      nowUtc: PASS3_NOW,
      sceneVisitId: "opaquevisitledger0001",
    });
    expect(result.status).toBe("applied");
    const entry = ledger.all()[0]!;
    expect(entry.applicationStatus).toBe("prepared");
    const reconciled = await orchestrator.evaluateParticipantCommand({
      sourceParticipantCommandId: commandId,
      nowUtc: PASS3_NOW,
      sceneVisitId: "opaquevisitledger0002",
    });
    expect(reconciled.status).toBe("duplicate");
    expect(ledger.all()[0]?.applicationStatus).toBe("applied");
    expect(() =>
      ledger.prepare({
        ...entry,
        inputDigest: "different-digest",
        applicationStatus: "prepared",
      }),
    ).toThrow();
  });

  it("permits retry after rollback failure leaves a prepared ledger entry", async () => {
    class RejectOnceConductor extends Gate1SceneConductor {
      private shouldReject = true;

      override async executeProtected(
        input: Parameters<Gate1SceneConductor["executeProtected"]>[0],
      ) {
        if (this.shouldReject) {
          this.shouldReject = false;
          return {
            commandId:
              input.envelope &&
              typeof input.envelope === "object" &&
              "protectedCommandId" in input.envelope
                ? String(input.envelope.protectedCommandId)
                : "injected-rejection",
            status: "rejected_invalid" as const,
            stateRevision: 0,
            participantMessageCode: "injected_rejection",
          };
        }
        return super.executeProtected(input);
      }
    }
    const harness = makeActiveHarness({ sceneIndex: 3 });
    const ledger = new MemoryProtectedEvaluationLedger();
    const commandId = "command-ledger-rollback-failure";
    await harness.conductor.executeParticipant({
      envelope: envelopeFromRun(
        harness,
        reflectionCommand(harness, "specific grounded answer"),
        commandId,
      ),
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      ids: PASS3_IDS,
    });
    const rejectingConductor = new RejectOnceConductor(
      harness.adapter,
      harness.mappingProvider,
      GATE1_CANONICAL_MANIFEST,
    );
    ledger.failNextAt("rollback");
    const first = new Gate1AdaptiveEvaluationOrchestrator({
      adapter: harness.adapter,
      mappingProvider: harness.mappingProvider,
      canonicalManifest: GATE1_CANONICAL_MANIFEST,
      participantManifest: harness.manifest,
      conductor: rejectingConductor,
      provider: providerWith({
        commandId,
        outcome: "satisfied",
        supportedFacets: "all",
      }),
      ledger,
    });
    const rejected = await first.evaluateParticipantCommand({
      sourceParticipantCommandId: commandId,
      nowUtc: PASS3_NOW,
      sceneVisitId: "opaquevisitledgerrollback1",
    });
    expect(rejected.status).toBe("rejected");
    expect(ledger.all()[0]?.applicationStatus).toBe("prepared");

    const retried = await first.evaluateParticipantCommand({
      sourceParticipantCommandId: commandId,
      nowUtc: PASS3_NOW,
      sceneVisitId: "opaquevisitledgerrollback2",
    });
    expect(retried.status).toBe("applied");
    expect(ledger.all()[0]?.applicationStatus).toBe("applied");
  });

  it("stales prior-route adaptive threads through runtime route staling", async () => {
    const run = {
      ...makeActiveHarness({
        stage: "active_route",
        routeId: FALSE_ARRIVAL_ROUTE_ID,
      }).root.gateRuns["gate-run-1"]!,
      adaptiveThreads: {
        satisfied: {
          schemaVersion: 1 as const,
          threadId: "satisfied",
          targetRuntimeId: "target-satisfied",
          runtimeSceneId: "scene1",
          sourceParticipantCommandId: "command-satisfied",
          state: "satisfied" as const,
          attemptCount: 1,
          followupCount: 0 as const,
          routeBindingRevision: 1,
          createdAtUtc: PASS3_NOW,
          updatedAtUtc: PASS3_NOW,
        },
        followup: {
          schemaVersion: 1 as const,
          threadId: "followup",
          targetRuntimeId: "target-followup",
          runtimeSceneId: "scene2",
          sourceParticipantCommandId: "command-followup",
          state: "follow_up_issued" as const,
          attemptCount: 1,
          followupCount: 1 as const,
          routeBindingRevision: 1,
          createdAtUtc: PASS3_NOW,
          updatedAtUtc: PASS3_NOW,
        },
        notYet: {
          schemaVersion: 1 as const,
          threadId: "notYet",
          targetRuntimeId: "target-not-yet",
          runtimeSceneId: "scene3",
          sourceParticipantCommandId: "command-not-yet",
          state: "not_yet_formed" as const,
          attemptCount: 1,
          followupCount: 0 as const,
          routeBindingRevision: 1,
          createdAtUtc: PASS3_NOW,
          updatedAtUtc: PASS3_NOW,
        },
        shared: {
          schemaVersion: 1 as const,
          threadId: "shared",
          targetRuntimeId: "target-shared",
          runtimeSceneId: "scene4",
          sourceParticipantCommandId: "command-shared",
          state: "follow_up_issued" as const,
          attemptCount: 1,
          followupCount: 1 as const,
          createdAtUtc: PASS3_NOW,
          updatedAtUtc: PASS3_NOW,
        },
      },
    };
    const { ritualGateReducer } = await import("../runtime/reducer");
    const next = ritualGateReducer(run, {
      type: "MARK_ROUTE_DATA_STALE",
      routeBindingRevision: 1,
      updatedAtUtc: PASS3_NOW,
    });
    expect(next.adaptiveThreads.satisfied?.state).toBe("stale");
    expect(next.adaptiveThreads.followup?.state).toBe("stale");
    expect(next.adaptiveThreads.notYet?.state).toBe("stale");
    expect(next.adaptiveThreads.shared?.state).toBe("follow_up_issued");
    expect(next.adaptiveThreads.satisfied?.stale).toBe(true);
  });

  it("stales protected ledger entries for a retired route revision only", () => {
    const ledger = new MemoryProtectedEvaluationLedger();
    const routeEntry = {
      schemaVersion: 1 as const,
      evaluationRequestId: "evalreq-route-ledger",
      evaluationDecisionId: "decision-route-ledger",
      sourceParticipantCommandId: "command-route-ledger",
      manifestInstanceId: "manifest-route",
      manifestDigest: "digest",
      manifestStage: "active_route" as const,
      stateRevisionEvaluated: 1,
      runtimeSceneId: "scene-route",
      canonicalSceneId: "FA-08" as never,
      protectedRouteId: FALSE_ARRIVAL_ROUTE_ID,
      routeBindingRevision: 1,
      policyId: "gate1.FA-08.v1",
      policyVersion: 1 as const,
      inputDigest: "digest-route",
      decisionDigest: "decision-digest-route",
      providerId: "gate1-fixture-provider",
      providerVersion: "1",
      applicationStatus: "applied" as const,
      appliedAtUtc: PASS3_NOW,
      outcome: "satisfied" as const,
      confidence: "high" as const,
      reasonCodes: [
        "completed_outside_reflection",
        "matches_active_gate_act",
      ] as ProtectedEvaluationDecision["reasonCodes"],
      safetyCodes: [],
      createdAtUtc: PASS3_NOW,
    };
    const sharedEntry = {
      ...routeEntry,
      evaluationRequestId: "evalreq-shared-ledger",
      sourceParticipantCommandId: "command-shared-ledger",
      routeBindingRevision: undefined,
      inputDigest: "digest-shared",
    };
    ledger.prepare(routeEntry).commitApplied(PASS3_NOW);
    ledger.prepare(sharedEntry).commitApplied(PASS3_NOW);
    ledger.markRouteRevisionStale(1, PASS3_NOW);
    expect(ledger.get("evalreq-route-ledger")?.applicationStatus).toBe("stale");
    expect(ledger.get("evalreq-shared-ledger")?.applicationStatus).toBe("applied");
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
      provider: providerWith({
        commandId: "command-concealment",
        outcome: "satisfied",
        supportedFacets: "all",
      }),
    });
    const text = JSON.stringify(result);
    expect(text).not.toContain("Splintered Trust");
    expect(text).not.toContain("False Arrival");
    expect(text).not.toContain("false_arrival");
    expect(text).not.toContain("protectedRouteId");
  });
});
