export type GateMeta = {
  id: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  name: string;
  epithet: string;
  // hidden routes — not in nav, only reachable from within the gate's flow
  thresholdCopy: string[]; // paragraphs, measured reveal
  encounterCopy: string[];
  reflectionPrompt: string;
  // constellation position (percent on the constellation canvas)
  pos: { x: number; y: number };
};

export const GATES: GateMeta[] = [
  {
    id: 1,
    name: "Gate of the First Threshold",
    epithet: "Where the wall is named.",
    pos: { x: 50, y: 88 },
    thresholdCopy: [
      "You have arrived at a wall you have learned to call permanent.",
      "Before you step through, the wall will be named — by you, not by the gate.",
      "This is not preparation. This is the work.",
    ],
    encounterCopy: [
      "Look at the wall. Do not soften it. Do not explain it.",
      "What is one true sentence you can say about it?",
      "Write it as you would write something only you will ever read.",
    ],
    reflectionPrompt: "Name the wall.",
  },
  { id: 2, name: "Gate of the Inheritance",  epithet: "Of what was given without consent.", pos: { x: 25, y: 70 }, thresholdCopy: ["This gate is sealed."], encounterCopy: [], reflectionPrompt: "" },
  { id: 3, name: "Gate of the Mirror",        epithet: "Where the face is met.",            pos: { x: 75, y: 70 }, thresholdCopy: ["This gate is sealed."], encounterCopy: [], reflectionPrompt: "" },
  { id: 4, name: "Gate of the Marrow",        epithet: "Where the lineage rearranges.",     pos: { x: 18, y: 45 }, thresholdCopy: ["This gate is sealed."], encounterCopy: [], reflectionPrompt: "" },
  { id: 5, name: "Gate of the Quiet Yes",     epithet: "Built from a thousand refusals.",   pos: { x: 82, y: 45 }, thresholdCopy: ["This gate is sealed."], encounterCopy: [], reflectionPrompt: "" },
  { id: 6, name: "Gate of Ash and Petal",     epithet: "What burned. What remains.",        pos: { x: 35, y: 22 }, thresholdCopy: ["This gate is sealed."], encounterCopy: [], reflectionPrompt: "" },
  { id: 7, name: "Gate of No Name",           epithet: "—",                                  pos: { x: 65, y: 22 }, thresholdCopy: ["This gate is not described."], encounterCopy: [], reflectionPrompt: "" },
];

export function gateById(id: number) {
  return GATES.find((g) => g.id === id);
}
