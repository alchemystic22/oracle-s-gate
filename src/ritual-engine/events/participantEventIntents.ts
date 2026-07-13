import type { RitualGateRuntime, RitualOutboxRecord } from "../domain/runtime";

export type ParticipantSafeEventType =
  | "gate_started"
  | "scene_entered"
  | "scene_completed"
  | "response_submitted"
  | "gate_act_submitted"
  | "evidence_recorded"
  | "route_reassessment_requested"
  | "run_paused"
  | "run_resumed"
  | "gate_completed";

export function createJourneyEventIntent(input: {
  outboxId: string;
  eventId: string;
  commandId: string;
  run: RitualGateRuntime;
  runtimeSceneId?: string;
  eventType: ParticipantSafeEventType;
  occurredAtUtc: string;
  isTestCycle: boolean;
}): RitualOutboxRecord {
  return {
    outboxId: input.outboxId,
    commandId: input.commandId,
    status: "pending",
    attemptCount: 0,
    createdAtUtc: input.occurredAtUtc,
    effectType: "append_journey_event",
    payload: {
      eventId: input.eventId,
      journeyCycleId: input.run.journeyCycleId,
      gateRunId: input.run.gateRunId,
      gateId: input.run.gateId,
      runtimeSceneId: input.runtimeSceneId,
      eventType: input.eventType,
      occurredAtUtc: input.occurredAtUtc,
      isTestCycle: input.isTestCycle,
    },
  };
}

export function createLegacyCompletionIntent(input: {
  outboxId: string;
  commandId: string;
  completedAtUtc: string;
}): RitualOutboxRecord {
  return {
    outboxId: input.outboxId,
    commandId: input.commandId,
    status: "pending",
    attemptCount: 0,
    createdAtUtc: input.completedAtUtc,
    effectType: "mirror_legacy_gate_completion",
    payload: { gateId: 1, completedAtUtc: input.completedAtUtc },
  };
}
