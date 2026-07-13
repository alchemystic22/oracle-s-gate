import type { ProtectedEvaluationDecision } from "./decisionSchema.protected";
import type { Gate1EvaluationPolicy } from "./policyTypes.protected";
import type { ProtectedEvaluationRequest } from "./requestSchema.protected";

export interface ProtectedEvaluationProvider {
  readonly providerId: string;
  readonly providerVersion: string;
  evaluate(
    request: ProtectedEvaluationRequest,
    policy: Gate1EvaluationPolicy,
  ): Promise<ProtectedEvaluationDecision>;
}
