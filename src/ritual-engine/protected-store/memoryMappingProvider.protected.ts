import type { ProtectedParticipantManifestMapping } from "../compiler/index.protected";
import type {
  ProtectedMappingProvider,
  ProtectedMappingProviderRecord,
} from "./mappingProvider.protected";

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class MemoryProtectedMappingProvider implements ProtectedMappingProvider {
  private readonly records = new Map<string, ProtectedMappingProviderRecord>();

  getByManifestInstanceId(id: string): ProtectedMappingProviderRecord | null {
    const record = this.records.get(id);
    return record ? clone(record) : null;
  }

  put(mapping: ProtectedParticipantManifestMapping): void {
    const existing = this.records.get(mapping.manifestInstanceId);
    if (existing && existing.mapping.manifestDigest !== mapping.manifestDigest) {
      throw new Error("Protected mapping overwrite conflict");
    }
    if (!existing) this.records.set(mapping.manifestInstanceId, { mapping: clone(mapping) });
  }

  retire(id: string, retiredAtUtc: string): void {
    const existing = this.records.get(id);
    if (!existing) throw new Error("Protected mapping is missing");
    if (existing.retiredAtUtc && existing.retiredAtUtc !== retiredAtUtc) {
      throw new Error("Protected mapping retirement conflict");
    }
    this.records.set(id, { mapping: existing.mapping, retiredAtUtc });
  }
}
