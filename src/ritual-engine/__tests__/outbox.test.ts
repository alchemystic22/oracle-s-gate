import { describe, expect, it } from "vitest";
import { RitualOutboxRecordSchema, RitualRuntimeRootSchema } from "../domain/runtime";
import { makeRuntime } from "./testFixture";

const now = new Date(0).toISOString();

function appendJourneyEventIntent() {
  return {
    outboxId: "o1",
    commandId: "c1",
    effectType: "append_journey_event" as const,
    payload: {
      eventId: "e1",
      journeyCycleId: "j1",
      gateRunId: "g1",
      gateId: 1,
      runtimeSceneId: "s1",
      eventType: "scene_entered",
      occurredAtUtc: now,
      isTestCycle: true,
    },
    status: "pending" as const,
    attemptCount: 0,
    createdAtUtc: now,
  };
}

describe("participant outbox boundary", () => {
  it("accepts an allowlisted participant-safe event intent", () => {
    expect(RitualOutboxRecordSchema.safeParse(appendJourneyEventIntent()).success).toBe(true);
  });

  it("does not define a protected-event outbox effect", () => {
    const intent = {
      ...appendJourneyEventIntent(),
      effectType: "append_protected_event",
    };
    expect(RitualOutboxRecordSchema.safeParse(intent).success).toBe(false);
  });

  it("rejects protected and raw payload fields", () => {
    const prohibitedFields = [
      "canonicalRouteId",
      "canonicalSceneId",
      "canonicalQuestionId",
      "rawText",
      "reflectionText",
      "journalText",
      "safetyDetail",
      "founderEvaluation",
    ];

    for (const field of prohibitedFields) {
      const intent = appendJourneyEventIntent();
      const payload = { ...intent.payload, [field]: "protected" };
      expect(RitualOutboxRecordSchema.safeParse({ ...intent, payload }).success).toBe(false);
    }
  });

  it("rejects nested protected and raw payload fields", () => {
    const nestedPayloads = [
      { metadata: { canonicalRouteId: "route-1" } },
      { response: { rawText: "private reflection" } },
      { evaluation: { founderOnlyScore: 7, safetyDetail: "protected" } },
    ];

    for (const nested of nestedPayloads) {
      const intent = appendJourneyEventIntent();
      expect(
        RitualOutboxRecordSchema.safeParse({
          ...intent,
          payload: { ...intent.payload, ...nested },
        }).success,
      ).toBe(false);
    }
  });

  it("rejects unsafe outbox data inside participant-persisted runtime", () => {
    const runtime = makeRuntime();
    const intent = appendJourneyEventIntent();
    runtime.gateRuns.g1.pendingOutbox = [
      {
        ...intent,
        payload: { ...intent.payload, journalText: "private journal" },
      } as never,
    ];

    expect(RitualRuntimeRootSchema.safeParse(runtime).success).toBe(false);
  });
});
