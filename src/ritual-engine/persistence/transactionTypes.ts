import type { ParticipantPrivacyMode } from "../domain/privacy";
import type { RitualRuntimeRoot } from "../domain/runtime";

export type TransactionPromotionMarker = {
  participantId: string;
  gateRunId: string;
  stateRevision: number;
  manifestInstanceId?: string;
  manifestDigest?: string;
  completedAtUtc: string;
};

export type TransactionCommitRequest = {
  expectedStateRevision: number;
  gateRunId: string;
  privacyMode: ParticipantPrivacyMode;
  nextRuntime: RitualRuntimeRoot;
  confirmStableScene: boolean;
  confirmedAtUtc: string;
};

export type TransactionCommitResult = {
  runtime: RitualRuntimeRoot;
  stableSceneConfirmed: boolean;
};
