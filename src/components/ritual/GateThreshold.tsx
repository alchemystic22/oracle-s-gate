import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { RitualButton } from "./RitualPrimitives";

/* Gate 1 threshold: CSS placeholder by default; runtime-checks for /assets/gates/gate-1/threshold.png
   and uses it without a broken-image flash. */
export function GateThreshold({
  onApproach,
  canApproach,
}: {
  onApproach: () => void;
  canApproach: boolean;
}) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  useEffect(() => {
    const url = "/assets/gates/gate-1/threshold.jpg";
    const img = new Image();
    img.onload = () => setImgUrl(url);
    img.onerror = () => setImgUrl(null);
    img.src = url;
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.4 }}
      className="flex min-h-[80vh] flex-col items-center justify-center text-center"
    >
      <p
        className="mb-6 text-xs uppercase tracking-[0.5em]"
        style={{ fontFamily: "'Cinzel', serif", color: "hsl(43 50% 60%)" }}
      >
        Gate 1
      </p>
      <h1
        className="mb-3 text-5xl md:text-6xl"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          letterSpacing: "0.06em",
          color: "hsl(43 80% 82%)",
          textShadow: "0 0 60px hsl(43 80% 60% / 0.35)",
        }}
      >
        The Broken Vow
      </h1>
      <p
        className="mb-10 max-w-xl text-base italic"
        style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 30% 75%)" }}
      >
        Where the world's promise fractures, and the soul begins to see.
      </p>

      <div className="relative mb-14 mx-auto w-full max-w-[30rem]" style={{ aspectRatio: "1024 / 1536" }}>
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-10"
          style={{
            background: "radial-gradient(ellipse at 50% 55%, hsl(43 80% 60% / 0.18) 0%, transparent 60%)",
            filter: "blur(20px)",
          }}
        />
        {/* Gate body — image when available, CSS placeholder otherwise */}
        {imgUrl ? (
          <motion.img
            src={imgUrl}
            alt=""
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 0.92, scale: 1 }}
            transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 h-full w-full select-none object-cover"
            style={{
              borderRadius: "0.5rem",
              boxShadow: "0 60px 120px -40px hsl(240 30% 0% / 0.95), inset 0 0 80px hsl(240 30% 0% / 0.5)",
              maskImage: "radial-gradient(ellipse at 50% 50%, black 45%, rgba(0,0,0,0.55) 80%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, black 45%, rgba(0,0,0,0.55) 80%, transparent 100%)",
            }}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 h-full w-full"
            style={{
              borderRadius: "0.5rem",
              background:
                "linear-gradient(180deg, hsl(240 35% 5%) 0%, hsl(255 28% 8%) 30%, hsl(20 30% 12%) 55%, hsl(255 28% 7%) 78%, hsl(240 35% 4%) 100%)",
              boxShadow: "0 60px 120px -40px hsl(240 30% 0% / 0.95), inset 0 0 100px hsl(240 30% 0% / 0.65)",
              maskImage: "radial-gradient(ellipse at 50% 50%, black 45%, rgba(0,0,0,0.55) 80%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, black 45%, rgba(0,0,0,0.55) 80%, transparent 100%)",
            }}
          >
            {/* archway suggestion — two pillars + lintel via inset shadows */}
            <div
              aria-hidden
              className="absolute inset-x-[18%] top-[12%] bottom-[6%]"
              style={{
                borderTopLeftRadius: "50% 30%",
                borderTopRightRadius: "50% 30%",
                background:
                  "linear-gradient(180deg, hsl(20 25% 14%) 0%, hsl(20 18% 7%) 70%, hsl(20 12% 4%) 100%)",
                boxShadow:
                  "inset 0 0 40px hsl(0 0% 0% / 0.85), inset 0 2px 0 hsl(45 30% 35% / 0.2)",
              }}
            />
            {/* central seam of light running down the gate */}
            <div
              aria-hidden
              className="absolute left-1/2 top-[14%] bottom-[8%] -translate-x-1/2"
              style={{
                width: "2px",
                background:
                  "linear-gradient(180deg, transparent 0%, hsl(43 80% 70% / 0.35) 25%, hsl(43 90% 75% / 0.6) 50%, hsl(43 80% 70% / 0.35) 75%, transparent 100%)",
                filter: "blur(0.5px)",
              }}
            />
          </motion.div>
        )}
        {/* violet→blue color overlay (always on, including with the canonical photo) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[15]"
          style={{
            background:
              "linear-gradient(90deg, hsl(285 80% 55% / 0.45) 0%, hsl(275 65% 45% / 0.22) 35%, hsl(225 65% 28% / 0.25) 55%, hsl(222 75% 32% / 0.55) 100%)",
            mixBlendMode: "overlay",
            maskImage: "radial-gradient(ellipse at 50% 50%, black 45%, rgba(0,0,0,0.55) 80%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, black 45%, rgba(0,0,0,0.55) 80%, transparent 100%)",
          }}
        />
        {/* ember pulse */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[44%] z-20 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: "3.5rem",
            height: "3.5rem",
            background:
              "radial-gradient(circle, hsl(43 95% 70% / 0.55) 0%, hsl(28 90% 50% / 0.25) 40%, transparent 75%)",
            filter: "blur(2px)",
            mixBlendMode: "screen",
          }}
          animate={{ opacity: [0.35, 0.75, 0.35], scale: [1, 1.08, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* slow seam-light ring */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[58%] z-20 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: "10rem",
            height: "10rem",
            border: "1px solid hsl(43 80% 60% / 0.18)",
            boxShadow: "inset 0 0 24px hsl(43 80% 60% / 0.18)",
            mixBlendMode: "screen",
          }}
          animate={{ opacity: [0.25, 0.5, 0.25], rotate: 360 }}
          transition={{
            opacity: { duration: 8, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 240, repeat: Infinity, ease: "linear" },
          }}
        />
        {/* drifting scanline */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-8 z-20 h-px"
          style={{
            background: "linear-gradient(90deg, transparent 0%, hsl(43 90% 75% / 0.35) 50%, transparent 100%)",
            mixBlendMode: "screen",
          }}
          initial={{ top: "10%", opacity: 0 }}
          animate={{ top: ["10%", "90%"], opacity: [0, 0.6, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
        />
        {/* deep vignette */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-30"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, transparent 55%, hsl(240 30% 2% / 0.85) 100%)",
          }}
        />
      </div>

      {/* Stillness until the time-lock releases. Then the line and the action appear together. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: canApproach ? 1 : 0 }}
        transition={{ duration: 1.6, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <pre
          className="mb-10 whitespace-pre-line text-lg italic leading-loose"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 30% 82%)" }}
        >
{`The Gate stands before you.
It does not require haste.
It requires arrival.`}
        </pre>
        <RitualButton onClick={onApproach} disabled={!canApproach}>Approach the Gate</RitualButton>
      </motion.div>
    </motion.div>
  );
}
