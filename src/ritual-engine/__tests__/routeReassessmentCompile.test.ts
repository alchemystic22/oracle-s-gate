import { describe, expect, it } from "vitest";
import { compileRouteReassessment } from "../compiler/protectedMapping";
import { GATE1_CANONICAL_MANIFEST } from "../gate1/manifest";
import { GATE1_PARTICIPANT_ASSET_REGISTRY } from "../gate1/assets";
import { FALSE_ARRIVAL_ROUTE_ID, SPLINTERED_TRUST_ROUTE_ID } from "../gate1/constants";
import { GATE1_QUESTIONS } from "../gate1/questions";
import {
  COMPILED_AT,
  ROUTE_TOKEN_A,
  ROUTE_TOKEN_B,
  compileStage,
  createTestOpaqueIdFactory,
} from "./pass2Fixture";

describe("route reassessment compilation", () => {
  it("rotates token, revision, manifest instance, and digest", () => {
    const factory = createTestOpaqueIdFactory();
    const previousManifest = compileStage("active_route", FALSE_ARRIVAL_ROUTE_ID, factory);
    const result = compileRouteReassessment({
      previousManifest,
      canonicalManifest: GATE1_CANONICAL_MANIFEST,
      routeBinding: {
        protectedRouteId: SPLINTERED_TRUST_ROUTE_ID,
        routeToken: ROUTE_TOKEN_B,
        routeBindingRevision: 2,
      },
      opaqueIdFactory: factory,
      participantAssetRegistry: GATE1_PARTICIPANT_ASSET_REGISTRY,
      compiledAtUtc: COMPILED_AT,
    });

    expect(result.participantManifest.routeToken).toBe(ROUTE_TOKEN_B);
    expect(result.participantManifest.routeBindingRevision).toBe(2);
    expect(result.participantManifest.manifestInstanceId).not.toBe(
      previousManifest.manifestInstanceId,
    );
    expect(result.participantManifest.digest).not.toBe(previousManifest.digest);
  });

  it("removes the prior route and records stale protected domains without deleting history", () => {
    const factory = createTestOpaqueIdFactory();
    const previousManifest = compileStage("active_route", FALSE_ARRIVAL_ROUTE_ID, factory);
    const result = compileRouteReassessment({
      previousManifest,
      canonicalManifest: GATE1_CANONICAL_MANIFEST,
      routeBinding: {
        protectedRouteId: SPLINTERED_TRUST_ROUTE_ID,
        routeToken: ROUTE_TOKEN_B,
        routeBindingRevision: 2,
      },
      opaqueIdFactory: factory,
      participantAssetRegistry: GATE1_PARTICIPANT_ASSET_REGISTRY,
      compiledAtUtc: COMPILED_AT,
    });
    const serialized = JSON.stringify(result.participantManifest);
    expect(serialized).not.toContain(GATE1_QUESTIONS.falseArrivalAxis.prompt);
    expect(serialized).toContain(GATE1_QUESTIONS.splinteredTrustAxis.prompt);
    expect(result.protectedRecord.retainedSharedOpening).toBe(true);
    expect(result.protectedRecord.staleDomains).toEqual([
      "responses",
      "gate_act",
      "evidence",
      "validations",
    ]);
  });

  it("fails closed without token and revision rotation", () => {
    const factory = createTestOpaqueIdFactory();
    const previousManifest = compileStage("active_route", FALSE_ARRIVAL_ROUTE_ID, factory);
    expect(() =>
      compileRouteReassessment({
        previousManifest,
        canonicalManifest: GATE1_CANONICAL_MANIFEST,
        routeBinding: {
          protectedRouteId: SPLINTERED_TRUST_ROUTE_ID,
          routeToken: ROUTE_TOKEN_A,
          routeBindingRevision: 1,
        },
        opaqueIdFactory: factory,
        participantAssetRegistry: GATE1_PARTICIPANT_ASSET_REGISTRY,
        compiledAtUtc: COMPILED_AT,
      }),
    ).toThrow();
  });
});
