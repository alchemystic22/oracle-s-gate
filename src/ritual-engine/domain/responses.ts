import { z } from "zod";

export const ResponseStorageClassSchema = z.enum([
  "persistent_private",
  "structured_only",
  "session_only",
]);

export const RitualResponseRecordSchema = z.object({
  responseId: z.string().min(1),
  runtimeSceneId: z.string().min(1),
  runtimeInteractionId: z.string().min(1).optional(),
  runtimeQuestionId: z.string().min(1),
  sourceCommandId: z.string().min(1).optional(),
  routeBindingRevision: z.number().int().nonnegative().optional(),
  stale: z.boolean().optional(),
  text: z.string().optional(),
  structuredSummary: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
  state: z.enum(["draft", "grounded", "provisional", "not_yet_formed"]),
  storageClass: ResponseStorageClassSchema,
  createdAtUtc: z.string().datetime({ offset: true }),
  updatedAtUtc: z.string().datetime({ offset: true }),
});
export type RitualResponseRecord = z.infer<typeof RitualResponseRecordSchema>;
