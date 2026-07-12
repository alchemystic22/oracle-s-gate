import { z } from "zod";

export const RitualSafetyRuntimeSchema = z.object({
  state: z.enum(["clear", "rescale_required", "blocked"]),
  reasonCodes: z.array(z.string()),
  updatedAtUtc: z.string().datetime({ offset: true }),
});
export type RitualSafetyRuntime = z.infer<typeof RitualSafetyRuntimeSchema>;
