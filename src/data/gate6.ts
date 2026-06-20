import type { GateContent } from "./gate-content";

export const GATE_6_CONTENT: GateContent = {
  id: 6,
  numberLabel: "Gate 6",
  name: "The Mirror Crown",
  subtitle: "You have seen your pattern, Architect. Now build it.",
  // FLAGGED FOR OWNER REVIEW — drafted inscription
  inscription: "Corona Ex Fragmentis",
  inscriptionTranslation: "A Crown From the Fragments",
  // Owner-supplied canonical image. Letterbox — never crop.
  thresholdImage: "/assets/gates/gate-6/threshold.png",
  thresholdAspect: "1024 / 1536",
  thresholdRitualOverlays: false,

  headerEpithet: "Gate 6 — The Mirror Crown",
  thresholdCopy: `The Gate stands before you.
It does not require haste.
It requires arrival.`,
  encounterParas: [
    "You have seen the pattern now.",
    "A wound that wore different clothing. A success that kept its shape across years. A symbol that returned and returned. The fragments are not random — but fragments are not yet blueprint.",
    "This Gate does not ask you to declare destiny or crown the pattern.",
    "It asks whether what recurs in you can be held — all of it, without rejecting the piece that does not fit, without inflating the pattern into proof, without erasing the face that was removed to keep the pattern acceptable.",
  ],
  encounterQuestion:
    "What pattern in you is ready to be held as architecture, not just seen as fate?",
  encounterSubmitHint:
    "There is no answer here that is too small. Name only what is true in this moment.",
  obstructionParas: [
    "The Gate has not refused you. It is not measuring how complete your pattern is.",
    "Something is asking to be held before passage continues. Two ways the pattern resists becoming crown rise within you. Both are true.",
    "Choose the one that is more true in this moment.",
  ],
  stanceCards: [
    {
      text: "I can see the pattern repeating, but the pieces are too scattered to build anything from yet.",
      route: "fractured_pattern",
    },
    {
      text: "To keep the pattern acceptable, I erased a part of myself — and it still belongs to the whole.",
      route: "erased_face",
    },
  ],
  closingCopy: `Gate 6 has been crossed.

The pattern has been held without being crowned too soon. Nothing was inflated into destiny. No fragment was erased to make it neat.

The next threshold has opened. It does not require you to enter today.`,
};
