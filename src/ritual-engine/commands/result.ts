import { z } from "zod";

export const ParticipantCommandStatusSchema = z.enum([
  "advanced",
  "accepted",
  "awaiting_protected_resolution",
  "awaiting_route_binding",
  "awaiting_route_reassessment",
  "paused",
  "resumed",
  "blocked",
  "duplicate",
  "rejected_stale",
  "rejected_unauthorized",
  "rejected_invalid",
]);

export const ParticipantCommandResultSchema = z
  .object({
    commandId: z.string().min(1),
    status: ParticipantCommandStatusSchema,
    stateRevision: z.number().int().nonnegative(),
    currentRuntimeSceneId: z.string().optional(),
    lastStableRuntimeSceneId: z.string().optional(),
    activeManifestInstanceId: z.string().optional(),
    activeManifestStage: z.enum(["pre_route", "active_route", "completion"]).optional(),
    participantMessageCode: z.string().min(1),
  })
  .strict();

export type ParticipantCommandStatus = z.infer<typeof ParticipantCommandStatusSchema>;
export type ParticipantCommandResult = z.infer<typeof ParticipantCommandResultSchema>;
