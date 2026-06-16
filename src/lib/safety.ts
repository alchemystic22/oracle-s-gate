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
