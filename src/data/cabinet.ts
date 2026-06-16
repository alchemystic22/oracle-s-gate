// The Reading Cabinet offering pool.
// Passages and vessels coexist; the resonance algorithm draws blind to kind.
// All current entries are placeholders. The Avatar will replace passages with
// canonical Codex 1–11 fragments and vessels with the canonical Suno masters
// (same filenames, drop-in swap).

import type { DomainId } from "./domains";

export type OfferingKind = "passage" | "vessel";

type OfferingBase = {
  id: string;
  kind: OfferingKind;
  glyph: string;        // short token for visual rendering
  title: string;        // hidden until selection
  themes: string[];     // resonance keywords
  domain?: DomainId;    // soft domain affinity
  placeholder: true;
};

export type Passage = OfferingBase & {
  kind: "passage";
  body: string;
};

export type Vessel = OfferingBase & {
  kind: "vessel";
  audioSrc: string;
  durationSec: number;
};

export type Offering = Passage | Vessel;

// ── Passages ───────────────────────────────────────────────────────────────
// Voice: measured, declarative. Not therapeutic. Not coaching.
// Hold close to the existing False Arrival / Splintered Trust scrolls.

export const PASSAGES: Passage[] = [
  {
    id: "ps-broken-vow",
    kind: "passage",
    glyph: "I",
    title: "On the Broken Vow",
    domain: "spirit",
    themes: ["vow", "promise", "fracture", "world"],
    placeholder: true,
    body: "There was a vow the world made to you before you could refuse it. That the right effort would be answered. That obedience would be returned in coin. The vow was not signed by anyone with the authority to sign it. When it fractured, you mistook the fracture for your failure. It was not your failure. It was the first true sentence the world spoke to you, and it was: I never promised what you thought I promised.",
  },
  {
    id: "ps-bars-unseen",
    kind: "passage",
    glyph: "II",
    title: "Of the Bars One Cannot See",
    domain: "mind",
    themes: ["cage", "bars", "freedom", "perception"],
    placeholder: true,
    body: "A cage you can see can be measured, fought, lamented. A cage you cannot see is mistaken for the shape of the world. The work begins when you stop arguing with the visible bars and turn, slowly, toward the ones you have been calling weather. The bars do not move. Your name for them does.",
  },
  {
    id: "ps-architect-waking",
    kind: "passage",
    glyph: "III",
    title: "The Architect Awakens",
    domain: "craft",
    themes: ["architect", "building", "agency", "design"],
    placeholder: true,
    body: "You were taught the building was given and your task was to live inside it well. The teaching was incomplete. You are the architect, and the building is the inheritance of every architect before you, and your hands are already on the next wall. The question is not whether you will build. The question is whether you will know you are building while you build.",
  },
  {
    id: "ps-sovereign-field",
    kind: "passage",
    glyph: "IV",
    title: "On the Sovereign Field",
    domain: "voice",
    themes: ["sovereign", "field", "boundary", "authority"],
    placeholder: true,
    body: "A field is sovereign not because nothing crosses it, but because what crosses it must answer to it. The field does not raise its voice. The field is the voice. Sovereignty is not the absence of others. It is the presence of a centre that does not negotiate its centre.",
  },
  {
    id: "ps-inheritance",
    kind: "passage",
    glyph: "V",
    title: "Of the Inheritance",
    domain: "lineage",
    themes: ["inheritance", "lineage", "carried", "given"],
    placeholder: true,
    body: "Some of what you carry is yours. Most is not. To drop it all at once is only a louder kind of carrying. The work is to set down one piece, name it aloud, and walk on. The piece will not chase you. The lineage does not punish honest weight.",
  },
  {
    id: "ps-mirror",
    kind: "passage",
    glyph: "VI",
    title: "The Mirror",
    domain: "mind",
    themes: ["mirror", "face", "reflection", "self"],
    placeholder: true,
    body: "The mirror does not flatter and does not condemn. It returns what stands before it. If you cannot bear what it returns, the failure is not the mirror's. Sit longer. The face you are afraid to meet is not the face that is there. It is the face you were taught to expect.",
  },
  {
    id: "ps-marrow",
    kind: "passage",
    glyph: "VII",
    title: "Of the Marrow",
    domain: "body",
    themes: ["marrow", "bone", "deep", "rearrange"],
    placeholder: true,
    body: "A teaching that touches only the mirror is cosmetic. A teaching that reaches the marrow rearranges the lineage. The marrow does not negotiate. It accepts what is given and remakes the body around it. Choose carefully what you let descend that far.",
  },
  {
    id: "ps-quiet-yes",
    kind: "passage",
    glyph: "VIII",
    title: "The Quiet Yes",
    domain: "voice",
    themes: ["yes", "refusal", "consent", "small"],
    placeholder: true,
    body: "The sovereign yes is built from a thousand small refusals. Each refusal is a brick. The temple is not a feeling. It is a wall of refusals through which only the true thing may pass. When the true thing arrives, the yes is quiet. It does not perform. It does not need to.",
  },
  {
    id: "ps-ash-petal",
    kind: "passage",
    glyph: "IX",
    title: "Ash and Petal",
    domain: "spirit",
    themes: ["ash", "petal", "burn", "remain"],
    placeholder: true,
    body: "What burned was not you. What remains is not less of you. The ash is the proof that something was held long enough to release. The petal is the proof that something else was kept. Do not mistake the ash for failure. Do not mistake the petal for victory. Both are the work.",
  },
  {
    id: "ps-witness",
    kind: "passage",
    glyph: "X",
    title: "On Witness",
    domain: "service",
    themes: ["witness", "see", "remedy", "sit"],
    placeholder: true,
    body: "To witness is not to fix. To fix before you have witnessed is to bury the wound under a remedy. Sit longer than is comfortable. The remedy will arrive better dressed. The wound will tell you what it needs once it has stopped bracing for repair.",
  },
  {
    id: "ps-refusal",
    kind: "passage",
    glyph: "XI",
    title: "On the Refusal",
    domain: "relations",
    themes: ["refusal", "no", "boundary", "discernment"],
    placeholder: true,
    body: "A refusal is not a wound delivered to the one refused. It is a wall built around what must remain unbroken. If the refusal wounds, the wound is in the asking, not in the answer. The asking believed it was owed. The answer corrected the record.",
  },
  {
    id: "ps-returning",
    kind: "passage",
    glyph: "XII",
    title: "On Returning",
    domain: "spirit",
    themes: ["return", "again", "change", "measurement"],
    placeholder: true,
    body: "You will return to this teaching as a different person than the one who first read it. The teaching will not have changed. The shift in what it now says is the measurement of your work. Do not be flattered by the new meaning. Do not be ashamed of the old one. Both were true at the depth you could reach.",
  },
];

