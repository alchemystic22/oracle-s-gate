import type { RitualResponseRecord } from "../domain/responses";
import type { RitualSafetyRuntime } from "../domain/safety";

export type RitualReducerAction =
  | { type: "SET_CURRENT_SCENE"; runtimeSceneId: string; updatedAtUtc: string }
  | { type: "UPSERT_RESPONSE"; response: RitualResponseRecord }
  | { type: "SET_VALIDATION"; key: string; value: boolean; source: string; updatedAtUtc: string }
  | { type: "SET_SAFETY"; safety: RitualSafetyRuntime }
  | {
      type: "SET_STATUS";
      status: "not_started" | "active" | "paused" | "blocked" | "completed";
      updatedAtUtc: string;
    }
  | { type: "COMMIT_REVISION"; revision: number; updatedAtUtc: string };
