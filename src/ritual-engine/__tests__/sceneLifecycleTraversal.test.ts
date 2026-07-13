import { describe, expect, it } from "vitest";
import { applyRootPlan } from "../conductor/applyPlan";
import { planEnterScene } from "../conductor/sceneLifecycle";
import { FALSE_ARRIVAL_ROUTE_ID, SPLINTERED_TRUST_ROUTE_ID } from "../gate1/constants";
import { RitualTransactionCoordinator } from "../persistence/transactionCoordinator";
import { MemoryRitualTransactionalPersistenceAdapter } from "../persistence/transactionalMemory";
import { Gate1SceneConductor } from "../conductor/index.protected";
import { GATE1_CANONICAL_MANIFEST } from "../gate1/manifest";
import { PASS3_IDS, PASS3_NOW, makeActiveHarness, makeParticipantEnvelope } from "./pass3Fixture";

async function applyLifecyclePlans(harness: ReturnType<typeof makeActiveHarness>) {
  let root = harness.root;
  const adapter = new MemoryRitualTransactionalPersistenceAdapter(root);
  const coordinator = new RitualTransactionCoordinator(adapter);
  for (let index = 0; index < harness.manifest.scenes.length - 1; index += 1) {
    const run = root.gateRuns["gate-run-1"]!;
    const nextScene = harness.manifest.scenes[index + 1]!;
    const plan = {
      gateRunId: run.gateRunId,
      expectedStateRevision: run.stateRevision,
      operations: [
        ...planEnterScene({
          state: run,
          runtimeSceneId: nextScene.runtimeSceneId,
          sceneVisitId: `opaquevisitpath${String(index).padStart(12, "0")}`,
          enteredAtUtc: PASS3_NOW,
          completeCurrent: true,
        }),
        {
          type: "COMMIT_REVISION" as const,
          revision: run.stateRevision + 1,
          updatedAtUtc: PASS3_NOW,
        },
      ],
      status: "advanced" as const,
      participantMessageCode: "structural_fixture_advanced",
      sceneChanged: true,
    };
    const nextRoot = applyRootPlan(root, plan);
    root = (
      await coordinator.commit({
        expectedStateRevision: run.stateRevision,
        gateRunId: run.gateRunId,
        privacyMode: root.privacyMode,
        nextRuntime: nextRoot,
        confirmStableScene: true,
        confirmedAtUtc: PASS3_NOW,
      })
    ).runtime;
  }
  return root.gateRuns["gate-run-1"]!;
}

describe("low-level scene lifecycle plan traversal", () => {
  it("applies scene lifecycle plans across ten pre-route scenes", async () => {
    const harness = makeActiveHarness({});
    const run = await applyLifecyclePlans(harness);
    expect(run.currentRuntimeSceneId).toBe(harness.manifest.scenes.at(-1)!.runtimeSceneId);
    expect(run.lastStableRuntimeSceneId).toBe(run.currentRuntimeSceneId);
    expect(run.sceneVisitOrder).toHaveLength(10);
  });

  it.each([
    [FALSE_ARRIVAL_ROUTE_ID, 14, "ST-"],
    [SPLINTERED_TRUST_ROUTE_ID, 15, "FA-"],
  ] as const)(
    "applies lifecycle plans without inactive route material",
    async (routeId, count, inactivePrefix) => {
      const harness = makeActiveHarness({ stage: "active_route", routeId });
      const run = await applyLifecyclePlans(harness);
      expect(run.sceneVisitOrder).toHaveLength(count);
      expect(run.currentRuntimeSceneId).toBe(harness.manifest.scenes.at(-1)!.runtimeSceneId);
      expect(
        Object.values(harness.compilation.protectedMapping.scenes).some((entry) =>
          entry.canonicalSceneId.startsWith(inactivePrefix),
        ),
      ).toBe(false);
    },
  );

  it("completes Gate 1 without creating Marks, Grace, or Sovereign Actions", async () => {
    const harness = makeActiveHarness({ stage: "completion" });
    const result = await harness.conductor.executeParticipant({
      envelope: makeParticipantEnvelope(harness, {
        kind: "invoke_scene_action",
        intent: "complete",
      }),
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      ids: PASS3_IDS,
    });
    const run = (await harness.adapter.loadActive())!.gateRuns["gate-run-1"]!;
    expect(result.status).toBe("advanced");
    expect(run.status).toBe("completed");
    expect(run.completedAtUtc).toBe(PASS3_NOW);
    expect(run.sceneVisits["visit-initial"]!.completedAtUtc).toBe(PASS3_NOW);
    expect(JSON.stringify(run)).not.toMatch(/marks|grace|sovereign/i);
  });

  it("rejects completion until book withdrawal is established", async () => {
    const harness = makeActiveHarness({ stage: "completion" });
    delete harness.root.gateRuns["gate-run-1"]!.validation["g1.book_withdrawn"];
    const adapter = new MemoryRitualTransactionalPersistenceAdapter(harness.root);
    const conductor = new Gate1SceneConductor(
      adapter,
      harness.mappingProvider,
      GATE1_CANONICAL_MANIFEST,
    );
    const before = await adapter.loadActive();
    const result = await conductor.executeParticipant({
      envelope: makeParticipantEnvelope(harness, {
        kind: "invoke_scene_action",
        intent: "complete",
      }),
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      ids: PASS3_IDS,
    });
    expect(result.status).toBe("rejected_unauthorized");
    expect(await adapter.loadActive()).toEqual(before);
  });
});
