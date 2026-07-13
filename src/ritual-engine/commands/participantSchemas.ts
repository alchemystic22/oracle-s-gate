import { z } from "zod";
import { isOpaqueIdentifier } from "../compiler/opaqueIds";

const opaqueId = z.string().refine(isOpaqueIdentifier, "Runtime identifier must be opaque");
const safeSummaryKey = z
  .string()
  .min(1)
  .refine((key) => !/(?:canonical|protected|route.?id|scene.?id|question.?id)/i.test(key));
const structuredSummary = z.record(safeSummaryKey, z.union([z.string(), z.number(), z.boolean()]));

const AcknowledgeSceneCommandSchema = z
  .object({
    kind: z.literal("acknowledge_scene"),
    runtimeInteractionId: opaqueId,
  })
  .strict();

const SubmitResponseCommandSchema = z
  .object({
    kind: z.literal("submit_response"),
    runtimeInteractionId: opaqueId,
    runtimeQuestionId: opaqueId,
    responseId: z.string().min(1),
    text: z.string().optional(),
    structuredSummary: structuredSummary.optional(),
    declaredState: z.enum(["draft", "not_yet_formed"]),
  })
  .strict();

const SelectOptionCommandSchema = z
  .object({
    kind: z.literal("select_option"),
    runtimeInteractionId: opaqueId,
    runtimeQuestionId: opaqueId,
    responseId: z.string().min(1),
    optionIndex: z.number().int().nonnegative(),
  })
  .strict();

const SubmitGateActCommandSchema = z
  .object({
    kind: z.literal("submit_gate_act"),
    runtimeInteractionId: opaqueId,
    gateActId: z.string().min(1),
    act: z.string(),
    context: z.string().optional(),
    immediateMicroAct: z.string(),
    continuationAction: z.string().optional(),
    safetySelfReport: z.enum(["safe", "unsure", "not_safe"]),
  })
  .strict();

const EvidenceBaseShape = {
  kind: z.literal("record_evidence"),
  runtimeInteractionId: opaqueId,
  evidenceEventId: z.string().min(1),
  gateActId: z.string().min(1),
  mode: z.enum(["completion_marker", "self_attested_description", "safe_witness"]),
  description: z.string().optional(),
  occurredAtUtc: z.string().datetime({ offset: true }),
};

const RecordEvidenceCommandSchema = z.discriminatedUnion("eventType", [
  z
    .object({
      ...EvidenceBaseShape,
      eventType: z.literal("micro_act_completed"),
      participantAttestation: z.literal("occurred_outside_reflection"),
    })
    .strict(),
  z
    .object({
      ...EvidenceBaseShape,
      eventType: z.literal("continuation_scheduled"),
      participantAttestation: z.literal("scheduled_only"),
    })
    .strict(),
]);

const RequestRouteReassessmentCommandSchema = z
  .object({ kind: z.literal("request_route_reassessment") })
  .strict();

const InvokeSceneActionCommandSchema = z
  .object({
    kind: z.literal("invoke_scene_action"),
    intent: z.enum(["continue", "seal", "complete"]),
    runtimeTransitionId: opaqueId.optional(),
  })
  .strict();

const PauseRunCommandSchema = z.object({ kind: z.literal("pause_run") }).strict();
const ResumeRunCommandSchema = z.object({ kind: z.literal("resume_run") }).strict();

export const ParticipantCommandSchema = z.union([
  AcknowledgeSceneCommandSchema,
  SubmitResponseCommandSchema,
  SelectOptionCommandSchema,
  SubmitGateActCommandSchema,
  RecordEvidenceCommandSchema,
  RequestRouteReassessmentCommandSchema,
  InvokeSceneActionCommandSchema,
  PauseRunCommandSchema,
  ResumeRunCommandSchema,
]);

export const ParticipantCommandEnvelopeSchema = z
  .object({
    schemaVersion: z.literal(1),
    commandId: z.string().min(1),
    participantId: z.string().min(1),
    journeyCycleId: z.string().min(1),
    gateRunId: z.string().min(1),
    gateId: z.literal(1),
    manifestInstanceId: opaqueId,
    manifestDigest: z.string().min(1),
    manifestStage: z.enum(["pre_route", "active_route", "completion"]),
    expectedStateRevision: z.number().int().nonnegative(),
    runtimeSceneId: opaqueId,
    routeToken: opaqueId.optional(),
    routeBindingRevision: z.number().int().nonnegative().optional(),
    issuedAtUtc: z.string().datetime({ offset: true }),
    command: ParticipantCommandSchema,
  })
  .strict()
  .superRefine((envelope, ctx) => {
    const hasRouteBinding =
      envelope.routeToken !== undefined && envelope.routeBindingRevision !== undefined;
    if (envelope.manifestStage === "active_route" && !hasRouteBinding) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Active route binding is required" });
    }
    if (
      envelope.manifestStage !== "active_route" &&
      (envelope.routeToken !== undefined || envelope.routeBindingRevision !== undefined)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Route binding is prohibited for this stage",
      });
    }
  });

export type ParticipantCommand = z.infer<typeof ParticipantCommandSchema>;
export type ParticipantCommandEnvelope = z.infer<typeof ParticipantCommandEnvelopeSchema>;
