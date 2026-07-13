import { describe, expect, it } from "vitest";
import { applyRootPlan } from "../conductor/applyPlan";
import { recoverTransactionalRuntime } from "../persistence/recovery";
import { RitualTransactionCoordinator } from "../persistence/transactionCoordinator";
import { MemoryRitualTransactionalPersistenceAdapter } from "../persistence/transactionalMemory";
import { makeActiveHarness, PASS3_NOW } from "./pass3Fixture";

function nextRuntime(harness: ReturnType<typeof makeActiveHarness>) {
  const run = harness.root.gateRuns["gate-run-1"]!;
  return applyRootPlan(harness.root, {
    gateRunId: run.gateRunId,
    expectedStateRevision: run.stateRevision,
    operations: [
      {
        type: "SET_CURRENT_SCENE",
        runtimeSceneId: "opaquevalue999999999999",
        updatedAtUtc: PASS3_NOW,
      },
      { type: "COMMIT_REVISION", revision: run.stateRevision + 1, updatedAtUtc: PASS3_NOW },
    ],
    status: "advanced",
    participantMessageCode: "advanced",
    sceneChanged: true,
  });
}

describe("transactional persistence coordinator", () => {
  it("writes pending before promotion, preserves previous, then confirms stable", async () => {
    const harness = makeActiveHarness({});
    const coordinator = new RitualTransactionCoordinator(harness.adapter);
    const result = await coordinator.commit({
      expectedStateRevision: 1,
      gateRunId: "gate-run-1",
      privacyMode: harness.root.privacyMode,
      nextRuntime: nextRuntime(harness),
      confirmStableScene: true,
      confirmedAtUtc: PASS3_NOW,
    });
    const operations = harness.adapter.getOperations();
    expect(operations.indexOf("write_pending")).toBeLessThan(operations.indexOf("promote"));
    expect(result.runtime.gateRuns["gate-run-1"]!.lastStableRuntimeSceneId).toBe(
      "opaquevalue999999999999",
    );
    expect(await harness.adapter.loadPrevious()).not.toBeNull();
  });

  it("leaves active and stable state unchanged when promotion fails", async () => {
    const harness = makeActiveHarness({});
    const before = await harness.adapter.loadActive();
    harness.adapter.failNextAt("promote");
    await expect(
      new RitualTransactionCoordinator(harness.adapter).commit({
        expectedStateRevision: 1,
        gateRunId: "gate-run-1",
        privacyMode: harness.root.privacyMode,
        nextRuntime: nextRuntime(harness),
        confirmStableScene: true,
        confirmedAtUtc: PASS3_NOW,
      }),
    ).rejects.toThrow();
    expect(await harness.adapter.loadActive()).toEqual(before);
  });

  it("recovers valid previous when active is corrupt", async () => {
    const harness = makeActiveHarness({});
    harness.adapter.seedPrevious(harness.root);
    harness.adapter.seedCorruptActive({ invalid: true });
    const recovered = await recoverTransactionalRuntime(harness.adapter);
    expect(recovered.source).toBe("previous");
    expect(recovered.runtime).toEqual(harness.root);
  });

  it("does not promote arbitrary pending data without a completed marker", async () => {
    const harness = makeActiveHarness({});
    const adapter = new MemoryRitualTransactionalPersistenceAdapter(null);
    adapter.seedPending(harness.root);
    const recovered = await recoverTransactionalRuntime(adapter);
    expect(recovered).toEqual({ source: "none", runtime: null });
  });

  it("recovers pending only when its promotion marker matches exactly", async () => {
    const harness = makeActiveHarness({});
    const run = harness.root.gateRuns["gate-run-1"]!;
    const adapter = new MemoryRitualTransactionalPersistenceAdapter(null);
    adapter.seedPending(harness.root, {
      participantId: harness.root.participantId,
      gateRunId: run.gateRunId,
      stateRevision: run.stateRevision,
      manifestInstanceId: run.activeManifest!.manifestInstanceId,
      manifestDigest: run.activeManifest!.manifestDigest,
      completedAtUtc: PASS3_NOW,
    });
    const recovered = await recoverTransactionalRuntime(adapter);
    expect(recovered.source).toBe("verified_pending");
    expect(await adapter.loadActive()).toEqual(harness.root);
  });
});
