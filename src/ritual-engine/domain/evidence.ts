import { z } from "zod";

export const EvidenceEventSchema = z.object({
  evidenceEventId: z.string().min(1),
  gateActId: z.string().min(1),
  eventType: z.enum(["micro_act_completed", "continuation_scheduled"]),
  mode: z.enum(["completion_marker", "self_attested_description", "safe_witness"]),
  description: z.string().optional(),
  routeBindingRevision: z.number().int().nonnegative().optional(),
  participantAttestation: z.enum(["occurred_outside_reflection", "scheduled_only"]),
  occurredAtUtc: z.string().datetime({ offset: true }),
});
export type EvidenceEvent = z.infer<typeof EvidenceEventSchema>;
