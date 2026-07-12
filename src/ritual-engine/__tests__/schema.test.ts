import { describe, expect, it } from "vitest";
import { ParticipantPrivacyModeSchema } from "../domain/privacy";
import { RitualRuntimeRootSchema } from "../domain/runtime";
import { ParticipantJourneyEventSchema } from "../domain/events";

describe("ritual schemas", () => {
  it("parses all canonical privacy modes", () => {
    for (const mode of [
      "full_private_continuity",
      "structured_journey_only",
      "completion_and_actions_only",
      "session_only_reflections",
    ]) {
      expect(ParticipantPrivacyModeSchema.parse(mode)).toBe(mode);
    }
  });

  it("rejects an invalid runtime version", () => {
    const result = RitualRuntimeRootSchema.safeParse({ schemaVersion: 2 });
    expect(result.success).toBe(false);
  });

  it("rejects prohibited participant event metadata", () => {
    const result = ParticipantJourneyEventSchema.safeParse({
      eventId: "e1",
      journeyCycleId: "j1",
      gateRunId: "g1",
      gateId: 1,
      eventType: "response_submitted",
      metadata: { rawText: "private" },
      occurredAtUtc: new Date().toISOString(),
      isTestCycle: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects nested protected metadata", () => {
    const result = ParticipantJourneyEventSchema.safeParse({
      eventId: "e1",
      journeyCycleId: "j1",
      gateRunId: "g1",
      gateId: 1,
      eventType: "response_submitted",
      metadata: { response: { canonicalQuestionId: "q1" } },
      occurredAtUtc: new Date().toISOString(),
      isTestCycle: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects protected top-level fields", () => {
    const result = ParticipantJourneyEventSchema.safeParse({
      eventId: "e1",
      journeyCycleId: "j1",
      gateRunId: "g1",
      gateId: 1,
      canonicalRouteId: "hidden-route",
      eventType: "route_selected",
      metadata: {},
      occurredAtUtc: new Date().toISOString(),
      isTestCycle: true,
    });
    expect(result.success).toBe(false);
  });
});
