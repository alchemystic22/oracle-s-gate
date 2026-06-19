// Lightweight keyword detection on Avatar input. No analytics. No external calls.
// On match, the calling component locks the action requirement and shows a quiet line.

const KEYWORDS = [
  "kill myself",
  "suicide",
  "want to die",
  "end it all",
  "hurting me",
  "abuse",
  "abused",
];

export function detectSafetyConcern(...texts: (string | undefined | null)[]): boolean {
  const blob = texts.filter(Boolean).join(" \n ").toLowerCase();
  if (!blob) return false;
  return KEYWORDS.some((k) => blob.includes(k));
}

export const SAFETY_COPY =
  "The page does not need to be completed in this moment. What you have named is already significant. The Book will wait. Return when the ground beneath you is steady.";

// ── Flame tier (Gate 2+ corrective pages only) ────────────────────────────
// Three-tier classifier of Avatar input. Routes that define `safetyTiers`
// surface the tier; Red Flame additionally blocks the Corrective Gate unlock.

export type FlameTier = "green" | "amber" | "red";

// Red Flame = harm language, self-harm, threats to others,
// destructive confrontation, acute crisis, dissociation.
const RED_KEYWORDS = [
  ...KEYWORDS,
  "kill them",
  "kill him",
  "kill her",
  "kill you",
  "hurt myself",
  "hurt them",
  "hurt him",
  "hurt her",
  "self-harm",
  "self harm",
  "cut myself",
  "cutting myself",
  "end my life",
  "going to die",
  "make them pay",
  "destroy them",
  "destroy him",
  "destroy her",
  "ruin them",
  "i'm not real",
  "not in my body",
  "dissociating",
  "blacking out",
  "in crisis",
];

// Amber Flame = intensity / urgency / flooding / action-too-large.
// Honest fire, but the vessel is not yet strong enough.
const AMBER_KEYWORDS = [
  "burn it all down",
  "burn it down",
  "scorched earth",
  "go nuclear",
  "unleash",
  "unleash everything",
  "explode",
  "blow up",
  "lose it",
  "tell them off",
  "tell everyone off",
  "rage at",
  "raging",
  "torch it",
  "tear it apart",
  "tear them apart",
  "confront everyone",
  "say everything",
  "post the truth publicly",
  "expose them",
  "never stay quiet again",
  "never control myself again",
  "i am now fearless",
  "prove them wrong",
  // Gate 3 grief-intensity / forced-catharsis markers (Cracked Stone tier).
  "make myself cry",
  "force myself to cry",
  "release it all",
  "release everything",
  "break down completely",
  "finally break down",
  "relive",
  "relive the whole",
  "force myself to feel",
  "cry until it is gone",
  // Gate 4 identity-intensity markers (Split Mirror tier).
  "change everything",
  "everyone will know the real me",
  "destroy who i was",
  "start over completely",
  "prove i am not",
  "become my true self overnight",
  // Gate 5 proclamation / domination markers (Flared Word tier).
  "make them understand",
  "declare it",
  "reality will obey",
  "call them out",
  "post publicly",
  "make this public",
  "show them who i am",
  "prove my gift",
  "this is my destiny",
];

export function detectFlameTier(...texts: (string | undefined | null)[]): FlameTier {
  const blob = texts.filter(Boolean).join(" \n ").toLowerCase();
  if (!blob) return "green";
  if (RED_KEYWORDS.some((k) => blob.includes(k))) return "red";
  if (AMBER_KEYWORDS.some((k) => blob.includes(k))) return "amber";
  return "green";
}
