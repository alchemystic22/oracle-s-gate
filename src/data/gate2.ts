import type { GateContent } from "./gate-content";

export const GATE_2_CONTENT: GateContent = {
  id: 2,
  numberLabel: "Gate 2",
  name: "Soul Fire",
  subtitle: "Only what endures the flame is real.",
  inscription: "Verum per Ignem",
  inscriptionTranslation: "Truth through Fire",
  thresholdImage: "/assets/gates/gate-2/threshold.jpg",
  thresholdAspect: "1024 / 1280",
  headerEpithet: "Gate 2 — Soul Fire",
  thresholdCopy: `The Gate stands before you.
It does not require haste.
It requires arrival.`,
  encounterParas: [
    "The flame rises.",
    "It does not consume you.",
    "It asks what is real.",
    "Only what endures the fire is yours to carry through.",
  ],
  encounterQuestion: "What in you has been waiting for fire it could survive?",
  encounterSubmitHint:
    "There is no answer here that is too small. Name only what burns when you write it.",
  obstructionParas: [
    "The Gate has not refused you. The fire is not measuring courage.",
    "Something is asking to be seen before passage continues. Two responses rise within you when the false self is named. Both are honest.",
    "Choose the one more true in this moment.",
  ],
  stanceCards: [
    {
      text: "There is a truth I stopped letting myself speak, because speaking it once cost me.",
      route: "burned_tongue",
    },
    {
      text: "There is a fire in me — anger, desire, creativity — I made quiet to stay acceptable.",
      route: "silenced_fire",
    },
  ],
  closingCopy: `Gate 2 has been crossed.

The Book remembers. The Codex remembers. The fire knows what it consumed and what it left.

The next threshold has opened. It does not require you to enter today.`,
};
