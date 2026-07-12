import type { CanonicalQuestionId } from "../domain/ids";

export type CanonicalQuestionDefinition = {
  canonicalQuestionId: CanonicalQuestionId;
  prompt: string;
  requiresPreparation: boolean;
};
