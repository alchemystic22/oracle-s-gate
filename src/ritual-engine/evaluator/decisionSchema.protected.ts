import { z } from "zod";
import { ParticipantGuidanceTemplateIdSchema } from "./participantGuidance";
import { EvaluationReasonCodeSchema } from "./reasonCodes.protected";
import { EvaluationSafetyCodeSchema } from "./safetyCodes.protected";

export const ProtectedEvaluationOutcomeSchema = z.enum([
  "satisfied",
  "needs_follow_up",
  "not_yet_formed",
  "rescale_required",
  "blocked",
]);

export const ProtectedEvaluationDecisionSchema = z
  .object({
    schemaVersion: z.literal(1),
    evaluationRequestId: z.string().min(1),
    evaluationDecisionId: z.string().min(1),
    outcome: ProtectedEvaluationOutcomeSchema,
    responseState: z.enum(["grounded", "provisional", "not_yet_formed"]).optional(),
    confidence: z.enum(["low", "medium", "high"]),
    reasonCodes: z.array(EvaluationReasonCodeSchema),
    guidanceTemplateId: ParticipantGuidanceTemplateIdSchema.optional(),
    safety: z
      .object({
        state: z.enum(["clear", "rescale_required", "blocked"]),
        codes: z.array(EvaluationSafetyCodeSchema),
        emergency: z.boolean(),
      })
      .strict(),
    provider: z
      .object({
        kind: z.literal("fixture"),
        providerId: z.string().min(1),
        fixtureId: z.string().min(1).optional(),
      })
      .strict(),
    decidedAtUtc: z.string().datetime({ offset: true }),
  })
  .strict();

export type ProtectedEvaluationOutcome = z.infer<typeof ProtectedEvaluationOutcomeSchema>;
export type ProtectedEvaluationDecision = z.infer<typeof ProtectedEvaluationDecisionSchema>;
