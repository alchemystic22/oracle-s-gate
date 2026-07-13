import { describe, expect, it, vi } from "vitest";
import { createJourneyEventIntent } from "../events/participantEventIntents";
import { processParticipantOutboxRecord, transitionOutboxStatus } from "../events/outboxProcessor";
import { makeRuntime } from "./testFixture";

describe("participant-safe outbox processing", () => {
  it("contains no raw text or canonical identity", () => {
    const root = makeRuntime();
    const record = createJourneyEventIntent({
      outboxId: "outbox-1",
      eventId: "event-1",
      commandId: "command-1",
      run: root.gateRuns.g1,
      runtimeSceneId: "runtime-scene",
      eventType: "response_submitted",
      occurredAtUtc: new Date(0).toISOString(),
      isTestCycle: true,
    });
    expect(JSON.stringify(record)).not.toMatch(/private answer|canonical|protected/i);
  });

  it("processes pending records idempotently", async () => {
    const record = createJourneyEventIntent({
      outboxId: "outbox-1",
      eventId: "event-1",
      commandId: "command-1",
      run: makeRuntime().gateRuns.g1,
      eventType: "run_paused",
      occurredAtUtc: new Date(0).toISOString(),
      isTestCycle: true,
    });
    const handler = vi.fn(async () => "completed" as const);
    const completed = await processParticipantOutboxRecord(record, handler);
    const repeated = await processParticipantOutboxRecord(completed, handler);
    expect(completed.status).toBe("completed");
    expect(repeated).toEqual(completed);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("supports deterministic retry and terminal states", () => {
    const record = createJourneyEventIntent({
      outboxId: "outbox-1",
      eventId: "event-1",
      commandId: "command-1",
      run: makeRuntime().gateRuns.g1,
      eventType: "run_paused",
      occurredAtUtc: new Date(0).toISOString(),
      isTestCycle: true,
    });
    const processing = transitionOutboxStatus(record, "processing");
    const retryable = transitionOutboxStatus(processing, "failed_retryable");
    const retried = transitionOutboxStatus(retryable, "processing");
    expect(retried.attemptCount).toBe(2);
    expect(transitionOutboxStatus(retried, "failed_terminal").status).toBe("failed_terminal");
  });
});
