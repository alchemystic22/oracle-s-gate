import type { ParticipantPrivacyMode } from "../domain/privacy";
import type { RitualRuntimeRoot } from "../domain/runtime";

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function transformRuntimeForPersistence(
  runtime: RitualRuntimeRoot,
  mode: ParticipantPrivacyMode,
): RitualRuntimeRoot {
  const next = clone(runtime);
  next.privacyMode = mode;

  if (mode === "full_private_continuity") return next;

  for (const gateRun of Object.values(next.gateRuns)) {
    for (const response of Object.values(gateRun.responses)) {
      delete response.text;
      if (mode === "completion_and_actions_only" || mode === "session_only_reflections") {
        delete response.structuredSummary;
      }
    }

    for (const evidence of gateRun.evidenceEvents) {
      delete evidence.description;
    }

    if (mode === "session_only_reflections") {
      gateRun.responses = {};
    }
  }

  return next;
}
