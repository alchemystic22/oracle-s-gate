import { deterministicDigest } from "../commands/digests";
import type { ProtectedCommand } from "../commands/protectedSchemas.protected";
import type { ProtectedParticipantManifestMapping } from "../compiler/index.protected";
import type { ParticipantManifest } from "../compiler/types";
import type { RitualGateRuntime } from "../domain/runtime";
import type { Gate1CanonicalManifest } from "../manifest/sceneTypes";
import type { RitualReducerAction } from "../runtime/actions";
import { authoredPrerequisitesSatisfied } from "./prerequisites.protected";
import type { ConductorPlan } from "./planner";
import { currentOpenVisitId, planEnterScene } from "./sceneLifecycle";
import { authoredEstablishmentOperations } from "./establishments.protected";

type SceneResolutionCommand = Extract<ProtectedCommand, { kind: "apply_scene_resolution" }>;

function sourceRuntimeBinding(run: RitualGateRuntime, commandId: string) {
  const response = Object.values(run.responses).find(
    (candidate) => candidate.sourceCommandId === commandId,
  );
  if (response) {
    return {
      runtimeSceneId: response.runtimeSceneId,
      runtimeInteractionId: response.runtimeInteractionId,
      runtimeQuestionId: response.runtimeQuestionId,
      responseId: response.responseId,
    };
  }
  if (run.gateAct?.sourceCommandId === commandId) {
    return {
      runtimeSceneId: run.gateAct.runtimeSceneId,
      runtimeInteractionId: run.gateAct.runtimeInteractionId,
      gateAct: true,
    };
  }
  const evidence = run.evidenceEvents.find((candidate) => candidate.sourceCommandId === commandId);
  if (evidence) {
    return {
      runtimeSceneId: evidence.runtimeSceneId,
      runtimeInteractionId: evidence.runtimeInteractionId,
      evidence: true,
    };
  }
  return { runtimeSceneId: run.currentRuntimeSceneId };
}

