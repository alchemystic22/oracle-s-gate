import type { CanonicalQuestionId, CanonicalRouteId, CanonicalSceneId } from "../domain/ids";
import type { ParticipantInteractionDefinition } from "../manifest/sceneTypes";
import type { ParticipantManifest, ParticipantManifestStage } from "./types";

export type ProtectedParticipantManifestMapping = {
  schemaVersion: 1;
  manifestInstanceId: string;
  manifestDigest: string;
  gateManifestVersion: string;
  stage: ParticipantManifestStage;
  compiledAtUtc: string;
  routeBinding?: {
    protectedRouteId: CanonicalRouteId;
    routeToken: string;
    routeBindingRevision: number;
  };
  scenes: Readonly<Record<string, { canonicalSceneId: CanonicalSceneId }>>;
  interactions: Readonly<
    Record<
      string,
      {
        canonicalSceneId: CanonicalSceneId;
        kind: ParticipantInteractionDefinition["kind"];
      }
    >
  >;
  questions: Readonly<
    Record<
      string,
      {
        canonicalSceneId: CanonicalSceneId;
        canonicalQuestionId?: CanonicalQuestionId;
      }
    >
  >;
  transitions: Readonly<
    Record<
      string,
      {
        fromCanonicalSceneId: CanonicalSceneId;
        toCanonicalSceneId: CanonicalSceneId;
        canonicalRouteId?: CanonicalRouteId;
      }
    >
  >;
};

export type ProtectedParticipantCompilation = {
  participantManifest: ParticipantManifest;
  protectedMapping: ProtectedParticipantManifestMapping;
};
