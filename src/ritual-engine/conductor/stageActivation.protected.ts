import type { ProtectedParticipantCompilation } from "../compiler/index.protected";
import { validateProtectedParticipantManifestMapping } from "../compiler/index.protected";
import type { RitualGateRuntime } from "../domain/runtime";
import type { Gate1CanonicalManifest } from "../manifest/sceneTypes";
import type { ConductorPlan } from "./planner";
import { planEnterScene } from "./sceneLifecycle";

export type CompilationActivationReason = "start_pre_route" | "route_bound" | "enter_completion";

export function planCompilationActivation(input: {
  run: RitualGateRuntime;
  compilation: ProtectedParticipantCompilation;
  canonicalManifest: Gate1CanonicalManifest;
  activationReason: CompilationActivationReason;
  nowUtc: string;
  sceneVisitId: string;
}): ConductorPlan {
  validateProtectedParticipantManifestMapping(input.compilation, input.canonicalManifest);
  const manifest = input.compilation.participantManifest;
  const validBoundary =
    (input.activationReason === "start_pre_route" &&
      manifest.stage === "pre_route" &&
      input.run.status === "not_started" &&
      !input.run.activeManifest) ||
    (input.activationReason === "route_bound" &&
      manifest.stage === "active_route" &&
      input.run.activeManifest?.manifestStage === "pre_route" &&
      input.run.validation["g1.stance_recognized"]?.value === true) ||
    (input.activationReason === "enter_completion" &&
      manifest.stage === "completion" &&
      input.run.activeManifest?.manifestStage === "active_route" &&
      input.run.validation["g1.book_withdrawn"]?.value === true);
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
