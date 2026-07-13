import { z } from "zod";
import type { CanonicalQuestionId, CanonicalRouteId, CanonicalSceneId } from "../domain/ids";
import { ParticipantGuidanceTemplateIdSchema } from "./participantGuidance";
import { EvaluationReasonCodeSchema } from "./reasonCodes.protected";

export const Gate1EvaluationFacetSchema = z.enum([
  "identifies_event_or_condition",
  "identifies_expected_promise",
  "distinguishes_event_from_promise",
  "identifies_conditional_agreement",
  "connects_doing_part_with_expected_outcome",
  "names_former_belief",
  "names_expected_coherence_or_protection",
  "answers_in_lived_terms",
  "names_broken_promise_or_structure",
  "names_personal_fracture",
  "valid_stance_option_selected",
  "names_recognition_or_insight",
  "names_assumed_freedom_or_change",
  "identifies_gap_between_seeing_and_crossing",
  "names_one_bounded_structure",
  "names_mistaken_completion",
  "names_current_obedience",
  "participant_centered",
  "act_interrupts_allegiance",
  "act_tests_bounded_signal",
  "act_participant_controlled",
  "act_bounded",
  "act_observable",
  "act_safe",
  "act_reversible_or_low_cost",
  "act_route_relevant",
  "evidence_occurred",
  "evidence_outside_reflection",
  "evidence_matches_active_gate_act",
  "evidence_current_route_revision",
  "evidence_not_stale",
  "names_broken_trust",
  "names_truth_danger",
  "avoids_blind_trust_requirement",
  "names_specific_breach",
  "names_protective_function",
  "names_guarded_against",
  "does_not_shame_suspicion",
  "names_authority_as_proof_pattern",
  "identifies_current_pattern_residue",
  "preserves_expertise_distinction",
  "names_testable_signal",
  "preserves_judgment",
  "avoids_blind_trust",
  "bounded_reversible_signal",
  "does_not_surrender_judgment",
  "names_outside_page_difference",
  "connects_change_to_gate_act_or_evidence",
  "distinguishes_reality_contact_from_insight",
]);

export type Gate1EvaluationFacet = z.infer<typeof Gate1EvaluationFacetSchema>;

export const EvaluationTargetKindSchema = z.enum([
  "reflection",
  "stance_selection",
  "gate_act",
  "evidence",
  "readiness",
]);

export type EvaluationTargetKind = z.infer<typeof EvaluationTargetKindSchema>;

export const Gate1EvaluationPolicySchema = z
  .object({
    policyId: z.string().min(1),
    version: z.literal(1),
    canonicalSceneId: z.custom<CanonicalSceneId>((value) => typeof value === "string"),
    canonicalQuestionId: z
      .custom<CanonicalQuestionId>((value) => typeof value === "string")
      .optional(),
    routeId: z.custom<CanonicalRouteId>((value) => typeof value === "string").optional(),
    targetKind: EvaluationTargetKindSchema,
    exactPrompt: z.string().min(1).optional(),
    requiredFacets: z.array(Gate1EvaluationFacetSchema).min(1),
    insufficientSubstitutes: z.array(z.string().min(1)),
    allowedReasonCodes: z.array(EvaluationReasonCodeSchema).min(1),
    allowedGuidanceTemplates: z.array(ParticipantGuidanceTemplateIdSchema),
    maxFollowups: z.literal(1),
    minConfidence: z.enum(["medium", "high"]),
    semanticProviderRequired: z.boolean(),
    safetyProfile: z.enum(["reflection", "gate_act", "evidence", "readiness"]),
  })
  .strict();

export type Gate1EvaluationPolicy = z.infer<typeof Gate1EvaluationPolicySchema>;
