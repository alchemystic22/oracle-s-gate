import { motion } from "framer-motion";
import { type ReactNode } from "react";
import { MeasuredReveal } from "../MeasuredReveal";
import type { Offering } from "../../data/cabinet";

/** Unfurled view of a selected offering. Glyph → title → body (passage) or player slot (vessel). */
export function OfferingPanel({
  offering,
  repeated,
  bodySlot,
  onBodyComplete,
}: {
  offering: Offering;
  repeated: boolean;
  bodySlot?: ReactNode;     // for vessels, render the player here
  onBodyComplete?: () => void;
}) {
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
            className="text-gold-aged text-[10px] tracking-[0.4em] uppercase mb-4 italic"
          >
            {offering.kind === "passage"
              ? "This passage has come to you before. Hear it again."
              : "This vessel returns to you."}
          </motion.p>
        )}
        <motion.h2
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 0.9 }}
          className="text-2xl text-parchment mb-8"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {offering.title}
        </motion.h2>
      </div>

      {offering.kind === "passage" ? (
        <MeasuredReveal
          paragraphs={[offering.body]}
          step={1400}
          tail={1500}
          onComplete={onBodyComplete}
          className="text-parchment text-left"
        />
      ) : (
        bodySlot
      )}
    </motion.article>
  );
}
