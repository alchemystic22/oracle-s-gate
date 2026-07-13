import { describe, expect, it } from "vitest";
import { Gate1SceneConductor } from "../conductor/index.protected";
import { GATE1_CANONICAL_MANIFEST } from "../gate1/manifest";
import { MemoryRitualTransactionalPersistenceAdapter } from "../persistence/transactionalMemory";
import { MemorySessionResponseStore } from "../session/sessionResponseStore";
import { PASS3_IDS, PASS3_NOW, makeActiveHarness, makeParticipantEnvelope } from "./pass3Fixture";

describe("session-only reflection conductor semantics", () => {
  it("keeps reflection continuity only in the current volatile session", async () => {
    const harness = makeActiveHarness({ sceneIndex: 3 });
    harness.root.privacyMode = "session_only_reflections";
    const adapter = new MemoryRitualTransactionalPersistenceAdapter(harness.root);
    const session = new MemorySessionResponseStore();
    const conductor = new Gate1SceneConductor(
      adapter,
      harness.mappingProvider,
      GATE1_CANONICAL_MANIFEST,
      session,
    );
    const participantEnvelope = makeParticipantEnvelope(harness, {
      kind: "submit_response",
      runtimeInteractionId: harness.scene.interaction!.runtimeInteractionId,
      runtimeQuestionId: harness.scene.interaction!.runtimeQuestionId!,
      responseId: "session-response-1",
      text: "volatile raw reflection",
      structuredSummary: { named: true },
      declaredState: "draft",
    });
    const submitted = await conductor.executeParticipant({
      envelope: participantEnvelope,
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      ids: PASS3_IDS,
    });
    expect(submitted.status).toBe("awaiting_protected_resolution");
    expect(session.getForGateRun("gate-run-1")["session-response-1"]).toMatchObject({
      text: "volatile raw reflection",
      structuredSummary: { named: true },
      state: "draft",
    });
    expect((await adapter.loadActive())!.gateRuns["gate-run-1"]!.responses).toEqual({});

    const resolved = await conductor.executeProtected({
      envelope: {
        schemaVersion: 1,
        protectedCommandId: "session-resolution-1",
        expectedStateRevision: submitted.stateRevision,
        issuedAtUtc: PASS3_NOW,
        command: {
          kind: "apply_scene_resolution",
          sourceCommandId: participantEnvelope.commandId,
          manifestInstanceId: harness.manifest.manifestInstanceId,
          manifestDigest: harness.manifest.digest,
          runtimeSceneId: harness.scene.runtimeSceneId,
          runtimeInteractionId: harness.scene.interaction!.runtimeInteractionId,
          runtimeQuestionId: harness.scene.interaction!.runtimeQuestionId,
          runtimeTransitionId: harness.scene.transitions[0]!.runtimeTransitionId,
          outcome: "satisfied",
        },
      },
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      sceneVisitId: "opaquesessionvisit000001",
    });
    expect(resolved.status).toBe("advanced");
    expect(session.getForGateRun("gate-run-1")["session-response-1"]).toMatchObject({
      text: "volatile raw reflection",
      structuredSummary: { named: true },
      state: "grounded",
    });

    const active = (await adapter.loadActive())!;
    const previous = (await adapter.loadPrevious())!;
    expect(active.gateRuns["gate-run-1"]!.responses).toEqual({});
    expect(previous.gateRuns["gate-run-1"]!.responses).toEqual({});
    expect(await adapter.loadPending()).toBeNull();
    expect(JSON.stringify(active.gateRuns["gate-run-1"]!.commandReceipts)).not.toContain(
      "volatile raw reflection",
    );
    expect(JSON.stringify(active.gateRuns["gate-run-1"]!.pendingOutbox)).not.toContain(
      "volatile raw reflection",
    );

    const freshSession = new MemorySessionResponseStore();
    new Gate1SceneConductor(
      adapter,
      harness.mappingProvider,
      GATE1_CANONICAL_MANIFEST,
      freshSession,
    );
    expect(freshSession.getForGateRun("gate-run-1")).toEqual({});
  });
});
