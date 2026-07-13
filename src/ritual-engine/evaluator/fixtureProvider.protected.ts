import type { ProtectedEvaluationDecision } from "./decisionSchema.protected";
import type { Gate1EvaluationPolicy } from "./policyTypes.protected";
import type { ProtectedEvaluationProvider } from "./provider.protected";
import type { ProtectedEvaluationRequest } from "./requestSchema.protected";

export type FixtureDecisionFactory = (
  request: ProtectedEvaluationRequest,
  policy: Gate1EvaluationPolicy,
) => ProtectedEvaluationDecision;

export type FixtureEvaluationRegistry = Readonly<Record<string, FixtureDecisionFactory>>;

export function createFixtureDecision(input: {
  request: ProtectedEvaluationRequest;
  policy: Gate1EvaluationPolicy;
  providerId?: string;
  providerVersion?: string;
  fixtureId?: string;
  outcome: ProtectedEvaluationDecision["outcome"];
  confidence?: ProtectedEvaluationDecision["confidence"];
  supportedFacets?: ProtectedEvaluationDecision["supportedFacets"];
  reasonCodes: ProtectedEvaluationDecision["reasonCodes"];
  guidanceTemplateId?: ProtectedEvaluationDecision["guidanceTemplateId"];
  safety?: ProtectedEvaluationDecision["safety"];
  decidedAtUtc?: string;
}): ProtectedEvaluationDecision {
  return {
    schemaVersion: 1,
    evaluationRequestId: input.request.evaluationRequestId,
    evaluationDecisionId: `${input.request.evaluationRequestId}.${input.fixtureId ?? "fixture"}`,
    sourceParticipantCommandId: input.request.sourceParticipantCommandId,
    inputDigest: input.request.inputDigest,
    policyId: input.policy.policyId,
    policyVersion: input.policy.version,
    providerId: input.providerId ?? "gate1-fixture-provider",
    providerVersion: input.providerVersion ?? "1",
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
    safety: input.safety ?? { state: "clear", codes: [], emergency: false },
    provider: {
      kind: "fixture",
      providerId: input.providerId ?? "gate1-fixture-provider",
      fixtureId: input.fixtureId,
    },
    decidedAtUtc: input.decidedAtUtc ?? input.request.issuedAtUtc,
  };
}

export class FixtureEvaluationProvider implements ProtectedEvaluationProvider {
  readonly providerId = "gate1-fixture-provider";
  readonly providerVersion = "1";

  constructor(private readonly registry: FixtureEvaluationRegistry = {}) {}

  async evaluate(
    request: ProtectedEvaluationRequest,
    policy: Gate1EvaluationPolicy,
  ): Promise<ProtectedEvaluationDecision> {
    const fixture =
      this.registry[request.evaluationRequestId] ??
      this.registry[request.sourceParticipantCommandId] ??
      this.registry[request.inputDigest];
    if (!fixture) {
      throw new Error("No deterministic fixture decision is registered for this request");
    }
    return fixture(request, policy);
  }
}
