import { RitualRuntimeRootSchema, type RitualRuntimeRoot } from "../domain/runtime";
import type { RitualTransactionalPersistenceAdapter } from "./transactionalAdapter";
import type { TransactionPromotionMarker } from "./transactionTypes";

export type RuntimeRecoveryResult = {
  source: "active" | "previous" | "verified_pending" | "none";
  runtime: RitualRuntimeRoot | null;
};

function valid(value: RitualRuntimeRoot | null): RitualRuntimeRoot | null {
  const parsed = RitualRuntimeRootSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function pendingMatchesMarker(
  pending: RitualRuntimeRoot,
  marker: TransactionPromotionMarker | null,
): boolean {
  if (!marker || pending.participantId !== marker.participantId) return false;
  const run = pending.gateRuns[marker.gateRunId];
  return Boolean(
    run &&
    run.stateRevision === marker.stateRevision &&
    run.activeManifest?.manifestInstanceId === marker.manifestInstanceId &&
    run.activeManifest?.manifestDigest === marker.manifestDigest,
  );
}

export async function recoverTransactionalRuntime(
  adapter: RitualTransactionalPersistenceAdapter,
): Promise<RuntimeRecoveryResult> {
  const active = valid(await adapter.loadActive().catch(() => null));
  if (active) return { source: "active", runtime: active };

  const previous = valid(await adapter.loadPrevious());
  if (previous) {
    await adapter.restorePreviousToActive();
    return { source: "previous", runtime: previous };
  }

  const pending = valid(await adapter.loadPending().catch(() => null));
  const marker = await adapter.loadPromotionMarker();
  if (pending && pendingMatchesMarker(pending, marker)) {
    await adapter.promotePendingToActive();
    return { source: "verified_pending", runtime: pending };
  }
  return { source: "none", runtime: null };
}
