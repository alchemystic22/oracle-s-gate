import { assertOpaqueIdentifier } from "./opaqueIds";
import { scanParticipantObjectForProtectedTerms } from "./concealmentScanner";
import type { ParticipantManifest } from "./types";

export function validateParticipantManifest(manifest: ParticipantManifest): void {
  if (manifest.schemaVersion !== 1 || manifest.gateId !== 1) {
    throw new Error("Participant manifest identity is invalid");
  }
  assertOpaqueIdentifier(manifest.manifestInstanceId);
  assertOpaqueIdentifier(manifest.entryRuntimeSceneId);
  if (manifest.routeToken) assertOpaqueIdentifier(manifest.routeToken);

  const sceneIds = new Set<string>();
  for (const scene of manifest.scenes) {
    assertOpaqueIdentifier(scene.runtimeSceneId);
    if (sceneIds.has(scene.runtimeSceneId)) throw new Error("Participant scene IDs must be unique");
    sceneIds.add(scene.runtimeSceneId);
    if (scene.interaction?.runtimeQuestionId) {
      assertOpaqueIdentifier(scene.interaction.runtimeQuestionId);
    }
  }

  for (const scene of manifest.scenes) {
    for (const transition of scene.transitions) {
      if (!sceneIds.has(transition.targetRuntimeSceneId)) {
        throw new Error("Participant transition target is missing");
      }
    }
  }

  const assetKeys = new Set(manifest.assets.map((asset) => asset.key));
  for (const scene of manifest.scenes) {
    for (const assetRef of scene.assetRefs ?? []) {
      if (!assetKeys.has(assetRef)) throw new Error("Participant asset reference is missing");
    }
  }

  if (manifest.stage === "pre_route") {
    if (
      manifest.scenes.length !== 10 ||
      manifest.routeToken ||
      manifest.routeBindingRevision !== undefined
    ) {
      throw new Error("Pre-route participant manifest boundary is invalid");
    }
  } else if (manifest.stage === "active_route") {
    if (
      ![14, 15].includes(manifest.scenes.length) ||
      !manifest.routeToken ||
      manifest.routeBindingRevision === undefined
    ) {
      throw new Error("Active-route participant manifest boundary is invalid");
    }
  } else if (
    manifest.scenes.length !== 1 ||
    manifest.routeToken ||
    manifest.routeBindingRevision !== undefined
  ) {
    throw new Error("Completion participant manifest boundary is invalid");
  }

  if (scanParticipantObjectForProtectedTerms(manifest).length > 0) {
    throw new Error("Participant manifest concealment validation failed");
  }
}
