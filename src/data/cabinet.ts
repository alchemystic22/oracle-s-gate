// The Ritual of Resonant Reading — offering pool.
// Passages (written transmissions) and vessels (audio transmissions) coexist;
// the resonance algorithm draws blind to kind. Six of the passages are the
// canonical source texts (Codex 12 / System A); the other twelve are placeholder
// scrolls in the existing voice. All current entries are placeholders the Avatar
// will refine over time (drop-in replacements preserving ids).

import type { DomainId } from "./domains";

export type OfferingKind = "passage" | "vessel";

type OfferingBase = {
  id: string;
  kind: OfferingKind;
  glyph: string;        // short token for visual rendering
  title: string;        // hidden until reception
  themes: string[];     // resonance keywords
  domain?: DomainId;    // soft domain affinity
  placeholder: true;
};

export type Passage = OfferingBase & {
  kind: "passage";
  body: string;
  /** Canonical source text — when set, title is the source title, revealed in Phase IV alongside the body. */
  source?: { title: string; canonical: true };
};

export type Vessel = OfferingBase & {
  kind: "vessel";
  audioSrc: string;
  durationSec: number;
  /** Lyric lines in order, rendered on parchment. */
  lyrics: string[];
  /** Indices into `lyrics` curating which lines surface for contemplation, and in what order. */
  illuminationOrder: number[];
};

export type Offering = Passage | Vessel;

// ── Canonical Six (System A — real-world esoteric texts) ──────────────────
// Placeholder bodies in the existing measured voice. Avatar replaces with
// canonical fragments. Title revealed only in Phase IV (Reception).

const CANONICAL_SIX: Passage[] = [
  {
    id: "ct-corpus-hermeticum",
    kind: "passage",
    glyph: "☉",
    title: "Corpus Hermeticum",
    source: { title: "Corpus Hermeticum", canonical: true },
    domain: "mind",
    themes: ["mind", "all", "one", "nous", "knowledge"],
    placeholder: true,
    body: "The All is mind; the universe is mental. What appears as world is the thinking of a thinker whose first thought you are. To know this is not to escape the world. It is to recognise the room you have always been standing in.",
  },
  {
    id: "ct-kybalion",
    kind: "passage",
    glyph: "☿",
    title: "The Kybalion",
    source: { title: "The Kybalion", canonical: true },
    domain: "spirit",
    themes: ["principle", "correspondence", "vibration", "polarity", "rhythm"],
    placeholder: true,
    body: "As above, so below; as below, so above. The principle is not a metaphor. The pattern that organises the world organises the body, and the pattern that organises the body organises the breath, and the breath organises the thought, and the thought organises the next world.",
  },
  {
    id: "ct-aurora-consurgens",
    kind: "passage",
    glyph: "☽",
    title: "Aurora Consurgens",
    source: { title: "Aurora Consurgens", canonical: true },
    domain: "spirit",
    themes: ["dawn", "rising", "wisdom", "feminine", "alchemy"],
    placeholder: true,
    body: "She rises in the night that has no name. She is the wisdom hidden in the work; she is the work disguised as suffering until the sufferer turns and recognises her. The dawn is not given. The dawn is what remains when you have stopped insisting on a different morning.",
  },
  {
    id: "ct-suggestive-inquiry",
    kind: "passage",
    glyph: "⚯",
    title: "A Suggestive Inquiry into the Hermetic Mystery",
    source: { title: "A Suggestive Inquiry into the Hermetic Mystery", canonical: true },
    domain: "craft",
    themes: ["inquiry", "mystery", "hermetic", "hidden", "method"],
    placeholder: true,
    body: "The mystery is not concealed by those who keep it. It is concealed by the form in which it must travel. To inquire suggestively is to permit the answer to arrive in the shape it requires, not the shape you asked for. The first discipline of the work is to release your demand for a particular sentence.",
  },
  {
    id: "ct-picatrix",
    kind: "passage",
    glyph: "⚹",
    title: "Picatrix",
    source: { title: "Picatrix", canonical: true },
    domain: "craft",
    themes: ["talisman", "image", "hour", "intention", "binding"],
    placeholder: true,
    body: "Every image carries the hour of its making. To bind a thing to an image is to bind it also to the moment in which the image was struck. The work is not in the symbol. The work is in the alignment of body, hour, and intention that consents to the symbol's authority.",
  },
  {
    id: "ct-way-of-kabbalah",
    kind: "passage",
    glyph: "✡",
    title: "The Way of Kabbalah",
    source: { title: "The Way of Kabbalah", canonical: true },
    domain: "lineage",
    themes: ["tree", "path", "vessel", "shattering", "repair"],
    placeholder: true,
    body: "The vessels could not hold the light. The shattering is not the error of the work; it is the first chapter of the work. Every shard you gather is the work. The repair is not a return to the vessel that broke. It is the building of a vessel capable of what the first vessel could not bear.",
  },
];

