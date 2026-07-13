import type { CanonicalRouteId, CanonicalSceneId } from "../domain/ids";

export type ProtectedConductorEvent = {
  protectedEventId: string;
  eventType: string;
  canonicalSceneId?: CanonicalSceneId;
  canonicalRouteId?: CanonicalRouteId;
  occurredAtUtc: string;
  detail: Readonly<Record<string, unknown>>;
};
