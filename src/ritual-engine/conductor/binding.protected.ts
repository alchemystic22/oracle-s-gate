import type { ParticipantCommandEnvelope } from "../commands";
import type {
  ParticipantCommandReceipt,
  RitualGateRuntime,
  RitualRuntimeRoot,
} from "../domain/runtime";
import type { Gate1CanonicalManifest, CanonicalSceneDefinition } from "../manifest/sceneTypes";
import type { ParticipantManifest, ParticipantScene } from "../compiler/types";
import type { ProtectedParticipantManifestMapping } from "../compiler/index.protected";
import type { ProtectedMappingProvider } from "../protected-store/mappingProvider.protected";
import { deterministicDigest } from "../commands/digests";
import { findCommandReceipt } from "../commands/receipts";
import { ConductorAuthorizationError } from "./authorization";

export type BoundParticipantCommand = {
  envelope: ParticipantCommandEnvelope;
  root: RitualRuntimeRoot;
  run: RitualGateRuntime;
  participantManifest: ParticipantManifest;
  participantScene: ParticipantScene;
  protectedMapping: ProtectedParticipantManifestMapping;
  canonicalScene: CanonicalSceneDefinition;
  payloadDigest: string;
  existingReceipt?: ParticipantCommandReceipt;
};

function commandInteractionId(command: ParticipantCommandEnvelope["command"]): string | undefined {
  return "runtimeInteractionId" in command ? command.runtimeInteractionId : undefined;
}

function commandQuestionId(command: ParticipantCommandEnvelope["command"]): string | undefined {
  return "runtimeQuestionId" in command ? command.runtimeQuestionId : undefined;
}

export function bindParticipantCommand(input: {
  envelope: ParticipantCommandEnvelope;
  root: RitualRuntimeRoot;
  participantManifest: ParticipantManifest;
  mappingProvider: ProtectedMappingProvider;
  canonicalManifest: Gate1CanonicalManifest;
}): BoundParticipantCommand {
  const { envelope, root, participantManifest, canonicalManifest } = input;
  const run = root.gateRuns[envelope.gateRunId];
  if (
    root.participantId !== envelope.participantId ||
    !run ||
    run.journeyCycleId !== envelope.journeyCycleId ||
    run.gateId !== envelope.gateId
  ) {
    throw new ConductorAuthorizationError("rejected_unauthorized", "Runtime identity mismatch");
  }

  const payloadDigest = deterministicDigest(envelope);
  const active = run.activeManifest;
  if (
    !active ||
    active.manifestInstanceId !== envelope.manifestInstanceId ||
    active.manifestDigest !== envelope.manifestDigest ||
    active.manifestStage !== envelope.manifestStage
  ) {
    throw new ConductorAuthorizationError("rejected_stale", "Active manifest binding mismatch");
  }
  if (
    active.routeToken !== envelope.routeToken ||
    active.routeBindingRevision !== envelope.routeBindingRevision
  ) {
    throw new ConductorAuthorizationError("rejected_stale", "Active route binding mismatch");
  }
  if (
    participantManifest.manifestInstanceId !== active.manifestInstanceId ||
    participantManifest.digest !== active.manifestDigest ||
    participantManifest.stage !== active.manifestStage
  ) {
    throw new ConductorAuthorizationError("rejected_stale", "Participant manifest mismatch");
  }

  const mappingRecord = input.mappingProvider.getByManifestInstanceId(active.manifestInstanceId);
  if (!mappingRecord || mappingRecord.retiredAtUtc) {
    throw new ConductorAuthorizationError("rejected_stale", "Protected mapping unavailable");
  }
  const mapping = mappingRecord.mapping;
  if (
    mapping.manifestDigest !== active.manifestDigest ||
    mapping.gateManifestVersion !== active.canonicalManifestVersion ||
    mapping.stage !== active.manifestStage
  ) {
    throw new ConductorAuthorizationError("rejected_stale", "Protected mapping mismatch");
  }

  const existingReceipt = findCommandReceipt(run.commandReceipts, envelope.commandId);
  if (
    !existingReceipt &&
    (run.stateRevision !== envelope.expectedStateRevision ||
      run.currentRuntimeSceneId !== envelope.runtimeSceneId)
  ) {
    throw new ConductorAuthorizationError("rejected_stale", "State or scene mismatch");
  }

  const participantScene = participantManifest.scenes.find(
    (scene) => scene.runtimeSceneId === envelope.runtimeSceneId,
  );
  const canonicalSceneId = mapping.scenes[envelope.runtimeSceneId]?.canonicalSceneId;
  const canonicalScene = canonicalManifest.scenes.find(
    (scene) => scene.canonicalSceneId === canonicalSceneId,
  );
  if (!participantScene || !canonicalScene) {
    throw new ConductorAuthorizationError("rejected_invalid", "Scene binding is invalid");
  }

  if (existingReceipt) {
    if (existingReceipt.payloadDigest !== payloadDigest) {
      throw new ConductorAuthorizationError("rejected_invalid", "Command replay digest conflict");
    }
    return {
      envelope,
      root,
      run,
      participantManifest,
      participantScene,
      protectedMapping: mapping,
      canonicalScene,
      payloadDigest,
      existingReceipt,
    };
  }

  if (run.safety.state === "blocked" && envelope.command.kind !== "pause_run") {
    throw new ConductorAuthorizationError("rejected_unauthorized", "Run is safety blocked");
  }
  if (
    run.status === "paused" &&
    !(
      ["pause_run", "resume_run"].includes(envelope.command.kind) ||
      (run.safety.state === "rescale_required" &&
        ["submit_response", "submit_gate_act"].includes(envelope.command.kind))
    )
  ) {
    throw new ConductorAuthorizationError("rejected_unauthorized", "Run is paused");
  }
  if (run.status === "completed") {
    throw new ConductorAuthorizationError("rejected_unauthorized", "Run is completed");
  }
  if (
    run.safety.state === "rescale_required" &&
    !["submit_response", "submit_gate_act", "pause_run"].includes(envelope.command.kind)
  ) {
    throw new ConductorAuthorizationError("rejected_unauthorized", "Run requires rescaling");
  }

  const interactionId = commandInteractionId(envelope.command);
  if (interactionId) {
    if (
      participantScene.interaction?.runtimeInteractionId !== interactionId ||
      mapping.interactions[interactionId]?.canonicalSceneId !== canonicalScene.canonicalSceneId
    ) {
      throw new ConductorAuthorizationError("rejected_unauthorized", "Interaction mismatch");
    }
  }
  const questionId = commandQuestionId(envelope.command);
  if (questionId) {
    if (
      participantScene.interaction?.runtimeQuestionId !== questionId ||
      mapping.questions[questionId]?.canonicalSceneId !== canonicalScene.canonicalSceneId
    ) {
      throw new ConductorAuthorizationError("rejected_unauthorized", "Question mismatch");
    }
  }
  if (
    envelope.command.kind === "invoke_scene_action" &&
    envelope.command.runtimeTransitionId &&
    !participantScene.transitions.some(
      (transition) =>
        transition.runtimeTransitionId ===
        (envelope.command.kind === "invoke_scene_action"
          ? envelope.command.runtimeTransitionId
          : undefined),
    )
  ) {
    throw new ConductorAuthorizationError("rejected_unauthorized", "Transition mismatch");
  }

  return {
    envelope,
    root,
    run,
    participantManifest,
    participantScene,
    protectedMapping: mapping,
    canonicalScene,
    payloadDigest,
  };
}
