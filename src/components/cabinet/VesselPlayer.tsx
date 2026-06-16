import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trackUrl } from "../../lib/audio";

/**
 * Minimal vessel player. Single play/pause, optional download.
 * Reflection field opens on track-end OR after 60s (whichever first).
 */
export function VesselPlayer({
  audioSrc,
  durationSec,
  onReadyForReflection,
}: {
  audioSrc: string;
  durationSec: number;
  onReadyForReflection: () => void;
}) {
  const [audio] = useState<HTMLAudioElement | null>(() => {
    if (typeof window === "undefined") return null;
    try { return new Audio(audioSrc); } catch { return null; }
  });
  const [playing, setPlaying] = useState(false);
  const [openedReflection, setOpenedReflection] = useState(false);

  useEffect(() => {
    if (!audio) return;
    const onEnded = () => {
      setPlaying(false);
      if (!openedReflection) { setOpenedReflection(true); onReadyForReflection(); }
    };
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("ended", onEnded);
      try { audio.pause(); } catch { /* */ }
    };
  }, [audio, openedReflection, onReadyForReflection]);

  // 60-second hard fallback.
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!openedReflection) { setOpenedReflection(true); onReadyForReflection(); }
    }, 60_000);
    return () => clearTimeout(t);
  }, [openedReflection, onReadyForReflection]);

  function toggle() {
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play().catch(() => { /* file may be silent placeholder */ }); setPlaying(true); }
  }

  return (
    <div className="mt-6 flex flex-col items-center">
      <div className="flex items-center gap-6">
        <button
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
          className="h-16 w-16 rounded-full border border-gold-aged/60 flex items-center justify-center text-gold hover:text-parchment hover:border-gold transition-all duration-500"
          style={{ boxShadow: playing ? "0 0 30px -6px color-mix(in oklab, var(--gold) 50%, transparent)" : undefined }}
        >
          {playing ? (
            <svg width="20" height="22" viewBox="0 0 20 22" fill="currentColor"><rect x="2" y="2" width="5" height="18" /><rect x="13" y="2" width="5" height="18" /></svg>
          ) : (
            <svg width="20" height="22" viewBox="0 0 20 22" fill="currentColor"><path d="M3 2 L18 11 L3 20 Z" /></svg>
          )}
        </button>
        <a
          href={audioSrc}
          download
          aria-label="Download vessel"
          className="text-parchment-dim hover:text-gold text-xs tracking-[0.3em] uppercase transition-colors duration-500"
        >
          download
        </a>
      </div>
      <p className="mt-6 text-parchment-dim text-xs italic">
        {durationSec}s vessel · {openedReflection ? "the room has opened" : "listen"}
      </p>
      <AnimatePresence>
        {!openedReflection && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => { setOpenedReflection(true); onReadyForReflection(); }}
            className="mt-4 text-parchment-dim hover:text-gold-aged text-[10px] tracking-[0.4em] uppercase"
          >
            open reflection now
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
