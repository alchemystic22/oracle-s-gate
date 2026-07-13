import { z } from "zod";
import { ParticipantPrivacyModeSchema, ResearchPermissionSchema } from "./privacy";
import { RitualResponseRecordSchema } from "./responses";
import { GateActRecordSchema } from "./gateAct";
import { EvidenceEventSchema } from "./evidence";
import { RitualSafetyRuntimeSchema } from "./safety";

export const SceneVisitRecordSchema = z.object({
  sceneVisitId: z.string().min(1),
  runtimeSceneId: z.string().min(1),
  enteredAtUtc: z.string().datetime({ offset: true }),
  completedAtUtc: z.string().datetime({ offset: true }).optional(),
});

export const ParticipantCommandKindSchema = z.enum([
  "acknowledge_scene",
  "submit_response",
  "select_option",
  "submit_gate_act",
  "record_evidence",
  "request_route_reassessment",
  "invoke_scene_action",
  "pause_run",
  "resume_run",
]);

export const ParticipantCommandReceiptSchema = z
  .object({
    commandId: z.string().min(1),
    commandKind: ParticipantCommandKindSchema,
    manifestInstanceId: z.string().min(1),
    runtimeSceneId: z.string().min(1),
    payloadDigest: z.string().min(1),
    safeStatus: z.enum([
      "advanced",
      "accepted",
      "awaiting_protected_resolution",
      "awaiting_route_binding",
      "awaiting_route_reassessment",
      "paused",
      "resumed",
      "blocked",
      "duplicate",
      "rejected_stale",
      "rejected_unauthorized",
      "rejected_invalid",
    ]),
    resolutionState: z.enum(["unresolved", "resolved", "superseded"]),
    resolutionDigest: z.string().min(1).optional(),
    issuedAtUtc: z.string().datetime({ offset: true }),
    recordedAtUtc: z.string().datetime({ offset: true }),
    resolvedAtUtc: z.string().datetime({ offset: true }).optional(),
  })
  .strict();

export const ActiveManifestReferenceSchema = z.object({
  manifestInstanceId: z.string().min(1),
  manifestStage: z.enum(["pre_route", "active_route", "completion"]),
  manifestDigest: z.string().min(1),
  canonicalManifestVersion: z.string().min(1),
  routeToken: z.string().optional(),
  routeBindingRevision: z.number().int().nonnegative().optional(),
  activatedAtUtc: z.string().datetime({ offset: true }),
});

const RitualOutboxBaseShape = {
  outboxId: z.string().min(1),
  commandId: z.string().min(1),
  status: z.enum(["pending", "processing", "completed", "failed_retryable", "failed_terminal"]),
  attemptCount: z.number().int().nonnegative(),
  createdAtUtc: z.string().datetime({ offset: true }),
};

const AppendJourneyEventIntentSchema = z
  .object({
    ...RitualOutboxBaseShape,
    effectType: z.literal("append_journey_event"),
    payload: z
      .object({
        eventId: z.string().min(1),
        journeyCycleId: z.string().min(1),
        gateRunId: z.string().min(1),
        gateId: z.number().int().min(1).max(7),
        runtimeSceneId: z.string().min(1).optional(),
        eventType: z.string().min(1),
        occurredAtUtc: z.string().datetime({ offset: true }),
        isTestCycle: z.boolean(),
      })
      .strict(),
  })
  .strict();

const MirrorLegacyGateVisitIntentSchema = z
  .object({
    ...RitualOutboxBaseShape,
    effectType: z.literal("mirror_legacy_gate_visit"),
    payload: z
      .object({
        gateId: z.number().int().min(1).max(7),
        visitedAtUtc: z.string().datetime({ offset: true }),
      })
      .strict(),
  })
  .strict();

const MirrorLegacyGateCompletionIntentSchema = z
  .object({
    ...RitualOutboxBaseShape,
    effectType: z.literal("mirror_legacy_gate_completion"),
    payload: z
      .object({
        gateId: z.number().int().min(1).max(7),
        completedAtUtc: z.string().datetime({ offset: true }),
      })
      .strict(),
  })
  .strict();

const ClearSessionResponseIntentSchema = z
  .object({
    ...RitualOutboxBaseShape,
    effectType: z.literal("clear_session_response"),
    payload: z
      .object({
        gateRunId: z.string().min(1),
        responseId: z.string().min(1),
      })
      .strict(),
  })
  .strict();

const DeleteRetiredRawResponseIntentSchema = z
  .object({
    ...RitualOutboxBaseShape,
    effectType: z.literal("delete_retired_raw_response"),
    payload: z
      .object({
        gateRunId: z.string().min(1),
        responseId: z.string().min(1),
        retiredAtUtc: z.string().datetime({ offset: true }),
      })
      .strict(),
  })
  .strict();

export const RitualOutboxRecordSchema = z.discriminatedUnion("effectType", [
  AppendJourneyEventIntentSchema,
  MirrorLegacyGateVisitIntentSchema,
  MirrorLegacyGateCompletionIntentSchema,
  ClearSessionResponseIntentSchema,
  DeleteRetiredRawResponseIntentSchema,
]);

export const RitualGateRuntimeSchema = z.object({
  gateRunId: z.string().min(1),
  journeyCycleId: z.string().min(1),
  gateId: z.number().int().min(1).max(7),
  status: z.enum(["not_started", "active", "paused", "blocked", "completed"]),
  currentRuntimeSceneId: z.string().optional(),
  lastStableRuntimeSceneId: z.string().optional(),
  stateRevision: z.number().int().nonnegative(),
  sceneVisits: z.record(z.string(), SceneVisitRecordSchema),
  sceneVisitOrder: z.array(z.string()),
  responses: z.record(z.string(), RitualResponseRecordSchema),
  gateAct: GateActRecordSchema.optional(),
  evidenceEvents: z.array(EvidenceEventSchema),
  safety: RitualSafetyRuntimeSchema,
  validation: z.record(
    z.string(),
    z.object({
      value: z.boolean(),
      source: z.string(),
      updatedAtUtc: z.string().datetime({ offset: true }),
      routeBindingRevision: z.number().int().nonnegative().optional(),
      stale: z.boolean().optional(),
    }),
  ),
  activeManifest: ActiveManifestReferenceSchema.optional(),
  commandReceipts: z.array(ParticipantCommandReceiptSchema).max(200),
  pendingOutbox: z.array(RitualOutboxRecordSchema),
  startedAtUtc: z.string().datetime({ offset: true }).optional(),
  completedAtUtc: z.string().datetime({ offset: true }).optional(),
  updatedAtUtc: z.string().datetime({ offset: true }),
});

export const RitualRuntimeRootSchema = z.object({
  schemaVersion: z.literal(1),
  participantId: z.string().min(1),
  privacyMode: ParticipantPrivacyModeSchema,
  researchPermission: ResearchPermissionSchema,
  isTestCycle: z.boolean(),
  activeGateRunId: z.string().optional(),
  gateRuns: z.record(z.string(), RitualGateRuntimeSchema),
  createdAtUtc: z.string().datetime({ offset: true }),
  updatedAtUtc: z.string().datetime({ offset: true }),
});

export type RitualRuntimeRoot = z.infer<typeof RitualRuntimeRootSchema>;
export type RitualGateRuntime = z.infer<typeof RitualGateRuntimeSchema>;
export type ParticipantCommandReceipt = z.infer<typeof ParticipantCommandReceiptSchema>;
export type SceneVisitRecord = z.infer<typeof SceneVisitRecordSchema>;
export type RitualOutboxRecord = z.infer<typeof RitualOutboxRecordSchema>;
