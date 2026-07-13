import { z } from "zod";

export const ParticipantGuidanceTemplateIdSchema = z.enum([
  "not_yet_formed_permission",
  "clarify_specific_event",
  "clarify_expected_promise",
  "clarify_present_obedience",
  "clarify_protective_suspicion",
  "clarify_remaining_signal",
  "clarify_outside_change",
  "gate_act_make_smaller",
  "gate_act_return_to_control",
  "evidence_requires_occurrence",
  "evidence_link_to_gate_act",
  "safety_rescale",
  "safety_pause",
]);

export type ParticipantGuidanceTemplateId = z.infer<typeof ParticipantGuidanceTemplateIdSchema>;

export const PARTICIPANT_GUIDANCE_COPY: Readonly<Record<ParticipantGuidanceTemplateId, string>> = {
  not_yet_formed_permission:
    "You do not have to force an answer. Stay here, pause, or return when the shape is clearer.",
  clarify_specific_event: "Name one specific event or moment. What happened?",
  clarify_expected_promise: "What did you expect would follow if you did your part?",
  clarify_present_obedience: "What still receives your obedience, even after you saw the fracture?",
  clarify_protective_suspicion: "What does suspicion protect you from now?",
  clarify_remaining_signal: "What signal could you test without surrendering judgment?",
  clarify_outside_change:
    "Name the change that occurred outside this page-not what you understood, but what became different.",
  gate_act_make_smaller: "Make the action smaller, reversible, and observable.",
  gate_act_return_to_control: "Choose an action that remains within your control.",
  evidence_requires_occurrence:
    "This requires something that occurred outside reflection, not only a plan.",
  evidence_link_to_gate_act: "Link the evidence to the Gate Act you formed.",
  safety_rescale: "Scale this down until it is bounded, reversible, and safe.",
  safety_pause: "Pause here. Do not continue the ritual until safety is restored.",
};

export function renderParticipantGuidance(templateId: ParticipantGuidanceTemplateId): string {
  return PARTICIPANT_GUIDANCE_COPY[templateId];
}
