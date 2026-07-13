import type { ProtectedParticipantManifestMapping } from "../compiler/index.protected";

export type ProtectedMappingProviderRecord = {
  mapping: ProtectedParticipantManifestMapping;
  retiredAtUtc?: string;
};

export interface ProtectedMappingProvider {
  getByManifestInstanceId(id: string): ProtectedMappingProviderRecord | null;
  put(mapping: ProtectedParticipantManifestMapping): void;
  retire(id: string, retiredAtUtc: string): void;
}
