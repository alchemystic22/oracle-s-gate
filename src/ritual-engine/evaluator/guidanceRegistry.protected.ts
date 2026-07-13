import type { Gate1EvaluationPolicy } from "./policyTypes.protected";
import {
  PARTICIPANT_GUIDANCE_COPY,
  renderParticipantGuidance,
  type ParticipantGuidanceTemplateId,
} from "./participantGuidance";

export function assertGuidanceAllowed(
  policy: Gate1EvaluationPolicy,
  templateId: ParticipantGuidanceTemplateId,
): void {
  const globallyAllowed: readonly ParticipantGuidanceTemplateId[] = [
    "not_yet_formed_permission",
    "safety_rescale",
    "safety_pause",
  ];
  if (
    !policy.allowedGuidanceTemplates.includes(templateId) &&
    !globallyAllowed.includes(templateId)
  ) {
    throw new Error("Guidance template is not allowed by the active policy");
  }
}

export function protectedRenderGuidance(
  policy: Gate1EvaluationPolicy,
  templateId: ParticipantGuidanceTemplateId,
): string {
  assertGuidanceAllowed(policy, templateId);
  return renderParticipantGuidance(templateId);
}

export const PROTECTED_GUIDANCE_REGISTRY = PARTICIPANT_GUIDANCE_COPY;
