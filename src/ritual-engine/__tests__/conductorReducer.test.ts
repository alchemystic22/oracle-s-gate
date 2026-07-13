import { describe, expect, it } from "vitest";
import { appendBoundedReceipt } from "../commands/receipts";
import { applyGatePlan } from "../conductor/applyPlan";
import { planEnterScene } from "../conductor/sceneLifecycle";
import type { ParticipantCommandReceipt } from "../domain/runtime";
import { makeRuntime } from "./testFixture";

function receipt(index: number, unresolved = false): ParticipantCommandReceipt {
  const now = new Date(index * 1_000).toISOString();
  return {
    commandId: `command-${index}`,
    commandKind: "submit_response",
    manifestInstanceId: "opaquevalue000000000001",
    runtimeSceneId: "opaquevalue000000000002",
    payloadDigest: `digest-${index}`,
    safeStatus: "accepted",
    resolutionState: unresolved ? "unresolved" : "resolved",
    issuedAtUtc: now,
    recordedAtUtc: now,
  };
}

describe("expanded conductor reducer", () => {
  it("appends revisit history without overwriting the prior visit", () => {
    const run = makeRuntime().gateRuns.g1;
    const first = planEnterScene({
      state: run,
      runtimeSceneId: "s2",
      sceneVisitId: "visit-1",
      enteredAtUtc: new Date(1_000).toISOString(),
      completeCurrent: false,
    });
    const next = applyGatePlan(run, {
      gateRunId: run.gateRunId,
      expectedStateRevision: 0,
      operations: [
        ...first,
        { type: "COMMIT_REVISION", revision: 1, updatedAtUtc: new Date(1_000).toISOString() },
      ],
      status: "advanced",
      participantMessageCode: "advanced",
      sceneChanged: true,
    });
    expect(next.sceneVisitOrder).toEqual(["visit-1"]);
    expect(next.sceneVisits["visit-1"]!.runtimeSceneId).toBe("s2");
  });

  it("rejects plans that attempt to confirm stability before persistence", () => {
    const run = makeRuntime().gateRuns.g1;
    expect(() =>
      applyGatePlan(run, {
        gateRunId: run.gateRunId,
        expectedStateRevision: 0,
        operations: [
          {
            type: "CONFIRM_STABLE_SCENE",
            runtimeSceneId: "s1",
            updatedAtUtc: new Date(0).toISOString(),
          },
          { type: "COMMIT_REVISION", revision: 1, updatedAtUtc: new Date(0).toISOString() },
        ],
        status: "advanced",
        participantMessageCode: "invalid",
        sceneChanged: false,
      }),
    ).toThrow("persistence-owned");
  });

  it("marks only the prior active route revision stale", () => {
    const run = makeRuntime().gateRuns.g1;
    run.responses.r1!.routeBindingRevision = 1;
    run.validation.route = {
      value: true,
      source: "active_route",
      routeBindingRevision: 1,
      updatedAtUtc: new Date(0).toISOString(),
    };
    const next = applyGatePlan(run, {
      gateRunId: run.gateRunId,
      expectedStateRevision: 0,
      operations: [
        {
          type: "MARK_ROUTE_DATA_STALE",
          routeBindingRevision: 1,
          updatedAtUtc: new Date(1_000).toISOString(),
        },
        { type: "COMMIT_REVISION", revision: 1, updatedAtUtc: new Date(1_000).toISOString() },
      ],
      status: "accepted",
      participantMessageCode: "stale",
      sceneChanged: false,
    });
    expect(next.responses.r1!.stale).toBe(true);
    expect(next.validation.route!.stale).toBe(true);
  });

  it("trims receipts deterministically without removing unresolved before resolved", () => {
    const receipts = [
      receipt(0, true),
      ...Array.from({ length: 199 }, (_, index) => receipt(index + 1)),
    ];
    const trimmed = appendBoundedReceipt(receipts, receipt(201));
    expect(trimmed).toHaveLength(200);
    expect(trimmed[0]!.commandId).toBe("command-0");
    expect(trimmed.some((item) => item.commandId === "command-1")).toBe(false);
  });

  it("refuses to trim an all-unresolved ledger", () => {
    const receipts = Array.from({ length: 200 }, (_, index) => receipt(index, true));
    expect(() => appendBoundedReceipt(receipts, receipt(201, true))).toThrow("Unresolved");
  });
});
