export {
  AdaptiveEvaluationApplicationResultSchema,
  AdaptiveThreadStateSchema,
  MemoryAdaptiveThreadStore,
  ParticipantAdaptiveThreadSchema,
  PARTICIPANT_GUIDANCE_COPY,
  ParticipantGuidanceTemplateIdSchema,
  renderParticipantGuidance,
} from "./index";
export type {
  AdaptiveEvaluationApplicationResult,
  AdaptiveThreadState,
  AdaptiveThreadStore,
  ParticipantAdaptiveThread,
  ParticipantGuidanceTemplateId,
} from "./index";

export {
  ProtectedEvaluationDecisionSchema,
  ProtectedEvaluationOutcomeSchema,
} from "./decisionSchema.protected";
export type {
  ProtectedEvaluationDecision,
  ProtectedEvaluationOutcome,
} from "./decisionSchema.protected";

export { FixtureEvaluationProvider } from "./fixtureProvider.protected";
export { PROTECTED_GUIDANCE_REGISTRY, protectedRenderGuidance } from "./guidanceRegistry.protected";
export {
  ProtectedEvaluationLedgerEntrySchema,
  MemoryProtectedEvaluationLedger,
} from "./ledger.protected";
export type { ProtectedEvaluationLedger, ProtectedEvaluationLedgerEntry } from "./ledger.protected";
export { Gate1AdaptiveEvaluationOrchestrator } from "./orchestrator.protected";
export {
  GATE1_EVALUATION_POLICIES,
  GATE1_EVALUATION_POLICY_BY_SCENE,
  getGate1EvaluationPolicy,
} from "./policies.gate1.protected";
export { Gate1EvaluationPolicySchema, EvaluationTargetKindSchema } from "./policyTypes.protected";
export type { EvaluationTargetKind, Gate1EvaluationPolicy } from "./policyTypes.protected";
export {
  ProtectedEvaluationRequestSchema,
  ProtectedEvaluationTargetSchema,
} from "./requestSchema.protected";
export type {
  ProtectedEvaluationRequest,
  ProtectedEvaluationTarget,
} from "./requestSchema.protected";
export { ALL_EVALUATION_REASON_CODES, EvaluationReasonCodeSchema } from "./reasonCodes.protected";
export type { EvaluationReasonCode } from "./reasonCodes.protected";
export { EvaluationSafetyCodeSchema } from "./safetyCodes.protected";
export type { EvaluationSafetyCode } from "./safetyCodes.protected";
export { normalizeProtectedEvaluationDecision } from "./decisionNormalizer.protected";
export { isExactNotYetFormed, runStructuralPreflight } from "./structuralPreflight.protected";
export type { ProtectedEvaluationProvider } from "./provider.protected";
