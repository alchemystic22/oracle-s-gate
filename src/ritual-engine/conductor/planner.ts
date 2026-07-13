import type { ParticipantCommandStatus } from "../commands/result";
import type { RitualReducerAction } from "../runtime/actions";

export type ConductorPlan = {
  gateRunId: string;
  expectedStateRevision: number;
  operations: readonly RitualReducerAction[];
  status: ParticipantCommandStatus;
  participantMessageCode: string;
  sceneChanged: boolean;
};
