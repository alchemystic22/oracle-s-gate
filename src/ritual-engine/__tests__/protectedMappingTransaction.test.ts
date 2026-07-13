import { describe, expect, it } from "vitest";
import type { ProtectedParticipantCompilation } from "../compiler/index.protected";
import { Gate1SceneConductor } from "../conductor/index.protected";
import type { RitualRuntimeRoot } from "../domain/runtime";
import { FALSE_ARRIVAL_ROUTE_ID } from "../gate1/constants";
import { GATE1_CANONICAL_MANIFEST } from "../gate1/manifest";
import { MemoryRitualTransactionalPersistenceAdapter } from "../persistence/transactionalMemory";
import { MemoryProtectedMappingProvider } from "../protected-store/memoryMappingProvider.protected";
import { createGateRuntime, createRuntimeRoot } from "../runtime/factories";
import { PASS3_NOW, compilePass3Stage } from "./pass3Fixture";

function freshRoot(): RitualRuntimeRoot {
  return createRuntimeRoot({
    participantId: "participant-mapping-transaction",
    gateRun: createGateRuntime({
      gateRunId: "gate-run-mapping-transaction",
      journeyCycleId: "cycle-mapping-transaction",
      nowUtc: PASS3_NOW,
    }),
    privacyMode: "full_private_continuity",
    nowUtc: PASS3_NOW,
  });
}

function preRouteBoundary(compilation: ProtectedParticipantCompilation): RitualRuntimeRoot {
  const root = freshRoot();
  const run = root.gateRuns["gate-run-mapping-transaction"]!;
  const manifest = compilation.participantManifest;
  const terminal = manifest.scenes.at(-1)!;
  run.status = "active";
  run.stateRevision = 7;
  run.currentRuntimeSceneId = terminal.runtimeSceneId;
  run.lastStableRuntimeSceneId = terminal.runtimeSceneId;
  run.activeManifest = {
    manifestInstanceId: manifest.manifestInstanceId,
    manifestStage: manifest.stage,
    manifestDigest: manifest.digest,
    canonicalManifestVersion: manifest.gateManifestVersion,
    activatedAtUtc: PASS3_NOW,
  };
  run.sceneVisits = {
    "terminal-visit": {
      sceneVisitId: "terminal-visit",
      runtimeSceneId: terminal.runtimeSceneId,
      enteredAtUtc: PASS3_NOW,
      completedAtUtc: PASS3_NOW,
    },
  };
  run.sceneVisitOrder = ["terminal-visit"];
  run.validation["g1.stance_recognized"] = {
    value: true,
    source: "shared",
    updatedAtUtc: PASS3_NOW,
  };
  run.commandReceipts = [
    {
      commandId: "stance-command",
      commandKind: "select_option",
      manifestInstanceId: manifest.manifestInstanceId,
      runtimeSceneId: terminal.runtimeSceneId,
      payloadDigest: "stance-digest",
      safeStatus: "awaiting_route_binding",
      resolutionState: "resolved",
      resolutionDigest: "stance-resolution-digest",
      issuedAtUtc: PASS3_NOW,
      recordedAtUtc: PASS3_NOW,
      resolvedAtUtc: PASS3_NOW,
    },
  ];
  return root;
}

async function activate(
  conductor: Gate1SceneConductor,
  compilation: ProtectedParticipantCompilation,
  expectedStateRevision: number,
  reason: "start_pre_route" | "route_bound",
) {
  return conductor.executeProtected({
    envelope: {
      schemaVersion: 1,
      protectedCommandId: `mapping-${reason}`,
      expectedStateRevision,
      issuedAtUtc: PASS3_NOW,
      command: { kind: "activate_compilation", activationReason: reason, compilation },
    },
    nowUtc: PASS3_NOW,
    sceneVisitId: "opaquemappingvisit000001",
  });
}

describe("transactional protected mapping changes", () => {
  it("does not mutate runtime when mapping preparation fails", async () => {
    const root = freshRoot();
    const adapter = new MemoryRitualTransactionalPersistenceAdapter(root);
    const provider = new MemoryProtectedMappingProvider();
    provider.failNextAt("put");
    const compilation = compilePass3Stage({ stage: "pre_route", factoryStart: 50_000 });
    const result = await activate(
      new Gate1SceneConductor(adapter, provider, GATE1_CANONICAL_MANIFEST),
      compilation,
      0,
      "start_pre_route",
    );
    expect(result.status).toBe("rejected_invalid");
    expect(await adapter.loadActive()).toEqual(root);
    expect(
      provider.getByManifestInstanceId(compilation.participantManifest.manifestInstanceId),
    ).toBeNull();
  });

  it("rolls back a prepared mapping when runtime promotion fails", async () => {
    const root = freshRoot();
    const adapter = new MemoryRitualTransactionalPersistenceAdapter(root);
    adapter.failNextAt("promote");
    const provider = new MemoryProtectedMappingProvider();
    const compilation = compilePass3Stage({ stage: "pre_route", factoryStart: 51_000 });
    const result = await activate(
      new Gate1SceneConductor(adapter, provider, GATE1_CANONICAL_MANIFEST),
      compilation,
      0,
      "start_pre_route",
    );
    expect(result.status).toBe("rejected_invalid");
    expect(await adapter.loadActive()).toEqual(root);
    expect(
      provider.getByManifestInstanceId(compilation.participantManifest.manifestInstanceId),
    ).toBeNull();
  });

  it("compensates runtime when prior mapping retirement fails", async () => {
    const preRoute = compilePass3Stage({ stage: "pre_route", factoryStart: 52_000 });
    const activeRoute = compilePass3Stage({
      stage: "active_route",
      routeId: FALSE_ARRIVAL_ROUTE_ID,
      factoryStart: 53_000,
    });
    const root = preRouteBoundary(preRoute);
    const adapter = new MemoryRitualTransactionalPersistenceAdapter(root);
    const provider = new MemoryProtectedMappingProvider();
    provider.put(preRoute.protectedMapping);
    provider.failNextAt("retire");
    const result = await activate(
      new Gate1SceneConductor(adapter, provider, GATE1_CANONICAL_MANIFEST),
      activeRoute,
      7,
      "route_bound",
    );
    expect(result.status).toBe("rejected_invalid");
    expect(await adapter.loadActive()).toEqual(root);
    expect(
      provider.getByManifestInstanceId(preRoute.participantManifest.manifestInstanceId)
        ?.retiredAtUtc,
    ).toBeUndefined();
    expect(
      provider.getByManifestInstanceId(activeRoute.participantManifest.manifestInstanceId),
    ).toBeNull();
  });

  it("fails closed when mapping rollback itself reports failure", async () => {
    const root = freshRoot();
    const adapter = new MemoryRitualTransactionalPersistenceAdapter(root);
    adapter.failNextAt("promote");
    const provider = new MemoryProtectedMappingProvider();
    provider.failNextAt("rollback");
    const compilation = compilePass3Stage({ stage: "pre_route", factoryStart: 54_000 });
    const result = await activate(
      new Gate1SceneConductor(adapter, provider, GATE1_CANONICAL_MANIFEST),
      compilation,
      0,
      "start_pre_route",
    );
    expect(result.status).toBe("rejected_invalid");
    expect(await adapter.loadActive()).toEqual(root);
    expect(
      provider.getByManifestInstanceId(compilation.participantManifest.manifestInstanceId),
    ).toBeNull();
    expect(JSON.stringify(await adapter.loadActive())).not.toContain("protectedMapping");
  });
});
