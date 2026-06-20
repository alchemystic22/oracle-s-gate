export type GateMeta = {
  id: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  name: string;
  epithet: string;
  pos: { x: number; y: number };
};

export const GATES: GateMeta[] = [
  { id: 1, name: "The Broken Vow",       epithet: "Where the world's promise fractures, and the soul begins to see.", pos: { x: 50, y: 52 } },
  { id: 2, name: "Soul Fire",            epithet: "Only what endures the flame is real.",                              pos: { x: 22, y: 38 } },
  { id: 3, name: "The Stone Garden of Grief", epithet: "Weeping willows whisper of sorrows sealed in stone.",          pos: { x: 78, y: 38 } },
  { id: 4, name: "The Echoed Self",      epithet: "A thousand masks cannot keep you. Here they fall away.",            pos: { x: 14, y: 70 } },
  { id: 5, name: "The Speaking Flame",   epithet: "Where Word Becomes World.",                                         pos: { x: 86, y: 70 } },
  { id: 6, name: "The Mirror Crown",     epithet: "You have seen your pattern, Architect. Now build it.",              pos: { x: 32, y: 16 } },
  // Canonical absence — Gate 7 has no epithet. Master spec: silence is the final transmission.
  { id: 7, name: "The Vanishing Star",    epithet: "",                                                                   pos: { x: 68, y: 16 } },
];

export function gateById(id: number) {
  return GATES.find((g) => g.id === id);
}
