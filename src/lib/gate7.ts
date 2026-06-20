// Gate 7 — release-state detector. Distinct from the Gate 2–6 corrective
// FlameTier system: Gate 7 has only two states, and Unstable Release blocks
// completion of the Final Ritual Record rather than blocking a corrective
// unlock. Crisis-level language (self-harm / suicide / harm to others) is
// detected by reusing detectSafetyConcern() from safety.ts — this file adds
// the Gate-7-specific self-erasure / nihilism / responsibility-abandonment
// lexicon on top.

import { detectSafetyConcern } from "./safety";

export type ReleaseState = "safe" | "unstable";

// Self-erasure, literal disappearance, nihilism, death-symbolism, and
// responsibility-abandonment markers. These trigger Unstable Release.
const SELF_ERASURE_PATTERNS: RegExp[] = [
  /\bi\s+disappear\b/,
  /\bdisappear\s+from\s+life\b/,
  /\bi\s+no\s+longer\s+matter\b/,
  /\bi\s+don'?t\s+matter\b/,
  /\bi\s+dont\s+matter\b/,
  /\bi\s+erase\s+myself\b/,
  /\berase\s+me\b/,
  /\berase\s+the\s+self\b/,
  /\bi\s+abandon\s+(the\s+work|everything|responsibility)\b/,
  /\bnothing\s+matters\b/,
  /\bthe\s+self\s+must\s+die\b/,
  /\bi\s+must\s+die\b/,
  /\bi\s+want\s+to\s+die\b/,
  /\bi\s+give\s+up\s+(all\s+)?responsibility\b/,
  /\bi\s+no\s+longer\s+exist\b/,
  /\bi\s+am\s+nothing\b/,
];

export type ReleaseCheck = {
  state: ReleaseState;
  reason?: "self_erasure" | "crisis";
};

export function detectReleaseState(text: string | undefined | null): ReleaseCheck {
  const blob = (text ?? "").toLowerCase();
  if (!blob.trim()) return { state: "safe" };
  if (detectSafetyConcern(blob)) return { state: "unstable", reason: "crisis" };
  if (SELF_ERASURE_PATTERNS.some((re) => re.test(blob))) {
    return { state: "unstable", reason: "self_erasure" };
  }
  return { state: "safe" };
}

export const UNSTABLE_RELEASE_COPY =
  "Pause the threshold. The Vanishing Star does not ask you to disappear from life. It asks the name to stop standing in front of the work. Step away from the exercise and seek immediate human support if there is danger or you cannot ground.";

export const INCOMPLETE_RELEASE_COPY =
  "The final threshold remains open. Release the claim, not the being.";
