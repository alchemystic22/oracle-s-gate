import { z } from "zod";

export const GateActRevisionSchema = z.object({
  revision: z.number().int().nonnegative(),
  act: z.string(),
  context: z.string().optional(),
  immediateMicroAct: z.string(),
  continuationAction: z.string().optional(),
  participantSafetySelfReport: z.enum(["safe", "unsure", "not_safe"]),
  createdAtUtc: z.string().datetime({ offset: true }),
});

export const GateActRecordSchema = z.object({
  gateActId: z.string().min(1),
  status: z.enum([
    "draft",
    "formed",
    "accepted",
    "abandoned_without_judgment",
    "completed_but_superseded",
  ]),
  activeRevision: z.number().int().nonnegative(),
  revisions: z.array(GateActRevisionSchema),
  createdAtUtc: z.string().datetime({ offset: true }),
  updatedAtUtc: z.string().datetime({ offset: true }),
});
export type GateActRecord = z.infer<typeof GateActRecordSchema>;
