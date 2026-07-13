import { describe, expect, it } from "vitest";
import { Gate1SceneConductor } from "../conductor/index.protected";
import { FALSE_ARRIVAL_ROUTE_ID } from "../gate1/constants";
import { GATE1_CANONICAL_MANIFEST } from "../gate1/manifest";
import { MemoryRitualTransactionalPersistenceAdapter } from "../persistence/transactionalMemory";
import { PASS3_IDS, PASS3_NOW, makeActiveHarness, makeParticipantEnvelope } from "./pass3Fixture";

describe("Gate Act, evidence, and safety conductor behavior", () => {
  it("appends immutable Gate Act revisions without creating a Sovereign Action", async () => {
    const harness = makeActiveHarness({
      stage: "active_route",
      routeId: FALSE_ARRIVAL_ROUTE_ID,
      sceneIndex: 8,
    });
    const first = makeParticipantEnvelope(harness, {
      kind: "submit_gate_act",
      runtimeInteractionId: harness.scene.interaction!.runtimeInteractionId,
      gateActId: "gate-act-1",
      act: "First act",
      immediateMicroAct: "First step",
      safetySelfReport: "safe",
    });
    const firstResult = await harness.conductor.executeParticipant({
      envelope: first,
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      ids: PASS3_IDS,
    });
    const second = makeParticipantEnvelope(
      harness,
      {
        kind: "submit_gate_act",
        runtimeInteractionId: harness.scene.interaction!.runtimeInteractionId,
        gateActId: "gate-act-1",
        act: "Revised act",
        immediateMicroAct: "Revised step",
        safetySelfReport: "safe",
      },
      { commandId: "command-2", expectedStateRevision: firstResult.stateRevision },
    );
    await harness.conductor.executeParticipant({
      envelope: second,
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      ids: { ...PASS3_IDS, outboxId: "opaqueoutbox00000000003" },
    });
    const run = (await harness.adapter.loadActive())!.gateRuns["gate-run-1"]!;
    expect(run.gateAct!.revisions.map((revision) => revision.act)).toEqual([
      "First act",
      "Revised act",
    ]);
    expect(JSON.stringify(run)).not.toMatch(/sovereign|mark/i);
  });

  it("blocks an unsafe Gate Act self-report", async () => {
    const harness = makeActiveHarness({
      stage: "active_route",
      routeId: FALSE_ARRIVAL_ROUTE_ID,
      sceneIndex: 8,
    });
    const result = await harness.conductor.executeParticipant({
      envelope: makeParticipantEnvelope(harness, {
        kind: "submit_gate_act",
        runtimeInteractionId: harness.scene.interaction!.runtimeInteractionId,
        gateActId: "gate-act-1",
        act: "Act",
        immediateMicroAct: "Step",
        safetySelfReport: "not_safe",
      }),
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      ids: PASS3_IDS,
    });
    expect(result.status).toBe("blocked");
    const run = (await harness.adapter.loadActive())!.gateRuns["gate-run-1"]!;
    expect(run.status).toBe("blocked");
    expect(run.safety.state).toBe("blocked");
  });

  it("binds evidence to the active Gate Act and does not qualify scheduled continuation", async () => {
    const harness = makeActiveHarness({
      stage: "active_route",
      routeId: FALSE_ARRIVAL_ROUTE_ID,
      sceneIndex: 9,
    });
    harness.root.gateRuns["gate-run-1"]!.gateAct = {
      gateActId: "gate-act-1",
      status: "accepted",
      activeRevision: 0,
      routeBindingRevision: 1,
      revisions: [
        {
          revision: 0,
          act: "Act",
          immediateMicroAct: "Step",
          participantSafetySelfReport: "safe",
          createdAtUtc: PASS3_NOW,
        },
      ],
      createdAtUtc: PASS3_NOW,
      updatedAtUtc: PASS3_NOW,
    };
    const adapter = new MemoryRitualTransactionalPersistenceAdapter(harness.root);
    const conductor = new Gate1SceneConductor(
      adapter,
      harness.mappingProvider,
      GATE1_CANONICAL_MANIFEST,
    );
    const result = await conductor.executeParticipant({
      envelope: makeParticipantEnvelope(harness, {
        kind: "record_evidence",
        runtimeInteractionId: harness.scene.interaction!.runtimeInteractionId,
        evidenceEventId: "evidence-1",
        gateActId: "gate-act-1",
        eventType: "continuation_scheduled",
        mode: "completion_marker",
        participantAttestation: "scheduled_only",
        occurredAtUtc: PASS3_NOW,
      }),
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      ids: PASS3_IDS,
    });
    const run = (await adapter.loadActive())!.gateRuns["gate-run-1"]!;
    expect(result.status).toBe("awaiting_protected_resolution");
    expect(run.evidenceEvents[0]!.routeBindingRevision).toBe(1);
    expect(run.validation["g1.active_route_qualifying_evidence"]).toBeUndefined();

    const resolution = await conductor.executeProtected({
      envelope: {
        schemaVersion: 1,
        protectedCommandId: "scheduled-evidence-resolution-1",
        expectedStateRevision: result.stateRevision,
        issuedAtUtc: PASS3_NOW,
        command: {
          kind: "apply_scene_resolution",
          sourceCommandId: "command-1",
          manifestInstanceId: harness.manifest.manifestInstanceId,
          manifestDigest: harness.manifest.digest,
          runtimeSceneId: harness.scene.runtimeSceneId,
          runtimeInteractionId: harness.scene.interaction!.runtimeInteractionId,
          runtimeTransitionId: harness.scene.transitions[0]?.runtimeTransitionId,
          outcome: "satisfied",
        },
      },
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      sceneVisitId: "opaquevisit000000000005",
    });
    expect(resolution.status).toBe("rejected_invalid");
    expect(
      (await adapter.loadActive())!.gateRuns["gate-run-1"]!.validation[
        "g1.active_route_qualifying_evidence"
      ],
    ).toBeUndefined();
  });

  it("rescale permits response revision but blocks progression", async () => {
    const harness = makeActiveHarness({ sceneIndex: 3 });
    const directive = await harness.conductor.executeProtected({
      envelope: {
        schemaVersion: 1,
        protectedCommandId: "safety-1",
        expectedStateRevision: 1,
        issuedAtUtc: PASS3_NOW,
        command: {
          kind: "apply_safety_directive",
          state: "rescale_required",
          protectedReasonCodes: ["protected-code"],
        },
      },
      nowUtc: PASS3_NOW,
      sceneVisitId: PASS3_IDS.sceneVisitId,
    });
    const response = await harness.conductor.executeParticipant({
      envelope: makeParticipantEnvelope(
        harness,
        {
          kind: "submit_response",
          runtimeInteractionId: harness.scene.interaction!.runtimeInteractionId,
          runtimeQuestionId: harness.scene.interaction!.runtimeQuestionId!,
          responseId: "response-1",
          declaredState: "draft",
        },
        { commandId: "command-2", expectedStateRevision: directive.stateRevision },
      ),
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      ids: PASS3_IDS,
    });
    expect(response.status).toBe("awaiting_protected_resolution");
    expect(response).not.toHaveProperty("protectedReasonCodes");
  });
});
