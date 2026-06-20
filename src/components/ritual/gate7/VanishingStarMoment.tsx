// Vanishing Star Moment — owner-supplied canonical image of the becoming
// moment. The image sits still; no animation on the image itself. The
// surrounding cosmic backdrop is active but at reduced opacity to keep
// focus on the image. An ~8 second hold passes before the Continue button
// appears (refresh restarts the hold).
//
// CANONICAL NARRATION TO BE SUPPLIED BY OWNER. Do not draft placeholder
// text. Leave space below image for ~3-5 lines of forthcoming narration.

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { RitualButton } from "../RitualPrimitives";
import { GATE_7 } from "../../../data/gate7";

const HOLD_MS = 8000;

export function VanishingStarMoment({ onContinue }: { onContinue: () => void }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [buttonReady, setButtonReady] = useState(false);

  useEffect(() => {
    let alive = true;
    const img = new Image();
    img.onload = () => { if (alive) setImgUrl(GATE_7.vanishingStarMomentImage); };
    img.onerror = () => { if (alive) setImgUrl(null); };
    img.src = GATE_7.vanishingStarMomentImage;
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setButtonReady(true), HOLD_MS);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2.0 }}
      className="relative flex min-h-[92vh] flex-col items-center justify-center text-center"
    >
      {/* Quieter cosmic backdrop than the threshold — reduced opacity so the
          image is the visual center. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, hsl(255 55% 9% / 0.85) 0%, hsl(240 60% 4%) 65%, hsl(240 65% 2%) 100%)",
        }}
      />

      <div
        className="relative mx-auto w-full max-w-[34rem]"
        style={{ aspectRatio: GATE_7.vanishingStarMomentAspect }}
      >
        {imgUrl ? (
          <img
            src={imgUrl}
            alt=""
            className="relative z-10 h-full w-full select-none object-contain"
            style={{
              boxShadow: "0 60px 140px -40px hsl(240 60% 0% / 0.95)",
            }}
          />
        ) : (
          <div
            className="relative z-10 h-full w-full"
            style={{
              background:
                "linear-gradient(180deg, hsl(240 55% 6%) 0%, hsl(255 40% 9%) 100%)",
            }}
          />
        )}
      </div>

      {/*
        CANONICAL NARRATION TO BE SUPPLIED BY OWNER. Do not draft placeholder
        text. Leave space below image for ~3-5 lines of forthcoming narration.
      */}
      <div
        aria-hidden
        className="mt-10 w-full max-w-xl"
        style={{ minHeight: "9rem" }}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: buttonReady ? 1 : 0 }}
        transition={{ duration: 1.6, ease: "easeOut" }}
        className="mt-2"
      >
        <RitualButton onClick={onContinue} disabled={!buttonReady}>
          Continue
        </RitualButton>
      </motion.div>
    </motion.div>
  );
}
