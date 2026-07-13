import { z } from "zod";

const EvidenceEventBaseShape = {
  evidenceEventId: z.string().min(1),
  gateActId: z.string().min(1),
  runtimeSceneId: z.string().min(1).optional(),
  runtimeInteractionId: z.string().min(1).optional(),
  mode: z.enum(["completion_marker", "self_attested_description", "safe_witness"]),
  description: z.string().optional(),
  routeBindingRevision: z.number().int().nonnegative().optional(),
  sourceCommandId: z.string().min(1).optional(),
  stale: z.boolean().optional(),
  occurredAtUtc: z.string().datetime({ offset: true }),
};

export const EvidenceEventSchema = z.discriminatedUnion("eventType", [
  z
    .object({
      ...EvidenceEventBaseShape,
      eventType: z.literal("micro_act_completed"),
      participantAttestation: z.literal("occurred_outside_reflection"),
    })
    .strict(),
  z
    .object({
      ...EvidenceEventBaseShape,
      eventType: z.literal("continuation_scheduled"),
      participantAttestation: z.literal("scheduled_only"),
    })
    .strict(),
]);
export type EvidenceEvent = z.infer<typeof EvidenceEventSchema>;