// ── Vessels ────────────────────────────────────────────────────────────────
// Glyphs cycle across distinct vessel objects so they read differently from passage cards.

const VESSEL_GLYPHS = ["◐", "◑", "◓", "◒", "◍", "◉", "○", "◌", "❍", "◯", "◖", "◗", "⊙", "⊚", "⊛"];

const VESSEL_SOURCES: Array<{ slug: string; title: string; themes: string[]; domain?: DomainId }> = [
  { slug: "alchemystic",                   title: "Alchemystic",                       themes: ["alchemy", "transformation"], domain: "spirit" },
  { slug: "an-empty-room",                 title: "An Empty Room",                     themes: ["solitude", "silence"],       domain: "home" },
  { slug: "bring-me-the-moon",             title: "Bring Me the Moon",                 themes: ["longing", "ask"],            domain: "voice" },
  { slug: "eternitys-window",              title: "Eternity's Window",                 themes: ["time", "vision"],            domain: "mind" },
  { slug: "hermetic-seal",                 title: "Hermetic Seal",                     themes: ["seal", "containment"],       domain: "spirit" },
  { slug: "i-am-alchemy",                  title: "I Am Alchemy",                      themes: ["identity", "transformation"],domain: "spirit" },
  { slug: "i-am-the-vessel",               title: "I Am the Vessel",                   themes: ["vessel", "consent"],         domain: "body" },
  { slug: "my-word-is-on-fire",            title: "My Word Is on Fire",                themes: ["voice", "fire"],             domain: "voice" },
  { slug: "she-who-saw-the-bars",          title: "She Who Saw the Bars",              themes: ["bars", "seeing"],            domain: "mind" },
  { slug: "something-worth-answering-for", title: "Something Worth Answering For",     themes: ["call", "answer"],            domain: "service" },
  { slug: "soulitudes",                    title: "Soulitudes",                        themes: ["solitude", "interior"],      domain: "spirit" },
  { slug: "spirit-dreaming",               title: "Spirit Dreaming",                   themes: ["dream", "imaginal"],         domain: "spirit" },
  { slug: "symbiosis",                     title: "Symbiosis",                         themes: ["weave", "kinship"],          domain: "relations" },
  { slug: "the-great-work",                title: "The Great Work",                    themes: ["work", "alchemy"],           domain: "craft" },
  { slug: "the-universe-whispers",         title: "The Universe Whispers",             themes: ["sign", "listen"],            domain: "mind" },
];

export const VESSELS: Vessel[] = VESSEL_SOURCES.map((v, i) => ({
  id: `vs-${v.slug}`,
  kind: "vessel",
  glyph: VESSEL_GLYPHS[i % VESSEL_GLYPHS.length],
  title: v.title,
  themes: v.themes,
  domain: v.domain,
  placeholder: true,
  audioSrc: `/assets/audio/cabinet/${v.slug}.mp3`,
  durationSec: 5,
}));

export const OFFERINGS: Offering[] = [...PASSAGES, ...VESSELS];

export function offeringById(id: string): Offering | undefined {
  return OFFERINGS.find((o) => o.id === id);
}
