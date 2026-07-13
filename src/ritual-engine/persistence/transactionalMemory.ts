import type { RitualRuntimeRoot } from "../domain/runtime";
import type { RitualTransactionalPersistenceAdapter } from "./transactionalAdapter";
import type { TransactionPromotionMarker } from "./transactionTypes";

type MemoryFailurePoint =
  | "load_active"
  | "load_pending"
  | "write_pending"
  | "promote"
  | "restore_previous";

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class MemoryRitualTransactionalPersistenceAdapter implements RitualTransactionalPersistenceAdapter {
  private active: RitualRuntimeRoot | null;
  private pending: RitualRuntimeRoot | null = null;
  private previous: RitualRuntimeRoot | null = null;
  private marker: TransactionPromotionMarker | null = null;
  private failurePoint: MemoryFailurePoint | null = null;
  private readonly operationLog: string[] = [];

  constructor(active: RitualRuntimeRoot | null = null) {
    this.active = active ? clone(active) : null;
  }

  failNextAt(point: MemoryFailurePoint): void {
    this.failurePoint = point;
  }

  getOperations(): readonly string[] {
    return [...this.operationLog];
  }

  seedPending(runtime: RitualRuntimeRoot, marker: TransactionPromotionMarker | null = null): void {
    this.pending = clone(runtime);
    this.marker = marker ? clone(marker) : null;
  }

  seedPrevious(runtime: RitualRuntimeRoot): void {
    this.previous = clone(runtime);
  }

  seedCorruptActive(value: unknown): void {
    this.active = clone(value) as RitualRuntimeRoot;
  }

  private failIf(point: MemoryFailurePoint): void {
    if (this.failurePoint !== point) return;
    this.failurePoint = null;
    throw new Error(`Injected transaction failure: ${point}`);
  }

  async loadActive(): Promise<RitualRuntimeRoot | null> {
    this.operationLog.push("load_active");
    this.failIf("load_active");
    return this.active ? clone(this.active) : null;
  }

  async loadPending(): Promise<RitualRuntimeRoot | null> {
    this.operationLog.push("load_pending");
    this.failIf("load_pending");
    return this.pending ? clone(this.pending) : null;
  }

  async loadPrevious(): Promise<RitualRuntimeRoot | null> {
    this.operationLog.push("load_previous");
    return this.previous ? clone(this.previous) : null;
  }

  async loadPromotionMarker(): Promise<TransactionPromotionMarker | null> {
    this.operationLog.push("load_marker");
    return this.marker ? clone(this.marker) : null;
  }

  async writePending(runtime: RitualRuntimeRoot): Promise<void> {
    this.operationLog.push("write_pending");
    this.failIf("write_pending");
    this.pending = clone(runtime);
    this.marker = null;
  }

  async writePromotionMarker(marker: TransactionPromotionMarker): Promise<void> {
    this.operationLog.push("write_marker");
    this.marker = clone(marker);
  }

  async promotePendingToActive(): Promise<void> {
    this.operationLog.push("promote");
    this.failIf("promote");
    if (!this.pending) throw new Error("No pending runtime to promote");
    this.previous = this.active ? clone(this.active) : null;
    this.active = clone(this.pending);
  }

  async restorePreviousToActive(): Promise<void> {
    this.operationLog.push("restore_previous");
    this.failIf("restore_previous");
    if (!this.previous) throw new Error("No previous runtime to restore");
    this.active = clone(this.previous);
  }

  async restoreActiveForCompensation(runtime: RitualRuntimeRoot): Promise<void> {
    this.operationLog.push("compensate_active");
    this.active = clone(runtime);
    this.pending = null;
    this.marker = null;
  }

  async clearPending(): Promise<void> {
    this.operationLog.push("clear_pending");
    this.pending = null;
    this.marker = null;
  }
}
