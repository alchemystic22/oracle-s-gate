import type { RitualGateRuntime } from "../domain/runtime";
import type { RitualReducerAction } from "./actions";

export function ritualGateReducer(
  state: RitualGateRuntime,
  action: RitualReducerAction,
): RitualGateRuntime {
  switch (action.type) {
    case "SET_CURRENT_SCENE":
      return {
        ...state,
        currentRuntimeSceneId: action.runtimeSceneId,
        lastStableRuntimeSceneId: action.runtimeSceneId,
        updatedAtUtc: action.updatedAtUtc,
      };
    case "UPSERT_RESPONSE":
      return {
        ...state,
        responses: { ...state.responses, [action.response.responseId]: action.response },
        updatedAtUtc: action.response.updatedAtUtc,
      };
    case "SET_VALIDATION":
      return {
        ...state,
        validation: {
          ...state.validation,
          [action.key]: {
            value: action.value,
            source: action.source,
            updatedAtUtc: action.updatedAtUtc,
          },
        },
        updatedAtUtc: action.updatedAtUtc,
      };
    case "SET_SAFETY":
      return { ...state, safety: action.safety, updatedAtUtc: action.safety.updatedAtUtc };
    case "SET_STATUS":
      return { ...state, status: action.status, updatedAtUtc: action.updatedAtUtc };
    case "COMMIT_REVISION":
      if (action.revision < state.stateRevision) return state;
      return { ...state, stateRevision: action.revision, updatedAtUtc: action.updatedAtUtc };
    default:
      return state;
  }
}
