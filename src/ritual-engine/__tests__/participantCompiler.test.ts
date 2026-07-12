import { describe, expect, it } from "vitest";
import { compileParticipantManifest } from "../compiler/index.protected";
import { validateParticipantManifest } from "../compiler/participantValidation";
import { routeIdFromUnknown } from "../compiler/activeGraph";
import { GATE1_CANONICAL_MANIFEST } from "../gate1/manifest";
import { GATE1_PARTICIPANT_ASSET_REGISTRY } from "../gate1/assets";
import { FALSE_ARRIVAL_ROUTE_ID, SPLINTERED_TRUST_ROUTE_ID } from "../gate1/constants";
import { GATE1_QUESTIONS } from "../gate1/questions";
import {
  COMPILED_AT,
  ROUTE_TOKEN_A,
  compileStage,
  createTestOpaqueIdFactory,
} from "./pass2Fixture";

describe("participant manifest compiler", () => {
  it("compiles only the ten pre-route scenes without route material", () => {
    const manifest = compileStage("pre_route");
    expect(manifest.scenes).toHaveLength(10);
    expect(manifest.routeToken).toBeUndefined();
    expect(manifest.routeBindingRevision).toBeUndefined();
    expect(manifest.assets.map((asset) => asset.key)).not.toContain("symbol-a");
    expect(manifest.assets.map((asset) => asset.key)).not.toContain("symbol-b");
    expect(() => validateParticipantManifest(manifest)).not.toThrow();
  });

  it("compiles only the assigned eight-scene route", () => {
    const manifest = compileStage("active_route", FALSE_ARRIVAL_ROUTE_ID);
    const serialized = JSON.stringify(manifest);
    expect(manifest.scenes).toHaveLength(14);
    expect(serialized).toContain(GATE1_QUESTIONS.falseArrivalAxis.prompt);
    expect(serialized).not.toContain(GATE1_QUESTIONS.splinteredTrustAxis.prompt);
    expect(manifest.assets.map((asset) => asset.key)).toContain("symbol-a");
    expect(manifest.assets.map((asset) => asset.key)).not.toContain("symbol-b");
  });

  it("compiles only the assigned nine-scene route", () => {
    const manifest = compileStage("active_route", SPLINTERED_TRUST_ROUTE_ID);
    const serialized = JSON.stringify(manifest);
    expect(manifest.scenes).toHaveLength(15);
    expect(serialized).toContain(GATE1_QUESTIONS.splinteredTrustAxis.prompt);
    expect(serialized).not.toContain(GATE1_QUESTIONS.falseArrivalAxis.prompt);
    expect(manifest.assets.map((asset) => asset.key)).toContain("symbol-b");
    expect(manifest.assets.map((asset) => asset.key)).not.toContain("symbol-a");
  });

  it("fails closed for absent, unknown, or multiple route bindings", () => {
    const base = {
      canonicalManifest: GATE1_CANONICAL_MANIFEST,
      stage: "active_route" as const,
      opaqueIdFactory: createTestOpaqueIdFactory(),
      participantAssetRegistry: GATE1_PARTICIPANT_ASSET_REGISTRY,
      compiledAtUtc: COMPILED_AT,
    };
    expect(() => compileParticipantManifest(base)).toThrow();
    expect(() =>
      compileParticipantManifest({
        ...base,
        routeBinding: {
          protectedRouteId: routeIdFromUnknown("unknown"),
          routeToken: ROUTE_TOKEN_A,
          routeBindingRevision: 1,
        },
      }),
    ).toThrow();
    expect(() =>
      compileParticipantManifest({
        ...base,
        routeBinding: [
          {
            protectedRouteId: FALSE_ARRIVAL_ROUTE_ID,
            routeToken: ROUTE_TOKEN_A,
            routeBindingRevision: 1,
          },
        ] as never,
      }),
    ).toThrow();
  });

  it("compiles route-safe completion without route binding", () => {
    const manifest = compileStage("completion");
    expect(manifest.scenes).toHaveLength(1);
    expect(manifest.routeToken).toBeUndefined();
    expect(manifest.routeBindingRevision).toBeUndefined();
  });

  it("resolves every delivered transition and asset locally", () => {
    for (const routeId of [FALSE_ARRIVAL_ROUTE_ID, SPLINTERED_TRUST_ROUTE_ID]) {
      const manifest = compileStage("active_route", routeId);
      expect(() => validateParticipantManifest(manifest)).not.toThrow();
    }
  });
});
