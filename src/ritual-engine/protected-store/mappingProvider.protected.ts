import type { ProtectedParticipantManifestMapping } from "../compiler/index.protected";
import type { ProtectedCommandReplayState } from "./protectedCommandLedger.protected";

export type ProtectedMappingProviderRecord = {
  mapping: ProtectedParticipantManifestMapping;
  retiredAtUtc?: string;
};

export type ProtectedMappingChange = {
  put: ProtectedParticipantManifestMapping;
  retire?: { manifestInstanceId: string; retiredAtUtc: string };
};

export interface ProtectedMappingTransaction {
  commit(): void;
  rollback(): void;
}

export interface ProtectedMappingProvider {
  getByManifestInstanceId(id: string): ProtectedMappingProviderRecord | null;
  put(mapping: ProtectedParticipantManifestMapping): void;
  retire(id: string, retiredAtUtc: string): void;
  prepare(change: ProtectedMappingChange): ProtectedMappingTransaction;
  checkProtectedCommand(commandId: string, digest: string): ProtectedCommandReplayState;
  recordProtectedCommand(commandId: string, digest: string): void;
}
