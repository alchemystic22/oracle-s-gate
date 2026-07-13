import type { RitualOutboxRecord } from "../domain/runtime";

export type OutboxProcessingOutcome = "completed" | "failed_retryable" | "failed_terminal";

export function transitionOutboxStatus(
  record: RitualOutboxRecord,
  status: RitualOutboxRecord["status"],
): RitualOutboxRecord {
  const allowed =
    ((record.status === "pending" || record.status === "failed_retryable") &&
      status === "processing") ||
    (record.status === "processing" &&
      ["completed", "failed_retryable", "failed_terminal"].includes(status));
  if (!allowed) throw new Error("Participant outbox status transition is invalid");
  return {
    ...record,
    status,
    attemptCount: status === "processing" ? record.attemptCount + 1 : record.attemptCount,
  };
}

export async function processParticipantOutboxRecord(
  record: RitualOutboxRecord,
  handler: (record: RitualOutboxRecord) => Promise<OutboxProcessingOutcome>,
): Promise<RitualOutboxRecord> {
  if (record.status === "completed" || record.status === "failed_terminal") return record;
  const processing = transitionOutboxStatus(record, "processing");
  const outcome = await handler(processing);
  return transitionOutboxStatus(processing, outcome);
}
