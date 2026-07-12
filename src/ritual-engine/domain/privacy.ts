import { z } from "zod";

export const ParticipantPrivacyModeSchema = z.enum([
  "full_private_continuity",
  "structured_journey_only",
  "completion_and_actions_only",
  "session_only_reflections",
]);

export type ParticipantPrivacyMode = z.infer<typeof ParticipantPrivacyModeSchema>;

export const ResearchPermissionSchema = z.object({
  allowed: z.boolean(),
  grantedAtUtc: z.string().datetime({ offset: true }).optional(),
});
export type ResearchPermission = z.infer<typeof ResearchPermissionSchema>;
