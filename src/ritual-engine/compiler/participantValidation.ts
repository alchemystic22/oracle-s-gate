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
  const interactionIds = new Set<string>();
  const questionIds = new Set<string>();
  const transitionIds = new Set<string>();
  for (const scene of manifest.scenes) {
    assertOpaqueIdentifier(scene.runtimeSceneId);
    if (sceneIds.has(scene.runtimeSceneId)) throw new Error("Participant scene IDs must be unique");
    sceneIds.add(scene.runtimeSceneId);
    if (scene.interaction) {
      assertOpaqueIdentifier(scene.interaction.runtimeInteractionId);
      if (interactionIds.has(scene.interaction.runtimeInteractionId)) {
        throw new Error("Participant interaction IDs must be unique");
      }
      interactionIds.add(scene.interaction.runtimeInteractionId);
      if (scene.interaction.runtimeQuestionId) {
        assertOpaqueIdentifier(scene.interaction.runtimeQuestionId);
        if (questionIds.has(scene.interaction.runtimeQuestionId)) {
          throw new Error("Participant question IDs must be unique");
        }
        questionIds.add(scene.interaction.runtimeQuestionId);
      }
    }
  }

  if (!sceneIds.has(manifest.entryRuntimeSceneId)) {
    throw new Error("Participant entry scene is missing");
  }
  if (
    manifest.routeBindingRevision !== undefined &&
    (!Number.isInteger(manifest.routeBindingRevision) || manifest.routeBindingRevision < 0)
  ) {
    throw new Error("Participant route binding revision is invalid");
  }

  for (const scene of manifest.scenes) {
    for (const transition of scene.transitions) {
      assertOpaqueIdentifier(transition.runtimeTransitionId);
      if (transitionIds.has(transition.runtimeTransitionId)) {
        throw new Error("Participant transition IDs must be unique");
      }
      transitionIds.add(transition.runtimeTransitionId);
      if (!sceneIds.has(transition.targetRuntimeSceneId)) {
        throw new Error("Participant transition target is missing");
      }
    }
  }

  const byId = new Map(manifest.scenes.map((scene) => [scene.runtimeSceneId, scene]));
  const reachable = new Set<string>();
  const visiting = new Set<string>();
  function visit(sceneId: string): void {
    if (visiting.has(sceneId)) throw new Error("Participant graph must be acyclic");
    if (reachable.has(sceneId)) return;
    visiting.add(sceneId);
    const scene = byId.get(sceneId)!;
    for (const transition of scene.transitions) visit(transition.targetRuntimeSceneId);
    visiting.delete(sceneId);
    reachable.add(sceneId);
  }
  visit(manifest.entryRuntimeSceneId);
  if (reachable.size !== manifest.scenes.length) {
    throw new Error("All participant scenes must be reachable from the entry");
  }
  if (manifest.scenes.at(-1)?.transitions.length !== 0) {
    throw new Error("The final participant scene must be terminal");
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
