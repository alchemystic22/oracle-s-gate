import { z } from "zod";

const prohibitedKeys = new Set([
  "rawText",
  "reflectionText",
  "journal",
  "journalText",
  "canonicalRouteId",
  "canonicalSceneId",
  "canonicalQuestionId",
  "personName",
  "safetyDetail",
]);

function findProhibitedMetadataKeys(value: unknown, path: string[] = []): string[] {
  if (!value || typeof value !== "object") return [];

  return Object.entries(value).flatMap(([key, nestedValue]) => {
    const nextPath = [...path, key];
    const matches = prohibitedKeys.has(key) ? [nextPath.join(".")] : [];
    return [...matches, ...findProhibitedMetadataKeys(nestedValue, nextPath)];
  });
}

const MetadataSchema = z.record(z.string(), z.unknown()).superRefine((obj, ctx) => {
  for (const key of findProhibitedMetadataKeys(obj)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Prohibited participant event metadata key: ${key}`,
    });
  }
});

export const ParticipantJourneyEventSchema = z
  .object({
    eventId: z.string().min(1),
    journeyCycleId: z.string().min(1),
    gateRunId: z.string().min(1),
    gateId: z.number().int().min(1).max(7),
    runtimeSceneId: z.string().optional(),
    eventType: z.string().min(1),
    metadata: MetadataSchema,
    occurredAtUtc: z.string().datetime({ offset: true }),
    isTestCycle: z.boolean(),
  })
  .strict();

export const ProtectedJourneyEventSchema = z.object({
  eventId: z.string().min(1),
  journeyCycleId: z.string().min(1),
  gateRunId: z.string().min(1),
  gateId: z.number().int().min(1).max(7),
  canonicalSceneId: z.string().optional(),
  canonicalRouteId: z.string().optional(),
  eventType: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()),
  occurredAtUtc: z.string().datetime({ offset: true }),
  isTestCycle: z.boolean(),
});
