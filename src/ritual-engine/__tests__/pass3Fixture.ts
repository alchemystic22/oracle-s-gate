import type { ParticipantCommand, ParticipantCommandEnvelope } from "../commands";
import { compileParticipantManifest } from "../compiler/index.protected";
import type { ParticipantManifestStage } from "../compiler/types";
import type { CanonicalRouteId } from "../domain/ids";
import { GATE1_PARTICIPANT_ASSET_REGISTRY } from "../gate1/assets";
import { GATE1_CANONICAL_MANIFEST } from "../gate1/manifest";
import { MemoryRitualTransactionalPersistenceAdapter } from "../persistence/transactionalMemory";
import { MemoryProtectedMappingProvider } from "../protected-store/memoryMappingProvider.protected";
import { createGateRuntime, createRuntimeRoot } from "../runtime/factories";
import { Gate1SceneConductor } from "../conductor/index.protected";
import { createTestOpaqueIdFactory, ROUTE_TOKEN_A } from "./pass2Fixture";

export const PASS3_NOW = new Date(1_000).toISOString();

export function compilePass3Stage(input: {
  stage: ParticipantManifestStage;
  routeId?: CanonicalRouteId;
  routeToken?: string;
  routeBindingRevision?: number;
  factoryStart?: number;
}) {
  return compileParticipantManifest({
    canonicalManifest: GATE1_CANONICAL_MANIFEST,
    stage: input.stage,
    routeBinding: input.routeId
      ? {
          protectedRouteId: input.routeId,
          routeToken: input.routeToken ?? ROUTE_TOKEN_A,
          routeBindingRevision: input.routeBindingRevision ?? 1,
        }
      : undefined,
    opaqueIdFactory: createTestOpaqueIdFactory(input.factoryStart ?? 0),
    participantAssetRegistry: GATE1_PARTICIPANT_ASSET_REGISTRY,
    compiledAtUtc: PASS3_NOW,
  });
}

export function makeActiveHarness(input: {
  stage?: ParticipantManifestStage;
  routeId?: CanonicalRouteId;
  sceneIndex?: number;
  stateRevision?: number;
}) {
  const compilation = compilePass3Stage({
    stage: input.stage ?? "pre_route",
    routeId: input.routeId,
  });
  const manifest = compilation.participantManifest;
  const scene = manifest.scenes[input.sceneIndex ?? 0]!;
  const gateRun = createGateRuntime({
    gateRunId: "gate-run-1",
    journeyCycleId: "cycle-1",
    nowUtc: PASS3_NOW,
  });
  gateRun.status = "active";
  gateRun.stateRevision = input.stateRevision ?? 1;
  gateRun.currentRuntimeSceneId = scene.runtimeSceneId;
  gateRun.lastStableRuntimeSceneId = scene.runtimeSceneId;
  gateRun.sceneVisits = {
    "visit-initial": {
      sceneVisitId: "visit-initial",
      runtimeSceneId: scene.runtimeSceneId,
      enteredAtUtc: PASS3_NOW,
    },
  };
  gateRun.sceneVisitOrder = ["visit-initial"];
  gateRun.activeManifest = {
    manifestInstanceId: manifest.manifestInstanceId,
    manifestStage: manifest.stage,
    manifestDigest: manifest.digest,
    canonicalManifestVersion: manifest.gateManifestVersion,
    routeToken: manifest.routeToken,
    routeBindingRevision: manifest.routeBindingRevision,
    activatedAtUtc: PASS3_NOW,
  };
  const canonicalSceneId =
    compilation.protectedMapping.scenes[scene.runtimeSceneId]!.canonicalSceneId;
  const canonicalScene = GATE1_CANONICAL_MANIFEST.scenes.find(
    (candidate) => candidate.canonicalSceneId === canonicalSceneId,
  )!;
  for (const prerequisite of canonicalScene.prerequisites) {
    gateRun.validation[prerequisite.key] = {
      value: true,
      source: prerequisite.source,
      routeBindingRevision:
        prerequisite.source === "active_route" ? manifest.routeBindingRevision : undefined,
      updatedAtUtc: PASS3_NOW,
    };
  }
  const root = createRuntimeRoot({
    participantId: "participant-1",
    gateRun,
    privacyMode: "full_private_continuity",
    nowUtc: PASS3_NOW,
    isTestCycle: true,
  });
  const adapter = new MemoryRitualTransactionalPersistenceAdapter(root);
  const mappingProvider = new MemoryProtectedMappingProvider();
  mappingProvider.put(compilation.protectedMapping);
  const conductor = new Gate1SceneConductor(adapter, mappingProvider, GATE1_CANONICAL_MANIFEST);
  return { compilation, manifest, scene, root, adapter, mappingProvider, conductor };
}

export function makeParticipantEnvelope(
  harness: ReturnType<typeof makeActiveHarness>,
  command: ParticipantCommand,
  overrides: Partial<ParticipantCommandEnvelope> = {},
): ParticipantCommandEnvelope {
  const run = harness.root.gateRuns["gate-run-1"]!;
  const manifest = harness.manifest;
  return {
    schemaVersion: 1,
    commandId: "command-1",
    participantId: harness.root.participantId,
    journeyCycleId: run.journeyCycleId,
    gateRunId: run.gateRunId,
    gateId: 1,
    manifestInstanceId: manifest.manifestInstanceId,
    manifestDigest: manifest.digest,
    manifestStage: manifest.stage,
    expectedStateRevision: run.stateRevision,
    runtimeSceneId: harness.scene.runtimeSceneId,
    routeToken: manifest.routeToken,
    routeBindingRevision: manifest.routeBindingRevision,
    issuedAtUtc: PASS3_NOW,
    command,
    ...overrides,
  };
}

export const PASS3_IDS = {
  sceneVisitId: "opaquevisit000000000001",
  outboxId: "opaqueoutbox00000000001",
  eventId: "opaqueevent000000000001",
  secondaryOutboxId: "opaqueoutbox00000000002",
};
