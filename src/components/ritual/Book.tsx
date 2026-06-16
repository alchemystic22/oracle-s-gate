import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { CornerBrackets, SacredGeometry } from "./Backdrop";
import { RitualButton } from "./RitualPrimitives";

function ClaspMedallion() {
  // Ornate gilded clasp/sigil rendered in SVG — replaces the lucide line icon.
  return (
    <svg viewBox="0 0 200 200" className="h-32 w-32 md:h-40 md:w-40" aria-hidden>
      <defs>
        <radialGradient id="gold-fill" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="hsl(48 95% 88%)" />
          <stop offset="45%" stopColor="hsl(43 85% 65%)" />
          <stop offset="100%" stopColor="hsl(35 70% 38%)" />
        </radialGradient>
        <radialGradient id="gold-rim" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor="hsl(43 70% 55%)" stopOpacity="0" />
          <stop offset="100%" stopColor="hsl(28 60% 25%)" stopOpacity="1" />
        </radialGradient>
        <filter id="emboss" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.5" />
        </filter>
      </defs>
      <circle cx="100" cy="100" r="62" fill="none" stroke="url(#gold-fill)" strokeWidth="1.4" opacity="0.9" />
      <circle cx="100" cy="100" r="62" fill="url(#gold-rim)" opacity="0.6" />
      <circle cx="100" cy="100" r="48" fill="none" stroke="hsl(43 70% 60%)" strokeWidth="0.8" opacity="0.55" />
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i * Math.PI) / 12;
        const x1 = 100 + Math.cos(a) * 54;
        const y1 = 100 + Math.sin(a) * 54;
        const x2 = 100 + Math.cos(a) * 60;
        const y2 = 100 + Math.sin(a) * 60;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(43 70% 60%)" strokeWidth="0.6" opacity="0.65" />;
      })}
      <g filter="url(#emboss)">
        <path
          d="M100 70 Q108 70 108 80 Q108 88 102 91 L104 110 L96 110 L98 91 Q92 88 92 80 Q92 70 100 70 Z"
          fill="url(#gold-fill)"
          stroke="hsl(28 60% 25%)"
          strokeWidth="0.6"
        />
        <rect x="78" y="118" width="44" height="3" rx="1" fill="url(#gold-fill)" />
        <rect x="86" y="124" width="28" height="2" rx="1" fill="url(#gold-fill)" opacity="0.85" />
      </g>
      {[0, 90, 180, 270].map((rot) => (
        <g key={rot} transform={`rotate(${rot} 100 100)`}>
          <path d="M100 36 Q104 40 100 44 Q96 40 100 36 Z" fill="url(#gold-fill)" opacity="0.9" />
        </g>
      ))}
    </svg>
  );
}

