import type { z } from "zod";
import { CanonicalManifestSchema } from "./schema";

export type CanonicalManifest = z.infer<typeof CanonicalManifestSchema>;

export function defineCanonicalManifest<T extends CanonicalManifest>(manifest: T): T {
  CanonicalManifestSchema.parse(manifest);
  return manifest;
}
