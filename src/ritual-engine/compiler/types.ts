import type { CanonicalRouteId } from "../domain/ids";
import type {
  CanonicalSceneType,
  Gate1CanonicalManifest,
  ParticipantActionDefinition,
  ParticipantInteractionDefinition,
} from "../manifest/sceneTypes";

export type ParticipantManifestStage = "pre_route" | "active_route" | "completion";

export type OpaqueIdKind = "manifest" | "scene" | "question";
export type OpaqueIdFactory = { next(kind: OpaqueIdKind): string };

export type ParticipantAssetRecord = {
  key: string;
  url: string;
  alt: string;
};

export type ParticipantAssetRegistry = Readonly<Record<string, ParticipantAssetRecord>>;

export type ParticipantScene = {
  runtimeSceneId: string;
  type: CanonicalSceneType;
  heading?: string;
  narration?: readonly string[];
  prompt?: string;
  interaction?: ParticipantInteractionDefinition & { runtimeQuestionId?: string };
  primaryAction?: ParticipantActionDefinition;
  secondaryAction?: ParticipantActionDefinition;
  accessibility: {
    semanticSummary: string;
    reducedMotionEquivalent?: string;
    screenReaderSequence?: readonly string[];
  };
  assetRefs?: readonly string[];
  transitions: readonly { targetRuntimeSceneId: string }[];
};

export type ParticipantManifest = {
  schemaVersion: 1;
  manifestInstanceId: string;
  gateId: 1;
  gateManifestVersion: string;
  stage: ParticipantManifestStage;
  digest: string;
  entryRuntimeSceneId: string;
  routeToken?: string;
  routeBindingRevision?: number;
  scenes: readonly ParticipantScene[];
  assets: readonly ParticipantAssetRecord[];
  compiledAtUtc: string;
};

export type ProtectedRouteBinding = {
  protectedRouteId: CanonicalRouteId;
  routeToken: string;
  routeBindingRevision: number;
};

export type CompileParticipantManifestInput = {
  canonicalManifest: Gate1CanonicalManifest;
  stage: ParticipantManifestStage;
  routeBinding?: ProtectedRouteBinding;
  opaqueIdFactory: OpaqueIdFactory;
  participantAssetRegistry: ParticipantAssetRegistry;
  compiledAtUtc: string;
};
