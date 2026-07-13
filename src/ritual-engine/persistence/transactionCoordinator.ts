import { RitualRuntimeRootSchema, type RitualRuntimeRoot } from "../domain/runtime";
import { ritualGateReducer } from "../runtime/reducer";
import { replaceGateRun } from "../runtime/rootReducer";
import { transformRuntimeForPersistence } from "./privacyTransform";
import type { RitualTransactionalPersistenceAdapter } from "./transactionalAdapter";
import type {
  TransactionCommitRequest,
  TransactionCommitResult,
  TransactionPromotionMarker,
} from "./transactionTypes";

function assertRuntime(value: RitualRuntimeRoot | null, label: string): RitualRuntimeRoot {
  const parsed = RitualRuntimeRootSchema.safeParse(value);
  if (!parsed.success) throw new Error(`${label} runtime validation failed`);
  return parsed.data;
}

function signature(runtime: RitualRuntimeRoot, gateRunId: string) {
  const run = runtime.gateRuns[gateRunId];
  if (!run) throw new Error("Transaction gate run is missing");
  return {
    participantId: runtime.participantId,
    gateRunId,
    stateRevision: run.stateRevision,
    manifestInstanceId: run.activeManifest?.manifestInstanceId,
    manifestDigest: run.activeManifest?.manifestDigest,
  };
}

function assertSameSignature(
  actual: RitualRuntimeRoot,
  expected: RitualRuntimeRoot,
  gateRunId: string,
): void {
  if (
    JSON.stringify(signature(actual, gateRunId)) !== JSON.stringify(signature(expected, gateRunId))
  ) {
    throw new Error("Transaction readback signature mismatch");
  }
}

export class RitualTransactionCoordinator {
  constructor(private readonly adapter: RitualTransactionalPersistenceAdapter) {}

  private async promoteVerified(
    runtime: RitualRuntimeRoot,
    gateRunId: string,
    completedAtUtc: string,
  ): Promise<RitualRuntimeRoot> {
    await this.adapter.writePending(runtime);
    const pending = assertRuntime(await this.adapter.loadPending(), "Pending");
    assertSameSignature(pending, runtime, gateRunId);
    await this.adapter.promotePendingToActive();
    const active = assertRuntime(await this.adapter.loadActive(), "Active");
    assertSameSignature(active, runtime, gateRunId);
    const marker: TransactionPromotionMarker = { ...signature(active, gateRunId), completedAtUtc };
    await this.adapter.writePromotionMarker(marker);
    return active;
  }

  async commit(request: TransactionCommitRequest): Promise<TransactionCommitResult> {
    const active = assertRuntime(await this.adapter.loadActive(), "Active");
    const activeRun = active.gateRuns[request.gateRunId];
    if (!activeRun || activeRun.stateRevision !== request.expectedStateRevision) {
      throw new Error("Transaction state revision is stale");
    }
    const nextRun = request.nextRuntime.gateRuns[request.gateRunId];
    if (!nextRun || nextRun.stateRevision <= request.expectedStateRevision) {
      throw new Error("Transaction must commit a higher state revision");
    }

    const privateRuntime = transformRuntimeForPersistence(request.nextRuntime, request.privacyMode);
    let persisted = await this.promoteVerified(
      assertRuntime(privateRuntime, "Transformed"),
      request.gateRunId,
      request.confirmedAtUtc,
    );
    let stableSceneConfirmed = false;

    if (request.confirmStableScene) {
      const persistedRun = persisted.gateRuns[request.gateRunId]!;
      if (
        persistedRun.currentRuntimeSceneId &&
        persistedRun.currentRuntimeSceneId !== persistedRun.lastStableRuntimeSceneId
      ) {
        let confirmedRun = ritualGateReducer(persistedRun, {
          type: "CONFIRM_STABLE_SCENE",
          runtimeSceneId: persistedRun.currentRuntimeSceneId,
          updatedAtUtc: request.confirmedAtUtc,
        });
        confirmedRun = ritualGateReducer(confirmedRun, {
          type: "COMMIT_REVISION",
          revision: persistedRun.stateRevision + 1,
          updatedAtUtc: request.confirmedAtUtc,
        });
        const confirmedRoot = transformRuntimeForPersistence(
          replaceGateRun(persisted, confirmedRun, request.confirmedAtUtc),
          request.privacyMode,
        );
        persisted = await this.promoteVerified(
          assertRuntime(confirmedRoot, "Stable confirmation"),
          request.gateRunId,
          request.confirmedAtUtc,
        );
        stableSceneConfirmed = true;
      }
    }

    await this.adapter.clearPending();
    return { runtime: persisted, stableSceneConfirmed };
  }
}
