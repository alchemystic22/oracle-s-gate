import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { CornerBrackets, SacredGeometry } from "./Backdrop";
import { RitualButton } from "./RitualPrimitives";

const GRIMOIRE_SRC = "/assets/gates/gate-1/grimoire.jpg";

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
        initial={{ y: 80, opacity: 0, rotateX: 22, scale: 0.92 }}
        animate={{ y: 0, opacity: 1, rotateX: 0, scale: 1 }}
        transition={{ duration: 2.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative mb-12"
        style={{ perspective: "1400px" }}
      >
        {/* Aurora halo behind — ancient warmth meeting cool tech glow */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
          {[1.55, 1.25, 1.0].map((s, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${24 * s}rem`,
                height: `${24 * s}rem`,
                background: `radial-gradient(circle, hsl(35 90% 55% / ${0.22 - i * 0.05}) 0%, hsl(280 65% 45% / ${0.12 - i * 0.03}) 38%, transparent 70%)`,
                filter: "blur(28px)",
              }}
              animate={{ scale: [1, 1.05, 1], opacity: [0.75, 1, 0.75] }}
              transition={{ duration: 7 + i * 1.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.7 }}
            />
          ))}
        </div>

        {/* deep cast shadow under the tome */}
        <div
          aria-hidden
          className="absolute left-1/2 -bottom-6 -translate-x-1/2"
          style={{
            width: "22rem",
            height: "3.5rem",
            background: "radial-gradient(ellipse at center, hsl(20 40% 0% / 0.85) 0%, transparent 70%)",
            filter: "blur(18px)",
          }}
        />

        {/* THE BOOK — real artifact image, tech effects orbit it, never cover it */}
        <div className="relative h-[26rem] w-[17rem] md:h-[32rem] md:w-[21rem]">
          <img
            src={GRIMOIRE_SRC}
            alt="Ancient leatherbound grimoire, embossed with sacred geometry and bound in gold"
            className="relative z-10 h-full w-full object-contain select-none"
            style={{
              filter: "drop-shadow(0 0 60px hsl(35 80% 45% / 0.55)) drop-shadow(0 30px 50px hsl(20 40% 0% / 0.9))",
            }}
            draggable={false}
          />

          {/* breathing ember glow concentrated on the lock/keyhole region */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[64%] z-20 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: "10rem",
              height: "10rem",
              background:
                "radial-gradient(circle, hsl(35 100% 65% / 0.55) 0%, hsl(28 90% 50% / 0.25) 35%, transparent 70%)",
              mixBlendMode: "screen",
              filter: "blur(6px)",
            }}
            animate={{ opacity: [0.45, 0.95, 0.45], scale: [0.95, 1.08, 0.95] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* sacred geometry pulse on the central sigil */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[38%] z-20 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: "11rem",
              height: "11rem",
              background:
                "radial-gradient(circle, hsl(48 95% 75% / 0.25) 0%, transparent 65%)",
              mixBlendMode: "screen",
              filter: "blur(8px)",
            }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* faint holographic scan grid AROUND the book (clipped by halo, not over the artwork) */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-0 opacity-25"
            style={{
              backgroundImage:
                "linear-gradient(hsl(43 80% 60% / 0.18) 1px, transparent 1px), linear-gradient(90deg, hsl(280 60% 60% / 0.14) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
              maskImage: "radial-gradient(ellipse at center, black 0%, transparent 68%)",
              WebkitMaskImage: "radial-gradient(ellipse at center, black 0%, transparent 68%)",
            }}
          />

          {/* slow rotating seam-light ring — tech halo at the book's outline */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-[-12px] z-0 rounded-[10px]"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0deg, hsl(43 90% 65% / 0.55) 40deg, transparent 90deg, transparent 180deg, hsl(280 70% 65% / 0.45) 220deg, transparent 270deg)",
              filter: "blur(14px)",
              mixBlendMode: "screen",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
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
      <a
        href={GRIMOIRE_SRC}
        download="grimoire.jpg"
        className="mt-6 text-sm underline-offset-4 hover:underline"
        style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 35% 72%)" }}
      >
        Download grimoire image
      </a>
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
