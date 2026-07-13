import type { RitualRuntimeRoot } from "../domain/runtime";

export function makeRuntime(): RitualRuntimeRoot {
  const now = new Date(0).toISOString();
  return {
    schemaVersion: 1,
    participantId: "p1",
    privacyMode: "full_private_continuity",
    researchPermission: { allowed: false },
    isTestCycle: true,
    activeGateRunId: "g1",
    gateRuns: {
      g1: {
        gateRunId: "g1",
        journeyCycleId: "j1",
        gateId: 1,
        status: "active",
        currentRuntimeSceneId: "s1",
        lastStableRuntimeSceneId: "s1",
        stateRevision: 0,
        sceneVisits: {},
        sceneVisitOrder: [],
        responses: {
          r1: {
            responseId: "r1",
            runtimeSceneId: "s1",
            runtimeQuestionId: "q1",
            text: "private answer",
            structuredSummary: { named: true },
            state: "grounded",
            storageClass: "persistent_private",
            createdAtUtc: now,
            updatedAtUtc: now,
          },
        },
        evidenceEvents: [
          {
            evidenceEventId: "e1",
            gateActId: "a1",
            eventType: "micro_act_completed",
            mode: "self_attested_description",
            description: "private evidence",
            participantAttestation: "occurred_outside_reflection",
            occurredAtUtc: now,
          },
        ],
        safety: { state: "clear", reasonCodes: [], updatedAtUtc: now },
        validation: {},
        adaptiveThreads: {},
        commandReceipts: [],
        pendingOutbox: [],
        updatedAtUtc: now,
      },
    },
    createdAtUtc: now,
    updatedAtUtc: now,
  };
}
