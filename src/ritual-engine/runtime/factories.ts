import type { ParticipantPrivacyMode } from "../domain/privacy";
import type { RitualGateRuntime, RitualRuntimeRoot } from "../domain/runtime";

export function createGateRuntime(input: {
  gateRunId: string;
  journeyCycleId: string;
  nowUtc: string;
}): RitualGateRuntime {
  return {
    gateRunId: input.gateRunId,
    journeyCycleId: input.journeyCycleId,
    gateId: 1,
    status: "not_started",
    stateRevision: 0,
    sceneVisits: {},
    sceneVisitOrder: [],
    responses: {},
    evidenceEvents: [],
    safety: { state: "clear", reasonCodes: [], updatedAtUtc: input.nowUtc },
    validation: {},
    adaptiveThreads: {},
    commandReceipts: [],
    pendingOutbox: [],
    updatedAtUtc: input.nowUtc,
  };
}

export function createRuntimeRoot(input: {
  participantId: string;
  gateRun: RitualGateRuntime;
  privacyMode: ParticipantPrivacyMode;
  nowUtc: string;
  isTestCycle?: boolean;
}): RitualRuntimeRoot {
  return {
    schemaVersion: 1,
    participantId: input.participantId,
    privacyMode: input.privacyMode,
    researchPermission: { allowed: false },
    isTestCycle: input.isTestCycle ?? false,
    activeGateRunId: input.gateRun.gateRunId,
    gateRuns: { [input.gateRun.gateRunId]: input.gateRun },
    createdAtUtc: input.nowUtc,
    updatedAtUtc: input.nowUtc,
  };
}
