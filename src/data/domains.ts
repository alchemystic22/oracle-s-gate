// 12 life-domains for the Sovereign Action Layer. Used by the Domain Map and Action Cards.
export type DomainId =
  | "body" | "mind" | "spirit" | "relations"
  | "work" | "craft" | "money" | "home"
  | "earth" | "lineage" | "voice" | "service";

export type Domain = {
  id: DomainId;
  name: string;
  glyph: string;        // single-character sigil
  /** angle in radians around the 12-node ring, 0 = top, clockwise */
  angle: number;
  short: string;
};

export const DOMAINS: Domain[] = [
  { id: "body",     name: "Body",       glyph: "☉", angle: 0,                short: "Flesh, breath, sleep, motion." },
  { id: "mind",     name: "Mind",       glyph: "☿", angle: Math.PI/6 * 1,    short: "Attention, study, discernment." },
  { id: "spirit",   name: "Spirit",     glyph: "✦", angle: Math.PI/6 * 2,    short: "Practice, stillness, reverence." },
  { id: "relations",name: "Relations",  glyph: "⚭", angle: Math.PI/6 * 3,    short: "Intimacy, kinship, friendship." },
  { id: "work",     name: "Work",       glyph: "⚒", angle: Math.PI/6 * 4,    short: "Labour exchanged for keep." },
  { id: "craft",    name: "Craft",      glyph: "⚙", angle: Math.PI/6 * 5,    short: "The making that is yours." },
  { id: "money",    name: "Money",      glyph: "⚖", angle: Math.PI/6 * 6,    short: "Flow, holding, lawful exchange." },
  { id: "home",     name: "Home",       glyph: "⌂", angle: Math.PI/6 * 7,    short: "Hearth, order, sanctuary." },
  { id: "earth",    name: "Earth",      glyph: "⏚", angle: Math.PI/6 * 8,    short: "Land, food, the wild." },
  { id: "lineage",  name: "Lineage",    glyph: "☥", angle: Math.PI/6 * 9,    short: "What was given. What is passed." },
  { id: "voice",    name: "Voice",      glyph: "✧", angle: Math.PI/6 * 10,   short: "Speech, writing, witness." },
  { id: "service",  name: "Service",    glyph: "✚", angle: Math.PI/6 * 11,   short: "What is given without price." },
];

export function domainById(id: DomainId): Domain {
  return DOMAINS.find((d) => d.id === id)!;
}
