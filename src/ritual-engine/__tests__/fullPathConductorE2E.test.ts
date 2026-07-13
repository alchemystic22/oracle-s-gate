import { describe, expect, it } from "vitest";
import type { ParticipantCommand, ParticipantCommandEnvelope } from "../commands";
import type { ProtectedParticipantCompilation } from "../compiler/index.protected";
import type { ParticipantManifest, ParticipantScene } from "../compiler/types";
import { Gate1SceneConductor } from "../conductor/index.protected";
import type { RitualGateRuntime } from "../domain/runtime";
import { FALSE_ARRIVAL_ROUTE_ID, SPLINTERED_TRUST_ROUTE_ID } from "../gate1/constants";
import { GATE1_CANONICAL_MANIFEST } from "../gate1/manifest";
import type { CanonicalSceneDefinition } from "../manifest/sceneTypes";
import { MemoryRitualTransactionalPersistenceAdapter } from "../persistence/transactionalMemory";
import { MemoryProtectedMappingProvider } from "../protected-store/memoryMappingProvider.protected";
import { createGateRuntime, createRuntimeRoot } from "../runtime/factories";
import { PASS3_NOW, compilePass3Stage } from "./pass3Fixture";

type PathHarness = {
  adapter: MemoryRitualTransactionalPersistenceAdapter;
  provider: MemoryProtectedMappingProvider;
  conductor: Gate1SceneConductor;
  sequence: number;
};

function nextId(harness: PathHarness, kind: string): string {
  harness.sequence += 1;
  return `opaque${kind}${String(harness.sequence).padStart(14, "0")}`;
}

function createPathHarness(): PathHarness {
  const gateRun = createGateRuntime({
    gateRunId: "gate-run-e2e",
    journeyCycleId: "cycle-e2e",
    nowUtc: PASS3_NOW,
  });
  const root = createRuntimeRoot({
    participantId: "participant-e2e",
    gateRun,
    privacyMode: "full_private_continuity",
    nowUtc: PASS3_NOW,
    isTestCycle: true,
  });
  const adapter = new MemoryRitualTransactionalPersistenceAdapter(root);
  const provider = new MemoryProtectedMappingProvider();
  return {
    adapter,
    provider,
    conductor: new Gate1SceneConductor(adapter, provider, GATE1_CANONICAL_MANIFEST),
    sequence: 0,
  };
}

async function activeRun(harness: PathHarness): Promise<RitualGateRuntime> {
  const root = (await harness.adapter.loadActive())!;
  return root.gateRuns[root.activeGateRunId!]!;
}

async function activate(
  harness: PathHarness,
  compilation: ProtectedParticipantCompilation,
  reason: "start_pre_route" | "route_bound" | "enter_completion",
): Promise<void> {
  const before = await activeRun(harness);
  const result = await harness.conductor.executeProtected({
    envelope: {
      schemaVersion: 1,
      protectedCommandId: nextId(harness, "protectedcommand"),
      expectedStateRevision: before.stateRevision,
      issuedAtUtc: PASS3_NOW,
      command: { kind: "activate_compilation", activationReason: reason, compilation },
    },
    nowUtc: PASS3_NOW,
    sceneVisitId: nextId(harness, "visit"),
  });
  const run = await activeRun(harness);
  expect(result.status).toBe("advanced");
  expect(run.activeManifest?.manifestInstanceId).toBe(
    compilation.participantManifest.manifestInstanceId,
  );
  expect(run.currentRuntimeSceneId).toBe(compilation.participantManifest.entryRuntimeSceneId);
  expect(run.lastStableRuntimeSceneId).toBe(run.currentRuntimeSceneId);
  expect(run.stateRevision).toBeGreaterThan(before.stateRevision);
  const activeMapping = harness.provider.getByManifestInstanceId(
    compilation.participantManifest.manifestInstanceId,
  );
  expect(activeMapping).not.toBeNull();
  expect(activeMapping?.retiredAtUtc).toBeUndefined();
  if (before.activeManifest) {
    expect(
      harness.provider.getByManifestInstanceId(before.activeManifest.manifestInstanceId)
        ?.retiredAtUtc,
    ).toBe(PASS3_NOW);
  }
  expect(JSON.stringify(run)).not.toContain("protectedMapping");
}

function participantEnvelope(
  harness: PathHarness,
  run: RitualGateRuntime,
  manifest: ParticipantManifest,
  scene: ParticipantScene,
  command: ParticipantCommand,
): ParticipantCommandEnvelope {
  return {
    schemaVersion: 1,
    commandId: nextId(harness, "command"),
    participantId: "participant-e2e",
    journeyCycleId: run.journeyCycleId,
    gateRunId: run.gateRunId,
    gateId: 1,
    manifestInstanceId: manifest.manifestInstanceId,
    manifestDigest: manifest.digest,
    manifestStage: manifest.stage,
    expectedStateRevision: run.stateRevision,
    runtimeSceneId: scene.runtimeSceneId,
    routeToken: manifest.routeToken,
    routeBindingRevision: manifest.routeBindingRevision,
    issuedAtUtc: PASS3_NOW,
    command,
  };
}

