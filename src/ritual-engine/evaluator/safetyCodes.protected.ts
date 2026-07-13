import { z } from "zod";

export const EvaluationSafetyCodeSchema = z.enum([
  "participant_declared_not_safe",
  "participant_declared_unsure",
  "immediate_self_harm_risk",
  "immediate_harm_to_others_risk",
  "immediate_abuse_or_coercion_risk",
  "medical_emergency_language",
  "severe_disorientation_or_reality_confusion",
  "dangerous_confrontation",
  "illegal_high_risk_action",
  "financially_irreversible_action",
  "external_entity_command_displacing_agency",
  "unknown_high_risk_condition",
]);

export type EvaluationSafetyCode = z.infer<typeof EvaluationSafetyCodeSchema>;
