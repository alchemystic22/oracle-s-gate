export type ProtectedCommandReplayState = "new" | "duplicate" | "conflict";

export class ProtectedCommandLedger {
  private readonly digests = new Map<string, string>();

  check(commandId: string, digest: string): ProtectedCommandReplayState {
    const existing = this.digests.get(commandId);
    if (existing === undefined) return "new";
    return existing === digest ? "duplicate" : "conflict";
  }

  record(commandId: string, digest: string): void {
    const state = this.check(commandId, digest);
    if (state === "conflict") throw new Error("Protected command digest conflict");
    this.digests.set(commandId, digest);
  }
}
