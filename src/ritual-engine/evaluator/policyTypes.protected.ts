import { z } from "zod";
import type { CanonicalQuestionId, CanonicalRouteId, CanonicalSceneId } from "../domain/ids";
import { ParticipantGuidanceTemplateIdSchema } from "./participantGuidance";
import { EvaluationReasonCodeSchema } from "./reasonCodes.protected";

export const EvaluationTargetKindSchema = z.enum([
  "reflection",
  "stance_selection",
  "gate_act",
  "evidence",
  "readiness",
]);

export type EvaluationTargetKind = z.infer<typeof EvaluationTargetKindSchema>;

export const Gate1EvaluationPolicySchema = z
  .object({
    policyId: z.string().min(1),
    version: z.literal(1),
    canonicalSceneId: z.custom<CanonicalSceneId>((value) => typeof value === "string"),
    canonicalQuestionId: z
      .custom<CanonicalQuestionId>((value) => typeof value === "string")
      .optional(),
    routeId: z.custom<CanonicalRouteId>((value) => typeof value === "string").optional(),
    targetKind: EvaluationTargetKindSchema,
    exactPrompt: z.string().min(1).optional(),
    requiredFacets: z.array(z.string().min(1)).min(1),
    insufficientSubstitutes: z.array(z.string().min(1)),
    allowedReasonCodes: z.array(EvaluationReasonCodeSchema).min(1),
    allowedGuidanceTemplates: z.array(ParticipantGuidanceTemplateIdSchema),
    maxFollowups: z.literal(1),
    minConfidence: z.enum(["medium", "high"]),
    semanticProviderRequired: z.boolean(),
    safetyProfile: z.enum(["reflection", "gate_act", "evidence", "readiness"]),
  })
  .strict();

export type Gate1EvaluationPolicy = z.infer<typeof Gate1EvaluationPolicySchema>;
