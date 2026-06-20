// Book Closure Acknowledgment — sits between the threshold and the
// Final Ritual Record. Explicitly names that the Book stays closed and
// that no hidden page opens. The closed Book glyph is rendered larger
// here but remains static. Do not animate the book as if it is opening.

import { motion } from "framer-motion";

import { RitualButton } from "../RitualPrimitives";
import { GATE_7 } from "../../../data/gate7";
import { ClosedBookGlyph } from "./ClosedBookGlyph";

export function BookClosureAcknowledgment({ onContinue }: { onContinue: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.8 }}
      className="relative flex min-h-[80vh] flex-col items-center justify-center text-center"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, hsl(255 55% 11% / 0.9) 0%, hsl(240 55% 5%) 60%, hsl(240 60% 3%) 100%)",
        }}
      />

      <div className="mb-12 opacity-70">
        <ClosedBookGlyph width={180} />
      </div>

      <pre
        className="mb-12 max-w-2xl whitespace-pre-line px-4 text-lg italic leading-loose"
        style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 30% 86%)" }}
      >
        {GATE_7.bookClosureCopy}
      </pre>

      <RitualButton onClick={onContinue}>Open the Final Ritual Record</RitualButton>
    </motion.div>
  );
}
