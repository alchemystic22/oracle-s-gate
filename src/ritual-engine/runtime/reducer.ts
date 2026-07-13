import type { RitualGateRuntime } from "../domain/runtime";
import type { RitualReducerAction } from "./actions";
import { appendBoundedReceipt } from "../commands/receipts";

export function ritualGateReducer(
  state: RitualGateRuntime,
  action: RitualReducerAction,
): RitualGateRuntime {
  switch (action.type) {
    case "SET_CURRENT_SCENE":
      return {
        ...state,
        currentRuntimeSceneId: action.runtimeSceneId,
        updatedAtUtc: action.updatedAtUtc,
      };
    case "CONFIRM_STABLE_SCENE":
      if (action.runtimeSceneId !== state.currentRuntimeSceneId) return state;
      return {
        ...state,
        lastStableRuntimeSceneId: action.runtimeSceneId,
        updatedAtUtc: action.updatedAtUtc,
      };
    case "OPEN_SCENE_VISIT":
      return {
        ...state,
        sceneVisits: { ...state.sceneVisits, [action.visit.sceneVisitId]: action.visit },
        sceneVisitOrder: [...state.sceneVisitOrder, action.visit.sceneVisitId],
        updatedAtUtc: action.visit.enteredAtUtc,
      };
    case "COMPLETE_SCENE_VISIT": {
      const visit = state.sceneVisits[action.sceneVisitId];
      if (!visit || visit.completedAtUtc) return state;
      return {
        ...state,
        sceneVisits: {
          ...state.sceneVisits,
          [action.sceneVisitId]: { ...visit, completedAtUtc: action.completedAtUtc },
        },
        updatedAtUtc: action.completedAtUtc,
      };
    }
    case "UPSERT_RESPONSE":
      return {
        ...state,
        responses: { ...state.responses, [action.response.responseId]: action.response },
        updatedAtUtc: action.response.updatedAtUtc,
      };
    case "SET_RESPONSE_STATE": {
      const response = state.responses[action.responseId];
      if (!response) return state;
      return {
        ...state,
        responses: {
          ...state.responses,
          [action.responseId]: {
            ...response,
            state: action.state,
            updatedAtUtc: action.updatedAtUtc,
          },
        },
        updatedAtUtc: action.updatedAtUtc,
      };
    }
    case "UPSERT_GATE_ACT":
      return { ...state, gateAct: action.gateAct, updatedAtUtc: action.gateAct.updatedAtUtc };
    case "APPEND_EVIDENCE":
      return {
        ...state,
        evidenceEvents: [...state.evidenceEvents, action.evidence],
        updatedAtUtc: action.updatedAtUtc,
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
            routeBindingRevision: action.routeBindingRevision,
            stale: action.stale,
          },
        },
        updatedAtUtc: action.updatedAtUtc,
      };
    case "MARK_ROUTE_DATA_STALE":
      return {
        ...state,
        responses: Object.fromEntries(
          Object.entries(state.responses).map(([id, response]) => [
            id,
            response.routeBindingRevision === action.routeBindingRevision
              ? { ...response, stale: true, updatedAtUtc: action.updatedAtUtc }
              : response,
          ]),
        ),
        gateAct:
          state.gateAct?.routeBindingRevision === action.routeBindingRevision
            ? {
                ...state.gateAct,
                stale: true,
                status: "completed_but_superseded",
                updatedAtUtc: action.updatedAtUtc,
              }
            : state.gateAct,
        evidenceEvents: state.evidenceEvents.map((evidence) =>
          evidence.routeBindingRevision === action.routeBindingRevision
            ? { ...evidence, stale: true }
            : evidence,
        ),
        validation: Object.fromEntries(
          Object.entries(state.validation).map(([key, validation]) => [
            key,
            validation.routeBindingRevision === action.routeBindingRevision
              ? { ...validation, stale: true, updatedAtUtc: action.updatedAtUtc }
              : validation,
          ]),
        ),
        adaptiveThreads: Object.fromEntries(
          Object.entries(state.adaptiveThreads).map(([id, thread]) => [
            id,
            thread.routeBindingRevision === action.routeBindingRevision &&
            thread.state !== "satisfied"
              ? {
                  ...thread,
                  state: "stale" as const,
                  stale: true,
                  updatedAtUtc: action.updatedAtUtc,
                }
              : thread,
          ]),
        ),
        commandReceipts: state.commandReceipts.map((receipt) =>
          receipt.resolutionState === "unresolved"
            ? { ...receipt, resolutionState: "superseded" as const }
            : receipt,
        ),
        updatedAtUtc: action.updatedAtUtc,
      };
    case "UPSERT_ADAPTIVE_THREAD":
      return {
        ...state,
        adaptiveThreads: {
          ...state.adaptiveThreads,
          [action.thread.threadId]: action.thread,
        },
        updatedAtUtc: action.updatedAtUtc,
      };
    case "SET_SAFETY":
      return { ...state, safety: action.safety, updatedAtUtc: action.safety.updatedAtUtc };
    case "ACTIVATE_MANIFEST":
      return { ...state, activeManifest: action.manifest };
    case "APPEND_COMMAND_RECEIPT":
      return {
        ...state,
        commandReceipts: appendBoundedReceipt(state.commandReceipts, action.receipt),
        updatedAtUtc: action.receipt.recordedAtUtc,
      };
    case "RESOLVE_COMMAND_RECEIPT":
      return {
        ...state,
        commandReceipts: state.commandReceipts.map((receipt) =>
          receipt.commandId === action.commandId
            ? {
                ...receipt,
                resolutionState: action.resolutionState,
                resolutionDigest: action.resolutionDigest,
                safeStatus: action.safeStatus,
                resolvedAtUtc: action.resolvedAtUtc,
              }
            : receipt,
        ),
        updatedAtUtc: action.resolvedAtUtc,
      };
    case "APPEND_OUTBOX_INTENT":
      return {
        ...state,
        pendingOutbox: [...state.pendingOutbox, action.outbox],
        updatedAtUtc: action.updatedAtUtc,
      };
    case "UPDATE_OUTBOX_INTENT":
      return {
        ...state,
        pendingOutbox: state.pendingOutbox.map((outbox) =>
          outbox.outboxId === action.outbox.outboxId ? action.outbox : outbox,
        ),
        updatedAtUtc: action.updatedAtUtc,
      };
    case "SET_STATUS":
      return { ...state, status: action.status, updatedAtUtc: action.updatedAtUtc };
    case "SET_COMPLETED":
      return {
        ...state,
        status: "completed",
        completedAtUtc: action.completedAtUtc,
        updatedAtUtc: action.completedAtUtc,
      };
    case "COMMIT_REVISION":
      if (action.revision < state.stateRevision) return state;
      return { ...state, stateRevision: action.revision, updatedAtUtc: action.updatedAtUtc };
    default:
      return state;
  }
}
