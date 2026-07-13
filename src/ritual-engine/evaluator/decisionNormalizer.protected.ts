import type { ParticipantAdaptiveThread } from "./adaptiveThreads";
import {
  ProtectedEvaluationDecisionSchema,
  type ProtectedEvaluationDecision,
} from "./decisionSchema.protected";
import { assertGuidanceAllowed } from "./guidanceRegistry.protected";
import type { Gate1EvaluationPolicy } from "./policyTypes.protected";
import type { ProtectedEvaluationRequest } from "./requestSchema.protected";

function withOutcome(
  decision: ProtectedEvaluationDecision,
  outcome: ProtectedEvaluationDecision["outcome"],
  reasonCodes: ProtectedEvaluationDecision["reasonCodes"],
  guidanceTemplateId: ProtectedEvaluationDecision["guidanceTemplateId"],
): ProtectedEvaluationDecision {
  return {
    ...decision,
    outcome,
    responseState:
      outcome === "satisfied"
        ? "grounded"
        : outcome === "not_yet_formed"
          ? "not_yet_formed"
          : "provisional",
    reasonCodes,
    guidanceTemplateId,
  };
}

export function normalizeProtectedEvaluationDecision(input: {
  request: ProtectedEvaluationRequest;
  policy: Gate1EvaluationPolicy;
  decision: unknown;
  activeThread?: ParticipantAdaptiveThread;
}): ProtectedEvaluationDecision {
  const parsed = ProtectedEvaluationDecisionSchema.parse(input.decision);
  if (parsed.evaluationRequestId !== input.request.evaluationRequestId) {
    throw new Error("Evaluation decision request binding is invalid");
  }
  if (
    parsed.sourceParticipantCommandId !== input.request.sourceParticipantCommandId ||
    parsed.inputDigest !== input.request.inputDigest ||
    parsed.policyId !== input.policy.policyId ||
    parsed.policyVersion !== input.policy.version
  ) {
    throw new Error("Evaluation decision protected binding is invalid");
  }
  for (const facet of parsed.supportedFacets) {
    if (!input.policy.requiredFacets.includes(facet)) {
      throw new Error("Evaluation facet is not allowed by policy");
    }
  }
  for (const reason of parsed.reasonCodes) {
    if (!input.policy.allowedReasonCodes.includes(reason)) {
      throw new Error("Evaluation reason code is not allowed by policy");
    }
  }
  if (parsed.guidanceTemplateId) assertGuidanceAllowed(input.policy, parsed.guidanceTemplateId);

  if (parsed.safety.state === "blocked") {
    return {
      ...parsed,
      outcome: "blocked",
      responseState: "provisional",
      guidanceTemplateId: parsed.guidanceTemplateId ?? "safety_pause",
    };
  }
  if (parsed.safety.state === "rescale_required") {
    return {
      ...parsed,
      outcome: "rescale_required",
      responseState: "provisional",
      guidanceTemplateId: parsed.guidanceTemplateId ?? "safety_rescale",
    };
  }
  if (parsed.outcome === "satisfied" && parsed.confidence === "low") {
    return withOutcome(parsed, "not_yet_formed", ["low_confidence"], "not_yet_formed_permission");
  }
  if (
    parsed.outcome === "satisfied" &&
    input.policy.requiredFacets.some((facet) => !parsed.supportedFacets.includes(facet))
  ) {
    return withOutcome(
      parsed,
      "needs_follow_up",
      parsed.reasonCodes.length > 0 ? parsed.reasonCodes : ["contradictory_to_required_facets"],
      input.policy.allowedGuidanceTemplates[0] ?? "not_yet_formed_permission",
    );
  }
  if (parsed.outcome === "needs_follow_up" && input.activeThread?.followupCount === 1) {
    return withOutcome(
      parsed,
      "not_yet_formed",
      [...parsed.reasonCodes, "follow_up_limit_reached"],
      "not_yet_formed_permission",
    );
  }
  if (parsed.outcome === "needs_follow_up" && !parsed.guidanceTemplateId) {
    throw new Error("Follow-up decisions require allowlisted guidance");
  }
  if (parsed.outcome === "not_yet_formed" && !parsed.guidanceTemplateId) {
    return withOutcome(parsed, "not_yet_formed", parsed.reasonCodes, "not_yet_formed_permission");
  }
  if (parsed.outcome === "rescale_required" && !parsed.guidanceTemplateId) {
    return withOutcome(parsed, "rescale_required", parsed.reasonCodes, "safety_rescale");
  }
  if (parsed.outcome === "blocked" && !parsed.guidanceTemplateId) {
    return withOutcome(parsed, "blocked", parsed.reasonCodes, "safety_pause");
  }
  return parsed;
}
