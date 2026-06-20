// Gate 7 Completion — two-screen seal sequence.
//
// Screen 1 (this file, mode="seal"): "The name has stepped back…" + seal button.
// Screen 3 (this file, mode="final"): "The star vanishes from the center…"
// with the programmatic dimming — central star recedes, field points
// brighten gently. The closed Book remains sealed in the distance. NO new
// page opens, NO Spiral, NO route menu, NO achievement animation.
//
// (Screen 2 — the Vanishing Star Moment image — lives in
// VanishingStarMoment.tsx and is rendered between these two by the
// orchestrator's phase machine.)

import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

import { RitualButton } from "../RitualPrimitives";
import { GATE_7 } from "../../../data/gate7";
import { ClosedBookGlyph } from "./ClosedBookGlyph";

export function Gate7CompletionSeal({ onSealed }: { onSealed: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.8 }}
      className="relative flex min-h-[80vh] flex-col items-center justify-center text-center"
    >
      <Backdrop />
      <CentralStar scale={1} opacity={1} />
      <pre
        className="mb-12 mt-10 whitespace-pre-line text-xl italic leading-loose"
        style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 30% 90%)" }}
      >
        {GATE_7.completionSealCopy}
      </pre>
      <RitualButton onClick={onSealed}>Seal the Final Record</RitualButton>
    </motion.div>
  );
}

export function Gate7CompletionFinal() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2.0 }}
      className="relative flex min-h-[88vh] flex-col items-center justify-center text-center"
    >
      <Backdrop />

      {/* Field points brighten gently around the receding star. */}
      <div className="relative mb-12 h-72 w-72">
        {FIELD_POINTS.map((pt, i) => (
          <motion.div
            key={i}
            aria-hidden
            className="absolute rounded-full"
            style={{
              top: `${pt.y}%`,
              left: `${pt.x}%`,
              width: `${pt.size}px`,
              height: `${pt.size}px`,
              background:
                "radial-gradient(circle, hsl(0 0% 96% / 0.95) 0%, hsl(43 70% 80% / 0.4) 55%, transparent 100%)",
              filter: "blur(0.4px)",
            }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 0.85, 0.7], scale: [0.6, 1.05, 1] }}
            transition={{ duration: 5, delay: 2 + i * 0.18, ease: "easeOut" }}
          />
        ))}

        {/* Star recession — opacity + scale tween, never collapses to void. */}
        <motion.div
          aria-hidden
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: "4.5rem",
            height: "4.5rem",
            background:
              "radial-gradient(circle, hsl(0 0% 100% / 0.98) 0%, hsl(43 80% 80% / 0.5) 40%, transparent 75%)",
            filter: "blur(0.5px)",
          }}
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: [1, 0.6, 0.18], scale: [1, 0.8, 0.55] }}
          transition={{ duration: 6.4, ease: [0.4, 0, 0.6, 1] }}
        />
      </div>

      <motion.pre
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6, delay: 1.0 }}
        className="mb-14 whitespace-pre-line text-xl italic leading-loose"
        style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 30% 90%)" }}
      >
        {GATE_7.completionFinalCopy}
      </motion.pre>

      {/* Closed Book remains sealed in the distance — never opens. */}
      <div aria-hidden className="mb-10 opacity-30">
        <ClosedBookGlyph width={72} />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, delay: 4.2 }}
        className="flex flex-col items-center gap-5"
      >
        <Link to="/gates">
          <RitualButton>Complete the Gate</RitualButton>
        </Link>
        <Link
          to="/sovereign"
          className="text-xs uppercase tracking-[0.4em]"
          style={{ fontFamily: "'Cinzel', serif", color: "hsl(43 50% 60%)" }}
        >
          Return to the Sovereign Action Layer
        </Link>
      </motion.div>
    </motion.div>
  );
}

function Backdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10"
      style={{
        background:
          "radial-gradient(ellipse at 50% 42%, hsl(255 55% 11% / 0.92) 0%, hsl(240 55% 5%) 60%, hsl(240 60% 3%) 100%)",
      }}
    />
  );
}

function CentralStar({ scale, opacity }: { scale: number; opacity: number }) {
  return (
    <div
      aria-hidden
      className="relative h-40 w-40"
      style={{ opacity, transform: `scale(${scale})` }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, hsl(0 0% 100% / 0.95) 0%, hsl(43 80% 78% / 0.45) 35%, transparent 70%)",
          filter: "blur(1px)",
        }}
      />
    </div>
  );
}

const FIELD_POINTS: { x: number; y: number; size: number }[] = [
  { x: 12, y: 22, size: 4 },
  { x: 84, y: 18, size: 5 },
  { x: 8,  y: 70, size: 5 },
  { x: 88, y: 78, size: 4 },
  { x: 28, y: 8,  size: 3 },
  { x: 70, y: 92, size: 3 },
  { x: 50, y: 6,  size: 4 },
  { x: 50, y: 94, size: 4 },
  { x: 4,  y: 48, size: 3 },
  { x: 96, y: 50, size: 3 },
  { x: 24, y: 86, size: 3 },
  { x: 76, y: 14, size: 3 },
];
