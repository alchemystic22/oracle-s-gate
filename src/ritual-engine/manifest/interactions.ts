import type { ParticipantActionDefinition, ParticipantInteractionDefinition } from "./sceneTypes";

export const reflectionInteraction = (): ParticipantInteractionDefinition => ({
  kind: "reflection",
});

export const continueAction = (label = "Continue"): ParticipantActionDefinition => ({
  label,
  intent: "continue",
});

export const reassessRouteAction = (): ParticipantActionDefinition => ({
  label: "This hidden page does not feel like what I encountered.",
  intent: "reassess_route",
});
