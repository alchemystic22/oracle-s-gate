import type { OpaqueIdFactory, OpaqueIdKind } from "./types";

const SEMANTIC_ID_PATTERN = /(?:g1|fa|st)[-_]?\d|false[-_ ]?arrival|splintered[-_ ]?trust/i;

export function isOpaqueIdentifier(value: unknown): value is string {
  return typeof value === "string" && value.length >= 12 && !SEMANTIC_ID_PATTERN.test(value);
}

export function assertOpaqueIdentifier(value: unknown): asserts value is string {
  if (!isOpaqueIdentifier(value)) throw new Error("Participant identifier is not opaque");
}

export function createRandomOpaqueIdFactory(): OpaqueIdFactory {
  return {
    next(_kind: OpaqueIdKind): string {
      return crypto.randomUUID().replaceAll("-", "");
    },
  };
}
