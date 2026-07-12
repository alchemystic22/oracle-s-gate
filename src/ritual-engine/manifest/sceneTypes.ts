import type {
  CanonicalQuestionId,
  CanonicalRouteId,
  CanonicalSceneId,
  ParticipantAssetKey,
} from "../domain/ids";

export type CanonicalSceneGroup =
  | "shared_opening"
  | "false_arrival"
  | "splintered_trust"
  | "shared_closing";

export type CanonicalSceneType =
  | "threshold"
  | "symbolic_encounter"
  | "symbol_behavior"
  | "recognition"
  | "oracle_distinction"
  | "question"
  | "narration"
  | "book_emergence"
  | "hidden_page"
  | "gate_act"
  | "evidence"
  | "readiness"
  | "corrective_gate"
  | "page_seal"
  | "book_withdrawal"
  | "completion";

export type ParticipantInteractionDefinition = {
  kind: "acknowledgment" | "reflection" | "stance_selection" | "gate_act" | "evidence";
  options?: readonly string[];
};

export type ParticipantActionDefinition = {
  label: string;
  intent: "continue" | "reassess_route" | "seal" | "complete";
};

export type ValidationRequirement = {
  key: string;
  source: "shared" | "active_route";
};

export type ValidationEstablishment = {
  key: string;
  value: boolean;
};

export type CanonicalTransition = {
  targetSceneId: CanonicalSceneId;
  routeId?: CanonicalRouteId;
};

export type CanonicalSceneDefinition = {
  canonicalSceneId: CanonicalSceneId;
  gateId: 1;
  group: CanonicalSceneGroup;
  type: CanonicalSceneType;
  title: string;
  purpose: string;
  participant: {
    heading?: string;
    narration?: readonly string[];
    prompt?: string;
    interaction?: ParticipantInteractionDefinition;
    primaryAction?: ParticipantActionDefinition;
    secondaryAction?: ParticipantActionDefinition;
    accessibility: {
      semanticSummary: string;
      reducedMotionEquivalent?: string;
      screenReaderSequence?: readonly string[];
    };
    assetRefs?: readonly ParticipantAssetKey[];
  };
  prerequisites: readonly ValidationRequirement[];
  establishes: readonly ValidationEstablishment[];
  transitions: readonly CanonicalTransition[];
  protected?: {
    routeId?: CanonicalRouteId;
    canonicalQuestionId?: CanonicalQuestionId;
    architectMeaning?: string;
    evaluatorContractId?: string;
    safetyProfileId?: string;
    founderNotes?: readonly string[];
  };
};

export type Gate1CanonicalManifest = {
  manifestId: string;
  version: string;
  gateId: 1;
  formalName: "The Broken Vow";
  subtitle: "Where the world’s promise fractures, and the soul begins to see.";
  corePurpose: string;
  coreDistinctions: readonly string[];
  sceneCount: 34;
  scenes: readonly CanonicalSceneDefinition[];
  protectedRouteMap: Readonly<Record<string, ProtectedRouteCanon>>;
};

export type ProtectedRouteCanon = {
  routeId: CanonicalRouteId;
  symbolicLaw: string;
  oracleDistinction: string;
  unlockEpigraph: string;
  sealLine: string;
  stanceMapping: string;
};
