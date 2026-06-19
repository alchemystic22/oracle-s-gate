import type { GateContent } from "./gate-content";

export const GATE_5_CONTENT: GateContent = {
  id: 5,
  numberLabel: "Gate 5",
  name: "The Speaking Flame",
  subtitle: "Where Word Becomes World.",
  // FLAGGED FOR OWNER REVIEW — drafted inscription
  inscription: "Verbum Caro Fit",
  inscriptionTranslation: "The Word Becomes Flesh",
  // Owner-supplied canonical image. Letterbox — never crop — so the painted
  // arch, the speaking flame, and the open book at the figure's feet remain
  // visible. Aspect matches Gate 4's canonical 1024x1536.
  thresholdImage: "/assets/gates/gate-5/threshold.png",
  thresholdAspect: "1024 / 1536",
  thresholdRitualOverlays: false,

  headerEpithet: "Gate 5 — The Speaking Flame",
  thresholdCopy: `The Gate stands before you.
It does not require haste.
It requires arrival.`,
  encounterParas: [
    "There is a word in you that has been waiting for a body.",
    "Some truths shape the room while remaining unspoken. Some lights went dim only because they stopped being fed. A word without action stays a wish. An action without word stays unconscious.",
    "This Gate does not ask you to declare, proclaim, or win.",
    "It asks whether your word and your life are aligned enough for one to become the other.",
  ],
  encounterQuestion:
    "What word in you has been waiting to become real through action?",
  encounterSubmitHint:
    "There is no answer here that is too small. Name only what is true in this moment.",
  obstructionParas: [
    "The Gate has not refused you. It is not measuring eloquence.",
    "Something is asking to find its body before passage continues. Two unspoken things rise within you. Both are true.",
    "Choose the one that is more true in this moment.",
  ],
  stanceCards: [
    {
      text: "There is a truth I have not spoken because saying it would change everything around me.",
      route: "unspoken_truth",
    },
    {
      text: "There is a light in me — a gift or direction — that went quiet because I stopped feeding it.",
      route: "forgotten_light",
    },
  ],
  closingCopy: `Gate 5 has been crossed.

The word has been given a body. Nothing was declared for an audience. Nothing was spoken that the next action could not carry.

The next threshold has opened. It does not require you to enter today.`,
};
