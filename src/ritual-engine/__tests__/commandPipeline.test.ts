import { describe, expect, it } from "vitest";
import { Gate1SceneConductor } from "../conductor/index.protected";
import { FALSE_ARRIVAL_ROUTE_ID } from "../gate1/constants";
import { GATE1_CANONICAL_MANIFEST } from "../gate1/manifest";
import { MemoryRitualTransactionalPersistenceAdapter } from "../persistence/transactionalMemory";
import { MemoryProtectedMappingProvider } from "../protected-store/memoryMappingProvider.protected";
import { PASS3_IDS, PASS3_NOW, makeActiveHarness, makeParticipantEnvelope } from "./pass3Fixture";

describe("participant command pipeline", () => {
  it("advances an acknowledgment and confirms stability only after persistence", async () => {
    const harness = makeActiveHarness({});
    const envelope = makeParticipantEnvelope(harness, {
      kind: "acknowledge_scene",
      runtimeInteractionId: harness.scene.interaction!.runtimeInteractionId,
    });
    const result = await harness.conductor.executeParticipant({
      envelope,
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      ids: PASS3_IDS,
    });
    const persisted = (await harness.adapter.loadActive())!.gateRuns["gate-run-1"]!;
    expect(result.status).toBe("advanced");
    expect(persisted.currentRuntimeSceneId).toBe(
      harness.scene.transitions[0]!.targetRuntimeSceneId,
    );
    expect(persisted.lastStableRuntimeSceneId).toBe(persisted.currentRuntimeSceneId);
    expect(persisted.sceneVisitOrder).toEqual(["visit-initial", PASS3_IDS.sceneVisitId]);
    expect(persisted.sceneVisits["visit-initial"]!.completedAtUtc).toBe(PASS3_NOW);
  });

  it("stores a reflection draft and waits for protected resolution", async () => {
    const harness = makeActiveHarness({ sceneIndex: 3 });
    const envelope = makeParticipantEnvelope(harness, {
      kind: "submit_response",
      runtimeInteractionId: harness.scene.interaction!.runtimeInteractionId,
      runtimeQuestionId: harness.scene.interaction!.runtimeQuestionId!,
      responseId: "response-1",
      text: "private reflection",
      declaredState: "draft",
    });
    const result = await harness.conductor.executeParticipant({
      envelope,
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      ids: PASS3_IDS,
    });
    const run = (await harness.adapter.loadActive())!.gateRuns["gate-run-1"]!;
    expect(result.status).toBe("awaiting_protected_resolution");
    expect(run.currentRuntimeSceneId).toBe(harness.scene.runtimeSceneId);
    expect(run.responses["response-1"]!.state).toBe("draft");
    expect(JSON.stringify(run.commandReceipts)).not.toContain("private reflection");
  });

  it("returns duplicate for the same command ID and digest", async () => {
    const harness = makeActiveHarness({ sceneIndex: 3 });
    const envelope = makeParticipantEnvelope(harness, {
      kind: "submit_response",
      runtimeInteractionId: harness.scene.interaction!.runtimeInteractionId,
      runtimeQuestionId: harness.scene.interaction!.runtimeQuestionId!,
      responseId: "response-1",
      text: "same",
      declaredState: "draft",
    });
    await harness.conductor.executeParticipant({
      envelope,
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      ids: PASS3_IDS,
    });
    const duplicate = await harness.conductor.executeParticipant({
      envelope,
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      ids: PASS3_IDS,
    });
    expect(duplicate.status).toBe("duplicate");
  });

  it("rejects the same command ID with a different digest", async () => {
    const harness = makeActiveHarness({ sceneIndex: 3 });
    const base = makeParticipantEnvelope(harness, {
      kind: "submit_response",
      runtimeInteractionId: harness.scene.interaction!.runtimeInteractionId,
      runtimeQuestionId: harness.scene.interaction!.runtimeQuestionId!,
      responseId: "response-1",
      text: "first",
      declaredState: "draft",
    });
    await harness.conductor.executeParticipant({
      envelope: base,
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      ids: PASS3_IDS,
    });
    const conflict = await harness.conductor.executeParticipant({
      envelope: { ...base, command: { ...base.command, text: "changed" } },
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      ids: PASS3_IDS,
    });
    expect(conflict.status).toBe("rejected_invalid");
  });

  it.each([
    ["revision", { expectedStateRevision: 999 }],
    ["manifest", { manifestInstanceId: "opaquevalue999999999991" }],
    ["digest", { manifestDigest: "wrong-digest" }],
    ["scene", { runtimeSceneId: "opaquevalue999999999992" }],
  ] as const)("rejects stale %s binding without mutation", async (_name, override) => {
    const harness = makeActiveHarness({});
    const envelope = makeParticipantEnvelope(harness, { kind: "pause_run" }, override);
    const before = await harness.adapter.loadActive();
    const result = await harness.conductor.executeParticipant({
      envelope,
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      ids: PASS3_IDS,
    });
    expect(result.status).toBe("rejected_stale");
    expect(await harness.adapter.loadActive()).toEqual(before);
  });

  it("rejects cross-scene interaction and question IDs", async () => {
    const harness = makeActiveHarness({ sceneIndex: 3 });
    const result = await harness.conductor.executeParticipant({
      envelope: makeParticipantEnvelope(harness, {
        kind: "submit_response",
        runtimeInteractionId: "opaquewronginteraction001",
        runtimeQuestionId: "opaquewrongquestion00001",
        responseId: "response-1",
        declaredState: "draft",
      }),
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      ids: PASS3_IDS,
    });
    expect(result.status).toBe("rejected_unauthorized");
  });

  it("fails closed for missing or retired protected mapping", async () => {
    const harness = makeActiveHarness({});
    const envelope = makeParticipantEnvelope(harness, { kind: "pause_run" });
    const missingConductor = new Gate1SceneConductor(
      harness.adapter,
      new MemoryProtectedMappingProvider(),
      GATE1_CANONICAL_MANIFEST,
    );
    expect(
      (
        await missingConductor.executeParticipant({
          envelope,
          participantManifest: harness.manifest,
          nowUtc: PASS3_NOW,
          ids: PASS3_IDS,
        })
      ).status,
    ).toBe("rejected_stale");

    harness.mappingProvider.retire(harness.manifest.manifestInstanceId, PASS3_NOW);
    expect(
      (
        await harness.conductor.executeParticipant({
          envelope,
          participantManifest: harness.manifest,
          nowUtc: PASS3_NOW,
          ids: PASS3_IDS,
        })
      ).status,
    ).toBe("rejected_stale");
  });

  it("enforces active route token and revision bindings", async () => {
    const harness = makeActiveHarness({ stage: "active_route", routeId: FALSE_ARRIVAL_ROUTE_ID });
    const result = await harness.conductor.executeParticipant({
      envelope: makeParticipantEnvelope(
        harness,
        { kind: "pause_run" },
        { routeBindingRevision: 9 },
      ),
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      ids: PASS3_IDS,
    });
    expect(result.status).toBe("rejected_stale");
  });

  it("rejects stage and transition mismatches without mutation", async () => {
    const harness = makeActiveHarness({});
    const before = await harness.adapter.loadActive();
    const stageResult = await harness.conductor.executeParticipant({
      envelope: makeParticipantEnvelope(
        harness,
        { kind: "pause_run" },
        { manifestStage: "completion" },
      ),
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      ids: PASS3_IDS,
    });
    const transitionResult = await harness.conductor.executeParticipant({
      envelope: makeParticipantEnvelope(harness, {
        kind: "invoke_scene_action",
        intent: "continue",
        runtimeTransitionId: "opaquetransition99999999",
      }),
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      ids: PASS3_IDS,
    });
    expect(stageResult.status).toBe("rejected_stale");
    expect(transitionResult.status).toBe("rejected_unauthorized");
    expect(await harness.adapter.loadActive()).toEqual(before);
  });

  it("prevents progression while paused and resumes at the stable scene", async () => {
    const harness = makeActiveHarness({});
    const paused = await harness.conductor.executeParticipant({
      envelope: makeParticipantEnvelope(harness, { kind: "pause_run" }),
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      ids: PASS3_IDS,
    });
    const rejected = await harness.conductor.executeParticipant({
      envelope: makeParticipantEnvelope(
        harness,
        {
          kind: "acknowledge_scene",
          runtimeInteractionId: harness.scene.interaction!.runtimeInteractionId,
        },
        { commandId: "command-2", expectedStateRevision: paused.stateRevision },
      ),
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      ids: PASS3_IDS,
    });
    const resumed = await harness.conductor.executeParticipant({
      envelope: makeParticipantEnvelope(
        harness,
        { kind: "resume_run" },
        { commandId: "command-3", expectedStateRevision: paused.stateRevision },
      ),
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      ids: PASS3_IDS,
    });
    expect(rejected.status).toBe("rejected_unauthorized");
    expect(resumed.status).toBe("resumed");
    expect(resumed.currentRuntimeSceneId).toBe(resumed.lastStableRuntimeSceneId);
  });

  it("applies privacy transformation before persistence", async () => {
    const harness = makeActiveHarness({ sceneIndex: 3 });
    harness.root.privacyMode = "structured_journey_only";
    const adapter = new MemoryRitualTransactionalPersistenceAdapter(harness.root);
    const conductor = new Gate1SceneConductor(
      adapter,
      harness.mappingProvider,
      GATE1_CANONICAL_MANIFEST,
    );
    await conductor.executeParticipant({
      envelope: makeParticipantEnvelope(harness, {
        kind: "submit_response",
        runtimeInteractionId: harness.scene.interaction!.runtimeInteractionId,
        runtimeQuestionId: harness.scene.interaction!.runtimeQuestionId!,
        responseId: "response-1",
        text: "must not persist",
        structuredSummary: { named: true },
        declaredState: "draft",
      }),
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      ids: PASS3_IDS,
    });
    const response = (await adapter.loadActive())!.gateRuns["gate-run-1"]!.responses["response-1"]!;
    expect(response.text).toBeUndefined();
    expect(response.structuredSummary).toEqual({ named: true });
  });
});
