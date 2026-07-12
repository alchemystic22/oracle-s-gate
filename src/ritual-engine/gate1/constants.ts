import type {
  CanonicalQuestionId,
  CanonicalRouteId,
  CanonicalSceneId,
  ParticipantAssetKey,
} from "../domain/ids";

export const canonicalSceneId = (value: string): CanonicalSceneId => value as CanonicalSceneId;
export const canonicalRouteId = (value: string): CanonicalRouteId => value as CanonicalRouteId;
export const canonicalQuestionId = (value: string): CanonicalQuestionId =>
  value as CanonicalQuestionId;
export const participantAssetKey = (value: string): ParticipantAssetKey =>
  value as ParticipantAssetKey;

export const FALSE_ARRIVAL_ROUTE_ID = canonicalRouteId("false_arrival");
export const SPLINTERED_TRUST_ROUTE_ID = canonicalRouteId("splintered_trust");
export const GATE1_ROUTE_IDS = [FALSE_ARRIVAL_ROUTE_ID, SPLINTERED_TRUST_ROUTE_ID] as const;

export const GATE1_MANIFEST_VERSION = "1.0.0";
export const GATE1_FORMAL_NAME = "The Broken Vow" as const;
export const GATE1_SUBTITLE =
  "Where the world’s promise fractures, and the soul begins to see." as const;
export const HIDDEN_PAGE_PHRASE = "A hidden page has opened.";
export const ROUTE_REASSESSMENT_PHRASE = "This hidden page does not feel like what I encountered.";
