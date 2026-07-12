import { validateCanonicalManifest } from "../gate1/manifest";
import { resolveParticipantGraph } from "./activeGraph";
import { assertOpaqueIdentifier } from "./opaqueIds";
import { projectParticipantScene } from "./participantAllowlist";
import { resolveParticipantAssets } from "./participantAssets";
import { validateParticipantManifest } from "./participantValidation";
import type {
  CompileParticipantManifestInput,
  ParticipantManifest,
  ParticipantScene,
} from "./types";

function structuralDigest(value: unknown): string {
  const text = JSON.stringify(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `pm${(hash >>> 0).toString(16).padStart(8, "0")}digest`;
}

export function compileParticipantManifest(
  input: CompileParticipantManifestInput,
): ParticipantManifest {
  validateCanonicalManifest(input.canonicalManifest);
  if (!Number.isFinite(Date.parse(input.compiledAtUtc))) {
    throw new Error("Compilation timestamp is invalid");
  }
  if (input.routeBinding !== undefined) {
    if (Array.isArray(input.routeBinding) || typeof input.routeBinding !== "object") {
      throw new Error("A valid route binding is required");
    }
    assertOpaqueIdentifier(input.routeBinding.routeToken);
  }

  const resolved = resolveParticipantGraph(
    input.canonicalManifest,
    input.stage,
    input.routeBinding,
  );
  const manifestInstanceId = input.opaqueIdFactory.next("manifest");
  assertOpaqueIdentifier(manifestInstanceId);

  const runtimeIds = new Map(
    resolved.scenes.map(({ scene }) => {
      const runtimeSceneId = input.opaqueIdFactory.next("scene");
      assertOpaqueIdentifier(runtimeSceneId);
      return [scene.canonicalSceneId, runtimeSceneId] as const;
    }),
  );

  const scenes: ParticipantScene[] = resolved.scenes.map(({ scene, transition }) => {
    return projectParticipantScene(
      scene,
      runtimeIds.get(scene.canonicalSceneId)!,
      transition
        ? {
            runtimeTransitionId: input.opaqueIdFactory.next("transition"),
            targetRuntimeSceneId: runtimeIds.get(transition.targetSceneId)!,
          }
        : undefined,
      input.opaqueIdFactory,
      resolved.activeRouteCanon,
    );
  });
  const assetKeys = scenes.flatMap((scene) => scene.assetRefs ?? []);
  const assets = resolveParticipantAssets(assetKeys, input.participantAssetRegistry);

  const withoutDigest = {
    schemaVersion: 1 as const,
    manifestInstanceId,
    gateId: 1 as const,
    gateManifestVersion: input.canonicalManifest.version,
    stage: input.stage,
    entryRuntimeSceneId: scenes[0]!.runtimeSceneId,
    routeToken: input.stage === "active_route" ? input.routeBinding!.routeToken : undefined,
    routeBindingRevision:
      input.stage === "active_route" ? input.routeBinding!.routeBindingRevision : undefined,
    scenes,
    assets,
    compiledAtUtc: input.compiledAtUtc,
  };
  const manifest: ParticipantManifest = {
    ...withoutDigest,
    digest: structuralDigest(withoutDigest),
  };
  validateParticipantManifest(manifest);
  return manifest;
}
