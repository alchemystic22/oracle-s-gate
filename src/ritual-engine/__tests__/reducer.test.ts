import { describe, expect, it } from "vitest";
import { ritualGateReducer } from "../runtime/reducer";
import { makeRuntime } from "./testFixture";

describe("ritual reducer", () => {
  it("is deterministic", () => {
    const state = makeRuntime().gateRuns.g1;
    const action = {
      type: "COMMIT_REVISION",
      revision: 2,
      updatedAtUtc: new Date(0).toISOString(),
    } as const;
    expect(ritualGateReducer(state, action)).toEqual(ritualGateReducer(state, action));
  });

  it("never decreases revision", () => {
    const state = { ...makeRuntime().gateRuns.g1, stateRevision: 5 };
    const next = ritualGateReducer(state, {
      type: "COMMIT_REVISION",
      revision: 3,
      updatedAtUtc: new Date(0).toISOString(),
    });
    expect(next.stateRevision).toBe(5);
  });
});
