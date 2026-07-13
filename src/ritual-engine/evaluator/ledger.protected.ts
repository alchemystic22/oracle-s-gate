import { z } from "zod";
import type { CanonicalRouteId, CanonicalSceneId } from "../domain/ids";
import { EvaluationReasonCodeSchema } from "./reasonCodes.protected";
import { EvaluationSafetyCodeSchema } from "./safetyCodes.protected";

export const ProtectedEvaluationLedgerEntrySchema = z
  .object({
    schemaVersion: z.literal(1),
    evaluationRequestId: z.string().min(1),
    evaluationDecisionId: z.string().min(1).optional(),
    sourceParticipantCommandId: z.string().min(1),
    manifestInstanceId: z.string().min(1),
    manifestDigest: z.string().min(1),
    manifestStage: z.enum(["pre_route", "active_route", "completion"]),
    stateRevisionEvaluated: z.number().int().nonnegative(),
    runtimeSceneId: z.string().min(1),
    runtimeInteractionId: z.string().min(1).optional(),
    runtimeQuestionId: z.string().min(1).optional(),
    canonicalSceneId: z.custom<CanonicalSceneId>((value) => typeof value === "string"),
    protectedRouteId: z.custom<CanonicalRouteId>((value) => typeof value === "string").optional(),
    routeBindingRevision: z.number().int().nonnegative().optional(),
    policyId: z.string().min(1),
    policyVersion: z.literal(1),
    inputDigest: z.string().min(1),
    decisionDigest: z.string().min(1).optional(),
    providerId: z.string().min(1),
    providerVersion: z.string().min(1),
    applicationStatus: z.enum(["prepared", "applied", "duplicate", "rejected", "stale"]),
    appliedAtUtc: z.string().datetime({ offset: true }).optional(),
    outcome: z.enum([
      "satisfied",
      "needs_follow_up",
      "not_yet_formed",
      "rescale_required",
      "blocked",
    ]),
    confidence: z.enum(["low", "medium", "high"]).optional(),
    reasonCodes: z.array(EvaluationReasonCodeSchema),
    safetyCodes: z.array(EvaluationSafetyCodeSchema),
    createdAtUtc: z.string().datetime({ offset: true }),
  })
  .strict();

export type ProtectedEvaluationLedgerEntry = z.infer<typeof ProtectedEvaluationLedgerEntrySchema>;

export interface ProtectedEvaluationLedger {
  prepare(entry: ProtectedEvaluationLedgerEntry): ProtectedEvaluationLedgerTransaction;
  promotePrepared(evaluationRequestId: string, inputDigest: string, appliedAtUtc: string): void;
  rollbackPrepared(evaluationRequestId: string, inputDigest: string): void;
  markRouteRevisionStale(routeBindingRevision: number, updatedAtUtc: string): void;
  get(evaluationRequestId: string): ProtectedEvaluationLedgerEntry | undefined;
  all(): readonly ProtectedEvaluationLedgerEntry[];
}

export interface ProtectedEvaluationLedgerTransaction {
  commitApplied(appliedAtUtc: string): void;
  rollback(): void;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class MemoryProtectedEvaluationLedger implements ProtectedEvaluationLedger {
  private readonly entries = new Map<string, ProtectedEvaluationLedgerEntry>();
  private failurePoint: "prepare" | "commit" | "rollback" | null = null;

  failNextAt(point: "prepare" | "commit" | "rollback"): void {
    this.failurePoint = point;
  }

  private failIf(point: "prepare" | "commit" | "rollback"): void {
    if (this.failurePoint !== point) return;
    this.failurePoint = null;
    throw new Error(`Injected evaluation ledger failure: ${point}`);
  }

  prepare(entry: ProtectedEvaluationLedgerEntry): ProtectedEvaluationLedgerTransaction {
    this.failIf("prepare");
    const parsed = ProtectedEvaluationLedgerEntrySchema.parse({
      ...clone(entry),
      applicationStatus: "prepared",
      appliedAtUtc: undefined,
    });
    const existing = this.entries.get(parsed.evaluationRequestId);
    if (existing && existing.inputDigest !== parsed.inputDigest) {
      throw new Error("Evaluation ledger request digest conflict");
    }
    if (existing) {
      if (existing.applicationStatus !== "prepared") {
        throw new Error("Evaluation ledger entry is not retryable");
      }
      return {
        commitApplied: (appliedAtUtc: string) => {
          this.promotePrepared(parsed.evaluationRequestId, parsed.inputDigest, appliedAtUtc);
        },
        rollback: () => {
          this.rollbackPrepared(parsed.evaluationRequestId, parsed.inputDigest);
        },
      };
    }
    this.entries.set(parsed.evaluationRequestId, parsed);
    return {
      commitApplied: (appliedAtUtc: string) => {
        this.failIf("commit");
        const current = this.entries.get(parsed.evaluationRequestId);
        if (!current || current.inputDigest !== parsed.inputDigest) {
          throw new Error("Evaluation ledger prepared entry is unavailable");
        }
        this.entries.set(parsed.evaluationRequestId, {
          ...current,
          applicationStatus: "applied",
          appliedAtUtc,
        });
      },
      rollback: () => {
        this.failIf("rollback");
        const current = this.entries.get(parsed.evaluationRequestId);
        if (current?.applicationStatus === "prepared") {
          this.entries.delete(parsed.evaluationRequestId);
        }
      },
    };
  }

  promotePrepared(evaluationRequestId: string, inputDigest: string, appliedAtUtc: string): void {
    this.failIf("commit");
    const current = this.entries.get(evaluationRequestId);
    if (
      !current ||
      current.inputDigest !== inputDigest ||
      current.applicationStatus !== "prepared"
    ) {
      throw new Error("Evaluation ledger prepared entry is unavailable");
    }
    this.entries.set(evaluationRequestId, {
      ...current,
      applicationStatus: "applied",
      appliedAtUtc,
    });
  }

  rollbackPrepared(evaluationRequestId: string, inputDigest: string): void {
    this.failIf("rollback");
    const current = this.entries.get(evaluationRequestId);
    if (current?.inputDigest === inputDigest && current.applicationStatus === "prepared") {
      this.entries.delete(evaluationRequestId);
    }
  }

  markRouteRevisionStale(routeBindingRevision: number, updatedAtUtc: string): void {
    for (const [evaluationRequestId, entry] of this.entries.entries()) {
      if (entry.routeBindingRevision === routeBindingRevision) {
        this.entries.set(evaluationRequestId, {
          ...entry,
          applicationStatus: "stale",
          appliedAtUtc: entry.appliedAtUtc ?? updatedAtUtc,
        });
      }
    }
  }

  get(evaluationRequestId: string): ProtectedEvaluationLedgerEntry | undefined {
    const found = this.entries.get(evaluationRequestId);
    return found ? clone(found) : undefined;
  }

  all(): readonly ProtectedEvaluationLedgerEntry[] {
    return [...this.entries.values()].map(clone);
  }
}
