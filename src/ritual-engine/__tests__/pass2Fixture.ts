import type { CanonicalRouteId } from "../domain/ids";
import type { OpaqueIdFactory, ParticipantManifestStage } from "../compiler/types";
import { compileParticipantManifest } from "../compiler/compileParticipantManifest";
import { GATE1_CANONICAL_MANIFEST } from "../gate1/manifest";
import { GATE1_PARTICIPANT_ASSET_REGISTRY } from "../gate1/assets";

export const COMPILED_AT = new Date(0).toISOString();
export const ROUTE_TOKEN_A = "opaqueroutetoken00000001";
export const ROUTE_TOKEN_B = "opaqueroutetoken00000002";

export function createTestOpaqueIdFactory(start = 0): OpaqueIdFactory {
  let index = start;
  return {
    next(): string {
      index += 1;
      return `opaquevalue${String(index).padStart(12, "0")}`;
    },
  };
}

export function compileStage(
  stage: ParticipantManifestStage,
  routeId?: CanonicalRouteId,
  factory = createTestOpaqueIdFactory(),
) {
  return compileParticipantManifest({
    canonicalManifest: GATE1_CANONICAL_MANIFEST,
    stage,
    routeBinding: routeId
      ? {
          protectedRouteId: routeId,
          routeToken: ROUTE_TOKEN_A,
          routeBindingRevision: 1,
        }
      : undefined,
    opaqueIdFactory: factory,
    participantAssetRegistry: GATE1_PARTICIPANT_ASSET_REGISTRY,
    compiledAtUtc: COMPILED_AT,
  });
}
