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
      "identifies an event or condition",
      "identifies what was expected to follow",
      "distinguishes the event from the expected promise",
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
      "identifies an inherited or learned conditional agreement",
      "connects doing my part with expected protection, coherence, recognition, or outcome",
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
      "names the former belief",
      "names the coherence, protection, or outcome expected",
      "answers in personal lived terms",
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
    requiredFacets: [
      "names a promise, role, authority, expectation, or structure",
      "names the fracture in personal lived terms",
      "does not require generalized cynicism",
    ],
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
    requiredFacets: ["valid authored stance option is selected"],
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
      "names a recognition or insight",
      "names the assumed freedom or change",
      "identifies the gap between seeing and crossing",
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
    requiredFacets: ["names one specific promise, structure, role, authority, or expectation"],
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
      "names one moment, decision, or conclusion",
      "names what was recognized",
      "names what was incorrectly assumed complete",
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
    requiredFacets: [
      "names one current behavior, role, authority, expectation, or avoidance",
      "identifies present obedience after recognition",
      "remains participant-centered",
    ],
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
      "interrupts the named active allegiance",
      "participant-controlled",
      "bounded",
      "observable",
      "safe",
      "possible without another person's agreement",
      "reversible or low-cost",
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
      "micro-act occurred",
      "occurred outside reflection",
      "matches current Gate Act",
      "current route revision",
      "not stale",
    ],
    insufficientSubstitutes: ["scheduled only", "planning", "understanding"],
    allowedReasonCodes: evidenceReasons,
    allowedGuidanceTemplates: ["evidence_requires_occurrence", "evidence_link_to_gate_act"],
    semanticProviderRequired: false,
    safetyProfile: "evidence",
  }),
  policy({
    canonicalSceneId: canonicalSceneId("ST-03"),
    canonicalQuestionId: GATE1_QUESTIONS.splinteredTrustAxis.canonicalQuestionId,
    routeId: SPLINTERED_TRUST_ROUTE_ID,
    targetKind: "reflection",
    exactPrompt: GATE1_QUESTIONS.splinteredTrustAxis.prompt,
    requiredFacets: [
      "names what broke trust",
      "names why truth or signal now feels dangerous",
      "does not require restored blind trust",
    ],
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
    requiredFacets: ["names one specific experience, pattern, authority, or breach"],
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
      "names the protective function of suspicion",
      "identifies what it prevents or guards against",
      "does not shame suspicion",
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
      "names how authority was treated as proof",
      "identifies the current pattern or residue",
      "does not require rejection of all expertise",
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
      "names one testable signal",
      "preserves judgment",
      "avoids blind trust",
      "is bounded and reversible",
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
      "tests one bounded signal",
      "participant-controlled",
      "reversible",
      "observable",
      "safe",
      "does not surrender judgment",
      "does not depend on another person's reaction",
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
      "micro-act occurred",
      "occurred outside reflection",
      "matches current Gate Act",
      "current route revision",
      "not stale",
    ],
    insufficientSubstitutes: ["scheduled only", "planning", "understanding"],
    allowedReasonCodes: evidenceReasons,
    allowedGuidanceTemplates: ["evidence_requires_occurrence", "evidence_link_to_gate_act"],
    semanticProviderRequired: false,
    safetyProfile: "evidence",
  }),
  policy({
    canonicalSceneId: canonicalSceneId("G1-12"),
    canonicalQuestionId: GATE1_QUESTIONS.finalReadiness.canonicalQuestionId,
    targetKind: "readiness",
    exactPrompt: GATE1_QUESTIONS.finalReadiness.prompt,
    requiredFacets: [
      "names an actual outside-page difference",
      "connects it to the Gate Act or evidence",
      "distinguishes action or reality contact from insight",
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
