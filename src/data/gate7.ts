// Gate 7 — The Vanishing Star.
//
// CANONICAL STRUCTURAL NOTE: Gate 7 is intentionally NOT a corrective gate.
// It has no Book emergence, no Spiral route, no Layer 3 stance choice, no
// subtitle, no inscription, no encounter/obstruction phase. These are
// canonical absences. Do not "fill them in" with content. The orchestrator
// at src/routes/gate.$gateId.tsx branches on `id === 7` and renders the
// Gate 7 surfaces directly, bypassing the corrective pipeline. This module
// is therefore deliberately NOT registered in src/data/gates-content.ts.

export const GATE_7 = {
  id: 7 as const,
  numberLabel: "Gate 7",
  name: "The Vanishing Star",

  // Owner-supplied canonical thresholds. Letterbox — never crop.
  thresholdImage: "/assets/gates/gate-7/threshold.png",
  thresholdAspect: "1024 / 1536",

  vanishingStarMomentImage: "/assets/gates/gate-7/vanishing-star-moment.png",
  vanishingStarMomentAspect: "1024 / 1536",

  thresholdCopy: `The work remains.
The name grows quiet.
What was built no longer asks to be owned.`,

  bookClosureCopy: `The Book closes.
No hidden page opens here.
The final Gate does not correct the Architect.
It asks what can remain when the name steps back.`,

  recordOpeningCopy: `The Final Ritual Record opens.
Not to repair what is broken.
To witness what is released.`,

  recordFields: [
    {
      id: "what_was_built",
      label: "What Was Built",
      prompt:
        "What has been built through this journey that no longer needs the name to stand in front of it?",
      placeholder:
        "Name the work, field, transmission, pattern, vow, or architecture that can remain.",
    },
    {
      id: "source_claim",
      label: "The Source-Claim",
      prompt: "Where does the name still want to be recognized as the source?",
      placeholder:
        "Name the claim gently: credit, authorship, visibility, proof, control, legacy, or another attachment.",
    },
    {
      id: "what_is_being_released",
      label: "What Is Being Released",
      prompt:
        "What part of source-claim are you ready to release without abandoning responsibility?",
      placeholder: "Release the claim, not the responsibility.",
    },
    {
      id: "what_remains_in_the_field",
      label: "What Remains in the Field",
      prompt: "What remains alive in the field even if the name grows quiet?",
      placeholder:
        "Name the effect, transmission, pattern, teaching, work, or presence that can continue.",
    },
    {
      id: "responsibility_that_remains",
      label: "Responsibility That Remains",
      prompt:
        "What responsibility remains even after the need for recognition is released?",
      placeholder:
        "Name the care, stewardship, protection, maintenance, or service that remains yours to honor.",
    },
    {
      id: "final_release_statement",
      label: "Final Release Statement",
      prompt:
        "Write the sentence that releases the work from needing your name in front of it.",
      placeholder: "Let the sentence be quiet, exact, and free of self-erasure.",
    },
  ] as const,

  releaseExamples: [
    "The work may live without my name standing before it.",
    "I release the need to be recognized as the source while remaining faithful to the field.",
    "What was built may serve beyond my claim to it.",
    "The name steps back. The work remains.",
    "I release ownership without abandoning stewardship.",
  ],

  whatThisIsNot: [
    "I disappear.",
    "I no longer matter.",
    "I erase myself.",
    "I abandon the work.",
    "Nothing matters now.",
    "The self must die.",
    "I give up all responsibility.",
  ],

  safeReleaseChecks: [
    "I am releasing source-claim, not disappearing from life.",
    "I am releasing ownership, not abandoning responsibility.",
    "I am allowing the work to remain without needing my name in front of it.",
    "My final release statement does not erase the being, deny worth, or collapse responsibility.",
    "The Book remains closed. No hidden page opens here.",
  ],

  privacyNote:
    "Final Record entries may be kept private. Completion does not require storing the full release statement.",

  completionSealCopy: `The name has stepped back.
The work remains.
The final record is sealed.`,

  completionFinalCopy: `The star vanishes from the center.
The field remembers the light.`,
};

export type Gate7FieldId = (typeof GATE_7.recordFields)[number]["id"];
