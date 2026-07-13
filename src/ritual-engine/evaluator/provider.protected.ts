import type { ProtectedEvaluationDecision } from "./decisionSchema.protected";
import type { ProtectedEvaluationRequest } from "./requestSchema.protected";

export interface ProtectedEvaluationProvider {
  readonly providerId: string;
  evaluate(request: ProtectedEvaluationRequest): Promise<ProtectedEvaluationDecision>;
}
