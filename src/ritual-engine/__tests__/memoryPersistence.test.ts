import { describe, expect, it } from "vitest";
import { MemoryRitualPersistenceAdapter } from "../persistence/memory";
import { makeRuntime } from "./testFixture";
import {
  RITUAL_EVENTS_KEY,
  RITUAL_MIGRATION_KEY,
  RITUAL_RUNTIME_ACTIVE_KEY,
  RITUAL_RUNTIME_PENDING_KEY,
  RITUAL_RUNTIME_PREVIOUS_KEY,
} from "../persistence/localKeys";

describe("memory persistence", () => {
  it("returns isolated copies", async () => {
    const adapter = new MemoryRitualPersistenceAdapter();
    const runtime = makeRuntime();
    await adapter.save(runtime);
    const first = await adapter.load();
    first!.gateRuns.g1.stateRevision = 99;
    const second = await adapter.load();
    expect(second!.gateRuns.g1.stateRevision).toBe(0);
  });

  it("preserves exact local keys", () => {
    expect([
      RITUAL_RUNTIME_ACTIVE_KEY,
      RITUAL_RUNTIME_PENDING_KEY,
      RITUAL_RUNTIME_PREVIOUS_KEY,
      RITUAL_EVENTS_KEY,
      RITUAL_MIGRATION_KEY,
    ]).toEqual([
      "alchemystic_ritual_runtime_v1_active",
      "alchemystic_ritual_runtime_v1_pending",
      "alchemystic_ritual_runtime_v1_previous",
      "alchemystic_ritual_events_v1",
      "alchemystic_ritual_migration_v1",
    ]);
  });
});
