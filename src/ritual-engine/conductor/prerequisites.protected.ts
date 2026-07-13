import type { RitualGateRuntime } from "../domain/runtime";
import type { CanonicalSceneDefinition } from "../manifest/sceneTypes";

export function authoredPrerequisitesSatisfied(
  run: RitualGateRuntime,
  scene: CanonicalSceneDefinition,
): boolean {
  return scene.prerequisites.every((requirement) => {
    const validation = run.validation[requirement.key];
    if (!validation?.value || validation.stale) return false;
    if (requirement.source === "shared") {
      if (validation.routeBindingRevision === undefined) return true;
      if (run.activeManifest?.manifestStage === "completion") return true;
      return validation.routeBindingRevision === run.activeManifest?.routeBindingRevision;
    }
    return (
      run.activeManifest?.routeBindingRevision !== undefined &&
      validation.routeBindingRevision === run.activeManifest.routeBindingRevision
    );
  });
}
