import type { RitualGateRuntime } from "../domain/runtime";
import type { CanonicalSceneDefinition } from "../manifest/sceneTypes";
import type { RitualReducerAction } from "../runtime/actions";

export function authoredEstablishmentOperations(
  run: RitualGateRuntime,
  scene: CanonicalSceneDefinition,
  nowUtc: string,
): RitualReducerAction[] {
  const routeBindingRevision =
    scene.group === "shared_opening" ? undefined : run.activeManifest?.routeBindingRevision;
  return scene.establishes.map((establishment) => ({
    type: "SET_VALIDATION" as const,
    key: establishment.key,
    value: establishment.value,
    source: routeBindingRevision === undefined ? "shared" : "active_route",
    routeBindingRevision,
    updatedAtUtc: nowUtc,
  }));
}
