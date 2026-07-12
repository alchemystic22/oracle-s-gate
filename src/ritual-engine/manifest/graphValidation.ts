import type { CanonicalRouteId, CanonicalSceneId } from "../domain/ids";
import type { CanonicalSceneDefinition, Gate1CanonicalManifest } from "./sceneTypes";

export class ManifestValidationError extends Error {}

function sceneMap(manifest: Gate1CanonicalManifest): Map<string, CanonicalSceneDefinition> {
  return new Map(manifest.scenes.map((scene) => [scene.canonicalSceneId, scene]));
}

export function validateSceneGraph(manifest: Gate1CanonicalManifest): void {
  const scenes = sceneMap(manifest);
  if (scenes.size !== manifest.scenes.length) {
    throw new ManifestValidationError("Canonical scene IDs must be unique");
  }

  for (const scene of manifest.scenes) {
    for (const transition of scene.transitions) {
      if (!scenes.has(transition.targetSceneId)) {
        throw new ManifestValidationError("Canonical transition target is missing");
      }
    }
  }

  const reachable = new Set<string>();
  const queue: string[] = ["G1-00"];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (reachable.has(id)) continue;
    reachable.add(id);
    const scene = scenes.get(id);
    if (scene) queue.push(...scene.transitions.map((transition) => transition.targetSceneId));
  }

  if (reachable.size !== manifest.scenes.length) {
    throw new ManifestValidationError("All canonical scenes must be reachable");
  }
}

export function validateQuestionPreparation(manifest: Gate1CanonicalManifest): void {
  for (const scene of manifest.scenes) {
    if (scene.type === "question" && scene.protected?.canonicalQuestionId) {
      if (scene.prerequisites.length === 0) {
        throw new ManifestValidationError("Major questions require preparation");
      }
    }
  }
}

export function resolveCanonicalPath(
  manifest: Gate1CanonicalManifest,
  routeId: CanonicalRouteId,
): readonly CanonicalSceneId[] {
  const scenes = sceneMap(manifest);
  const path: CanonicalSceneId[] = [];
  let current = "G1-00";

  while (true) {
    const scene = scenes.get(current);
    if (!scene) throw new ManifestValidationError("Canonical path references a missing scene");
    path.push(scene.canonicalSceneId);
    if (scene.transitions.length === 0) break;
    const transition =
      scene.transitions.find((candidate) => candidate.routeId === routeId) ??
      scene.transitions.find((candidate) => !candidate.routeId);
    if (!transition) throw new ManifestValidationError("Canonical route cannot advance");
    current = transition.targetSceneId;
    if (path.length > manifest.scenes.length) {
      throw new ManifestValidationError("Canonical graph contains a cycle");
    }
  }

  return path;
}

export function validateRouteConvergence(
  manifest: Gate1CanonicalManifest,
  routeIds: readonly CanonicalRouteId[],
): void {
  for (const routeId of routeIds) {
    const path = resolveCanonicalPath(manifest, routeId);
    if (!path.includes("G1-12" as CanonicalSceneId)) {
      throw new ManifestValidationError("Canonical routes must converge at the shared closing");
    }
  }
}
