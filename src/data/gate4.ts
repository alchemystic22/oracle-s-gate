import type { GateContent } from "./gate-content";

export const GATE_4_CONTENT: GateContent = {
  id: 4,
  numberLabel: "Gate 4",
  name: "The Echoed Self",
  subtitle: "A thousand masks cannot keep you. Here they fall away.",
  // FLAGGED FOR OWNER REVIEW — drafted inscription
  inscription: "Nomen Sub Nomine",
  inscriptionTranslation: "The Name Beneath the Name",
  // Owner-supplied canonical image. Letterbox — never crop — so the painted
  // inscription on the arch and the fallen masks on the ground remain visible.
  thresholdImage: "/assets/gates/gate-4/threshold.png",
  thresholdAspect: "1024 / 1536",
  thresholdRitualOverlays: false,

  headerEpithet: "Gate 4 — The Echoed Self",
  thresholdCopy: `The Gate stands before you.
It does not require haste.
It requires arrival.`,
  encounterParas: [
    "There is a name the world learned to call you.",
    "Responsible. Gifted. Difficult. Strong. Pleasant. Useful. Special. Safe. Perhaps it was never spoken aloud, but every room rewarded it — and so the name became a face, and the face became a rule.",
    "This Gate does not ask you to hate the name that helped you survive.",
    "It asks you to see where that name still answers before truth can speak.",
  ],
  encounterQuestion:
    "What part of you learned to perform so well that you began to mistake it for yourself?",
  encounterSubmitHint:
    "There is no answer here that is too small. Name only what is true in this moment.",
  obstructionParas: [
    "The Gate has not refused you. It is not measuring authenticity.",
    "Something is asking to be distinguished before passage continues. Two echoes rise within you. Both are true.",
    "Choose the one that is more true in this moment.",
  ],
  stanceCards: [
    {
      text: "There is a name the world praised that still answers before the truer one can speak.",
      route: "doubled_name",
    },
    {
      text: "There is something I keep hidden and call sacred, when underneath it is fear.",
      route: "binding_veil",
    },
  ],
  closingCopy: `Gate 4 has been crossed.

The echo has been distinguished from the signal. Nothing was destroyed. Nothing was forced into the open.

The next threshold has opened. It does not require you to enter today.`,
};
