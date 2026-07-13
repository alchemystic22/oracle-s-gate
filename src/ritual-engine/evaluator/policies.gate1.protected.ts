import type { CanonicalSceneId } from "../domain/ids";
import {
  FALSE_ARRIVAL_ROUTE_ID,
  SPLINTERED_TRUST_ROUTE_ID,
  canonicalSceneId,
} from "../gate1/constants";
import { GATE1_QUESTIONS } from "../gate1/questions";
import type { Gate1EvaluationPolicy } from "./policyTypes.protected";
import type { EvaluationReasonCode } from "./reasonCodes.protected";
import type { ParticipantGuidanceTemplateId } from "./participantGuidance";

const groundingReasons = [
  "directly_answers_prompt",
  "names_specific_event",
  "names_expected_promise",
  "names_current_pattern",
  "names_personal_relevance",
  "distinguishes_event_from_promise",
  "distinguishes_recognition_from_freedom",
  "distinguishes_discernment_from_total_distrust",
  "identifies_outside_change",
  "empty_or_missing",
  "explicit_not_yet_formed",
  "nonresponsive",
  "too_abstract",
  "only_repeats_prompt",
  "only_intellectual_summary",
  "missing_specific_event",
  "missing_expected_promise",
  "missing_present_pattern",
  "externalizes_all_agency",
  "contradictory_to_required_facets",
  "low_confidence",
  "follow_up_limit_reached",
] as const;

const gateActReasons = [
  "act_is_bounded",
  "act_is_observable",
  "act_is_participant_controlled",
  "act_is_reversible",
  "act_is_route_relevant",
  "act_is_too_broad",
  "act_depends_on_other_person",
  "act_is_irreversible",
  "act_is_high_cost",
  "act_is_confrontational",
  "act_is_illegal_or_policy_prohibited",
  "act_is_not_observable",
  "act_is_unrelated_to_gate",
  "low_confidence",
] as const;

const evidenceReasons = [
  "completed_outside_reflection",
  "matches_active_gate_act",
  "scheduled_only",
  "description_missing_when_required",
  "does_not_match_gate_act",
  "only_planning",
  "low_confidence",
] as const;

type PolicyInput = Omit<
  Gate1EvaluationPolicy,
  | "policyId"
  | "version"
  | "maxFollowups"
  | "minConfidence"
  | "allowedReasonCodes"
  | "allowedGuidanceTemplates"
> & {
  allowedReasonCodes: readonly EvaluationReasonCode[];
  allowedGuidanceTemplates: readonly ParticipantGuidanceTemplateId[];
};

function policy(value: PolicyInput): Gate1EvaluationPolicy {
  return {
    policyId: `gate1.${value.canonicalSceneId}.v1`,
    version: 1,
    maxFollowups: 1,
    minConfidence: "medium",
    ...value,
    allowedReasonCodes: [...value.allowedReasonCodes],
    allowedGuidanceTemplates: [...value.allowedGuidanceTemplates],
  };
}