function commandForScene(harness: PathHarness, scene: ParticipantScene): ParticipantCommand {
  const interaction = scene.interaction;
  if (interaction?.kind === "acknowledgment") {
    return { kind: "acknowledge_scene", runtimeInteractionId: interaction.runtimeInteractionId };
  }
  if (interaction?.kind === "reflection") {
    return {
      kind: "submit_response",
      runtimeInteractionId: interaction.runtimeInteractionId,
      runtimeQuestionId: interaction.runtimeQuestionId!,
      responseId: nextId(harness, "response"),
      text: "bounded test reflection",
      declaredState: "draft",
    };
  }
  if (interaction?.kind === "stance_selection") {
    return {
      kind: "select_option",
      runtimeInteractionId: interaction.runtimeInteractionId,
      runtimeQuestionId: interaction.runtimeQuestionId!,
      responseId: nextId(harness, "response"),
      optionIndex: 0,
    };
  }
  if (interaction?.kind === "gate_act") {
    return {
      kind: "submit_gate_act",
      runtimeInteractionId: interaction.runtimeInteractionId,
      gateActId: "gate-act-e2e",
      act: "Take one bounded action",
      immediateMicroAct: "Complete one observable step",
      safetySelfReport: "safe",
    };
  }
  if (interaction?.kind === "evidence") {
    return {
      kind: "record_evidence",
      runtimeInteractionId: interaction.runtimeInteractionId,
      evidenceEventId: nextId(harness, "evidence"),
      gateActId: "gate-act-e2e",
      eventType: "micro_act_completed",
      mode: "completion_marker",
      participantAttestation: "occurred_outside_reflection",
      occurredAtUtc: PASS3_NOW,
    };
  }
  if (scene.primaryAction) {
    return {
      kind: "invoke_scene_action",
      intent: scene.primaryAction.intent as "continue" | "seal" | "complete",
      runtimeTransitionId: scene.transitions[0]?.runtimeTransitionId,
    };
  }
  throw new Error("E2E scene has no participant command");
}

function canonicalScene(
  compilation: ProtectedParticipantCompilation,
  scene: ParticipantScene,
): CanonicalSceneDefinition {
  const canonicalSceneId =
    compilation.protectedMapping.scenes[scene.runtimeSceneId]!.canonicalSceneId;
  return GATE1_CANONICAL_MANIFEST.scenes.find(
    (candidate) => candidate.canonicalSceneId === canonicalSceneId,
  )!;
}

