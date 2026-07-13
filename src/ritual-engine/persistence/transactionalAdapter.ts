import type { RitualRuntimeRoot } from "../domain/runtime";
import type { TransactionPromotionMarker } from "./transactionTypes";

export interface RitualTransactionalPersistenceAdapter {
  loadActive(): Promise<RitualRuntimeRoot | null>;
  loadPending(): Promise<RitualRuntimeRoot | null>;
  loadPrevious(): Promise<RitualRuntimeRoot | null>;
  loadPromotionMarker(): Promise<TransactionPromotionMarker | null>;
  writePending(runtime: RitualRuntimeRoot): Promise<void>;
  writePromotionMarker(marker: TransactionPromotionMarker): Promise<void>;
  promotePendingToActive(): Promise<void>;
  restorePreviousToActive(): Promise<void>;
  restoreActiveForCompensation(runtime: RitualRuntimeRoot): Promise<void>;
  clearPending(): Promise<void>;
}
