import { describe, expect, it } from "vitest";
import { Gate1SceneConductor } from "../conductor/index.protected";
import { FALSE_ARRIVAL_ROUTE_ID, SPLINTERED_TRUST_ROUTE_ID } from "../gate1/constants";
import { GATE1_CANONICAL_MANIFEST } from "../gate1/manifest";
import { MemoryRitualTransactionalPersistenceAdapter } from "../persistence/transactionalMemory";
import { ROUTE_TOKEN_B } from "./pass2Fixture";
import {
  PASS3_IDS,
  PASS3_NOW,
  compilePass3Stage,
  makeActiveHarness,
  makeParticipantEnvelope,
} from "./pass3Fixture";

describe("runtime route reassessment", () => {
  it("preserves shared history, stales prior route data, rotates mapping, and rejects old commands", async () => {
    const harness = makeActiveHarness({
      stage: "active_route",
      routeId: FALSE_ARRIVAL_ROUTE_ID,
      sceneIndex: 1,
    });
    const run = harness.root.gateRuns["gate-run-1"]!;
    run.responses.shared = {
      responseId: "shared",
      runtimeSceneId: "opaque-shared-scene",
      runtimeQuestionId: "opaque-shared-question",
      state: "grounded",
      storageClass: "structured_only",
      createdAtUtc: PASS3_NOW,
      updatedAtUtc: PASS3_NOW,
    };
    run.responses.route = {
      responseId: "route",
      runtimeSceneId: harness.scene.runtimeSceneId,
      runtimeQuestionId: "opaque-route-question",
      routeBindingRevision: 1,
      state: "grounded",
      storageClass: "structured_only",
      createdAtUtc: PASS3_NOW,
      updatedAtUtc: PASS3_NOW,
    };
    const adapter = new MemoryRitualTransactionalPersistenceAdapter(harness.root);
    const conductor = new Gate1SceneConductor(
      adapter,
      harness.mappingProvider,
      GATE1_CANONICAL_MANIFEST,
    );
    const requestEnvelope = makeParticipantEnvelope(harness, {
      kind: "request_route_reassessment",
    });
    const requested = await conductor.executeParticipant({
      envelope: requestEnvelope,
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      ids: PASS3_IDS,
    });
    expect(requested.status).toBe("awaiting_route_reassessment");

    const nextCompilation = compilePass3Stage({
      stage: "active_route",
      routeId: SPLINTERED_TRUST_ROUTE_ID,
      routeToken: ROUTE_TOKEN_B,
      routeBindingRevision: 2,
      factoryStart: 500,
    });
    const reassessmentEnvelope = {
      schemaVersion: 1,
      protectedCommandId: "reassessment-apply-1",
      expectedStateRevision: requested.stateRevision,
      issuedAtUtc: PASS3_NOW,
      command: {
        kind: "apply_route_reassessment",
        sourceCommandId: requestEnvelope.commandId,
        reassessmentCompilation: nextCompilation,
      },
    } as const;
    const applied = await conductor.executeProtected({
      envelope: reassessmentEnvelope,
      nowUtc: PASS3_NOW,
      sceneVisitId: "opaquevisit000000000099",
    });
    const persisted = (await adapter.loadActive())!.gateRuns["gate-run-1"]!;
    expect(applied.status).toBe("advanced");
    expect(persisted.responses.shared!.stale).toBeUndefined();
    expect(persisted.responses.route!.stale).toBe(true);
    expect(persisted.activeManifest!.manifestInstanceId).toBe(
      nextCompilation.participantManifest.manifestInstanceId,
    );
    expect(persisted.activeManifest!.routeToken).toBe(ROUTE_TOKEN_B);
    expect(persisted.activeManifest!.routeBindingRevision).toBe(2);
    expect(
      harness.mappingProvider.getByManifestInstanceId(harness.manifest.manifestInstanceId)!
        .retiredAtUtc,
    ).toBe(PASS3_NOW);
    expect(
      harness.mappingProvider.getByManifestInstanceId(
        nextCompilation.participantManifest.manifestInstanceId,
      )!.retiredAtUtc,
    ).toBeUndefined();

    const replay = await conductor.executeProtected({
      envelope: reassessmentEnvelope,
      nowUtc: PASS3_NOW,
      sceneVisitId: "opaquevisit000000000100",
    });
    expect(replay.status).toBe("duplicate");
    const conflict = await conductor.executeProtected({
      envelope: {
        ...reassessmentEnvelope,
        command: { ...reassessmentEnvelope.command, sourceCommandId: "different-command" },
      },
      nowUtc: PASS3_NOW,
      sceneVisitId: "opaquevisit000000000101",
    });
    expect(conflict.status).toBe("rejected_invalid");

    const stale = await conductor.executeParticipant({
      envelope: requestEnvelope,
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      ids: PASS3_IDS,
    });
    expect(stale.status).toBe("rejected_stale");
  });

  it("rejects same-route reassessment despite rotating opaque bindings", async () => {
    const harness = makeActiveHarness({
      stage: "active_route",
      routeId: FALSE_ARRIVAL_ROUTE_ID,
      sceneIndex: 1,
    });
    const requestEnvelope = makeParticipantEnvelope(harness, {
      kind: "request_route_reassessment",
    });
    const requested = await harness.conductor.executeParticipant({
      envelope: requestEnvelope,
      participantManifest: harness.manifest,
      nowUtc: PASS3_NOW,
      ids: PASS3_IDS,
    });
    const sameRouteCompilation = compilePass3Stage({
      stage: "active_route",
      routeId: FALSE_ARRIVAL_ROUTE_ID,
      routeToken: ROUTE_TOKEN_B,
      routeBindingRevision: 2,
      factoryStart: 700,
    });
    const before = await harness.adapter.loadActive();
    const result = await harness.conductor.executeProtected({
      envelope: {
        schemaVersion: 1,
        protectedCommandId: "same-route-reassessment",
        expectedStateRevision: requested.stateRevision,
        issuedAtUtc: PASS3_NOW,
        command: {
          kind: "apply_route_reassessment",
          sourceCommandId: requestEnvelope.commandId,
          reassessmentCompilation: sameRouteCompilation,
        },
      },
      nowUtc: PASS3_NOW,
      sceneVisitId: "opaquevisit000000000102",
    });
    expect(result.status).toBe("rejected_invalid");
    expect(await harness.adapter.loadActive()).toEqual(before);
    expect(
      harness.mappingProvider.getByManifestInstanceId(
        sameRouteCompilation.participantManifest.manifestInstanceId,
      ),
    ).toBeNull();
  });
});
