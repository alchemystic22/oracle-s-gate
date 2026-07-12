import type { CanonicalRouteId, CanonicalSceneId } from "../domain/ids";
import type {
  CanonicalSceneDefinition,
  Gate1CanonicalManifest,
  ValidationRequirement,
} from "./sceneTypes";

export class ManifestValidationError extends Error {}

const EXPECTED_MAJOR_QUESTION_PREPARATION: Readonly<
  Record<string, readonly ValidationRequirement[]>
> = {
  "G1Q-BRIDGE": [{ key: "g1.promise_recognition_completed", source: "shared" }],
  "G1Q-AXIS": [{ key: "g1.bridge_answered", source: "shared" }],
  "G1Q-FA-AXIS": [{ key: "g1.active_route_distinction_established", source: "active_route" }],
  "G1Q-ST-AXIS": [{ key: "g1.active_route_distinction_established", source: "active_route" }],
  "G1Q-READINESS": [
    { key: "g1.bridge_answered", source: "shared" },
    { key: "g1.gate_axis_answered", source: "shared" },
    { key: "g1.stance_recognized", source: "shared" },
    { key: "g1.active_route_gate_act_formed", source: "active_route" },
    { key: "g1.active_route_qualifying_evidence", source: "active_route" },
  ],
};

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
  const found = new Set<string>();
  for (const scene of manifest.scenes) {
    if (scene.protected?.canonicalQuestionId) {
      const questionId = scene.protected.canonicalQuestionId;
      const expected = EXPECTED_MAJOR_QUESTION_PREPARATION[questionId];
      if (!expected) continue;
      found.add(questionId);
      if (JSON.stringify(scene.prerequisites) !== JSON.stringify(expected)) {
        throw new ManifestValidationError("A major question has an invalid preparation contract");
      }
    }
  }
  if (found.size !== Object.keys(EXPECTED_MAJOR_QUESTION_PREPARATION).length) {
    throw new ManifestValidationError("A major question preparation contract is missing");
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

export function validatePreparationFlow(
  manifest: Gate1CanonicalManifest,
  routeIds: readonly CanonicalRouteId[],
): void {
  const scenes = sceneMap(manifest);
  for (const routeId of routeIds) {
    const established = {
      shared: new Set<string>(),
      active_route: new Set<string>(),
    };
    let previousScene: CanonicalSceneDefinition | undefined;
    for (const sceneId of resolveCanonicalPath(manifest, routeId)) {
      const scene = scenes.get(sceneId)!;
      if (previousScene && scene.prerequisites.length === 0) {
        throw new ManifestValidationError(
          "A canonical scene lacks its sequential preparation milestone",
        );
      }
      for (const requirement of scene.prerequisites) {
        if (!established[requirement.source].has(requirement.key)) {
          throw new ManifestValidationError(
            "A canonical scene lacks its sequential preparation milestone",
          );
        }
      }
      const source =
        scene.group === "false_arrival" || scene.group === "splintered_trust"
          ? "active_route"
          : "shared";
      if (previousScene && previousScene.establishes.length > 0) {
        const previousSource =
          previousScene.group === "false_arrival" || previousScene.group === "splintered_trust"
            ? "active_route"
            : "shared";
        const directlyAuthorized = previousScene.establishes.some((establishment) =>
          scene.prerequisites.some(
            (requirement) =>
              requirement.key === establishment.key && requirement.source === previousSource,
          ),
        );
        if (!directlyAuthorized) {
          throw new ManifestValidationError(
            "A canonical scene lacks its sequential preparation milestone",
          );
        }
      }
      for (const establishment of scene.establishes) {
        if (establishment.value) established[source].add(establishment.key);
      }
      previousScene = scene;
    }
  }
}
