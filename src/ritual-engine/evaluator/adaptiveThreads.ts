import { z } from "zod";
import { ParticipantGuidanceTemplateIdSchema } from "./participantGuidance";

export const AdaptiveThreadStateSchema = z.enum([
  "open",
  "follow_up_issued",
  "satisfied",
  "not_yet_formed",
  "rescale_required",
  "blocked",
  "stale",
]);

export const ParticipantAdaptiveThreadSchema = z
  .object({
    schemaVersion: z.literal(1),
    threadId: z.string().min(1),
    targetRuntimeId: z.string().min(1),
    runtimeSceneId: z.string().min(1),
    runtimeInteractionId: z.string().min(1).optional(),
    runtimeQuestionId: z.string().min(1).optional(),
    sourceParticipantCommandId: z.string().min(1),
    responseId: z.string().min(1).optional(),
    state: AdaptiveThreadStateSchema,
    attemptCount: z.number().int().nonnegative(),
    followupCount: z.union([z.literal(0), z.literal(1)]),
    guidance: z
      .object({
        templateId: ParticipantGuidanceTemplateIdSchema,
        prompt: z.string().min(1),
        renderedAtUtc: z.string().datetime({ offset: true }),
      })
      .strict()
      .optional(),
    routeBindingRevision: z.number().int().nonnegative().optional(),
    stale: z.boolean().optional(),
    createdAtUtc: z.string().datetime({ offset: true }),
    updatedAtUtc: z.string().datetime({ offset: true }),
  })
  .strict();

export type ParticipantAdaptiveThread = z.infer<typeof ParticipantAdaptiveThreadSchema>;
export type AdaptiveThreadState = z.infer<typeof AdaptiveThreadStateSchema>;

export interface AdaptiveThreadStore {
  getByTarget(targetRuntimeId: string): ParticipantAdaptiveThread | undefined;
  getBySourceCommand(sourceParticipantCommandId: string): ParticipantAdaptiveThread | undefined;
  upsert(thread: ParticipantAdaptiveThread): void;
  staleByRouteRevision(routeBindingRevision: number, updatedAtUtc: string): void;
  all(): readonly ParticipantAdaptiveThread[];
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class MemoryAdaptiveThreadStore implements AdaptiveThreadStore {
  private readonly threads = new Map<string, ParticipantAdaptiveThread>();

  getByTarget(targetRuntimeId: string): ParticipantAdaptiveThread | undefined {
    const found = [...this.threads.values()].find(
      (thread) => thread.targetRuntimeId === targetRuntimeId && thread.state !== "stale",
    );
    return found ? clone(found) : undefined;
  }

  getBySourceCommand(sourceParticipantCommandId: string): ParticipantAdaptiveThread | undefined {
    const found = [...this.threads.values()].find(
      (thread) => thread.sourceParticipantCommandId === sourceParticipantCommandId,
    );
    return found ? clone(found) : undefined;
  }

  upsert(thread: ParticipantAdaptiveThread): void {
    this.threads.set(thread.threadId, ParticipantAdaptiveThreadSchema.parse(clone(thread)));
  }

  staleByRouteRevision(routeBindingRevision: number, updatedAtUtc: string): void {
    for (const thread of this.threads.values()) {
      if (thread.routeBindingRevision === routeBindingRevision) {
        this.threads.set(thread.threadId, {
          ...thread,
          state: "stale",
          stale: true,
          updatedAtUtc,
        });
      }
    }
  }

  all(): readonly ParticipantAdaptiveThread[] {
    return [...this.threads.values()].map(clone);
  }
}
