import { z } from "zod";
import { ParticipantPrivacyModeSchema } from "./privacy";
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

export const ActiveManifestReferenceSchema = z.object({
  manifestInstanceId: z.string().min(1),
  manifestStage: z.enum(["pre_route", "active_route", "completion"]),
  manifestDigest: z.string().min(1),
  canonicalManifestVersion: z.string().min(1),
  routeToken: z.string().optional(),
  routeBindingRevision: z.number().int().nonnegative().optional(),
  activatedAtUtc: z.string().datetime({ offset: true }),
});

export const RitualOutboxRecordSchema = z.object({
  outboxId: z.string().min(1),
  commandId: z.string().min(1),
  effectType: z.enum([
    "append_journey_event",
    "append_protected_event",
    "mirror_legacy_gate_visit",
    "mirror_legacy_gate_completion",
    "clear_session_response",
    "delete_retired_raw_response",
  ]),
  payload: z.record(z.string(), z.unknown()),
  status: z.enum(["pending", "processing", "completed", "failed_retryable", "failed_terminal"]),
  attemptCount: z.number().int().nonnegative(),
  createdAtUtc: z.string().datetime({ offset: true }),
});

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
    }),
  ),
  activeManifest: ActiveManifestReferenceSchema.optional(),
  pendingOutbox: z.array(RitualOutboxRecordSchema),
  startedAtUtc: z.string().datetime({ offset: true }).optional(),
  completedAtUtc: z.string().datetime({ offset: true }).optional(),
  updatedAtUtc: z.string().datetime({ offset: true }),
});

export const RitualRuntimeRootSchema = z.object({
  schemaVersion: z.literal(1),
  participantId: z.string().min(1),
  privacyMode: ParticipantPrivacyModeSchema,
  researchPermission: z.object({
    allowed: z.boolean(),
    grantedAtUtc: z.string().datetime({ offset: true }).optional(),
  }),
  isTestCycle: z.boolean(),
  activeGateRunId: z.string().optional(),
  gateRuns: z.record(z.string(), RitualGateRuntimeSchema),
  createdAtUtc: z.string().datetime({ offset: true }),
  updatedAtUtc: z.string().datetime({ offset: true }),
});

export type RitualRuntimeRoot = z.infer<typeof RitualRuntimeRootSchema>;
export type RitualGateRuntime = z.infer<typeof RitualGateRuntimeSchema>;
