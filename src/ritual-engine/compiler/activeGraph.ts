import type { CanonicalRouteId } from "../domain/ids";
import type {
  CanonicalSceneDefinition,
  Gate1CanonicalManifest,
  ProtectedRouteCanon,
} from "../manifest/sceneTypes";
import type { ParticipantManifestStage, ProtectedRouteBinding } from "./types";

export type ResolvedParticipantGraph = {
  scenes: readonly CanonicalSceneDefinition[];
  activeRouteCanon?: ProtectedRouteCanon;
};

function requireNoBinding(binding: unknown): void {
  if (binding !== undefined)
    throw new Error("This participant stage does not accept route binding");
}

function resolveActiveRoute(
  manifest: Gate1CanonicalManifest,
  binding: ProtectedRouteBinding | undefined,
): ResolvedParticipantGraph {
  if (!binding || Array.isArray(binding)) throw new Error("A valid route binding is required");
  if (!Number.isInteger(binding.routeBindingRevision) || binding.routeBindingRevision < 0) {
    throw new Error("A valid route binding is required");
  }

  const routeCanon = manifest.protectedRouteMap[binding.protectedRouteId];
  if (!routeCanon) throw new Error("A valid route binding is required");
  const routeScenes = manifest.scenes.filter(
    (scene) => scene.protected?.routeId === binding.protectedRouteId,
  );
  if (routeScenes.length === 0) throw new Error("A valid route binding is required");

  const opening = manifest.scenes.filter((scene) =>
    ["G1-10", "G1-11"].includes(scene.canonicalSceneId),
  );
  const closing = manifest.scenes.filter((scene) =>
    ["G1-12", "G1-13", "G1-14", "G1-15"].includes(scene.canonicalSceneId),
  );
  return { scenes: [...opening, ...routeScenes, ...closing], activeRouteCanon: routeCanon };
}

export function resolveParticipantGraph(
  manifest: Gate1CanonicalManifest,
  stage: ParticipantManifestStage,
  binding?: ProtectedRouteBinding,
): ResolvedParticipantGraph {
  if (stage === "pre_route") {
    requireNoBinding(binding);
    return {
      scenes: manifest.scenes.filter(
        (scene) => scene.group === "shared_opening" && scene.canonicalSceneId <= "G1-09",
      ),
    };
  }
  if (stage === "completion") {
    requireNoBinding(binding);
    const scene = manifest.scenes.find((candidate) => candidate.canonicalSceneId === "G1-16");
    if (!scene) throw new Error("Completion scene is unavailable");
    return { scenes: [scene] };
  }
  if (stage === "active_route") return resolveActiveRoute(manifest, binding);
  throw new Error("Participant manifest stage is invalid");
}

export function routeIdFromUnknown(value: unknown): CanonicalRouteId {
  return value as CanonicalRouteId;
}
