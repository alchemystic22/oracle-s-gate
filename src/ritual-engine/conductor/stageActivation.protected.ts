import type { ProtectedParticipantCompilation } from "../compiler/index.protected";
import { validateProtectedParticipantManifestMapping } from "../compiler/index.protected";
import type { RitualGateRuntime } from "../domain/runtime";
import type { Gate1CanonicalManifest } from "../manifest/sceneTypes";
import type { ConductorPlan } from "./planner";
import { planEnterScene } from "./sceneLifecycle";
import type { ProtectedParticipantManifestMapping } from "../compiler/index.protected";

function currentSceneVisitIsCompleted(run: RitualGateRuntime): boolean {
  return [...run.sceneVisitOrder].reverse().some((visitId) => {
    const visit = run.sceneVisits[visitId];
    return visit?.runtimeSceneId === run.currentRuntimeSceneId && Boolean(visit.completedAtUtc);
  });
}

function mappingMatchesActiveRun(
  run: RitualGateRuntime,
  mapping: ProtectedParticipantManifestMapping | undefined,
): mapping is ProtectedParticipantManifestMapping {
  return Boolean(
    mapping &&
    run.activeManifest &&
    mapping.manifestInstanceId === run.activeManifest.manifestInstanceId &&
    mapping.manifestDigest === run.activeManifest.manifestDigest &&
    mapping.stage === run.activeManifest.manifestStage,
  );
}

export type CompilationActivationReason = "start_pre_route" | "route_bound" | "enter_completion";

export function planCompilationActivation(input: {
  run: RitualGateRuntime;
  compilation: ProtectedParticipantCompilation;
  canonicalManifest: Gate1CanonicalManifest;
  activationReason: CompilationActivationReason;
  currentMapping?: ProtectedParticipantManifestMapping;
  nowUtc: string;
  sceneVisitId: string;
}): ConductorPlan {
  validateProtectedParticipantManifestMapping(input.compilation, input.canonicalManifest);
  const manifest = input.compilation.participantManifest;
  const currentCanonicalSceneId = input.run.currentRuntimeSceneId
    ? input.currentMapping?.scenes[input.run.currentRuntimeSceneId]?.canonicalSceneId
    : undefined;
  const stanceValidation = input.run.validation["g1.stance_recognized"];
  const stanceReceiptResolved = input.run.commandReceipts.some(
    (receipt) =>
      receipt.runtimeSceneId === input.run.currentRuntimeSceneId &&
      receipt.commandKind === "select_option" &&
      receipt.resolutionState === "resolved",
  );
  const bookWithdrawn = input.run.validation["g1.book_withdrawn"];
  const validBoundary =
    (input.activationReason === "start_pre_route" &&
      manifest.stage === "pre_route" &&
      input.run.status === "not_started" &&
      !input.run.activeManifest) ||
    (input.activationReason === "route_bound" &&
      manifest.stage === "active_route" &&
      input.run.activeManifest?.manifestStage === "pre_route" &&
      mappingMatchesActiveRun(input.run, input.currentMapping) &&
      currentCanonicalSceneId === "G1-09" &&
      currentSceneVisitIsCompleted(input.run) &&
      stanceReceiptResolved &&
      stanceValidation?.value === true &&
      !stanceValidation.stale &&
      stanceValidation.routeBindingRevision === undefined) ||
    (input.activationReason === "enter_completion" &&
      manifest.stage === "completion" &&
      input.run.activeManifest?.manifestStage === "active_route" &&
      mappingMatchesActiveRun(input.run, input.currentMapping) &&
      currentCanonicalSceneId === "G1-15" &&
      currentSceneVisitIsCompleted(input.run) &&
      bookWithdrawn?.value === true &&
      !bookWithdrawn.stale &&
      bookWithdrawn.routeBindingRevision === input.run.activeManifest.routeBindingRevision);
  if (!validBoundary) throw new Error("Compilation activation stage boundary is invalid");

  const operations = [
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
    { type: "SET_STATUS" as const, status: "active" as const, updatedAtUtc: input.nowUtc },
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
    participantMessageCode: "manifest_activated",
    sceneChanged: true,
  };
}
