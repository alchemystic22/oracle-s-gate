import type { ParticipantCommandReceipt } from "../domain/runtime";
import type { RitualReducerAction } from "../runtime/actions";
import type { BoundParticipantCommand } from "./binding.protected";
import type { ConductorPlan } from "./planner";
import { ConductorAuthorizationError } from "./authorization";
import { currentOpenVisitId, planEnterScene } from "./sceneLifecycle";
import { authoredPrerequisitesSatisfied } from "./prerequisites.protected";
import {
  createJourneyEventIntent,
  createLegacyCompletionIntent,
  type ParticipantSafeEventType,
} from "../events/participantEventIntents";
import { deterministicDigest } from "../commands/digests";
import type { EvidenceEvent } from "../domain/evidence";

export type ParticipantPlannerIds = {
  sceneVisitId: string;
  outboxId: string;
  eventId: string;
  secondaryOutboxId: string;
};

function storageClass(bound: BoundParticipantCommand) {
  switch (bound.root.privacyMode) {
    case "full_private_continuity":
      return "persistent_private" as const;
    case "session_only_reflections":
      return "session_only" as const;
    default:
      return "structured_only" as const;
  }
}

function makeReceipt(
  bound: BoundParticipantCommand,
  status: ParticipantCommandReceipt["safeStatus"],
  nowUtc: string,
  resolutionState: ParticipantCommandReceipt["resolutionState"],
): ParticipantCommandReceipt {
  return {
    commandId: bound.envelope.commandId,
    commandKind: bound.envelope.command.kind,
    manifestInstanceId: bound.envelope.manifestInstanceId,
    runtimeSceneId: bound.envelope.runtimeSceneId,
    payloadDigest: bound.payloadDigest,
    safeStatus: status,
    resolutionState,
    issuedAtUtc: bound.envelope.issuedAtUtc,
    recordedAtUtc: nowUtc,
  };
}

function eventOperation(
  bound: BoundParticipantCommand,
  ids: ParticipantPlannerIds,
  nowUtc: string,
  eventType: ParticipantSafeEventType,
): RitualReducerAction {
  return {
    type: "APPEND_OUTBOX_INTENT",
    outbox: createJourneyEventIntent({
      outboxId: ids.outboxId,
      eventId: ids.eventId,
      commandId: bound.envelope.commandId,
      run: bound.run,
      runtimeSceneId: bound.envelope.runtimeSceneId,
      eventType,
      occurredAtUtc: nowUtc,
      isTestCycle: bound.root.isTestCycle,
    }),
    updatedAtUtc: nowUtc,
  };
}

function completePlan(
  bound: BoundParticipantCommand,
  operations: RitualReducerAction[],
  status: ConductorPlan["status"],
  participantMessageCode: string,
  nowUtc: string,
  sceneChanged = false,
): ConductorPlan {
  operations.push({
    type: "COMMIT_REVISION",
    revision: bound.run.stateRevision + 1,
    updatedAtUtc: nowUtc,
  });
  return {
    gateRunId: bound.run.gateRunId,
    expectedStateRevision: bound.run.stateRevision,
    operations,
    status,
    participantMessageCode,
    sceneChanged,
  };
}

