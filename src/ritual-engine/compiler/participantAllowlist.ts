import type { CanonicalSceneDefinition, ProtectedRouteCanon } from "../manifest/sceneTypes";
import type { OpaqueIdFactory, ParticipantScene } from "./types";

function routeSafeNarration(
  scene: CanonicalSceneDefinition,
  routeCanon: ProtectedRouteCanon | undefined,
): readonly string[] | undefined {
  const narration = [...(scene.participant.narration ?? [])];
  if (scene.type === "corrective_gate" && routeCanon) narration.push(routeCanon.unlockEpigraph);
  if (scene.type === "page_seal" && routeCanon) narration.push(routeCanon.sealLine);
  return narration.length > 0 ? narration : undefined;
}

export function projectParticipantScene(
  scene: CanonicalSceneDefinition,
  runtimeSceneId: string,
  transition: { runtimeTransitionId: string; targetRuntimeSceneId: string } | undefined,
  opaqueIdFactory: OpaqueIdFactory,
  routeCanon?: ProtectedRouteCanon,
): ParticipantScene {
  const interaction = scene.participant.interaction
    ? {
        kind: scene.participant.interaction.kind,
        options: scene.participant.interaction.options
          ? [...scene.participant.interaction.options]
          : undefined,
        runtimeInteractionId: opaqueIdFactory.next("interaction"),
        runtimeQuestionId:
          scene.participant.prompt || scene.participant.interaction.kind !== "acknowledgment"
            ? opaqueIdFactory.next("question")
            : undefined,
      }
    : undefined;

  return {
    runtimeSceneId,
    type: scene.type,
    heading: scene.participant.heading,
    narration: routeSafeNarration(scene, routeCanon),
    prompt: scene.participant.prompt,
    interaction,
    primaryAction: scene.participant.primaryAction
      ? { ...scene.participant.primaryAction }
      : undefined,
    secondaryAction: scene.participant.secondaryAction
      ? { ...scene.participant.secondaryAction }
      : undefined,
    accessibility: {
      semanticSummary: scene.participant.accessibility.semanticSummary,
      reducedMotionEquivalent: scene.participant.accessibility.reducedMotionEquivalent,
      screenReaderSequence: scene.participant.accessibility.screenReaderSequence
        ? [...scene.participant.accessibility.screenReaderSequence]
        : undefined,
    },
    assetRefs: scene.participant.assetRefs?.map(String),
    transitions: transition ? [{ ...transition }] : [],
  };
}
