import type {
  CanonicalSceneDefinition,
  CanonicalSceneGroup,
  CanonicalSceneType,
  CanonicalTransition,
  ParticipantActionDefinition,
  ParticipantInteractionDefinition,
  ValidationEstablishment,
  ValidationRequirement,
} from "../manifest/sceneTypes";
import type { CanonicalQuestionId, CanonicalRouteId, ParticipantAssetKey } from "../domain/ids";
import { canonicalSceneId } from "./constants";

type SceneInput = {
  id: string;
  group: CanonicalSceneGroup;
  type: CanonicalSceneType;
  title: string;
  purpose: string;
  semanticSummary?: string;
  heading?: string;
  narration?: readonly string[];
  prompt?: string;
  interaction?: ParticipantInteractionDefinition;
  primaryAction?: ParticipantActionDefinition;
  secondaryAction?: ParticipantActionDefinition;
  reducedMotionEquivalent?: string;
  screenReaderSequence?: readonly string[];
  assetRefs?: readonly ParticipantAssetKey[];
  prerequisites?: readonly ValidationRequirement[];
  establishes?: readonly ValidationEstablishment[];
  transitions?: readonly CanonicalTransition[];
  protected?: {
    routeId?: CanonicalRouteId;
    canonicalQuestionId?: CanonicalQuestionId;
    architectMeaning?: string;
    evaluatorContractId?: string;
    safetyProfileId?: string;
    founderNotes?: readonly string[];
  };
};

export function defineGate1Scene(input: SceneInput): CanonicalSceneDefinition {
  return {
    canonicalSceneId: canonicalSceneId(input.id),
    gateId: 1,
    group: input.group,
    type: input.type,
    title: input.title,
    purpose: input.purpose,
    participant: {
      heading: input.heading,
      narration: input.narration,
      prompt: input.prompt,
      interaction: input.interaction,
      primaryAction: input.primaryAction,
      secondaryAction: input.secondaryAction,
      accessibility: {
        semanticSummary: input.semanticSummary ?? input.purpose,
        reducedMotionEquivalent: input.reducedMotionEquivalent,
        screenReaderSequence: input.screenReaderSequence,
      },
      assetRefs: input.assetRefs,
    },
    prerequisites: input.prerequisites ?? [],
    establishes: input.establishes ?? [],
    transitions: input.transitions ?? [],
    protected: input.protected,
  };
}

export const transitionTo = (
  targetSceneId: string,
  routeId?: CanonicalRouteId,
): CanonicalTransition => ({
  targetSceneId: canonicalSceneId(targetSceneId),
  routeId,
});

export const requiresShared = (key: string): ValidationRequirement => ({
  key,
  source: "shared",
});

export const requiresActiveRoute = (key: string): ValidationRequirement => ({
  key,
  source: "active_route",
});

export const establishes = (key: string): ValidationEstablishment => ({ key, value: true });
