import { z } from "zod";
import type { ProtectedParticipantCompilation } from "../compiler/index.protected";
import { ParticipantAdaptiveThreadSchema } from "../evaluator/adaptiveThreads";

const ActivateCompilationSchema = z
  .object({
    kind: z.literal("activate_compilation"),
    activationReason: z.enum(["start_pre_route", "route_bound", "enter_completion"]),
    compilation: z.custom<ProtectedParticipantCompilation>((value) =>
      Boolean(value && typeof value === "object"),
    ),
  })
  .strict();

const ApplySceneResolutionSchema = z
  .object({
    kind: z.literal("apply_scene_resolution"),
    sourceCommandId: z.string().min(1),
    manifestInstanceId: z.string().min(1),
    manifestDigest: z.string().min(1),
    runtimeSceneId: z.string().min(1),
    runtimeInteractionId: z.string().min(1).optional(),
    runtimeQuestionId: z.string().min(1).optional(),
    runtimeTransitionId: z.string().min(1).optional(),
    outcome: z.enum([
      "satisfied",
      "needs_follow_up",
      "not_yet_formed",
      "rescale_required",
      "blocked",
    ]),
    adaptiveThread: ParticipantAdaptiveThreadSchema.optional(),
  })
  .strict();

const ApplyRouteReassessmentSchema = z
  .object({
    kind: z.literal("apply_route_reassessment"),
    sourceCommandId: z.string().min(1),
    reassessmentCompilation: z.custom<ProtectedParticipantCompilation>((value) =>
      Boolean(value && typeof value === "object"),
    ),
  })
  .strict();

const ApplySafetyDirectiveSchema = z
  .object({
    kind: z.literal("apply_safety_directive"),
    state: z.enum(["clear", "rescale_required", "blocked"]),
    protectedReasonCodes: z.array(z.string().min(1)),
  })
  .strict();

const RecoverRuntimeSchema = z.object({ kind: z.literal("recover_runtime") }).strict();

export const ProtectedCommandSchema = z.discriminatedUnion("kind", [
  ActivateCompilationSchema,
  ApplySceneResolutionSchema,
  ApplyRouteReassessmentSchema,
  ApplySafetyDirectiveSchema,
  RecoverRuntimeSchema,
]);

export const ProtectedCommandEnvelopeSchema = z
  .object({
    schemaVersion: z.literal(1),
    protectedCommandId: z.string().min(1),
    expectedStateRevision: z.number().int().nonnegative(),
    issuedAtUtc: z.string().datetime({ offset: true }),
    command: ProtectedCommandSchema,
  })
  .strict();

export type ProtectedCommand = z.infer<typeof ProtectedCommandSchema>;
export type ProtectedCommandEnvelope = z.infer<typeof ProtectedCommandEnvelopeSchema>;
