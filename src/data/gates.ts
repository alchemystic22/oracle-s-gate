export type GateMeta = {
  id: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  name: string;
  epithet: string;
  pos: { x: number; y: number };
};

export const GATES: GateMeta[] = [
  { id: 1, name: "The Broken Vow",       epithet: "Where the world's promise fractures, and the soul begins to see.", pos: { x: 50, y: 88 } },
  { id: 2, name: "The Inheritance",      epithet: "Of what was given without consent.",                                pos: { x: 25, y: 70 } },
  { id: 3, name: "The Mirror",           epithet: "Where the face is met.",                                            pos: { x: 75, y: 70 } },
  { id: 4, name: "The Marrow",           epithet: "Where the lineage rearranges.",                                     pos: { x: 18, y: 45 } },
  { id: 5, name: "The Quiet Yes",        epithet: "Built from a thousand refusals.",                                   pos: { x: 82, y: 45 } },
  { id: 6, name: "Ash and Petal",        epithet: "What burned. What remains.",                                        pos: { x: 35, y: 22 } },
  { id: 7, name: "No Name",              epithet: "—",                                                                  pos: { x: 65, y: 22 } },
];

export function gateById(id: number) {
  return GATES.find((g) => g.id === id);
}
