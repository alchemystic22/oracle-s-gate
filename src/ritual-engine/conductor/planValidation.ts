import type { ConductorPlan } from "./planner";

export function validateConductorPlan(plan: ConductorPlan): void {
  const revisions = plan.operations.filter((operation) => operation.type === "COMMIT_REVISION");
  if (
    revisions.length !== 1 ||
    revisions[0]!.type !== "COMMIT_REVISION" ||
    revisions[0].revision !== plan.expectedStateRevision + 1
  ) {
    throw new Error("Conductor plan must commit exactly one next revision");
  }
  const currentScenes = plan.operations.filter(
    (operation) => operation.type === "SET_CURRENT_SCENE",
  );
  if (currentScenes.length > 1) throw new Error("Conductor plan has contradictory scene changes");
  const statuses = plan.operations.filter((operation) => operation.type === "SET_STATUS");
  if (statuses.length > 1) throw new Error("Conductor plan has contradictory status changes");
  if (plan.operations.some((operation) => operation.type === "CONFIRM_STABLE_SCENE")) {
    throw new Error("Stable scene confirmation is persistence-owned");
  }
}
