import type { RitualResponseRecord } from "../domain/responses";
import type { RitualRuntimeRoot } from "../domain/runtime";

function clone<T>(value: T): T {
  return structuredClone(value);
}

export interface SessionResponseStore {
  getForGateRun(gateRunId: string): Readonly<Record<string, RitualResponseRecord>>;
  replaceForGateRun(
    gateRunId: string,
    responses: Readonly<Record<string, RitualResponseRecord>>,
  ): void;
}

export class MemorySessionResponseStore implements SessionResponseStore {
  private readonly responses = new Map<string, Record<string, RitualResponseRecord>>();

  getForGateRun(gateRunId: string): Readonly<Record<string, RitualResponseRecord>> {
    return clone(this.responses.get(gateRunId) ?? {});
  }

  replaceForGateRun(
    gateRunId: string,
    responses: Readonly<Record<string, RitualResponseRecord>>,
  ): void {
    this.responses.set(gateRunId, clone(responses));
  }
}

export function hydrateSessionResponses(
  runtime: RitualRuntimeRoot,
  store: SessionResponseStore,
): RitualRuntimeRoot {
  if (runtime.privacyMode !== "session_only_reflections") return runtime;
  const next = clone(runtime);
  for (const run of Object.values(next.gateRuns)) {
    run.responses = {
      ...run.responses,
      ...store.getForGateRun(run.gateRunId),
    };
  }
  return next;
}

export function captureSessionResponses(
  runtime: RitualRuntimeRoot,
  store: SessionResponseStore,
): void {
  if (runtime.privacyMode !== "session_only_reflections") return;
  for (const run of Object.values(runtime.gateRuns)) {
    store.replaceForGateRun(run.gateRunId, run.responses);
  }
}
