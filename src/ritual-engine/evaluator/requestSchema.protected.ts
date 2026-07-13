import { z } from "zod";
import type { CanonicalQuestionId, CanonicalRouteId, CanonicalSceneId } from "../domain/ids";
import { EvaluationTargetKindSchema } from "./policyTypes.protected";

const RuntimeBindingSchema = z
  .object({
    manifestInstanceId: z.string().min(1),
    manifestDigest: z.string().min(1),
    gateManifestVersion: z.string().min(1),
    stage: z.enum(["pre_route", "active_route", "completion"]),
    routeBinding: z
      .object({
        protectedRouteId: z.custom<CanonicalRouteId>((value) => typeof value === "string"),
        routeToken: z.string().min(1),
        routeBindingRevision: z.number().int().nonnegative(),
      })
      .strict()
      .optional(),
  })
  .strict();

const ReflectionTargetSchema = z
  .object({
    kind: z.literal("reflection"),
    responseId: z.string().min(1),
    responseState: z.enum(["draft", "grounded", "provisional", "not_yet_formed"]),
    text: z.string().optional(),
    structuredSummary: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
      .optional(),
    storageClass: z.enum(["persistent_private", "structured_only", "session_only"]),
  })
  .strict();

const ActiveGateActEvaluationViewSchema = z
  .object({
    gateActId: z.string().min(1),
    act: z.string(),
    immediateMicroAct: z.string(),
    context: z.string().optional(),
    continuationAction: z.string().optional(),
    status: z.enum([
      "draft",
      "formed",
      "accepted",
      "abandoned_without_judgment",
      "completed_but_superseded",
    ]),
    routeBindingRevision: z.number().int().nonnegative().optional(),
    stale: z.boolean().optional(),
  })
  .strict();

const QualifyingEvidenceSummarySchema = z
  .object({
    evidenceEventId: z.string().min(1),
    gateActId: z.string().min(1),
    eventType: z.literal("micro_act_completed"),
    participantAttestation: z.literal("occurred_outside_reflection"),
    mode: z.enum(["completion_marker", "self_attested_description", "safe_witness"]),
    description: z.string().optional(),
    routeBindingRevision: z.number().int().nonnegative().optional(),
    stale: z.boolean().optional(),
  })
  .strict();

const ReadinessTargetSchema = z
  .object({
    kind: z.literal("readiness"),
    responseId: z.string().min(1),
    responseState: z.enum(["draft", "grounded", "provisional", "not_yet_formed"]),
    text: z.string().optional(),
    structuredSummary: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
      .optional(),
    storageClass: z.enum(["persistent_private", "structured_only", "session_only"]),
    activeGateAct: ActiveGateActEvaluationViewSchema.optional(),
    qualifyingEvidence: z.array(QualifyingEvidenceSummarySchema),
  })
  .strict();

const StanceTargetSchema = z
  .object({
    kind: z.literal("stance_selection"),
    selectedOptionIndex: z.number().int().nonnegative(),
  })
  .strict();

const GateActTargetSchema = z
  .object({
    kind: z.literal("gate_act"),
    gateActId: z.string().min(1),
    act: z.string(),
    context: z.string().optional(),
    immediateMicroAct: z.string(),
    continuationAction: z.string().optional(),
    safetySelfReport: z.enum(["safe", "unsure", "not_safe"]),
  })
  .strict();

const EvidenceTargetSchema = z
  .object({
    kind: z.literal("evidence"),
    evidenceEventId: z.string().min(1),
    gateActId: z.string().min(1),
    eventType: z.enum(["micro_act_completed", "continuation_scheduled"]),
    participantAttestation: z.enum(["occurred_outside_reflection", "scheduled_only"]),
    mode: z.enum(["completion_marker", "self_attested_description", "safe_witness"]),
    description: z.string().optional(),
    routeBindingRevision: z.number().int().nonnegative().optional(),
    stale: z.boolean().optional(),
    activeGateAct: ActiveGateActEvaluationViewSchema.optional(),
    activeRouteBindingRevision: z.number().int().nonnegative().optional(),
  })
  .strict();

export const ProtectedEvaluationTargetSchema = z.discriminatedUnion("kind", [
  ReflectionTargetSchema,
  ReadinessTargetSchema,
  StanceTargetSchema,
  GateActTargetSchema,
  EvidenceTargetSchema,
]);

export const ProtectedEvaluationRequestSchema = z
  .object({
    schemaVersion: z.literal(1),
    evaluationRequestId: z.string().min(1),
    participantId: z.string().min(1),
    journeyCycleId: z.string().min(1),
    gateRunId: z.string().min(1),
    gateId: z.literal(1),
    sourceParticipantCommandId: z.string().min(1),
    commandKind: z.string().min(1),
    expectedStateRevision: z.number().int().nonnegative(),
    runtimeSceneId: z.string().min(1),
    runtimeInteractionId: z.string().min(1).optional(),
    runtimeQuestionId: z.string().min(1).optional(),
    canonicalSceneId: z.custom<CanonicalSceneId>((value) => typeof value === "string"),
    canonicalQuestionId: z
      .custom<CanonicalQuestionId>((value) => typeof value === "string")
      .optional(),
    policyId: z.string().min(1),
    policyVersion: z.literal(1),
    targetKind: EvaluationTargetKindSchema,
    runtimeBinding: RuntimeBindingSchema,
    routeToken: z.string().min(1).optional(),
    routeBindingRevision: z.number().int().nonnegative().optional(),
    target: ProtectedEvaluationTargetSchema,
    inputDigest: z.string().min(1),
    issuedAtUtc: z.string().datetime({ offset: true }),
  })
  .strict();

export type ProtectedEvaluationRequest = z.infer<typeof ProtectedEvaluationRequestSchema>;
export type ProtectedEvaluationTarget = z.infer<typeof ProtectedEvaluationTargetSchema>;
