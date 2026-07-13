import type { ParticipantCommandReceipt } from "../domain/runtime";

export const COMMAND_RECEIPT_LIMIT = 200;

export function appendBoundedReceipt(
  receipts: readonly ParticipantCommandReceipt[],
  receipt: ParticipantCommandReceipt,
  limit = COMMAND_RECEIPT_LIMIT,
): ParticipantCommandReceipt[] {
  const next = [...receipts, receipt];
  while (next.length > limit) {
    const resolvedIndex = next.findIndex((candidate) => candidate.resolutionState !== "unresolved");
    if (resolvedIndex < 0) throw new Error("Unresolved command receipts exceed the ledger limit");
    next.splice(resolvedIndex, 1);
  }
  return next;
}

export function findCommandReceipt(
  receipts: readonly ParticipantCommandReceipt[],
  commandId: string,
): ParticipantCommandReceipt | undefined {
  return receipts.find((receipt) => receipt.commandId === commandId);
}
