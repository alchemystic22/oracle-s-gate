import type { ProtectedParticipantManifestMapping } from "../compiler/index.protected";
import type {
  ProtectedMappingProvider,
  ProtectedMappingChange,
  ProtectedMappingProviderRecord,
  ProtectedMappingTransaction,
} from "./mappingProvider.protected";
import {
  ProtectedCommandLedger,
  type ProtectedCommandReplayState,
} from "./protectedCommandLedger.protected";

export type MemoryProtectedMappingFailurePoint = "put" | "retire" | "rollback";

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class MemoryProtectedMappingProvider implements ProtectedMappingProvider {
  private readonly records = new Map<string, ProtectedMappingProviderRecord>();
  private readonly commandLedger = new ProtectedCommandLedger();
  private failurePoint?: MemoryProtectedMappingFailurePoint;

  failNextAt(point: MemoryProtectedMappingFailurePoint): void {
    this.failurePoint = point;
  }

  checkProtectedCommand(commandId: string, digest: string): ProtectedCommandReplayState {
    return this.commandLedger.check(commandId, digest);
  }

  recordProtectedCommand(commandId: string, digest: string): void {
    this.commandLedger.record(commandId, digest);
  }

  private failIf(point: MemoryProtectedMappingFailurePoint): void {
    if (this.failurePoint !== point) return;
    this.failurePoint = undefined;
    throw new Error(`Injected protected mapping failure: ${point}`);
  }

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

  prepare(change: ProtectedMappingChange): ProtectedMappingTransaction {
    this.failIf("put");
    const existingPut = this.records.get(change.put.manifestInstanceId);
    if (existingPut && existingPut.mapping.manifestDigest !== change.put.manifestDigest) {
      throw new Error("Protected mapping overwrite conflict");
    }
    const existingRetire = change.retire
      ? this.records.get(change.retire.manifestInstanceId)
      : undefined;
    if (change.retire && !existingRetire) {
      throw new Error("Protected mapping retirement target is missing");
    }

    const snapshot = new Map(
      [...this.records.entries()].map(([id, record]) => [id, clone(record)]),
    );
    let committed = false;
    let rolledBack = false;
    return {
      commit: () => {
        if (committed || rolledBack) {
          throw new Error("Protected mapping transaction is settled");
        }
        if (change.retire) this.failIf("retire");
        const next = new Map(
          [...this.records.entries()].map(([id, record]) => [id, clone(record)]),
        );
        if (!existingPut) {
          next.set(change.put.manifestInstanceId, { mapping: clone(change.put) });
        }
        if (change.retire) {
          const retiring = next.get(change.retire.manifestInstanceId)!;
          next.set(change.retire.manifestInstanceId, {
            mapping: retiring.mapping,
            retiredAtUtc: change.retire.retiredAtUtc,
          });
        }
        this.records.clear();
        for (const [id, record] of next) this.records.set(id, record);
        committed = true;
      },
      rollback: () => {
        if (rolledBack) return;
        this.failIf("rollback");
        if (committed) {
          this.records.clear();
          for (const [id, record] of snapshot) this.records.set(id, clone(record));
        }
        rolledBack = true;
      },
    };
  }
}
