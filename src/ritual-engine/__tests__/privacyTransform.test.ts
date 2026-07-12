import { describe, expect, it } from "vitest";
import { transformRuntimeForPersistence } from "../persistence/privacyTransform";
import { makeRuntime } from "./testFixture";

describe("privacy transform", () => {
  it("retains raw text in full private continuity", () => {
    expect(
      transformRuntimeForPersistence(makeRuntime(), "full_private_continuity").gateRuns.g1.responses
        .r1.text,
    ).toBe("private answer");
  });

  it.each([
    "structured_journey_only",
    "completion_and_actions_only",
    "session_only_reflections",
  ] as const)("removes raw text for %s", (mode) => {
    const result = transformRuntimeForPersistence(makeRuntime(), mode);
    expect(result.gateRuns.g1.responses.r1?.text).toBeUndefined();
  });

  it("removes all reflection responses in session-only mode", () => {
    expect(
      transformRuntimeForPersistence(makeRuntime(), "session_only_reflections").gateRuns.g1
        .responses,
    ).toEqual({});
  });
});
