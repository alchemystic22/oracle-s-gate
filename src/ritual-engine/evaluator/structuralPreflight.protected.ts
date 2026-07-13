import type { ParticipantAdaptiveThread } from "./adaptiveThreads";
import type { ProtectedEvaluationDecision } from "./decisionSchema.protected";
import type { Gate1EvaluationPolicy } from "./policyTypes.protected";
import type { ProtectedEvaluationRequest } from "./requestSchema.protected";

function decision(input: {
  request: ProtectedEvaluationRequest;
  outcome: ProtectedEvaluationDecision["outcome"];
  confidence?: ProtectedEvaluationDecision["confidence"];
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
    outcome: input.outcome,
    responseState:
      input.outcome === "satisfied"
        ? "grounded"
        : input.outcome === "not_yet_formed"
          ? "not_yet_formed"
          : "provisional",
    confidence: input.confidence ?? "high",
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

function containsAny(value: string, needles: readonly string[]): boolean {
  const lowered = value.toLowerCase();
  return needles.some((needle) => lowered.includes(needle));
}

export function runStructuralPreflight(input: {
  request: ProtectedEvaluationRequest;
  policy: Gate1EvaluationPolicy;
  activeThread?: ParticipantAdaptiveThread;
  decidedAtUtc: string;
}): ProtectedEvaluationDecision | undefined {
  const { request, activeThread } = input;
  const target = request.target;

  if (
    (target.kind === "reflection" || target.kind === "readiness") &&
    isExactNotYetFormed(target.text)
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
    return decision({
      request,
      outcome: "satisfied",
      reasonCodes: ["completed_outside_reflection", "matches_active_gate_act"],
      decidedAtUtc: input.decidedAtUtc,
    });
  }

  if (target.kind === "gate_act") {
    const text = `${target.act} ${target.context ?? ""} ${target.immediateMicroAct} ${
      target.continuationAction ?? ""
    }`;
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
    if (
      target.safetySelfReport === "unsure" ||
      containsAny(text, [
        "confront",
        "threaten",
        "drive all night",
        "spend my savings",
        "quit my job",
      ])
    ) {
      return decision({
        request,
        outcome: "rescale_required",
        reasonCodes: ["act_is_high_cost"],
        safetyState: "rescale_required",
        safetyCodes:
          target.safetySelfReport === "unsure"
            ? ["participant_declared_unsure"]
            : ["dangerous_confrontation"],
        guidanceTemplateId: "safety_rescale",
        decidedAtUtc: input.decidedAtUtc,
      });
    }
    if (containsAny(text, ["make them", "convince them", "unless they", "if they agree"])) {
      return decision({
        request,
        outcome: "rescale_required",
        reasonCodes: ["act_depends_on_other_person"],
        safetyState: "rescale_required",
        safetyCodes: [],
        guidanceTemplateId: "gate_act_return_to_control",
        decidedAtUtc: input.decidedAtUtc,
      });
    }
  }

  if (activeThread?.followupCount === 1) {
    return decision({
      request,
      outcome: "not_yet_formed",
      reasonCodes: ["follow_up_limit_reached"],
      guidanceTemplateId: "not_yet_formed_permission",
      decidedAtUtc: input.decidedAtUtc,
    });
  }

  return undefined;
}
