import type { RitualResponseRecord } from "../domain/responses";
import type { RitualSafetyRuntime } from "../domain/safety";
import type {
  ParticipantCommandReceipt,
  RitualGateRuntime,
  RitualOutboxRecord,
  SceneVisitRecord,
} from "../domain/runtime";
import type { GateActRecord } from "../domain/gateAct";
import type { EvidenceEvent } from "../domain/evidence";

export type RitualReducerAction =
  | { type: "SET_CURRENT_SCENE"; runtimeSceneId: string; updatedAtUtc: string }
  | { type: "CONFIRM_STABLE_SCENE"; runtimeSceneId: string; updatedAtUtc: string }
  | { type: "OPEN_SCENE_VISIT"; visit: SceneVisitRecord }
  | { type: "COMPLETE_SCENE_VISIT"; sceneVisitId: string; completedAtUtc: string }
  | { type: "UPSERT_RESPONSE"; response: RitualResponseRecord }
  | {
      type: "SET_RESPONSE_STATE";
      responseId: string;
      state: RitualResponseRecord["state"];
      updatedAtUtc: string;
    }
  | { type: "UPSERT_GATE_ACT"; gateAct: GateActRecord }
  | { type: "APPEND_EVIDENCE"; evidence: EvidenceEvent; updatedAtUtc: string }
  | {
      type: "SET_VALIDATION";
      key: string;
      value: boolean;
      source: string;
      updatedAtUtc: string;
      routeBindingRevision?: number;
      stale?: boolean;
    }
  | { type: "MARK_ROUTE_DATA_STALE"; routeBindingRevision: number; updatedAtUtc: string }
  | { type: "SET_SAFETY"; safety: RitualSafetyRuntime }
  | { type: "ACTIVATE_MANIFEST"; manifest: RitualGateRuntime["activeManifest"] }
  | { type: "APPEND_COMMAND_RECEIPT"; receipt: ParticipantCommandReceipt }
  | {
      type: "RESOLVE_COMMAND_RECEIPT";
      commandId: string;
      resolutionDigest: string;
      resolutionState: "resolved" | "superseded";
      safeStatus: ParticipantCommandReceipt["safeStatus"];
      resolvedAtUtc: string;
    }
  | { type: "APPEND_OUTBOX_INTENT"; outbox: RitualOutboxRecord; updatedAtUtc: string }
  | { type: "UPDATE_OUTBOX_INTENT"; outbox: RitualOutboxRecord; updatedAtUtc: string }
  | {
      type: "SET_STATUS";
      status: "not_started" | "active" | "paused" | "blocked" | "completed";
      updatedAtUtc: string;
    }
  | { type: "SET_COMPLETED"; completedAtUtc: string }
  | { type: "COMMIT_REVISION"; revision: number; updatedAtUtc: string };
