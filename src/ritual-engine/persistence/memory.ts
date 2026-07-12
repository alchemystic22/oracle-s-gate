import type { RitualRuntimeRoot } from "../domain/runtime";
import type { RitualPersistenceAdapter } from "./adapter";

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class MemoryRitualPersistenceAdapter implements RitualPersistenceAdapter {
  private value: RitualRuntimeRoot | null = null;

  async load(): Promise<RitualRuntimeRoot | null> {
    return this.value ? clone(this.value) : null;
  }

  async save(runtime: RitualRuntimeRoot): Promise<void> {
    this.value = clone(runtime);
  }

  async clear(): Promise<void> {
    this.value = null;
  }
}
