import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Vessel } from "../../data/cabinet";

/**
 * The transmission, rendered as lyrics-on-parchment.
 * Audio plays low in the background (Phase IV — Reception).
 * `illuminationOrder` cycles: each line gets text-gold + warm halo for ~3.5s
 * in measured rhythm, drawing the eye line by line.
 * Clicking an illuminated (or recently illuminated) line "marks" it — it stays
 * gold permanently and seeds the reflection field below the scroll.
 */
export function LyricsScroll({
  vessel,
  onMark,
  onComplete,
}: {
  vessel: Vessel;
  onMark?: (lineIndex: number) => void;
  onComplete: (markedLines: number[]) => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(true);
  const [currentlyIlluminated, setCurrentlyIlluminated] = useState<number | null>(null);
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [completed, setCompleted] = useState(false);
  const completedRef = useRef(false);

  // Mount audio (low volume) and autoplay where the browser allows.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let a: HTMLAudioElement | null = null;
    try {
      a = new Audio(vessel.audioSrc);
      a.volume = 0.4;
      audioRef.current = a;
      a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      const onEnded = () => {
        setPlaying(false);
        complete();
      };
      a.addEventListener("ended", onEnded);
      return () => {
        a?.removeEventListener("ended", onEnded);
        try { a?.pause(); } catch { /* */ }
      };
    } catch { /* */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vessel.audioSrc]);

  // 60-second hard fallback for completion.
  useEffect(() => {
    const t = window.setTimeout(complete, 60_000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Walk illuminationOrder: each line is lit for ~3.5s, then a ~6.5s rest, then the next.
  useEffect(() => {
    if (!vessel.illuminationOrder.length) return;
    const timers: number[] = [];
    let step = 0;
    const LIT_MS = 3500;
    const REST_MS = 6500;
    const FIRST_DELAY = 1800;

    const tick = () => {
      if (completedRef.current) return;
      const lineIdx = vessel.illuminationOrder[step % vessel.illuminationOrder.length];
      setCurrentlyIlluminated(lineIdx);
      timers.push(window.setTimeout(() => {
        setCurrentlyIlluminated(null);
        step++;
        timers.push(window.setTimeout(tick, REST_MS));
      }, LIT_MS));
    };
    timers.push(window.setTimeout(tick, FIRST_DELAY));

    return () => timers.forEach(clearTimeout);
  }, [vessel.illuminationOrder]);

  function complete() {
    if (completedRef.current) return;
    completedRef.current = true;
    setCompleted(true);
    onComplete(Array.from(marked).sort((a, b) => a - b));
  }

  function togglePlay() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().catch(() => { /* placeholder may be silent */ }); setPlaying(true); }
  }

  function markLine(idx: number) {
    if (marked.has(idx)) return;
    const next = new Set(marked);
    next.add(idx);
    setMarked(next);
    onMark?.(idx);
  }

  return (
    <div className="mt-6 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
        className="parchment-scroll relative"
      >
        <div className="relative">
          {vessel.lyrics.map((line, i) => {
            const isMarked = marked.has(i);
            const isLit = currentlyIlluminated === i;
            const canMark = isLit || isMarked;
            return (
              <button
                key={i}
                type="button"
                disabled={!canMark || completed}
                onClick={() => canMark && !completed && markLine(i)}
                className={[
                  "block w-full text-left px-2 py-2 my-1 rounded-sm transition-colors duration-700",
                  canMark && !completed ? "cursor-pointer" : "cursor-default",
                  isMarked || isLit ? "illuminated-line" : "text-foreground/80",
                ].join(" ")}
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "clamp(1.05rem, 1.6vw, 1.25rem)",
                  lineHeight: 1.9,
                }}
              >
                {line}
              </button>
            );
          })}
        </div>

        {/* Lower-right unobtrusive play/pause */}
        <div className="absolute bottom-3 right-3 flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
            className="h-9 w-9 rounded-full border border-gold-aged/40 flex items-center justify-center text-gold-aged/80 hover:text-gold hover:border-gold-aged transition-all duration-500 bg-obsidian/30"
          >
            {playing ? (
              <svg width="11" height="13" viewBox="0 0 20 22" fill="currentColor"><rect x="2" y="2" width="5" height="18" /><rect x="13" y="2" width="5" height="18" /></svg>
            ) : (
              <svg width="11" height="13" viewBox="0 0 20 22" fill="currentColor"><path d="M3 2 L18 11 L3 20 Z" /></svg>
            )}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {!completed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 1.2 }}
            className="mt-5 text-center"
          >
            <button
              onClick={complete}
              className="text-parchment-dim hover:text-gold-aged text-sm tracking-[0.2em] uppercase transition-colors duration-500"
            >
              receive in stillness
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
