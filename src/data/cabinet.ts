// 12 original mystical-toned placeholder passages. All marked placeholder.
export type CabinetPassage = {
  id: string;
  title: string;       // hidden until drawn
  body: string;
  placeholder: true;
};

export const PASSAGES: CabinetPassage[] = [
  { id: "p1", title: "On the First Threshold", body: "Before the gate there is no gate. There is only a wall you have learned to call permanent. The wall does not move. You move. The gate is the place where you stopped agreeing with the wall.", placeholder: true },
  { id: "p2", title: "The Weight of the Unnamed", body: "Whatever you will not name, you will carry. Naming does not remove the weight; it only ends the pretense that you were not carrying it.", placeholder: true },
  { id: "p3", title: "On Slowness", body: "The fast path teaches the body that nothing was true. The slow path teaches the body that something was. Choose accordingly. The body remembers what it was made to outrun.", placeholder: true },
  { id: "p4", title: "Of Mirrors and Marrow", body: "The mirror reflects the face. The marrow remembers the inheritance. A teaching that touches the mirror only is cosmetic; a teaching that touches the marrow rearranges the lineage.", placeholder: true },
  { id: "p5", title: "On Witness", body: "To witness is not to fix. To fix before you have witnessed is to bury the wound under a remedy. Sit longer than is comfortable. The remedy will arrive better dressed.", placeholder: true },
  { id: "p6", title: "The Two Silences", body: "There is the silence that hides, and the silence that holds. The first is a wall built quickly. The second is a room built slowly. Learn the difference by which one you can breathe inside.", placeholder: true },
  { id: "p7", title: "On the Refusal", body: "A sovereign yes is built from a thousand small refusals. Each refusal is a brick. The temple is not a feeling; it is a wall of refusals through which only the true thing can pass.", placeholder: true },
  { id: "p8", title: "Of the Inheritance", body: "Some of what you carry is yours. Most is not. The work is not to drop it all at once — that is only a louder kind of carrying. The work is to set down one piece, name it, and walk on.", placeholder: true },
  { id: "p9", title: "On the Quiet Yes", body: "The yes that is loud is often the no in costume. Listen for the yes that arrives without performance. It is usually shorter than you expected, and older.", placeholder: true },
  { id: "p10", title: "Ash and Petal", body: "What burned was not you. What remains is not less of you. The ash is the proof that something was held long enough to be released. The petal is the proof that something else was kept.", placeholder: true },
  { id: "p11", title: "Of the Gate That Does Not Open", body: "Some gates are not for opening. They are for standing in front of, year after year, until the part of you that demanded entry has died of its own demand. Then the gate is no longer a gate.", placeholder: true },
  { id: "p12", title: "On Returning", body: "You will return to this teaching as a different person than the one who first read it. The teaching will not have changed. The shift in what it says is the measurement of your work.", placeholder: true },
];

export function passageById(id: string) {
  return PASSAGES.find((p) => p.id === id);
}

// Drawing: deterministic-ish pseudo-random, avoid repeating recently drawn.
export function drawNextPassageId(alreadyDrawn: string[]): string {
  const remaining = PASSAGES.filter((p) => !alreadyDrawn.slice(-6).includes(p.id));
  const pool = remaining.length > 0 ? remaining : PASSAGES;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx].id;
}
