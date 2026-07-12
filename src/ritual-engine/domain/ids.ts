export type Brand<T, B extends string> = T & { readonly __brand: B };

export type ParticipantId = Brand<string, "ParticipantId">;
export type JourneyCycleId = Brand<string, "JourneyCycleId">;
export type GateRunId = Brand<string, "GateRunId">;
export type RuntimeSceneId = Brand<string, "RuntimeSceneId">;
export type CanonicalSceneId = Brand<string, "CanonicalSceneId">;
export type ResponseId = Brand<string, "ResponseId">;
export type GateActId = Brand<string, "GateActId">;
export type EvidenceEventId = Brand<string, "EvidenceEventId">;
export type SceneVisitId = Brand<string, "SceneVisitId">;
export type JourneyEventId = Brand<string, "JourneyEventId">;
export type RouteToken = Brand<string, "RouteToken">;
export type ManifestInstanceId = Brand<string, "ManifestInstanceId">;
export type OutboxId = Brand<string, "OutboxId">;
