import type { RitualGateRuntime, RitualRuntimeRoot } from "../domain/runtime";

export function replaceGateRun(
  root: RitualRuntimeRoot,
  gateRun: RitualGateRuntime,
  updatedAtUtc: string,
): RitualRuntimeRoot {
  return {
    ...root,
    gateRuns: { ...root.gateRuns, [gateRun.gateRunId]: gateRun },
    updatedAtUtc,
  };
}
