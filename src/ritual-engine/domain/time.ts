import { z } from "zod";
import type { Brand } from "./ids";

export type UtcTimestamp = Brand<string, "UtcTimestamp">;
export const UtcTimestampSchema = z
  .string()
  .datetime({ offset: true })
  .transform((v) => v as UtcTimestamp);

export function toUtcTimestamp(date: Date): UtcTimestamp {
  return date.toISOString() as UtcTimestamp;
}
