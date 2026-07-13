import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ParticipantCommandEnvelopeSchema } from "../commands";
import * as participantCommands from "../commands";
import { FALSE_ARRIVAL_ROUTE_ID } from "../gate1/constants";
import { makeActiveHarness, makeParticipantEnvelope } from "./pass3Fixture";

describe("Pass 3 participant command schema", () => {
  it("accepts a strict valid envelope", () => {
    const harness = makeActiveHarness({});
    const envelope = makeParticipantEnvelope(harness, {
      kind: "acknowledge_scene",
      runtimeInteractionId: harness.scene.interaction!.runtimeInteractionId,
    });
    expect(ParticipantCommandEnvelopeSchema.safeParse(envelope).success).toBe(true);
  });

  it.each(["canonicalSceneId", "canonicalRouteId", "protected", "metadata"])(
    "rejects the participant envelope field %s",
    (field) => {
      const harness = makeActiveHarness({});
      const envelope = {
        ...makeParticipantEnvelope(harness, { kind: "pause_run" }),
        [field]: "not-allowed",
      };
      expect(ParticipantCommandEnvelopeSchema.safeParse(envelope).success).toBe(false);
    },
  );

  it("rejects unknown or protected nested command fields", () => {
    const harness = makeActiveHarness({ sceneIndex: 3 });
    const envelope = makeParticipantEnvelope(harness, {
      kind: "submit_response",
      runtimeInteractionId: harness.scene.interaction!.runtimeInteractionId,
      runtimeQuestionId: harness.scene.interaction!.runtimeQuestionId!,
      responseId: "response-1",
      declaredState: "draft",
      structuredSummary: { canonicalSceneId: "hidden" },
    });
    expect(ParticipantCommandEnvelopeSchema.safeParse(envelope).success).toBe(false);
  });

  it("requires route token and revision for active-route commands", () => {
    const harness = makeActiveHarness({ stage: "active_route", routeId: FALSE_ARRIVAL_ROUTE_ID });
    const envelope = makeParticipantEnvelope(harness, { kind: "pause_run" });
    expect(
      ParticipantCommandEnvelopeSchema.safeParse({
        ...envelope,
        routeToken: undefined,
        routeBindingRevision: undefined,
      }).success,
    ).toBe(false);
  });

  it("prohibits route token and revision outside the active route", () => {
    const harness = makeActiveHarness({});
    const envelope = makeParticipantEnvelope(harness, { kind: "pause_run" });
    expect(
      ParticipantCommandEnvelopeSchema.safeParse({
        ...envelope,
        routeToken: "opaqueroutetoken00000001",
        routeBindingRevision: 1,
      }).success,
    ).toBe(false);
  });

  it("keeps protected commands absent from the participant barrel", () => {
    const barrel = readFileSync(new URL("../commands/index.ts", import.meta.url), "utf8");
    for (const name of [
      "activate_compilation",
      "apply_scene_resolution",
      "apply_route_reassessment",
      "apply_safety_directive",
      "recover_runtime",
      "ProtectedCommand",
    ]) {
      expect(barrel).not.toContain(name);
      expect(participantCommands).not.toHaveProperty(name);
    }
  });
});
