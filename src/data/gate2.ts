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
    "The fire at this Gate is not punishment. It does not consume what is real.",
    "It consumes the rehearsed self. The performed voice. The borrowed conviction. The script you have been speaking that was never yours to begin with.",
    "What enters this fire is not who you have presented to the world. What walks through is what survived the burning.",
    "Stand close enough to feel the heat.",
  ],
  encounterQuestion:
    "What part of yourself have you been speaking that was never truly yours?",
  encounterSubmitHint:
    "There is no answer here that is too small. Name only what burns when you write it.",
  obstructionParas: [
    "The Gate has not refused you. The fire is not measuring courage.",
    "Something is asking to be seen before passage continues. Two responses rise within you when the false self is named. Both are honest.",
    "Choose the one more true in this moment.",
  ],
  stanceCards: [
    {
      text: "I have spoken what was given to me, but the words burned my own tongue.",
      route: "burned_tongue",
    },
    {
      text: "I have kept silent where my own fire wanted to speak.",
      route: "silenced_fire",
    },
  ],
  closingCopy: `Gate 2 has been crossed.

The Book remembers. The Codex remembers. The fire knows what it consumed and what it left.

The next threshold has opened. It does not require you to enter today.`,
};