// ── Placeholder Passages (12) ─────────────────────────────────────────────
// Voice: measured, declarative. Not therapeutic. Not coaching.

export const PASSAGES: Passage[] = [
  ...CANONICAL_SIX,
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
// Each vessel carries placeholder lyrics in the existing voice + illuminationOrder
// curating 3–4 lines that surface for contemplation. Suno masters will replace later.

const VESSEL_GLYPHS = ["◐", "◑", "◓", "◒", "◍", "◉", "○", "◌", "❍", "◯", "◖", "◗", "⊙", "⊚", "⊛"];

type VesselSeed = {
  slug: string;
  title: string;
  themes: string[];
  domain?: DomainId;
  lyrics: string[];
  illuminationOrder: number[];
};

const VESSEL_SOURCES: VesselSeed[] = [
  {
    slug: "alchemystic", title: "Alchemystic", themes: ["alchemy", "transformation"], domain: "spirit",
    lyrics: [
      "I was lead before I was gold.",
      "The fire did not ask my permission.",
      "It asked only that I remain.",
      "What melted was the name I had been given.",
      "What rose was the name I had not yet learned.",
      "I am alchemystic. I am the change and the changing.",
    ],
    illuminationOrder: [1, 4, 5],
  },
  {
    slug: "an-empty-room", title: "An Empty Room", themes: ["solitude", "silence"], domain: "home",
    lyrics: [
      "I built a room with no one in it.",
      "I closed the door and listened.",
      "The silence was not empty.",
      "The silence was full of every voice I had refused.",
      "I sat with them, one by one.",
      "When I left the room, I left alone, and I left whole.",
    ],
    illuminationOrder: [2, 3, 5],
  },
  {
    slug: "bring-me-the-moon", title: "Bring Me the Moon", themes: ["longing", "ask"], domain: "voice",
    lyrics: [
      "Bring me the moon, I said, knowing the asking was the thing.",
      "Bring me the moon, and I will hold it like a coin.",
      "The moon did not come. The asking did.",
      "The asking arrived in the shape of a voice I had not heard in years.",
      "It was my own.",
      "It said: you may ask. You may ask again.",
    ],
    illuminationOrder: [0, 2, 4],
  },
  {
    slug: "eternitys-window", title: "Eternity's Window", themes: ["time", "vision"], domain: "mind",
    lyrics: [
      "There is a window in the hour that does not close.",
      "Through it, the work of every year is visible at once.",
      "What I called wasted was the slow shape of arriving.",
      "What I called sudden was the long thread snapping into sight.",
      "Eternity does not move. We move past it, and call that time.",
    ],
    illuminationOrder: [1, 2, 4],
  },
  {
    slug: "hermetic-seal", title: "Hermetic Seal", themes: ["seal", "containment"], domain: "spirit",
    lyrics: [
      "Seal the vessel. Let the work breathe inside it.",
      "Not every fire requires an audience.",
      "Not every transformation should be narrated.",
      "Some work refuses witness and asks only for containment.",
      "The seal is not secrecy. The seal is consent.",
      "I consent to be the vessel of my own becoming.",
    ],
    illuminationOrder: [1, 4, 5],
  },
  {
    slug: "i-am-alchemy", title: "I Am Alchemy", themes: ["identity", "transformation"], domain: "spirit",
    lyrics: [
      "I am not the one who is transformed.",
      "I am the transformation.",
      "The lead is not the body; the gold is not the body.",
      "The body is the room where the change is consenting to happen.",
      "I am alchemy. I do not perform it. I am performed by it.",
    ],
    illuminationOrder: [1, 3, 4],
  },
  {
    slug: "i-am-the-vessel", title: "I Am the Vessel", themes: ["vessel", "consent"], domain: "body",
    lyrics: [
      "I am the vessel. I am not the thing poured in.",
      "I am not the thing poured out.",
      "I am the shape that consents to hold what is given.",
      "When the vessel cracks, the work does not stop.",
      "The crack is how the next thing gets in.",
    ],
    illuminationOrder: [0, 2, 4],
  },
  {
    slug: "my-word-is-on-fire", title: "My Word Is on Fire", themes: ["voice", "fire"], domain: "voice",
    lyrics: [
      "My word is on fire and the fire has a name.",
      "The name is the thing I refused to say for years.",
      "Now I say it. The room does not collapse.",
      "The fire does not consume me; it consumes what was never mine.",
      "What remains is the word, and the word is on fire, and the fire is mine.",
    ],
    illuminationOrder: [1, 3, 4],
  },
  {
    slug: "she-who-saw-the-bars", title: "She Who Saw the Bars", themes: ["bars", "seeing"], domain: "mind",
    lyrics: [
      "She walked the room a hundred times before she saw them.",
      "The bars had been there since the first hour.",
      "They were not in the walls. They were in the naming.",
      "When she renamed them, they did not fall.",
      "She walked through them, and they stayed where they were, naming someone else.",
    ],
    illuminationOrder: [1, 2, 4],
  },
  {
    slug: "something-worth-answering-for", title: "Something Worth Answering For", themes: ["call", "answer"], domain: "service",
    lyrics: [
      "The call came in a voice I did not recognise.",
      "I almost did not answer.",
      "The voice said: there is something here worth answering for.",
      "I said: I am tired. I have answered too many calls that were not mine.",
      "The voice said: this one is yours. Test it. You will know.",
      "I tested it. I knew.",
    ],
    illuminationOrder: [2, 4, 5],
  },
  {
    slug: "soulitudes", title: "Soulitudes", themes: ["solitude", "interior"], domain: "spirit",
    lyrics: [
      "Solitude is the room. Soulitude is the inhabitant.",
      "I went to the room to be alone and found I was already accompanied.",
      "By whom, I cannot say.",
      "By what, I will not say.",
      "By presence, I will say. Presence that did not require my performance.",
    ],
    illuminationOrder: [0, 1, 4],
  },
  {
    slug: "spirit-dreaming", title: "Spirit Dreaming", themes: ["dream", "imaginal"], domain: "spirit",
    lyrics: [
      "Spirit dreams the body before the body wakes.",
      "What you call your day is the slow translation of a sentence already spoken.",
      "The dream is not symbolic. The day is the symbol.",
      "Listen for the original sentence beneath the day.",
      "It is still being spoken. It will not stop being spoken.",
    ],
    illuminationOrder: [1, 2, 4],
  },
  {
    slug: "symbiosis", title: "Symbiosis", themes: ["weave", "kinship"], domain: "relations",
    lyrics: [
      "I am not the one. I am the one among.",
      "The weave is not made of me. The weave is made of the spaces between us.",
      "When I pull away, the weave does not break.",
      "It changes shape. It remembers I was there.",
      "Symbiosis is not need. Symbiosis is the willingness to be changed by the other.",
    ],
    illuminationOrder: [1, 3, 4],
  },
  {
    slug: "the-great-work", title: "The Great Work", themes: ["work", "alchemy"], domain: "craft",
    lyrics: [
      "The Great Work is not great because it is large.",
      "It is great because it cannot be done by half.",
      "Every gesture is the work or the refusal of the work.",
      "There is no rehearsal. There is no warming up.",
      "The hour you are in is the hour the work is in.",
    ],
    illuminationOrder: [1, 2, 4],
  },
  {
    slug: "the-universe-whispers", title: "The Universe Whispers", themes: ["sign", "listen"], domain: "mind",
    lyrics: [
      "The universe whispers in the language of repetition.",
      "What returns is not coincidence.",
      "What returns is asking for your attention.",
      "Listen for the word that appears three times in a week.",
      "It is the door knocking. You may open it.",
    ],
    illuminationOrder: [0, 2, 4],
  },
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
  lyrics: v.lyrics,
  illuminationOrder: v.illuminationOrder,
}));

export const OFFERINGS: Offering[] = [...PASSAGES, ...VESSELS];

export function offeringById(id: string): Offering | undefined {
  return OFFERINGS.find((o) => o.id === id);
}
