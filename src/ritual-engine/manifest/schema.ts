import { z } from "zod";

export const CanonicalManifestSchema = z.object({
  manifestId: z.string().min(1),
  version: z.string().min(1),
  gateId: z.number().int().min(1).max(6),
  sceneCount: z.number().int().positive(),
  scenes: z.array(
    z.object({
      canonicalSceneId: z.string().min(1),
      type: z.string().min(1),
      participant: z.record(z.string(), z.unknown()),
      protected: z.record(z.string(), z.unknown()).optional(),
    }),
  ),
});