export function BookEmergence({ onOpen, ready }: { onOpen: () => void; ready: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.4 }}
      className="flex min-h-[70vh] flex-col items-center justify-center text-center"
    >
      <motion.div
        initial={{ y: 60, opacity: 0, rotateX: 28 }}
        animate={{ y: 0, opacity: 1, rotateX: 0 }}
        transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative mb-12"
        style={{ perspective: "1200px" }}
      >
        {/* aura halos BEHIND the book (replaces floor ellipses) */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
          {[1.4, 1.15, 0.9].map((s, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${22 * s}rem`,
                height: `${22 * s}rem`,
                background: `radial-gradient(circle, hsl(43 85% 60% / ${0.18 - i * 0.04}) 0%, hsl(280 60% 40% / ${0.08 - i * 0.02}) 40%, transparent 70%)`,
                filter: "blur(22px)",
              }}
              animate={{ scale: [1, 1.06, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }}
            />
          ))}
        </div>

        {/* deep cast shadow under book */}
        <div
          aria-hidden
          className="absolute left-1/2 -bottom-4 -translate-x-1/2"
          style={{
            width: "20rem",
            height: "3rem",
            background: "radial-gradient(ellipse at center, hsl(240 30% 0% / 0.8) 0%, transparent 70%)",
            filter: "blur(16px)",
          }}
        />

        <div
          className="relative h-96 w-72 md:h-[28rem] md:w-80"
          style={{
            background:
              "linear-gradient(135deg, hsl(28 22% 18%) 0%, hsl(25 24% 11%) 45%, hsl(20 20% 5%) 100%)",
            border: "1px solid hsl(43 35% 55% / 0.55)",
            borderRadius: "5px",
            boxShadow:
              "0 0 140px -10px hsl(43 80% 60% / 0.45), inset 0 2px 0 hsl(45 50% 70% / 0.25), inset 0 -60px 100px hsl(20 30% 2% / 0.9), inset 0 0 0 1px hsl(20 30% 3% / 0.7), 0 60px 100px -20px hsl(240 30% 0% / 0.95)",
          }}
        >
          {/* coarse leather grain */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.55] mix-blend-overlay"
            style={{
              borderRadius: "5px",
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.22  0 0 0 0 0.14  0 0 0 0 0.08  0 0 0 1.4 -0.2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
            }}
          />
          {/* fine pebble grain */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.4] mix-blend-soft-light"
            style={{
              borderRadius: "5px",
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='2.8' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
            }}
          />
          {/* warm vignette */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              borderRadius: "5px",
              background:
                "radial-gradient(ellipse at 50% 35%, hsl(38 50% 30% / 0.25) 0%, transparent 55%), radial-gradient(ellipse at 50% 100%, hsl(20 40% 2% / 0.7) 0%, transparent 60%)",
            }}
          />

          {/* engraved inner border — double-stroke with inset shadow */}
          <div
            aria-hidden
            className="absolute inset-5 rounded-[3px]"
            style={{
              border: "1px solid hsl(43 50% 62% / 0.55)",
              boxShadow:
                "inset 0 0 0 1px hsl(20 40% 2% / 0.9), inset 0 0 32px hsl(20 40% 2% / 0.75), 0 0 0 1px hsl(20 40% 2% / 0.55), 0 0 14px hsl(43 70% 55% / 0.18)",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-7 rounded-[2px]"
            style={{ border: "1px solid hsl(43 40% 55% / 0.28)" }}
          />

          {/* ornate filigree corners */}
          {[
            { top: "0.9rem", left: "0.9rem", rot: 0 },
            { top: "0.9rem", right: "0.9rem", rot: 90 },
            { bottom: "0.9rem", right: "0.9rem", rot: 180 },
            { bottom: "0.9rem", left: "0.9rem", rot: 270 },
          ].map((pos, i) => (
            <svg
              key={i}
              viewBox="0 0 40 40"
              aria-hidden
              className="absolute h-5 w-5"
              style={{ ...pos, transform: `rotate(${pos.rot}deg)` }}
            >
              <path
                d="M2 2 L18 2 M2 2 L2 18 M2 2 Q12 4 18 10 M2 2 Q4 12 10 18"
                fill="none"
                stroke="hsl(43 65% 68% / 0.7)"
                strokeWidth="0.9"
                strokeLinecap="round"
              />
              <circle cx="12" cy="12" r="1.2" fill="hsl(43 80% 70% / 0.7)" />
            </svg>
          ))}

          {/* breathing clasp medallion */}
          <motion.div
            animate={{ opacity: [0.75, 1, 0.75], scale: [1, 1.025, 1] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ filter: "drop-shadow(0 0 22px hsl(43 85% 60% / 0.75)) drop-shadow(0 0 6px hsl(48 95% 80% / 0.5))" }}
          >
            <ClaspMedallion />
          </motion.div>

          {/* spine seam with highlight */}
          <div
            aria-hidden
            className="absolute left-1/2 top-4 bottom-4 -translate-x-1/2"
            style={{
              width: "4px",
              background:
                "linear-gradient(180deg, transparent, hsl(20 40% 2% / 0.85) 8%, hsl(20 40% 2% / 0.85) 92%, transparent)",
              boxShadow:
                "1.5px 0 0 hsl(43 45% 55% / 0.22), -1.5px 0 0 hsl(20 40% 2% / 0.8)",
            }}
          />

          {/* top edge highlight */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[2px]"
            style={{ background: "linear-gradient(90deg, transparent, hsl(45 60% 75% / 0.55), transparent)" }}
          />
          {/* bottom edge shadow */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-[3px]"
            style={{ background: "linear-gradient(90deg, transparent, hsl(20 50% 2% / 0.9), transparent)" }}
          />
        </div>
      </motion.div>
      <p
        className="mb-10 text-2xl md:text-3xl italic"
        style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 35% 82%)" }}
      >
        A hidden page has opened.
      </p>
      <RitualButton onClick={onOpen} disabled={!ready}>Open the Book</RitualButton>
    </motion.div>
  );
}

export function BookShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative mx-auto w-full p-2 md:p-3"
      style={{
        background:
          "linear-gradient(135deg, hsl(240 35% 10% / 0.85) 0%, hsl(270 40% 8% / 0.85) 100%)",
        border: "1px solid hsl(43 80% 82% / 0.45)",
        borderRadius: "6px",
        backdropFilter: "blur(14px)",
        boxShadow:
          "0 0 180px -20px hsl(43 80% 60% / 0.3), 0 0 60px -20px hsl(280 70% 50% / 0.35), 0 50px 80px -30px hsl(240 30% 0% / 0.85), inset 0 1px 0 hsl(45 60% 70% / 0.18)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: "6px",
          background:
            "linear-gradient(120deg, transparent 30%, hsl(43 90% 70% / 0.08) 48%, hsl(280 70% 70% / 0.08) 52%, transparent 70%)",
        }}
      />
      <CornerBrackets />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-overlay"
        style={{
          borderRadius: "4px",
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        }}
      />
      <div
        className="relative px-6 py-12 md:px-14 md:py-16"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, hsl(240 30% 13%) 0%, hsl(255 30% 9%) 55%, hsl(240 30% 6%) 100%)",
          border: "1px solid hsl(43 80% 82% / 0.22)",
          boxShadow:
            "inset 0 0 160px hsl(240 40% 2% / 0.85), inset 0 0 80px hsl(280 60% 30% / 0.15), inset 0 1px 0 hsl(45 60% 70% / 0.1)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.7'/></svg>\")",
          }}
        />
        <SacredGeometry className="absolute left-1/2 top-1/2 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 opacity-[0.06]" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 0% 0%, hsl(20 30% 2% / 0.55) 0%, transparent 35%), radial-gradient(ellipse at 100% 0%, hsl(20 30% 2% / 0.55) 0%, transparent 35%), radial-gradient(ellipse at 0% 100%, hsl(20 30% 2% / 0.55) 0%, transparent 35%), radial-gradient(ellipse at 100% 100%, hsl(20 30% 2% / 0.55) 0%, transparent 35%)",
          }}
        />
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}
