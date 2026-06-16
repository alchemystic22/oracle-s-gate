import { motion } from "framer-motion";
import { type ReactNode } from "react";
import { MeasuredReveal } from "../MeasuredReveal";
import type { Offering } from "../../data/cabinet";

/** Reception view of a selected transmission. Glyph → source (if canonical) → title → body (passage) or vessel slot. */
export function OfferingPanel({
  offering,
  repeated,
  bodySlot,
  onBodyComplete,
}: {
  offering: Offering;
  repeated: boolean;
  bodySlot?: ReactNode;     // for vessels, render the lyrics scroll here
  onBodyComplete?: () => void;
}) {
  const isPassage = offering.kind === "passage";
  const canonicalSource = isPassage ? offering.source : undefined;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
      className="relative max-w-2xl mx-auto"
    >
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl text-gold mb-6"
          style={{ textShadow: "0 0 20px color-mix(in oklab, var(--gold) 50%, transparent)" }}
        >
          {offering.glyph}
        </motion.div>
        {repeated && (
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
            className="text-gold-aged text-sm tracking-[0.2em] uppercase mb-5 italic max-w-lg mx-auto"
            style={{ letterSpacing: "0.15em" }}
          >
            {offering.kind === "passage"
              ? "This transmission has come to you before. You are not the same person who first received it."
              : "This transmission returns. It has more to give you."}
          </motion.p>
        )}
        {canonicalSource && (
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.75 }}
            className="text-gold-aged/80 text-xs md:text-sm tracking-[0.3em] uppercase mb-3"
          >
            from
          </motion.p>
        )}
        <motion.h2
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 0.9 }}
          className="text-3xl md:text-4xl text-parchment mb-10"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {offering.title}
        </motion.h2>
      </div>

      {isPassage ? (
        <MeasuredReveal
          paragraphs={[offering.body]}
          step={1400}
          tail={1500}
          onComplete={onBodyComplete}
          className="text-parchment text-left text-lg md:text-xl leading-relaxed"
        />
      ) : (
        bodySlot
      )}
    </motion.article>
  );
}
