import type { ProtectedEvaluationDecision } from "./decisionSchema.protected";
import type { ProtectedEvaluationProvider } from "./provider.protected";
import type { ProtectedEvaluationRequest } from "./requestSchema.protected";
import type { EvaluationSafetyCode } from "./safetyCodes.protected";

function containsAny(value: string | undefined, needles: readonly string[]): boolean {
  const lowered = value?.toLowerCase() ?? "";
  return needles.some((needle) => lowered.includes(needle));
}

export class FixtureEvaluationProvider implements ProtectedEvaluationProvider {
  readonly providerId = "gate1-fixture-provider";

  async evaluate(request: ProtectedEvaluationRequest): Promise<ProtectedEvaluationDecision> {
    const target = request.target;
    const text =
      target.kind === "reflection" || target.kind === "readiness"
        ? target.text
        : target.kind === "gate_act"
          ? `${target.act} ${target.immediateMicroAct} ${target.context ?? ""}`
          : target.kind === "evidence"
            ? target.description
            : "";
    let outcome: ProtectedEvaluationDecision["outcome"] = "satisfied";
    let confidence: ProtectedEvaluationDecision["confidence"] = "high";
    let reasonCodes: ProtectedEvaluationDecision["reasonCodes"] = ["directly_answers_prompt"];
    let guidanceTemplateId: ProtectedEvaluationDecision["guidanceTemplateId"];
    let safety: ProtectedEvaluationDecision["safety"] = {
      state: "clear",
      codes: [] as EvaluationSafetyCode[],
      emergency: false,
    };

    if (containsAny(text, ["self harm", "kill myself", "end my life"])) {
      outcome = "blocked";
      reasonCodes = ["nonresponsive"];
      guidanceTemplateId = "safety_pause";
      safety = { state: "blocked", codes: ["immediate_self_harm_risk"], emergency: true };
    } else if (containsAny(text, ["hurt someone", "harm another", "attack them"])) {
      outcome = "blocked";
      reasonCodes = ["nonresponsive"];
      guidanceTemplateId = "safety_pause";
      safety = { state: "blocked", codes: ["immediate_harm_to_others_risk"], emergency: true };
    } else if (containsAny(text, ["medical emergency", "overdose", "cannot breathe"])) {
      outcome = "blocked";
      reasonCodes = ["nonresponsive"];
      guidanceTemplateId = "safety_pause";
      safety = { state: "blocked", codes: ["medical_emergency_language"], emergency: true };
    } else if (containsAny(text, ["external entity commanded", "the oracle ordered me"])) {
      outcome = "rescale_required";
      reasonCodes = ["externalizes_all_agency"];
      guidanceTemplateId = "safety_rescale";
      safety = {
        state: "rescale_required",
        codes: ["external_entity_command_displacing_agency"],
        emergency: false,
      };
    } else if (
      target.kind === "readiness" &&
      containsAny(text, ["understood", "planning", "plan to", "intend"])
    ) {
      outcome = "needs_follow_up";
      confidence = "medium";
      reasonCodes = [
        containsAny(text, ["planning", "plan to"]) ? "only_planning" : "only_understanding",
      ];
      guidanceTemplateId = "clarify_outside_change";
    } else if (
      !text?.trim() ||
      containsAny(text, ["abstract", "philosophy", "same as prompt", "i learned a lot"])
    ) {
      outcome = "needs_follow_up";
      confidence = "medium";
      reasonCodes = [!text?.trim() ? "empty_or_missing" : "too_abstract"];
      guidanceTemplateId =
        request.targetKind === "readiness" ? "clarify_outside_change" : "clarify_specific_event";
    } else if (target.kind === "gate_act") {
      reasonCodes = [
        "act_is_bounded",
        "act_is_observable",
        "act_is_participant_controlled",
        "act_is_reversible",
        "act_is_route_relevant",
      ];
    } else if (target.kind === "readiness") {
      reasonCodes = ["identifies_outside_change"];
    } else if (target.kind === "reflection" && containsAny(text, ["one day reality cracked"])) {
      outcome = "needs_follow_up";
      confidence = "medium";
      reasonCodes = ["too_abstract"];
      guidanceTemplateId = "clarify_specific_event";
    }

    return {
      schemaVersion: 1,
      evaluationRequestId: request.evaluationRequestId,
      evaluationDecisionId: `${request.evaluationRequestId}.fixture`,
      outcome,
      responseState: outcome === "satisfied" ? "grounded" : "provisional",
      confidence,
      reasonCodes,
      guidanceTemplateId,
      safety,
      provider: { kind: "fixture", providerId: this.providerId, fixtureId: "synthetic-corpus-v1" },
      decidedAtUtc: request.issuedAtUtc,
    };
  }
}
