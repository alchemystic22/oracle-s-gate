// Silent audio manifest. Files live at /audio/<slug>.mp3 (silent placeholders, drop in real tracks later).
// Plays no-op if file is missing.

export const TRACKS = [
  "alchemystic",
  "an-empty-room",
  "bring-me-the-moon",
  "eternitys-window",
  "hermetic-seal",
  "i-am-alchemy",
  "i-am-the-vessel",
  "my-word-is-on-fire",
  "she-who-saw-the-bars",
  "something-worth-answering-for",
  "soulitudes",
  "spirit-dreaming",
  "symbiosis",
  "the-great-work",
  "the-universe-whispers",
] as const;

export type Track = (typeof TRACKS)[number];

let current: HTMLAudioElement | null = null;

export function playTrack(slug: Track, opts: { loop?: boolean; volume?: number } = {}) {
  if (typeof window === "undefined") return;
  stopTrack();
  try {
    const a = new Audio(`/audio/${slug}.mp3`);
    a.loop = opts.loop ?? true;
    a.volume = opts.volume ?? 0.4;
    a.play().catch(() => { /* silent: file may not exist, by design */ });
    current = a;
  } catch { /* silent */ }
}

export function stopTrack() {
  if (current) {
    try { current.pause(); } catch { /* */ }
    current = null;
  }
}
