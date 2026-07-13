import { describe, expect, it } from "vitest";
import { Gate1SceneConductor } from "../conductor/index.protected";
import { GATE1_CANONICAL_MANIFEST } from "../gate1/manifest";
import { MemoryRitualTransactionalPersistenceAdapter } from "../persistence/transactionalMemory";
import { MemoryProtectedMappingProvider } from "../protected-store/memoryMappingProvider.protected";
import { createGateRuntime, createRuntimeRoot } from "../runtime/factories";
import { ProtectedCommandEnvelopeSchema } from "../commands/protectedSchemas.protected";
import {
  PASS3_IDS,
  PASS3_NOW,
  compilePass3Stage,
  makeActiveHarness,
  makeParticipantEnvelope,
} from "./pass3Fixture";

describe("protected scene conductor", () => {
  it("rejects unknown fields in protected command envelopes and payloads", () => {
    expect(
      ProtectedCommandEnvelopeSchema.safeParse({
        schemaVersion: 1,
        protectedCommandId: "protected-strict-1",
        expectedStateRevision: 0,
        issuedAtUtc: PASS3_NOW,
        unknown: true,
        command: { kind: "recover_runtime" },
      }).success,
    ).toBe(false);
    expect(
      ProtectedCommandEnvelopeSchema.safeParse({
        schemaVersion: 1,
        protectedCommandId: "protected-strict-2",
        expectedStateRevision: 0,
        issuedAtUtc: PASS3_NOW,
        command: { kind: "recover_runtime", unknown: true },
      }).success,
    ).toBe(false);
  });

  it("activates pre-route compilation and persists its entry as stable", async () => {
    const compilation = compilePass3Stage({ stage: "pre_route" });
    const run = createGateRuntime({
      gateRunId: "gate-run-1",
      journeyCycleId: "cycle-1",
      nowUtc: PASS3_NOW,
    });
    const root = createRuntimeRoot({
      participantId: "participant-1",
      gateRun: run,
      privacyMode: "full_private_continuity",
      nowUtc: PASS3_NOW,
    });
    const adapter = new MemoryRitualTransactionalPersistenceAdapter(root);
    const provider = new MemoryProtectedMappingProvider();
    const conductor = new Gate1SceneConductor(adapter, provider, GATE1_CANONICAL_MANIFEST);
    const result = await conductor.executeProtected({
      envelope: {
        schemaVersion: 1,
        protectedCommandId: "protected-activation-1",
        expectedStateRevision: 0,
        issuedAtUtc: PASS3_NOW,
        command: { kind: "activate_compilation", activationReason: "start_pre_route", compilation },
      },
      nowUtc: PASS3_NOW,
      sceneVisitId: PASS3_IDS.sceneVisitId,
    });
    const persisted = (await adapter.loadActive())!.gateRuns["gate-run-1"]!;
    expect(result.status).toBe("advanced");
    expect(persisted.currentRuntimeSceneId).toBe(
      compilation.participantManifest.entryRuntimeSceneId,
    );
    expect(persisted.lastStableRuntimeSceneId).toBe(persisted.currentRuntimeSceneId);
    expect(JSON.stringify(persisted)).not.toContain("protectedMapping");
    expect(
      provider.getByManifestInstanceId(compilation.participantManifest.manifestInstanceId),
    ).not.toBeNull();
  });

  it("rejects active-route and completion activation outside their boundaries", async () => {
    const harness = makeActiveHarness({});
    const activeCompilation = compilePass3Stage({
      stage: "active_route",
      routeId: GATE1_CANONICAL_MANIFEST.protectedRouteMap.false_arrival.routeId,
      factoryStart: 100,
    });
    const result = await harness.conductor.executeProtected({
      envelope: {
        schemaVersion: 1,
        protectedCommandId: "protected-activation-2",
        expectedStateRevision: 1,
        issuedAtUtc: PASS3_NOW,
        command: {
          kind: "activate_compilation",
          activationReason: "route_bound",
          compilation: activeCompilation,
        },
      },
      nowUtc: PASS3_NOW,
      sceneVisitId: PASS3_IDS.sceneVisitId,
    });
    expect(result.status).toBe("rejected_invalid");

    const completionCompilation = compilePass3Stage({
      stage: "completion",
      factoryStart: 200,
    });
    const completionResult = await harness.conductor.executeProtected({
      envelope: {
        schemaVersion: 1,
        protectedCommandId: "protected-activation-3",
        expectedStateRevision: 1,
        issuedAtUtc: PASS3_NOW,
        command: {
          kind: "activate_compilation",
          activationReason: "enter_completion",
          compilation: completionCompilation,
        },
      },
      nowUtc: PASS3_NOW,
      sceneVisitId: PASS3_IDS.sceneVisitId,
    });
    expect(completionResult.status).toBe("rejected_invalid");
  });

  it("grounds a reflection and applies only authored establishments", async () => {
    const harness = makeActiveHarness({ sceneIndex: 3 });
    const participantEnvelope = makeParticipantEnvelope(harness, {
      kind: "submit_response",
      runtimeInteractionId: harness.scene.interaction!.runtimeInteractionId,
      runtimeQuestionId: harness.scene.interaction!.runtimeQuestionId!,
      responseId: "response-1",
      text: "reflection",
      declaredState: "draft",
    });
    const submitted = await harness.conductor.executeParticipant({
      envelope: participantEnvelope,
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      ids: PASS3_IDS,
    });
    const resolution = {
      schemaVersion: 1 as const,
      protectedCommandId: "protected-resolution-1",
      expectedStateRevision: submitted.stateRevision,
      issuedAtUtc: PASS3_NOW,
      command: {
        kind: "apply_scene_resolution" as const,
        sourceCommandId: participantEnvelope.commandId,
        manifestInstanceId: harness.manifest.manifestInstanceId,
        manifestDigest: harness.manifest.digest,
        runtimeSceneId: harness.scene.runtimeSceneId,
        runtimeInteractionId: harness.scene.interaction!.runtimeInteractionId,
        runtimeQuestionId: harness.scene.interaction!.runtimeQuestionId,
        runtimeTransitionId: harness.scene.transitions[0]!.runtimeTransitionId,
        outcome: "satisfied" as const,
      },
    };
    const result = await harness.conductor.executeProtected({
      envelope: resolution,
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      sceneVisitId: "opaquevisit000000000002",
    });
    const run = (await harness.adapter.loadActive())!.gateRuns["gate-run-1"]!;
    expect(result.status).toBe("advanced");
    expect(run.responses["response-1"]!.state).toBe("grounded");
    expect(run.validation["g1.event_promise_separated"]?.value).toBe(true);
    expect(Object.keys(run.validation)).not.toContain("injected.validation");

    const duplicate = await harness.conductor.executeProtected({
      envelope: resolution,
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      sceneVisitId: "opaquevisit000000000003",
    });
    expect(duplicate.status).toBe("duplicate");
  });

  it("keeps follow-up on the scene and blocks on protected blocked outcome", async () => {
    const harness = makeActiveHarness({ sceneIndex: 3 });
    const envelope = makeParticipantEnvelope(harness, {
      kind: "submit_response",
      runtimeInteractionId: harness.scene.interaction!.runtimeInteractionId,
      runtimeQuestionId: harness.scene.interaction!.runtimeQuestionId!,
      responseId: "response-1",
      declaredState: "not_yet_formed",
    });
    const submitted = await harness.conductor.executeParticipant({
      envelope,
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      ids: PASS3_IDS,
    });
    const result = await harness.conductor.executeProtected({
      envelope: {
        schemaVersion: 1,
        protectedCommandId: "protected-resolution-2",
        expectedStateRevision: submitted.stateRevision,
        issuedAtUtc: PASS3_NOW,
        command: {
          kind: "apply_scene_resolution",
          sourceCommandId: envelope.commandId,
          manifestInstanceId: harness.manifest.manifestInstanceId,
          manifestDigest: harness.manifest.digest,
          runtimeSceneId: harness.scene.runtimeSceneId,
          runtimeInteractionId: harness.scene.interaction!.runtimeInteractionId,
          runtimeQuestionId: harness.scene.interaction!.runtimeQuestionId,
          outcome: "blocked",
        },
      },
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      sceneVisitId: "opaquevisit000000000002",
    });
    const run = (await harness.adapter.loadActive())!.gateRuns["gate-run-1"]!;
    expect(result.status).toBe("blocked");
    expect(run.status).toBe("blocked");
    expect(run.currentRuntimeSceneId).toBe(harness.scene.runtimeSceneId);
  });

  it("rejects protected resolution without its source receipt", async () => {
    const harness = makeActiveHarness({ sceneIndex: 3 });
    const result = await harness.conductor.executeProtected({
      envelope: {
        schemaVersion: 1,
        protectedCommandId: "protected-resolution-missing",
        expectedStateRevision: 1,
        issuedAtUtc: PASS3_NOW,
        command: {
          kind: "apply_scene_resolution",
          sourceCommandId: "missing-command",
          manifestInstanceId: harness.manifest.manifestInstanceId,
          manifestDigest: harness.manifest.digest,
          runtimeSceneId: harness.scene.runtimeSceneId,
          outcome: "satisfied",
        },
      },
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      sceneVisitId: PASS3_IDS.sceneVisitId,
    });
    expect(result.status).toBe("rejected_invalid");
  });

  it("closes a terminal scene visit when its protected resolution succeeds", async () => {
    const harness = makeActiveHarness({ sceneIndex: 9 });
    const participantEnvelope = makeParticipantEnvelope(harness, {
      kind: "select_option",
      runtimeInteractionId: harness.scene.interaction!.runtimeInteractionId,
      runtimeQuestionId: harness.scene.interaction!.runtimeQuestionId!,
      responseId: "stance-response-1",
      optionIndex: 0,
    });
    const submitted = await harness.conductor.executeParticipant({
      envelope: participantEnvelope,
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      ids: PASS3_IDS,
    });
    const result = await harness.conductor.executeProtected({
      envelope: {
        schemaVersion: 1,
        protectedCommandId: "protected-terminal-1",
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
          outcome: "satisfied",
        },
      },
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      sceneVisitId: "opaquevisit000000000004",
    });
    const run = (await harness.adapter.loadActive())!.gateRuns["gate-run-1"]!;
    expect(result.status).toBe("awaiting_route_binding");
    expect(run.sceneVisits["visit-initial"]!.completedAtUtc).toBe(PASS3_NOW);
    expect(run.sceneVisitOrder).toEqual(["visit-initial"]);
  });
});
