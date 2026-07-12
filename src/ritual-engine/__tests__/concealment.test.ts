import { describe, expect, it } from "vitest";
import { scanParticipantObjectForProtectedTerms } from "../compiler/concealmentScanner";
import { FALSE_ARRIVAL_ROUTE_ID, SPLINTERED_TRUST_ROUTE_ID } from "../gate1/constants";
import { GATE1_QUESTIONS } from "../gate1/questions";
import { compileStage } from "./pass2Fixture";

describe("participant concealment", () => {
  it("finds protected terms in keys, nested values, URLs, and canonical IDs", () => {
    const unsafe = {
      canonicalRouteId: "false_arrival",
      nested: { accessibility: "Splintered Trust" },
      url: "/assets/correctives/false-arrival.png",
      scene: "FA-01",
      question: "G1Q-BRIDGE",
    };
    expect(scanParticipantObjectForProtectedTerms(unsafe).length).toBeGreaterThanOrEqual(5);
  });

  it.each([
    "protected",
    "protectedRouteId",
    "canonicalRouteId",
    "canonicalSceneId",
    "canonicalQuestionId",
    "architectMeaning",
    "founderNotes",
    "evaluatorContractId",
    "safetyProfileId",
  ])("rejects the nested protected key %s", (key) => {
    const unsafe = { outer: { middle: { [key]: "opaque-looking-value" } } };
    expect(scanParticipantObjectForProtectedTerms(unsafe)).toContain(
      `$participant.outer.middle.${key}`,
    );
  });

  it("finds no protected terms in any compiled participant stage", () => {
    const manifests = [
      compileStage("pre_route"),
      compileStage("active_route", FALSE_ARRIVAL_ROUTE_ID),
      compileStage("active_route", SPLINTERED_TRUST_ROUTE_ID),
      compileStage("completion"),
    ];
    for (const manifest of manifests) {
      expect(scanParticipantObjectForProtectedTerms(manifest)).toEqual([]);
      expect(scanParticipantObjectForProtectedTerms(JSON.stringify(manifest))).toEqual([]);
    }
  });

  it("never delivers the inactive route question or asset", () => {
    const first = compileStage("active_route", FALSE_ARRIVAL_ROUTE_ID);
    const second = compileStage("active_route", SPLINTERED_TRUST_ROUTE_ID);
    expect(JSON.stringify(first)).not.toContain(GATE1_QUESTIONS.splinteredTrustAxis.prompt);
    expect(JSON.stringify(first)).not.toContain("symbol-b");
    expect(JSON.stringify(second)).not.toContain(GATE1_QUESTIONS.falseArrivalAxis.prompt);
    expect(JSON.stringify(second)).not.toContain("symbol-a");
  });

  it("contains no canonical identity, protected block, Mark, Sovereign Action, or Gate 2 entry", () => {
    const serialized = JSON.stringify(
      compileStage("active_route", FALSE_ARRIVAL_ROUTE_ID),
    ).toLowerCase();
    for (const prohibited of [
      "canonicalsceneid",
      "canonicalrouteid",
      "canonicalquestionid",
      "protected",
      "marksawarded",
      "sovereignaction",
      "gate 2",
      "/gate/2",
    ]) {
      expect(serialized).not.toContain(prohibited);
    }
  });
});
