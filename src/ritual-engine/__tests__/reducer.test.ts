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

  it("changes the current scene without advancing the stable scene", () => {
    const state = makeRuntime().gateRuns.g1;
    const next = ritualGateReducer(state, {
      type: "SET_CURRENT_SCENE",
      runtimeSceneId: "s2",
      updatedAtUtc: new Date(1).toISOString(),
    });

    expect(next.currentRuntimeSceneId).toBe("s2");
    expect(next.lastStableRuntimeSceneId).toBe("s1");
  });

  it("advances the stable scene after persistence confirmation", () => {
    const state = ritualGateReducer(makeRuntime().gateRuns.g1, {
      type: "SET_CURRENT_SCENE",
      runtimeSceneId: "s2",
      updatedAtUtc: new Date(1).toISOString(),
    });
    const next = ritualGateReducer(state, {
      type: "CONFIRM_STABLE_SCENE",
      runtimeSceneId: "s2",
      updatedAtUtc: new Date(2).toISOString(),
    });

    expect(next.lastStableRuntimeSceneId).toBe("s2");
  });

  it("cannot confirm a scene that is not current", () => {
    const state = makeRuntime().gateRuns.g1;
    const next = ritualGateReducer(state, {
      type: "CONFIRM_STABLE_SCENE",
      runtimeSceneId: "s2",
      updatedAtUtc: new Date(1).toISOString(),
    });

    expect(next).toBe(state);
    expect(next.lastStableRuntimeSceneId).toBe("s1");
  });
});