export function planProtectedSceneResolution(input: {
  run: RitualGateRuntime;
  participantManifest: ParticipantManifest;
  mapping: ProtectedParticipantManifestMapping;
  canonicalManifest: Gate1CanonicalManifest;
  command: SceneResolutionCommand;
  nowUtc: string;
  sceneVisitId: string;
}): ConductorPlan {
  const { run, command, mapping } = input;
  const receipt = run.commandReceipts.find(
    (candidate) => candidate.commandId === command.sourceCommandId,
  );
  if (!receipt) throw new Error("Protected resolution source receipt is missing");
  if (receipt.resolutionState === "superseded") {
    throw new Error("Protected resolution source receipt is superseded");
  }
  const resolutionDigest = deterministicDigest(command, "resolution");
  if (receipt.resolutionDigest) {
    if (receipt.resolutionDigest !== resolutionDigest) {
      throw new Error("Protected resolution conflicts with the existing resolution");
    }
    return {
      gateRunId: run.gateRunId,
      expectedStateRevision: run.stateRevision,
      operations: [],
      status: "duplicate",
      participantMessageCode: "resolution_already_applied",
      sceneChanged: false,
    };
  }
  if (
    run.activeManifest?.manifestInstanceId !== command.manifestInstanceId ||
    run.activeManifest.manifestDigest !== command.manifestDigest ||
    run.currentRuntimeSceneId !== command.runtimeSceneId ||
    receipt.manifestInstanceId !== command.manifestInstanceId ||
    receipt.runtimeSceneId !== command.runtimeSceneId
  ) {
    throw new Error("Protected resolution binding is stale");
  }
  const source = sourceRuntimeBinding(run, command.sourceCommandId);
  if (
    source.runtimeSceneId !== command.runtimeSceneId ||
    source.runtimeInteractionId !== command.runtimeInteractionId ||
    source.runtimeQuestionId !== command.runtimeQuestionId
  ) {
    throw new Error("Protected resolution source binding is invalid");
  }
  const canonicalSceneId = mapping.scenes[command.runtimeSceneId]?.canonicalSceneId;
  const canonicalScene = input.canonicalManifest.scenes.find(
    (scene) => scene.canonicalSceneId === canonicalSceneId,
  );
  const participantScene = input.participantManifest.scenes.find(
    (scene) => scene.runtimeSceneId === command.runtimeSceneId,
  );
  if (!canonicalScene || !participantScene) throw new Error("Protected scene is unavailable");
  if (
    command.runtimeInteractionId &&
    mapping.interactions[command.runtimeInteractionId]?.canonicalSceneId !== canonicalSceneId
  ) {
    throw new Error("Protected interaction binding is invalid");
  }
  if (
    command.runtimeQuestionId &&
    mapping.questions[command.runtimeQuestionId]?.canonicalSceneId !== canonicalSceneId
  ) {
    throw new Error("Protected question binding is invalid");
  }
  if (!authoredPrerequisitesSatisfied(run, canonicalScene)) {
    throw new Error("Protected resolution prerequisites are unmet");
  }

  const operations: RitualReducerAction[] = [];
  let status: ConductorPlan["status"] = "accepted";
  let message = "resolution_applied";
  let sceneChanged = false;

  if (command.outcome === "satisfied") {
    if (source.evidence) {
      const evidence = run.evidenceEvents.find(
        (candidate) => candidate.sourceCommandId === command.sourceCommandId,
      );
      if (
        evidence?.eventType !== "micro_act_completed" ||
        evidence.participantAttestation !== "occurred_outside_reflection"
      ) {
        throw new Error("Scheduled continuation cannot qualify as completed evidence");
      }
    }
    operations.push(...authoredEstablishmentOperations(run, canonicalScene, input.nowUtc));
    if (source.responseId) {
      operations.push({
        type: "SET_RESPONSE_STATE",
        responseId: source.responseId,
        state: "grounded",
        updatedAtUtc: input.nowUtc,
      });
    }
    if (source.gateAct && run.gateAct) {
      operations.push({
        type: "UPSERT_GATE_ACT",
        gateAct: { ...run.gateAct, status: "accepted", updatedAtUtc: input.nowUtc },
      });
    }
    if (command.runtimeTransitionId) {
      const transition = participantScene.transitions.find(
        (candidate) => candidate.runtimeTransitionId === command.runtimeTransitionId,
      );
      const protectedTransition = mapping.transitions[command.runtimeTransitionId];
      if (
        !transition ||
        !protectedTransition ||
        protectedTransition.fromCanonicalSceneId !== canonicalScene.canonicalSceneId ||
        protectedTransition.toCanonicalSceneId !==
          mapping.scenes[transition.targetRuntimeSceneId]?.canonicalSceneId
      ) {
        throw new Error("Protected resolution transition is invalid");
      }
      operations.push(
        ...planEnterScene({
          state: run,
          runtimeSceneId: transition.targetRuntimeSceneId,
          sceneVisitId: input.sceneVisitId,
          enteredAtUtc: input.nowUtc,
          completeCurrent: true,
        }),
      );
      sceneChanged = true;
      status = "advanced";
      message = "scene_advanced";
    } else if (participantScene.transitions.length > 0) {
      throw new Error("Protected resolution cannot omit an authored transition");
    } else {
      const openVisitId = currentOpenVisitId(run);
      if (openVisitId) {
        operations.push({
          type: "COMPLETE_SCENE_VISIT",
          sceneVisitId: openVisitId,
          completedAtUtc: input.nowUtc,
        });
      }
      if (input.participantManifest.stage === "pre_route") {
        status = "awaiting_route_binding";
        message = "route_binding_required";
      }
    }
  } else if (command.outcome === "needs_follow_up") {
    if (source.responseId) {
      operations.push({
        type: "SET_RESPONSE_STATE",
        responseId: source.responseId,
        state: "provisional",
        updatedAtUtc: input.nowUtc,
      });
    }
    status = "awaiting_protected_resolution";
    message = "follow_up_required";
  } else if (command.outcome === "not_yet_formed") {
    if (source.responseId) {
      operations.push({
        type: "SET_RESPONSE_STATE",
        responseId: source.responseId,
        state: "not_yet_formed",
        updatedAtUtc: input.nowUtc,
      });
    }
    status = "awaiting_protected_resolution";
    message = "response_not_yet_formed";
  } else if (command.outcome === "rescale_required") {
    operations.push(
      {
        type: "SET_SAFETY",
        safety: { ...run.safety, state: "rescale_required", updatedAtUtc: input.nowUtc },
      },
      { type: "SET_STATUS", status: "paused", updatedAtUtc: input.nowUtc },
    );
    status = "paused";
    message = "rescale_required";
  } else {
    operations.push(
      {
        type: "SET_SAFETY",
        safety: { ...run.safety, state: "blocked", updatedAtUtc: input.nowUtc },
      },
      { type: "SET_STATUS", status: "blocked", updatedAtUtc: input.nowUtc },
    );
    status = "blocked";
    message = "run_blocked";
  }

  operations.push(
    {
      type: "RESOLVE_COMMAND_RECEIPT",
      commandId: command.sourceCommandId,
      resolutionDigest,
      resolutionState: "resolved",
      safeStatus: status,
      resolvedAtUtc: input.nowUtc,
    },
    {
      type: "COMMIT_REVISION",
      revision: run.stateRevision + 1,
      updatedAtUtc: input.nowUtc,
    },
  );
  return {
    gateRunId: run.gateRunId,
    expectedStateRevision: run.stateRevision,
    operations,
    status,
    participantMessageCode: message,
    sceneChanged,
  };
}

export function planSafetyDirective(input: {
  run: RitualGateRuntime;
  state: "clear" | "rescale_required" | "blocked";
  protectedReasonCodes: readonly string[];
  nowUtc: string;
}): ConductorPlan {
  const status =
    input.state === "blocked" ? "blocked" : input.state === "clear" ? "accepted" : "paused";
  const operations: RitualReducerAction[] = [
    {
      type: "SET_SAFETY",
      safety: {
        state: input.state,
        reasonCodes: [...input.protectedReasonCodes],
        updatedAtUtc: input.nowUtc,
      },
    },
    {
      type: "SET_STATUS",
      status: input.state === "blocked" ? "blocked" : input.state === "clear" ? "active" : "paused",
      updatedAtUtc: input.nowUtc,
    },
    {
      type: "COMMIT_REVISION",
      revision: input.run.stateRevision + 1,
      updatedAtUtc: input.nowUtc,
    },
  ];
  return {
    gateRunId: input.run.gateRunId,
    expectedStateRevision: input.run.stateRevision,
    operations,
    status,
    participantMessageCode: input.state === "clear" ? "safety_cleared" : "safety_updated",
    sceneChanged: false,
  };
}
