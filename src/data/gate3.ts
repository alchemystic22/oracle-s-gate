import type { GateContent } from "./gate-content";

export const GATE_3_CONTENT: GateContent = {
  id: 3,
  numberLabel: "Gate 3",
  name: "The Stone Garden of Grief",
  subtitle: "Weeping willows whisper of sorrows sealed in stone.",
  // FLAGGED FOR OWNER REVIEW — drafted inscription
  inscription: "Dolor in Silentio",
  inscriptionTranslation: "Grief in Silence",
  thresholdImage: "/assets/gates/gate-3/threshold.jpg",
  // Owner-supplied canonical image native aspect (571 × 847). The frame
  // adopts the image's native shape so MEMORIA inscription and the ground
  // offerings (quill, keys, scattered tokens) remain visible without cropping.
  thresholdAspect: "571 / 847",
  thresholdRitualOverlays: false,

  headerEpithet: "Gate 3 — The Stone Garden of Grief",
  thresholdCopy: `The Gate stands before you.
It does not require haste.
It requires arrival.`,
  encounterParas: [
    "Some sorrow was never allowed to be sorrow.",
    "It was made useful. Made composed. Made wise too quickly. It learned to stand while something inside remained kneeling.",
    "This Gate does not ask you to explain the grief, or heal it, or find its meaning.",
    "It asks only that what was buried be allowed to be seen.",
  ],
  encounterQuestion:
    "What grief have you carried without being allowed to set it down?",
  encounterSubmitHint:
    "There is no answer here that is too small. Name only what is true in this moment.",
  obstructionParas: [
    "The Gate has not refused you. The stones are not measuring strength.",
    "Something is asking to be seen before passage continues. Two forms of held grief rise within you. Both are true.",
    "Choose the one that is more true in this moment.",
  ],
  stanceCards: [
    {
      text: "There is a sorrow I buried so deeply beneath strength that it has never been seen.",
      route: "hidden_grief",
    },
    {
      text: "I know my grief — I have named it — but my body still will not let it move.",
      route: "withheld_tears",
    },
  ],
  closingCopy: `Gate 3 has been crossed.

The stones have held what you set down. Nothing was rushed. Nothing was forced into meaning.

The next threshold has opened. It does not require you to enter today.`,
};
