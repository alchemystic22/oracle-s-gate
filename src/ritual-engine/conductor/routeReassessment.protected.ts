import type { ProtectedParticipantCompilation } from "../compiler/index.protected";
import type { RitualGateRuntime } from "../domain/runtime";
import type { ConductorPlan } from "./planner";
import { planEnterScene } from "./sceneLifecycle";

export function planRouteReassessmentApplication(input: {
  run: RitualGateRuntime;
  sourceCommandId: string;
  reassessmentCompilation: ProtectedParticipantCompilation;
  nowUtc: string;
  sceneVisitId: string;
}): ConductorPlan {
  const sourceReceipt = input.run.commandReceipts.find(
    (receipt) => receipt.commandId === input.sourceCommandId,
  );
  if (
    !sourceReceipt ||
    sourceReceipt.commandKind !== "request_route_reassessment" ||
    sourceReceipt.resolutionState !== "unresolved"
  ) {
    throw new Error("Route reassessment source receipt is invalid");
  }
  const previousRevision = input.run.activeManifest?.routeBindingRevision;
  const manifest = input.reassessmentCompilation.participantManifest;
  if (
    previousRevision === undefined ||
    manifest.stage !== "active_route" ||
    manifest.routeBindingRevision === undefined ||
    manifest.routeBindingRevision <= previousRevision ||
    manifest.routeToken === input.run.activeManifest?.routeToken ||
    manifest.manifestInstanceId === input.run.activeManifest?.manifestInstanceId
  ) {
    throw new Error("Route reassessment compilation rotation is invalid");
  }

  const operations = [
    {
      type: "MARK_ROUTE_DATA_STALE" as const,
      routeBindingRevision: previousRevision,
      updatedAtUtc: input.nowUtc,
    },
    {
      type: "ACTIVATE_MANIFEST" as const,
      manifest: {
        manifestInstanceId: manifest.manifestInstanceId,
        manifestStage: manifest.stage,
        manifestDigest: manifest.digest,
        canonicalManifestVersion: manifest.gateManifestVersion,
        routeToken: manifest.routeToken,
        routeBindingRevision: manifest.routeBindingRevision,
        activatedAtUtc: input.nowUtc,
      },
    },
    ...planEnterScene({
      state: input.run,
      runtimeSceneId: manifest.entryRuntimeSceneId,
      sceneVisitId: input.sceneVisitId,
      enteredAtUtc: input.nowUtc,
      completeCurrent: false,
    }),
    {
      type: "COMMIT_REVISION" as const,
      revision: input.run.stateRevision + 1,
      updatedAtUtc: input.nowUtc,
    },
  ];
  return {
    gateRunId: input.run.gateRunId,
    expectedStateRevision: input.run.stateRevision,
    operations,
    status: "advanced",
    participantMessageCode: "route_reassessment_applied",
    sceneChanged: true,
  };
}
