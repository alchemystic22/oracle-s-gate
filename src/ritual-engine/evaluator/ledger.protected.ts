import { z } from "zod";
import { EvaluationReasonCodeSchema } from "./reasonCodes.protected";
import { EvaluationSafetyCodeSchema } from "./safetyCodes.protected";

export const ProtectedEvaluationLedgerEntrySchema = z
  .object({
    schemaVersion: z.literal(1),
    evaluationRequestId: z.string().min(1),
    evaluationDecisionId: z.string().min(1).optional(),
    sourceParticipantCommandId: z.string().min(1),
    policyId: z.string().min(1),
    policyVersion: z.literal(1),
    inputDigest: z.string().min(1),
    decisionDigest: z.string().min(1).optional(),
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
  append(entry: ProtectedEvaluationLedgerEntry): void;
  get(evaluationRequestId: string): ProtectedEvaluationLedgerEntry | undefined;
  all(): readonly ProtectedEvaluationLedgerEntry[];
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class MemoryProtectedEvaluationLedger implements ProtectedEvaluationLedger {
  private readonly entries = new Map<string, ProtectedEvaluationLedgerEntry>();

  append(entry: ProtectedEvaluationLedgerEntry): void {
    this.entries.set(
      entry.evaluationRequestId,
      ProtectedEvaluationLedgerEntrySchema.parse(clone(entry)),
    );
  }

  get(evaluationRequestId: string): ProtectedEvaluationLedgerEntry | undefined {
    const found = this.entries.get(evaluationRequestId);
    return found ? clone(found) : undefined;
  }

  all(): readonly ProtectedEvaluationLedgerEntry[] {
    return [...this.entries.values()].map(clone);
  }
}
