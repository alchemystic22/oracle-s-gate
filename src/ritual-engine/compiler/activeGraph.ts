import type { CanonicalRouteId } from "../domain/ids";
import type {
  CanonicalSceneDefinition,
  CanonicalTransition,
  Gate1CanonicalManifest,
  ProtectedRouteCanon,
} from "../manifest/sceneTypes";
import { resolveCanonicalPath } from "../manifest/graphValidation";
import type { ParticipantManifestStage, ProtectedRouteBinding } from "./types";

export type ResolvedParticipantGraph = {
  scenes: readonly {
    scene: CanonicalSceneDefinition;
    transition?: CanonicalTransition;
  }[];
  activeRouteCanon?: ProtectedRouteCanon;
};

const STAGE_BOUNDARIES = {
  pre_route: ["G1-00", "G1-09"],
  active_route: ["G1-10", "G1-15"],
  completion: ["G1-16", "G1-16"],
} as const;

function requireNoBinding(binding: unknown): void {
  if (binding !== undefined)
    throw new Error("This participant stage does not accept route binding");
}

function routePath(
  manifest: Gate1CanonicalManifest,
  routeId: CanonicalRouteId,
  stage: ParticipantManifestStage,
): ResolvedParticipantGraph["scenes"] {
  const byId = new Map(manifest.scenes.map((scene) => [scene.canonicalSceneId, scene]));
  const fullPath = resolveCanonicalPath(manifest, routeId);
  const [startId, endId] = STAGE_BOUNDARIES[stage];
  const start = fullPath.findIndex((sceneId) => sceneId === startId);
  const end = fullPath.findIndex((sceneId) => sceneId === endId);
  if (start < 0 || end < start) throw new Error("Canonical stage boundary is unavailable");

  const stagePath = fullPath.slice(start, end + 1);
  return stagePath.map((sceneId, index) => {
    const scene = byId.get(sceneId);
    if (!scene) throw new Error("Canonical path references a missing scene");
    const nextSceneId = stagePath[index + 1];
    if (!nextSceneId) return { scene };
    const transition = scene.transitions.find(
      (candidate) =>
        candidate.targetSceneId === nextSceneId &&
        (candidate.routeId === undefined || candidate.routeId === routeId),
    );
    if (!transition) throw new Error("Canonical stage transition is unavailable");
    return { scene, transition };
  });
}

export function resolveParticipantGraph(
  manifest: Gate1CanonicalManifest,
  stage: ParticipantManifestStage,
  binding?: ProtectedRouteBinding,
): ResolvedParticipantGraph {
  if (stage === "pre_route") {
    requireNoBinding(binding);
    const routeId = Object.keys(manifest.protectedRouteMap)[0] as CanonicalRouteId | undefined;
    if (!routeId) throw new Error("Canonical route map is empty");
    return { scenes: routePath(manifest, routeId, stage) };
  }
  if (stage === "completion") {
    requireNoBinding(binding);
    const routeId = Object.keys(manifest.protectedRouteMap)[0] as CanonicalRouteId | undefined;
    if (!routeId) throw new Error("Canonical route map is empty");
    return { scenes: routePath(manifest, routeId, stage) };
  }
  if (stage === "active_route") {
    if (!binding || Array.isArray(binding)) throw new Error("A valid route binding is required");
    if (!Number.isInteger(binding.routeBindingRevision) || binding.routeBindingRevision < 0) {
      throw new Error("A valid route binding is required");
    }
    const routeCanon = manifest.protectedRouteMap[binding.protectedRouteId];
    if (!routeCanon) throw new Error("A valid route binding is required");
    return {
      scenes: routePath(manifest, binding.protectedRouteId, stage),
      activeRouteCanon: routeCanon,
    };
  }
  throw new Error("Participant manifest stage is invalid");
}

export function routeIdFromUnknown(value: unknown): CanonicalRouteId {
  return value as CanonicalRouteId;
}