export function planParticipantCommand(
  bound: BoundParticipantCommand,
  nowUtc: string,
  ids: ParticipantPlannerIds,
): ConductorPlan {
  if (bound.existingReceipt) {
    return {
      gateRunId: bound.run.gateRunId,
      expectedStateRevision: bound.run.stateRevision,
      operations: [],
      status: "duplicate",
      participantMessageCode: "command_already_received",
      sceneChanged: false,
    };
  }

  const command = bound.envelope.command;
  const operations: RitualReducerAction[] = [];
  let status: ConductorPlan["status"] = "accepted";
  let message = "command_accepted";
  let eventType: ParticipantSafeEventType | undefined;
  let unresolved = false;
  let sceneChanged = false;

  if (command.kind === "acknowledge_scene") {
    if (bound.participantScene.interaction?.kind !== "acknowledgment") {
      throw new ConductorAuthorizationError("rejected_unauthorized", "Acknowledgment unavailable");
    }
    const transition = bound.participantScene.transitions[0];
    if (transition) {
      operations.push(
        ...planEnterScene({
          state: bound.run,
          runtimeSceneId: transition.targetRuntimeSceneId,
          sceneVisitId: ids.sceneVisitId,
          enteredAtUtc: nowUtc,
          completeCurrent: true,
        }),
      );
      sceneChanged = true;
      status = "advanced";
      message = "scene_advanced";
      eventType = "scene_completed";
    }
  } else if (command.kind === "submit_response") {
    if (bound.participantScene.interaction?.kind !== "reflection") {
      throw new ConductorAuthorizationError("rejected_unauthorized", "Reflection unavailable");
    }
    operations.push({
      type: "UPSERT_RESPONSE",
      response: {
        responseId: command.responseId,
        runtimeSceneId: bound.envelope.runtimeSceneId,
        runtimeInteractionId: command.runtimeInteractionId,
        runtimeQuestionId: command.runtimeQuestionId,
        sourceCommandId: bound.envelope.commandId,
        routeBindingRevision: bound.envelope.routeBindingRevision,
        text: command.text,
        structuredSummary: command.structuredSummary,
        state: command.declaredState,
        storageClass: storageClass(bound),
        createdAtUtc: nowUtc,
        updatedAtUtc: nowUtc,
      },
    });
    status = "awaiting_protected_resolution";
    message = "response_awaiting_resolution";
    eventType = "response_submitted";
    unresolved = true;
  } else if (command.kind === "select_option") {
    if (
      bound.participantScene.interaction?.kind !== "stance_selection" ||
      !bound.participantScene.interaction.options?.[command.optionIndex]
    ) {
      throw new ConductorAuthorizationError("rejected_unauthorized", "Option unavailable");
    }
    operations.push({
      type: "UPSERT_RESPONSE",
      response: {
        responseId: command.responseId,
        runtimeSceneId: bound.envelope.runtimeSceneId,
        runtimeInteractionId: command.runtimeInteractionId,
        runtimeQuestionId: command.runtimeQuestionId,
        sourceCommandId: bound.envelope.commandId,
        structuredSummary: { selectedOptionIndex: command.optionIndex },
        state: "draft",
        storageClass: storageClass(bound),
        createdAtUtc: nowUtc,
        updatedAtUtc: nowUtc,
      },
    });
    status = "awaiting_protected_resolution";
    message = "selection_awaiting_resolution";
    eventType = "response_submitted";
    unresolved = true;
  } else if (command.kind === "submit_gate_act") {
    if (bound.participantScene.interaction?.kind !== "gate_act") {
      throw new ConductorAuthorizationError("rejected_unauthorized", "Gate Act unavailable");
    }
    const existing = bound.run.gateAct;
    if (existing && existing.gateActId !== command.gateActId) {
      throw new ConductorAuthorizationError("rejected_invalid", "Gate Act identity conflict");
    }
    const revision = existing ? existing.activeRevision + 1 : 0;
    operations.push({
      type: "UPSERT_GATE_ACT",
      gateAct: {
        gateActId: command.gateActId,
        runtimeSceneId: bound.envelope.runtimeSceneId,
        runtimeInteractionId: command.runtimeInteractionId,
        sourceCommandId: bound.envelope.commandId,
        routeBindingRevision: bound.envelope.routeBindingRevision,
        status: "draft",
        activeRevision: revision,
        revisions: [
          ...(existing?.revisions ?? []),
          {
            revision,
            act: command.act,
            context: command.context,
            immediateMicroAct: command.immediateMicroAct,
            continuationAction: command.continuationAction,
            participantSafetySelfReport: command.safetySelfReport,
            createdAtUtc: nowUtc,
          },
        ],
        createdAtUtc: existing?.createdAtUtc ?? nowUtc,
        updatedAtUtc: nowUtc,
      },
    });
    if (command.safetySelfReport === "not_safe") {
      operations.push(
        {
          type: "SET_SAFETY",
          safety: { state: "blocked", reasonCodes: [], updatedAtUtc: nowUtc },
        },
        { type: "SET_STATUS", status: "blocked", updatedAtUtc: nowUtc },
      );
      status = "blocked";
      message = "safety_blocked";
    } else if (command.safetySelfReport === "unsure") {
      operations.push(
        {
          type: "SET_SAFETY",
          safety: { state: "rescale_required", reasonCodes: [], updatedAtUtc: nowUtc },
        },
        { type: "SET_STATUS", status: "paused", updatedAtUtc: nowUtc },
      );
      status = "paused";
      message = "safety_review_needed";
      unresolved = true;
    } else {
      status = "awaiting_protected_resolution";
      message = "gate_act_awaiting_resolution";
      unresolved = true;
    }
    eventType = "gate_act_submitted";
  } else if (command.kind === "record_evidence") {
    if (
      bound.participantScene.interaction?.kind !== "evidence" ||
      !bound.run.gateAct ||
      bound.run.gateAct.gateActId !== command.gateActId ||
      bound.run.gateAct.stale
    ) {
      throw new ConductorAuthorizationError("rejected_unauthorized", "Evidence is not authorized");
    }
    const existing = bound.run.evidenceEvents.find(
      (event) => event.evidenceEventId === command.evidenceEventId,
    );
    const evidence: EvidenceEvent =
      command.eventType === "micro_act_completed"
        ? {
            evidenceEventId: command.evidenceEventId,
            gateActId: command.gateActId,
            runtimeSceneId: bound.envelope.runtimeSceneId,
            runtimeInteractionId: command.runtimeInteractionId,
            eventType: command.eventType,
            mode: command.mode,
            description: command.description,
            participantAttestation: command.participantAttestation,
            routeBindingRevision: bound.envelope.routeBindingRevision,
            sourceCommandId: bound.envelope.commandId,
            occurredAtUtc: command.occurredAtUtc,
          }
        : {
            evidenceEventId: command.evidenceEventId,
            gateActId: command.gateActId,
            runtimeSceneId: bound.envelope.runtimeSceneId,
            runtimeInteractionId: command.runtimeInteractionId,
            eventType: command.eventType,
            mode: command.mode,
            description: command.description,
            participantAttestation: command.participantAttestation,
            routeBindingRevision: bound.envelope.routeBindingRevision,
            sourceCommandId: bound.envelope.commandId,
            occurredAtUtc: command.occurredAtUtc,
          };
    if (existing) {
      if (deterministicDigest(existing) !== deterministicDigest(evidence)) {
        throw new ConductorAuthorizationError("rejected_invalid", "Evidence identity conflict");
      }
      status = "duplicate";
      message = "evidence_already_received";
    } else {
      operations.push({ type: "APPEND_EVIDENCE", evidence, updatedAtUtc: nowUtc });
      status = "awaiting_protected_resolution";
      message = "evidence_awaiting_resolution";
      unresolved = true;
      eventType = "evidence_recorded";
    }
  } else if (command.kind === "request_route_reassessment") {
    if (bound.participantScene.secondaryAction?.intent !== "reassess_route") {
      throw new ConductorAuthorizationError("rejected_unauthorized", "Reassessment unavailable");
    }
    status = "awaiting_route_reassessment";
    message = "route_reassessment_requested";
    eventType = "route_reassessment_requested";
    unresolved = true;
  } else if (command.kind === "invoke_scene_action") {
    const actionIntents = [
      bound.participantScene.primaryAction?.intent,
      bound.participantScene.secondaryAction?.intent,
    ];
    if (!actionIntents.includes(command.intent)) {
      throw new ConductorAuthorizationError("rejected_unauthorized", "Scene action unavailable");
    }
    if (!authoredPrerequisitesSatisfied(bound.run, bound.canonicalScene)) {
      throw new ConductorAuthorizationError("rejected_unauthorized", "Prerequisites are unmet");
    }
    if (command.intent === "complete") {
      const openVisitId = currentOpenVisitId(bound.run);
      if (openVisitId) {
        operations.push({
          type: "COMPLETE_SCENE_VISIT",
          sceneVisitId: openVisitId,
          completedAtUtc: nowUtc,
        });
      }
      operations.push({ type: "SET_COMPLETED", completedAtUtc: nowUtc });
      operations.push(eventOperation(bound, ids, nowUtc, "gate_completed"), {
        type: "APPEND_OUTBOX_INTENT",
        outbox: createLegacyCompletionIntent({
          outboxId: ids.secondaryOutboxId,
          commandId: bound.envelope.commandId,
          completedAtUtc: nowUtc,
        }),
        updatedAtUtc: nowUtc,
      });
      eventType = undefined;
      status = "advanced";
      message = "gate_completed";
    } else {
      const transition = command.runtimeTransitionId
        ? bound.participantScene.transitions.find(
            (candidate) => candidate.runtimeTransitionId === command.runtimeTransitionId,
          )
        : bound.participantScene.transitions[0];
      if (transition) {
        operations.push(
          ...planEnterScene({
            state: bound.run,
            runtimeSceneId: transition.targetRuntimeSceneId,
            sceneVisitId: ids.sceneVisitId,
            enteredAtUtc: nowUtc,
            completeCurrent: true,
          }),
        );
        sceneChanged = true;
        status = "advanced";
        message = command.intent === "seal" ? "page_sealed" : "scene_advanced";
        eventType = "scene_completed";
      } else if (bound.participantManifest.stage === "pre_route") {
        status = "awaiting_route_binding";
        message = "route_binding_required";
      }
    }
  } else if (command.kind === "pause_run") {
    operations.push({ type: "SET_STATUS", status: "paused", updatedAtUtc: nowUtc });
    status = "paused";
    message = "run_paused";
    eventType = "run_paused";
  } else if (command.kind === "resume_run") {
    if (bound.run.status !== "paused" || bound.run.safety.state !== "clear") {
      throw new ConductorAuthorizationError("rejected_unauthorized", "Run cannot resume");
    }
    operations.push({ type: "SET_STATUS", status: "active", updatedAtUtc: nowUtc });
    if (
      bound.run.lastStableRuntimeSceneId &&
      bound.run.currentRuntimeSceneId !== bound.run.lastStableRuntimeSceneId
    ) {
      operations.push({
        type: "SET_CURRENT_SCENE",
        runtimeSceneId: bound.run.lastStableRuntimeSceneId,
        updatedAtUtc: nowUtc,
      });
      sceneChanged = true;
    }
    status = "resumed";
    message = "run_resumed";
    eventType = "run_resumed";
  }

  operations.push({
    type: "APPEND_COMMAND_RECEIPT",
    receipt: makeReceipt(bound, status, nowUtc, unresolved ? "unresolved" : "resolved"),
  });
  if (eventType) operations.push(eventOperation(bound, ids, nowUtc, eventType));
  return completePlan(bound, operations, status, message, nowUtc, sceneChanged);
}
