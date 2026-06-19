import type { GateContent } from "./gate-content";

export const GATE_1_CONTENT: GateContent = {
  id: 1,
  numberLabel: "Gate 1",
  name: "The Broken Vow",
  subtitle: "Where the world's promise fractures, and the soul begins to see.",
  thresholdImage: "/assets/gates/gate-1/threshold.jpg",
  thresholdAspect: "1024 / 1536",
  headerEpithet: "Gate 1 — The Broken Vow",
  thresholdCopy: `The Gate stands before you.
It does not require haste.
It requires arrival.`,
  encounterParas: [
    "Something promised you the world.",
    "Not the literal world — but a way the world would be if you obeyed its rules. A way it would be safe. A way it would reward you. A way it would not betray you if you stayed inside its lines.",
    "That promise has broken.",
    "Or it is breaking now.",
  ],
  encounterQuestion: "What promise of the world broke for you?",
  encounterSubmitHint: "There is no answer here that is too small.",
  obstructionParas: [
    "The Gate stands closed.",
    "Not because your answer was wrong. The Gate is not measuring correctness.",
    "Something is asking to be seen before passage continues.",
    "Two responses rise within you when a promise breaks. Both are honest.",
    "Choose the one that is more true in this moment.",
  ],
  stanceCards: [
    { text: "I see what was false. I am no longer bound by it.", route: "false_arrival" },
    { text: "I see what was false. I cannot trust what comes next.", route: "splintered_trust" },
  ],
  closingCopy: `Gate 1 has been crossed.

The Book remembers. The Codex remembers. You may now return to the Sovereign Action Layer, or remain in stillness.

The next threshold has opened. It does not require you to enter today.`,
};