export const GATE1_EVALUATION_POLICIES: readonly Gate1EvaluationPolicy[] = [
  policy({
    canonicalSceneId: canonicalSceneId("G1-03"),
    targetKind: "reflection",
    requiredFacets: [
      "identifies_event_or_condition",
      "identifies_expected_promise",
      "distinguishes_event_from_promise",
    ],
    insufficientSubstitutes: [
      "abstract philosophy",
      "only naming the event",
      "only naming disappointment",
      "repeating the prompt",
    ],
    allowedReasonCodes: groundingReasons,
    allowedGuidanceTemplates: ["clarify_specific_event", "clarify_expected_promise"],
    semanticProviderRequired: true,
    safetyProfile: "reflection",
  }),
  policy({
    canonicalSceneId: canonicalSceneId("G1-05"),
    targetKind: "reflection",
    requiredFacets: [
      "identifies_conditional_agreement",
      "connects_doing_part_with_expected_outcome",
    ],
    insufficientSubstitutes: [
      "general complaint",
      "event description with no conditional belief",
      "blame without naming the promise",
    ],
    allowedReasonCodes: groundingReasons,
    allowedGuidanceTemplates: ["clarify_expected_promise"],
    semanticProviderRequired: true,
    safetyProfile: "reflection",
  }),
  policy({
    canonicalSceneId: canonicalSceneId("G1-06"),
    canonicalQuestionId: GATE1_QUESTIONS.bridge.canonicalQuestionId,
    targetKind: "reflection",
    exactPrompt: GATE1_QUESTIONS.bridge.prompt,
    requiredFacets: [
      "names_former_belief",
      "names_expected_coherence_or_protection",
      "answers_in_lived_terms",
    ],
    insufficientSubstitutes: [
      "current opinion only",
      "generalized social critique",
      "nothing without context",
      "repeating the question",
    ],
    allowedReasonCodes: groundingReasons,
    allowedGuidanceTemplates: ["clarify_expected_promise"],
    semanticProviderRequired: true,
    safetyProfile: "reflection",
  }),
  policy({
    canonicalSceneId: canonicalSceneId("G1-07"),
    canonicalQuestionId: GATE1_QUESTIONS.gateAxis.canonicalQuestionId,
    targetKind: "reflection",
    exactPrompt: GATE1_QUESTIONS.gateAxis.prompt,
    requiredFacets: ["names_broken_promise_or_structure", "names_personal_fracture"],
    insufficientSubstitutes: [
      "the world is broken",
      "only naming an event",
      "rejection of all authority",
      "purely intellectual commentary",
    ],
    allowedReasonCodes: groundingReasons,
    allowedGuidanceTemplates: ["clarify_specific_event", "clarify_expected_promise"],
    semanticProviderRequired: true,
    safetyProfile: "reflection",
  }),
  policy({
    canonicalSceneId: canonicalSceneId("G1-09"),
    targetKind: "stance_selection",
    requiredFacets: ["valid_stance_option_selected"],
    insufficientSubstitutes: ["free text stance", "route mapping disclosure"],
    allowedReasonCodes: ["directly_answers_prompt"],
    allowedGuidanceTemplates: [],
    semanticProviderRequired: false,
    safetyProfile: "reflection",
  }),
  policy({
    canonicalSceneId: canonicalSceneId("FA-03"),
    canonicalQuestionId: GATE1_QUESTIONS.falseArrivalAxis.canonicalQuestionId,
    routeId: FALSE_ARRIVAL_ROUTE_ID,
    targetKind: "reflection",
    exactPrompt: GATE1_QUESTIONS.falseArrivalAxis.prompt,
    requiredFacets: [
      "names_recognition_or_insight",
      "names_assumed_freedom_or_change",
      "identifies_gap_between_seeing_and_crossing",
    ],
    insufficientSubstitutes: [
      "I learned a lot",
      "naming only the broken structure",
      "claiming total freedom with no behavior change",
    ],
    allowedReasonCodes: groundingReasons,
    allowedGuidanceTemplates: ["clarify_present_obedience"],
    semanticProviderRequired: true,
    safetyProfile: "reflection",
  }),
  policy({
    canonicalSceneId: canonicalSceneId("FA-04"),
    routeId: FALSE_ARRIVAL_ROUTE_ID,
    targetKind: "reflection",
    exactPrompt: "Name the broken promise or structure.",
    requiredFacets: ["names_one_bounded_structure"],
    insufficientSubstitutes: ["society", "everything", "generalized distrust"],
    allowedReasonCodes: groundingReasons,
    allowedGuidanceTemplates: ["clarify_specific_event"],
    semanticProviderRequired: true,
    safetyProfile: "reflection",
  }),
  policy({
    canonicalSceneId: canonicalSceneId("FA-05"),
    canonicalQuestionId: GATE1_QUESTIONS.falseArrivalAxis.canonicalQuestionId,
    routeId: FALSE_ARRIVAL_ROUTE_ID,
    targetKind: "reflection",
    exactPrompt: GATE1_QUESTIONS.falseArrivalAxis.prompt,
    requiredFacets: [
      "names_recognition_or_insight",
      "names_mistaken_completion",
      "identifies_gap_between_seeing_and_crossing",
    ],
    insufficientSubstitutes: ["recognition without behavior", "general insight"],
    allowedReasonCodes: groundingReasons,
    allowedGuidanceTemplates: ["clarify_present_obedience"],
    semanticProviderRequired: true,
    safetyProfile: "reflection",
  }),
  policy({
    canonicalSceneId: canonicalSceneId("FA-06"),
    routeId: FALSE_ARRIVAL_ROUTE_ID,
    targetKind: "reflection",
    exactPrompt: "Name what still receives obedience.",
    requiredFacets: ["names_current_obedience", "participant_centered"],
    insufficientSubstitutes: ["only blaming an external system"],
    allowedReasonCodes: groundingReasons,
    allowedGuidanceTemplates: ["clarify_present_obedience"],
    semanticProviderRequired: true,
    safetyProfile: "reflection",
  }),
  policy({
    canonicalSceneId: canonicalSceneId("FA-07"),
    routeId: FALSE_ARRIVAL_ROUTE_ID,
    targetKind: "gate_act",
    requiredFacets: [
      "act_interrupts_allegiance",
      "act_participant_controlled",
      "act_bounded",
      "act_observable",
      "act_safe",
      "act_reversible_or_low_cost",
      "act_route_relevant",
    ],
    insufficientSubstitutes: ["broad identity change", "another person's reaction"],
    allowedReasonCodes: gateActReasons,
    allowedGuidanceTemplates: [
      "gate_act_make_smaller",
      "gate_act_return_to_control",
      "safety_rescale",
    ],
    semanticProviderRequired: true,
    safetyProfile: "gate_act",
  }),
  policy({
    canonicalSceneId: canonicalSceneId("FA-08"),
    routeId: FALSE_ARRIVAL_ROUTE_ID,
    targetKind: "evidence",
    requiredFacets: [
      "evidence_occurred",
      "evidence_outside_reflection",
      "evidence_matches_active_gate_act",
      "evidence_current_route_revision",
      "evidence_not_stale",
    ],
    insufficientSubstitutes: ["scheduled only", "planning", "understanding"],
    allowedReasonCodes: evidenceReasons,
    allowedGuidanceTemplates: ["evidence_requires_occurrence", "evidence_link_to_gate_act"],
    semanticProviderRequired: true,
    safetyProfile: "evidence",
  }),
  policy({
    canonicalSceneId: canonicalSceneId("ST-03"),
    canonicalQuestionId: GATE1_QUESTIONS.splinteredTrustAxis.canonicalQuestionId,
    routeId: SPLINTERED_TRUST_ROUTE_ID,
    targetKind: "reflection",
    exactPrompt: GATE1_QUESTIONS.splinteredTrustAxis.prompt,
    requiredFacets: ["names_broken_trust", "names_truth_danger", "avoids_blind_trust_requirement"],
    insufficientSubstitutes: ["blind trust", "total distrust"],
    allowedReasonCodes: groundingReasons,
    allowedGuidanceTemplates: ["clarify_protective_suspicion"],
    semanticProviderRequired: true,
    safetyProfile: "reflection",
  }),
  policy({
    canonicalSceneId: canonicalSceneId("ST-04"),
    routeId: SPLINTERED_TRUST_ROUTE_ID,
    targetKind: "reflection",
    exactPrompt: "Name what broke trust.",
    requiredFacets: ["names_specific_breach"],
    insufficientSubstitutes: ["everything", "all truth"],
    allowedReasonCodes: groundingReasons,
    allowedGuidanceTemplates: ["clarify_specific_event"],
    semanticProviderRequired: true,
    safetyProfile: "reflection",
  }),
  policy({
    canonicalSceneId: canonicalSceneId("ST-05"),
    routeId: SPLINTERED_TRUST_ROUTE_ID,
    targetKind: "reflection",
    exactPrompt: "Name how suspicion currently protects.",
    requiredFacets: [
      "names_protective_function",
      "names_guarded_against",
      "does_not_shame_suspicion",
    ],
    insufficientSubstitutes: ["shaming suspicion", "restoring blind trust"],
    allowedReasonCodes: groundingReasons,
    allowedGuidanceTemplates: ["clarify_protective_suspicion"],
    semanticProviderRequired: true,
    safetyProfile: "reflection",
  }),
  policy({
    canonicalSceneId: canonicalSceneId("ST-06"),
    routeId: SPLINTERED_TRUST_ROUTE_ID,
    targetKind: "reflection",
    exactPrompt: "Name the pattern equating authority with truth.",
    requiredFacets: [
      "names_authority_as_proof_pattern",
      "identifies_current_pattern_residue",
      "preserves_expertise_distinction",
    ],
    insufficientSubstitutes: ["rejecting all expertise"],
    allowedReasonCodes: groundingReasons,
    allowedGuidanceTemplates: ["clarify_specific_event"],
    semanticProviderRequired: true,
    safetyProfile: "reflection",
  }),
  policy({
    canonicalSceneId: canonicalSceneId("ST-07"),
    routeId: SPLINTERED_TRUST_ROUTE_ID,
    targetKind: "reflection",
    exactPrompt: "Name a bounded signal available without surrender.",
    requiredFacets: [
      "names_testable_signal",
      "preserves_judgment",
      "avoids_blind_trust",
      "bounded_reversible_signal",
    ],
    insufficientSubstitutes: ["blind trust", "total refusal"],
    allowedReasonCodes: groundingReasons,
    allowedGuidanceTemplates: ["clarify_remaining_signal"],
    semanticProviderRequired: true,
    safetyProfile: "reflection",
  }),
  policy({
    canonicalSceneId: canonicalSceneId("ST-08"),
    routeId: SPLINTERED_TRUST_ROUTE_ID,
    targetKind: "gate_act",
    requiredFacets: [
      "act_tests_bounded_signal",
      "act_participant_controlled",
      "act_reversible_or_low_cost",
      "act_observable",
      "act_safe",
      "does_not_surrender_judgment",
      "act_route_relevant",
    ],
    insufficientSubstitutes: ["blind trust", "another person's reaction"],
    allowedReasonCodes: gateActReasons,
    allowedGuidanceTemplates: [
      "gate_act_make_smaller",
      "gate_act_return_to_control",
      "safety_rescale",
    ],
    semanticProviderRequired: true,
    safetyProfile: "gate_act",
  }),
  policy({
    canonicalSceneId: canonicalSceneId("ST-09"),
    routeId: SPLINTERED_TRUST_ROUTE_ID,
    targetKind: "evidence",
    requiredFacets: [
      "evidence_occurred",
      "evidence_outside_reflection",
      "evidence_matches_active_gate_act",
      "evidence_current_route_revision",
      "evidence_not_stale",
    ],
    insufficientSubstitutes: ["scheduled only", "planning", "understanding"],
    allowedReasonCodes: evidenceReasons,
    allowedGuidanceTemplates: ["evidence_requires_occurrence", "evidence_link_to_gate_act"],
    semanticProviderRequired: true,
    safetyProfile: "evidence",
  }),
  policy({
    canonicalSceneId: canonicalSceneId("G1-12"),
    canonicalQuestionId: GATE1_QUESTIONS.finalReadiness.canonicalQuestionId,
    targetKind: "readiness",
    exactPrompt: GATE1_QUESTIONS.finalReadiness.prompt,
    requiredFacets: [
      "names_outside_page_difference",
      "connects_change_to_gate_act_or_evidence",
      "distinguishes_reality_contact_from_insight",
    ],
    insufficientSubstitutes: [
      "understanding",
      "clarity",
      "planning",
      "intention",
      "visualization",
      "emotional intensity without outside change",
    ],
    allowedReasonCodes: [...groundingReasons, "only_planning", "only_understanding"],
    allowedGuidanceTemplates: ["clarify_outside_change"],
    semanticProviderRequired: true,
    safetyProfile: "readiness",
  }),
];

export const GATE1_EVALUATION_POLICY_BY_SCENE: ReadonlyMap<
  CanonicalSceneId,
  Gate1EvaluationPolicy
> = new Map(GATE1_EVALUATION_POLICIES.map((entry) => [entry.canonicalSceneId, entry]));

export function getGate1EvaluationPolicy(
  canonicalSceneId: CanonicalSceneId,
): Gate1EvaluationPolicy | undefined {
  return GATE1_EVALUATION_POLICY_BY_SCENE.get(canonicalSceneId);
}
