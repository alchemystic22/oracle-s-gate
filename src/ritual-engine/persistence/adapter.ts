import type { RitualRuntimeRoot } from "../domain/runtime";

export interface RitualPersistenceAdapter {
  load(): Promise<RitualRuntimeRoot | null>;
  save(runtime: RitualRuntimeRoot): Promise<void>;
  clear(): Promise<void>;
}
