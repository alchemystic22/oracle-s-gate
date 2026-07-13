import type { RitualGateRuntime } from "../domain/runtime";
import type { CanonicalSceneDefinition } from "../manifest/sceneTypes";

export function authoredPrerequisitesSatisfied(
  run: RitualGateRuntime,
  scene: CanonicalSceneDefinition,
): boolean {
  return scene.prerequisites.every((requirement) => {
    const validation = run.validation[requirement.key];
    if (!validation?.value || validation.stale) return false;
    if (requirement.source === "shared") return validation.routeBindingRevision === undefined;
    return (
      run.activeManifest?.routeBindingRevision !== undefined &&
      validation.routeBindingRevision === run.activeManifest.routeBindingRevision
    );
  });
}
