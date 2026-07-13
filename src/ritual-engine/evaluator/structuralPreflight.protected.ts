import type { ParticipantAdaptiveThread } from "./adaptiveThreads";
import type { ProtectedEvaluationDecision } from "./decisionSchema.protected";
import type { Gate1EvaluationPolicy } from "./policyTypes.protected";
import type { ProtectedEvaluationRequest } from "./requestSchema.protected";

function decision(input: {
  request: ProtectedEvaluationRequest;
  outcome: ProtectedEvaluationDecision["outcome"];
  confidence?: ProtectedEvaluationDecision["confidence"];
  supportedFacets?: ProtectedEvaluationDecision["supportedFacets"];
  reasonCodes: ProtectedEvaluationDecision["reasonCodes"];
  guidanceTemplateId?: ProtectedEvaluationDecision["guidanceTemplateId"];
  safetyState?: ProtectedEvaluationDecision["safety"]["state"];
  safetyCodes?: ProtectedEvaluationDecision["safety"]["codes"];
  decidedAtUtc: string;
}): ProtectedEvaluationDecision {
  return {
    schemaVersion: 1,
    evaluationRequestId: input.request.evaluationRequestId,
    evaluationDecisionId: `${input.request.evaluationRequestId}.preflight`,
    sourceParticipantCommandId: input.request.sourceParticipantCommandId,
    inputDigest: input.request.inputDigest,
    policyId: input.request.policyId,
    policyVersion: input.request.policyVersion,
    providerId: "structural-preflight",
    providerVersion: "1",
    deterministic: true,
    outcome: input.outcome,
    responseState:
      input.outcome === "satisfied"
        ? "grounded"
        : input.outcome === "not_yet_formed"
          ? "not_yet_formed"
          : "provisional",
    confidence: input.confidence ?? "high",
    supportedFacets: input.supportedFacets ?? [],
    reasonCodes: input.reasonCodes,
    guidanceTemplateId: input.guidanceTemplateId,
    safety: {
      state: input.safetyState ?? "clear",
      codes: input.safetyCodes ?? [],
      emergency: input.safetyState === "blocked",
    },
    provider: { kind: "fixture", providerId: "structural-preflight" },
    decidedAtUtc: input.decidedAtUtc,
  };
}

export function isExactNotYetFormed(value: string | undefined): boolean {
  if (!value) return false;
  return /^\s*i cannot name this clearly yet[.!?]?\s*$/i.test(value);
}

export function runStructuralPreflight(input: {
  request: ProtectedEvaluationRequest;
  policy: Gate1EvaluationPolicy;
  activeThread?: ParticipantAdaptiveThread;
  decidedAtUtc: string;
}): ProtectedEvaluationDecision | undefined {
  const { request } = input;
  const target = request.target;

  if (
    (target.kind === "reflection" || target.kind === "readiness") &&
    (target.responseState === "not_yet_formed" || isExactNotYetFormed(target.text))
  ) {
    return decision({
      request,
      outcome: "not_yet_formed",
      reasonCodes: ["explicit_not_yet_formed"],
      guidanceTemplateId: "not_yet_formed_permission",
      decidedAtUtc: input.decidedAtUtc,
    });
  }

  if (target.kind === "stance_selection") {
    return decision({
      request,
      outcome: "satisfied",
      supportedFacets: input.policy.requiredFacets,
      reasonCodes: ["directly_answers_prompt"],
      decidedAtUtc: input.decidedAtUtc,
    });
  }

  if (target.kind === "evidence") {
    if (target.eventType === "continuation_scheduled") {
      return decision({
        request,
        outcome: "not_yet_formed",
        reasonCodes: ["scheduled_only", "only_planning"],
        guidanceTemplateId: "evidence_requires_occurrence",
        decidedAtUtc: input.decidedAtUtc,
      });
    }
    if (
      target.stale ||
      target.activeGateAct?.stale ||
      !target.activeGateAct ||
      target.gateActId !== target.activeGateAct.gateActId ||
      target.routeBindingRevision !== target.activeRouteBindingRevision
    ) {
      return decision({
        request,
        outcome: "not_yet_formed",
        reasonCodes: ["does_not_match_gate_act"],
        guidanceTemplateId: "evidence_link_to_gate_act",
        decidedAtUtc: input.decidedAtUtc,
      });
    }
    return undefined;
  }

  if (target.kind === "gate_act") {
    if (target.safetySelfReport === "not_safe") {
      return decision({
        request,
        outcome: "blocked",
        reasonCodes: ["act_is_unrelated_to_gate"],
        safetyState: "blocked",
        safetyCodes: ["participant_declared_not_safe"],
        guidanceTemplateId: "safety_pause",
        decidedAtUtc: input.decidedAtUtc,
      });
    }
    if (target.safetySelfReport === "unsure") {
      return decision({
        request,
        outcome: "rescale_required",
        reasonCodes: ["act_is_high_cost"],
        safetyState: "rescale_required",
        safetyCodes: ["participant_declared_unsure"],
        guidanceTemplateId: "safety_rescale",
        decidedAtUtc: input.decidedAtUtc,
      });
    }
  }

  return undefined;
}
