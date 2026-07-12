import type { CanonicalQuestionDefinition } from "../manifest/questionTypes";
import { canonicalQuestionId } from "./constants";

export const GATE1_QUESTIONS = {
  bridge: {
    canonicalQuestionId: canonicalQuestionId("G1Q-BRIDGE"),
    prompt: "What did you once believe would keep life coherent if you did your part?",
    requiresPreparation: true,
  },
  gateAxis: {
    canonicalQuestionId: canonicalQuestionId("G1Q-AXIS"),
    prompt: "What promise of the world broke for you?",
    requiresPreparation: true,
  },
  falseArrivalAxis: {
    canonicalQuestionId: canonicalQuestionId("G1Q-FA-AXIS"),
    prompt: "Where did you mistake recognition for freedom?",
    requiresPreparation: true,
  },
  splinteredTrustAxis: {
    canonicalQuestionId: canonicalQuestionId("G1Q-ST-AXIS"),
    prompt: "What broke trust so deeply that truth now feels dangerous?",
    requiresPreparation: true,
  },
  finalReadiness: {
    canonicalQuestionId: canonicalQuestionId("G1Q-READINESS"),
    prompt: "Has something changed outside this page—or has the page only been understood?",
    requiresPreparation: true,
  },
} as const satisfies Record<string, CanonicalQuestionDefinition>;
