import { AnimatePresence, motion } from "framer-motion";

/**
 * The atmospheric phase marker for The Ritual of Resonant Reading.
 * Renders the small-caps phase line + a single descriptive sentence beneath it.
 * Cross-fades between phases over 800ms (key-based remount via AnimatePresence).
 *
 * The phases are NOT a stepper. They are the language of the room.
 */
export function PhaseLabel({
  phaseKey,
  label,
  description,
}: {
  phaseKey: string;
  label: string;
  description: string;
}) {
  return (
    <div className="min-h-[64px] text-center mb-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={phaseKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="phase-label">{label}</div>
          <p
            className="mt-2 text-gold-aged/70 italic text-base md:text-lg"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {description}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
