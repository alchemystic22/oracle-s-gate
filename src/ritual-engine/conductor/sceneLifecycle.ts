import type { RitualGateRuntime } from "../domain/runtime";
import type { RitualReducerAction } from "../runtime/actions";

export function currentOpenVisitId(state: RitualGateRuntime): string | undefined {
  return [...state.sceneVisitOrder].reverse().find((id) => {
    const visit = state.sceneVisits[id];
    return visit?.runtimeSceneId === state.currentRuntimeSceneId && !visit.completedAtUtc;
  });
}

export function planEnterScene(input: {
  state: RitualGateRuntime;
  runtimeSceneId: string;
  sceneVisitId: string;
  enteredAtUtc: string;
  completeCurrent: boolean;
}): RitualReducerAction[] {
  const operations: RitualReducerAction[] = [];
  const currentVisitId = currentOpenVisitId(input.state);
  if (input.completeCurrent && currentVisitId) {
    operations.push({
      type: "COMPLETE_SCENE_VISIT",
      sceneVisitId: currentVisitId,
      completedAtUtc: input.enteredAtUtc,
    });
  }
  operations.push(
    {
      type: "SET_CURRENT_SCENE",
      runtimeSceneId: input.runtimeSceneId,
      updatedAtUtc: input.enteredAtUtc,
    },
    {
      type: "OPEN_SCENE_VISIT",
      visit: {
        sceneVisitId: input.sceneVisitId,
        runtimeSceneId: input.runtimeSceneId,
        enteredAtUtc: input.enteredAtUtc,
      },
    },
  );
  return operations;
}
