import type { RitualGateRuntime, RitualRuntimeRoot } from "../domain/runtime";
import { ritualGateReducer } from "../runtime/reducer";
import { replaceGateRun } from "../runtime/rootReducer";
import type { ConductorPlan } from "./planner";
import { validateConductorPlan } from "./planValidation";

export function applyGatePlan(state: RitualGateRuntime, plan: ConductorPlan): RitualGateRuntime {
  validateConductorPlan(plan);
  if (state.gateRunId !== plan.gateRunId || state.stateRevision !== plan.expectedStateRevision) {
    throw new Error("Conductor plan state binding is stale");
  }
  return plan.operations.reduce(ritualGateReducer, state);
}

export function applyRootPlan(root: RitualRuntimeRoot, plan: ConductorPlan): RitualRuntimeRoot {
  const gateRun = root.gateRuns[plan.gateRunId];
  if (!gateRun) throw new Error("Conductor plan gate run is missing");
  const nextGateRun = applyGatePlan(gateRun, plan);
  return replaceGateRun(root, nextGateRun, nextGateRun.updatedAtUtc);
}
