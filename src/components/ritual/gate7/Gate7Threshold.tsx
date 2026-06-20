// Gate 7 Threshold — quiet, vast, restrained. The closed Book of Spiral
// Fractures appears as a static, dim silhouette far below the central star.
// The Book MUST NOT animate as if a page is being revealed.

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { RitualButton } from "../RitualPrimitives";
import { GATE_7 } from "../../../data/gate7";
import { ClosedBookGlyph } from "./ClosedBookGlyph";

export function Gate7Threshold({ onApproach }: { onApproach: () => void }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    const img = new Image();
    img.onload = () => { if (alive) setImgUrl(GATE_7.thresholdImage); };
    img.onerror = () => { if (alive) setImgUrl(null); };
    img.src = GATE_7.thresholdImage;
    return () => { alive = false; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.8 }}
      className="relative flex min-h-[88vh] flex-col items-center justify-center text-center"
    >
      {/* Quiet field of distant stars */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 50% 38%, hsl(255 60% 12% / 0.9) 0%, hsl(240 50% 6% / 0.95) 55%, hsl(240 60% 3%) 100%)",
        }}
      />

      <p
        className="mb-6 text-xs uppercase tracking-[0.5em]"
        style={{ fontFamily: "'Cinzel', serif", color: "hsl(43 50% 60%)" }}
      >
        {GATE_7.numberLabel}
      </p>
      <h1
        className="mb-12 text-5xl md:text-6xl"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          letterSpacing: "0.06em",
          color: "hsl(0 0% 96%)",
          textShadow: "0 0 70px hsl(255 60% 70% / 0.45)",
        }}
      >
        {GATE_7.name}
      </h1>
      {/* Canonical absence — Gate 7 has no subtitle. */}

      <div
        className="relative mb-14 mx-auto w-full max-w-[28rem]"
        style={{ aspectRatio: GATE_7.thresholdAspect }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-12"
          style={{
            background:
              "radial-gradient(ellipse at 50% 42%, hsl(43 70% 70% / 0.16) 0%, transparent 60%)",
            filter: "blur(24px)",
          }}
        />
        {imgUrl ? (
          <motion.img
            src={imgUrl}
            alt=""
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.96 }}
            transition={{ duration: 3.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 h-full w-full select-none object-contain"
            style={{
              boxShadow: "0 60px 120px -40px hsl(240 50% 0% / 0.95)",
            }}
          />
        ) : (
          <div
            className="relative z-10 h-full w-full"
            style={{
              borderRadius: "0.5rem",
              background:
                "linear-gradient(180deg, hsl(240 50% 6%) 0%, hsl(255 40% 10%) 100%)",
            }}
          />
        )}
      </div>

      {/* Closed Book visible far below — symbolic presence only, NEVER opens. */}
      <div
        aria-hidden
        className="mb-12 flex flex-col items-center opacity-40"
        style={{ filter: "blur(0.3px)" }}
      >
        <ClosedBookGlyph width={92} />
        <p
          className="mt-3 text-[10px] uppercase tracking-[0.4em]"
          style={{ fontFamily: "'Cinzel', serif", color: "hsl(43 30% 50%)" }}
        >
          the book remains closed
        </p>
      </div>

      <pre
        className="mb-10 whitespace-pre-line text-lg italic leading-loose"
        style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 30% 86%)" }}
      >
        {GATE_7.thresholdCopy}
      </pre>
      <RitualButton onClick={onApproach}>Enter the Final Threshold</RitualButton>
    </motion.div>
  );
}
