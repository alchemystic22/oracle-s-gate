import { z } from "zod";
import { ParticipantCommandResultSchema } from "../commands/result";
import { ParticipantGuidanceTemplateIdSchema } from "./participantGuidance";

export const AdaptiveEvaluationApplicationResultSchema = z
  .object({
    schemaVersion: z.literal(1),
    evaluationRequestId: z.string().min(1),
    evaluationDecisionId: z.string().min(1).optional(),
    sourceParticipantCommandId: z.string().min(1),
    status: z.enum(["applied", "duplicate", "stale", "rejected", "provider_failed"]),
    conductorResult: ParticipantCommandResultSchema.optional(),
    guidance: z
      .object({
        kind: z.enum(["follow_up", "not_yet_formed", "rescale", "safety_pause"]),
        templateId: ParticipantGuidanceTemplateIdSchema,
        prompt: z.string().min(1),
      })
      .strict()
      .optional(),
  })
  .strict();

export type AdaptiveEvaluationApplicationResult = z.infer<
  typeof AdaptiveEvaluationApplicationResultSchema
>;