async function traverseStage(
  harness: PathHarness,
  compilation: ProtectedParticipantCompilation,
  inactivePrefix?: "FA-" | "ST-",
): Promise<readonly string[]> {
  const manifest = compilation.participantManifest;
  const visitedCanonicalIds: string[] = [];
  for (const scene of manifest.scenes) {
    const canonical = canonicalScene(compilation, scene);
    visitedCanonicalIds.push(canonical.canonicalSceneId);
    const before = await activeRun(harness);
    expect(before.currentRuntimeSceneId).toBe(scene.runtimeSceneId);
    expect(before.lastStableRuntimeSceneId).toBe(scene.runtimeSceneId);
    expect(before.activeManifest?.manifestInstanceId).toBe(manifest.manifestInstanceId);

    const command = commandForScene(harness, scene);
    const envelope = participantEnvelope(harness, before, manifest, scene, command);
    let result = await harness.conductor.executeParticipant({
      envelope,
      participantManifest: manifest,
      nowUtc: PASS3_NOW,
      ids: {
        sceneVisitId: nextId(harness, "visit"),
        outboxId: nextId(harness, "outbox"),
        eventId: nextId(harness, "event"),
        secondaryOutboxId: nextId(harness, "outbox"),
      },
    });

    if (
      ["submit_response", "select_option", "submit_gate_act", "record_evidence"].includes(
        command.kind,
      )
    ) {
      expect(result.status).toBe("awaiting_protected_resolution");
      const submitted = await activeRun(harness);
      result = await harness.conductor.executeProtected({
        envelope: {
          schemaVersion: 1,
          protectedCommandId: nextId(harness, "protectedcommand"),
          expectedStateRevision: submitted.stateRevision,
          issuedAtUtc: PASS3_NOW,
          command: {
            kind: "apply_scene_resolution",
            sourceCommandId: envelope.commandId,
            manifestInstanceId: manifest.manifestInstanceId,
            manifestDigest: manifest.digest,
            runtimeSceneId: scene.runtimeSceneId,
            runtimeInteractionId: scene.interaction?.runtimeInteractionId,
            runtimeQuestionId: ["reflection", "stance_selection"].includes(
              scene.interaction?.kind ?? "",
            )
              ? scene.interaction?.runtimeQuestionId
              : undefined,
            runtimeTransitionId: scene.transitions[0]?.runtimeTransitionId,
            outcome: "satisfied",
          },
        },
        participantManifest: manifest,
        nowUtc: PASS3_NOW,
        sceneVisitId: nextId(harness, "visit"),
      });
      expect(result.status, `${canonical.canonicalSceneId} protected resolution must succeed`).toBe(
        scene.transitions.length > 0 ? "advanced" : "awaiting_route_binding",
      );
    }

    const after = await activeRun(harness);
    expect(after.stateRevision).toBe(result.stateRevision);
    expect(after.stateRevision).toBeGreaterThan(before.stateRevision);
    expect(after.activeManifest?.manifestInstanceId).toBe(manifest.manifestInstanceId);
    for (const establishment of canonical.establishes) {
      expect(
        after.validation[establishment.key]?.value,
        `${canonical.canonicalSceneId} must establish ${establishment.key}`,
      ).toBe(establishment.value);
      expect(after.validation[establishment.key]?.stale).not.toBe(true);
    }

    const completedVisit = [...after.sceneVisitOrder]
      .map((visitId) => after.sceneVisits[visitId]!)
      .find(
        (visit) => visit.runtimeSceneId === scene.runtimeSceneId && Boolean(visit.completedAtUtc),
      );
    expect(completedVisit).toBeDefined();
    const transition = scene.transitions[0];
    if (transition) {
      expect(after.currentRuntimeSceneId).toBe(transition.targetRuntimeSceneId);
      expect(after.lastStableRuntimeSceneId).toBe(transition.targetRuntimeSceneId);
      const currentVisit = after.sceneVisits[after.sceneVisitOrder.at(-1)!]!;
      expect(currentVisit.runtimeSceneId).toBe(transition.targetRuntimeSceneId);
      expect(currentVisit.completedAtUtc).toBeUndefined();
    } else {
      expect(after.currentRuntimeSceneId).toBe(scene.runtimeSceneId);
      expect(after.lastStableRuntimeSceneId).toBe(scene.runtimeSceneId);
    }
    if (inactivePrefix) {
      expect(
        Object.values(compilation.protectedMapping.scenes).some((entry) =>
          entry.canonicalSceneId.startsWith(inactivePrefix),
        ),
      ).toBe(false);
    }
    expect(JSON.stringify(after)).not.toMatch(/marks|grace|gift|sovereign/i);
  }
  return visitedCanonicalIds;
}

describe("true Gate 1 conductor full paths", () => {
  it.each([
    [FALSE_ARRIVAL_ROUTE_ID, 14, "ST-"],
    [SPLINTERED_TRUST_ROUTE_ID, 15, "FA-"],
  ] as const)(
    "executes pre-route, %s active route, and completion end to end",
    async (routeId, activeCount, inactivePrefix) => {
      const harness = createPathHarness();
      const preRoute = compilePass3Stage({ stage: "pre_route", factoryStart: 10_000 });
      await activate(harness, preRoute, "start_pre_route");
      const preIds = await traverseStage(harness, preRoute);
      expect(preIds).toEqual([
        "G1-00",
        "G1-01",
        "G1-02",
        "G1-03",
        "G1-04",
        "G1-05",
        "G1-06",
        "G1-07",
        "G1-08",
        "G1-09",
      ]);
      const routeWait = await activeRun(harness);
      expect(routeWait.currentRuntimeSceneId).toBe(
        preRoute.participantManifest.scenes.at(-1)!.runtimeSceneId,
      );
      expect(routeWait.commandReceipts.at(-1)?.resolutionState).toBe("resolved");

      const activeRoute = compilePass3Stage({
        stage: "active_route",
        routeId,
        factoryStart: routeId === FALSE_ARRIVAL_ROUTE_ID ? 20_000 : 30_000,
      });
      await activate(harness, activeRoute, "route_bound");
      const activeIds = await traverseStage(harness, activeRoute, inactivePrefix);
      expect(activeIds).toHaveLength(activeCount);
      expect(activeIds.at(0)).toBe("G1-10");
      expect(activeIds.at(-1)).toBe("G1-15");

      const completion = compilePass3Stage({ stage: "completion", factoryStart: 40_000 });
      await activate(harness, completion, "enter_completion");
      const completionIds = await traverseStage(harness, completion);
      expect(completionIds).toEqual(["G1-16"]);
      const completed = await activeRun(harness);
      expect(completed.status).toBe("completed");
      expect(completed.completedAtUtc).toBe(PASS3_NOW);
      expect(completed.validation["g1.completed"]?.value).toBe(true);
      expect(JSON.stringify(completed)).not.toMatch(/marks|grace|gift|sovereign/i);
    },
  );
});
