import { motion } from "framer-motion";
import { BookLock } from "lucide-react";
import type { ReactNode } from "react";
import { CornerBrackets, SacredGeometry } from "./Backdrop";
import { RitualButton } from "./RitualPrimitives";

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
        <div
          aria-hidden
          className="absolute left-1/2 top-full -translate-x-1/2"
          style={{ width: "26rem", height: "10rem", transform: "translate(-50%, -40%) perspective(600px) rotateX(70deg)" }}
        >
          {[1, 0.75, 0.5].map((s, i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: `${100 * s}%`,
                height: `${100 * s}%`,
                border: `1px solid hsl(43 90% 70% / ${0.5 - i * 0.12})`,
                boxShadow: `0 0 30px hsl(43 90% 60% / 0.4), inset 0 0 30px hsl(280 70% 60% / 0.25)`,
              }}
              animate={{ scale: [1, 1.05, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
            />
          ))}
        </div>
        <div
          aria-hidden
          className="absolute left-1/2 -bottom-6 -translate-x-1/2"
          style={{
            width: "14rem",
            height: "2.5rem",
            background: "radial-gradient(ellipse at center, hsl(240 20% 0% / 0.7) 0%, transparent 70%)",
            filter: "blur(8px)",
          }}
        />
        <div
          className="relative h-80 w-60 md:h-96 md:w-72"
          style={{
            background:
              "linear-gradient(135deg, hsl(28 22% 18%) 0%, hsl(25 24% 11%) 45%, hsl(20 20% 5%) 100%)",
            border: "1px solid hsl(43 35% 55% / 0.55)",
            borderRadius: "4px",
            boxShadow:
              "0 0 120px -15px hsl(43 80% 60% / 0.35), inset 0 2px 0 hsl(45 40% 65% / 0.18), inset 0 -50px 80px hsl(20 30% 2% / 0.85), inset 0 0 0 1px hsl(20 30% 3% / 0.6), 0 50px 90px -20px hsl(240 30% 0% / 0.9)",
          }}
        >
          {/* leather grain (stronger) */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.35] mix-blend-overlay"
            style={{
              borderRadius: "4px",
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.18  0 0 0 0 0.12  0 0 0 0 0.07  0 0 0 1 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
            }}
          />
          {/* secondary fine grain */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.25] mix-blend-soft-light"
            style={{
              borderRadius: "4px",
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='2.4' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
            }}
          />
          {/* engraved inner border — double-stroke */}
          <div
            aria-hidden
            className="absolute inset-4 rounded-[2px]"
            style={{
              border: "1px solid hsl(43 40% 60% / 0.5)",
              boxShadow:
                "inset 0 0 0 1px hsl(20 30% 2% / 0.8), inset 0 0 28px hsl(20 30% 2% / 0.7), 0 0 0 1px hsl(20 30% 2% / 0.5)",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-6 rounded-[1px]"
            style={{ border: "1px solid hsl(43 30% 50% / 0.25)" }}
          />
          {/* small corner glyphs */}
          {[
            { top: "1rem", left: "1rem" },
            { top: "1rem", right: "1rem" },
            { bottom: "1rem", left: "1rem" },
            { bottom: "1rem", right: "1rem" },
          ].map((pos, i) => (
            <div
              key={i}
              aria-hidden
              className="absolute h-2 w-2 rotate-45"
              style={{ ...pos, border: "1px solid hsl(43 50% 65% / 0.55)" }}
            />
          ))}
          {/* breathing lock */}
          <motion.div
            animate={{ opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ filter: "drop-shadow(0 0 18px hsl(43 80% 60% / 0.7))" }}
          >
            <BookLock className="h-16 w-16 md:h-20 md:w-20" strokeWidth={1.2} style={{ color: "hsl(43 85% 84%)" }} />
          </motion.div>
          {/* spine seam — wider, with highlight */}
          <div
            aria-hidden
            className="absolute left-1/2 top-3 bottom-3 -translate-x-1/2"
            style={{
              width: "3px",
              background:
                "linear-gradient(180deg, transparent, hsl(20 30% 2% / 0.75) 10%, hsl(20 30% 2% / 0.75) 90%, transparent)",
              boxShadow:
                "1px 0 0 hsl(43 40% 55% / 0.18), -1px 0 0 hsl(20 30% 2% / 0.7)",
            }}
          />
          {/* top edge highlight */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[2px]"
            style={{ background: "linear-gradient(90deg, transparent, hsl(45 50% 70% / 0.45), transparent)" }}
          />
        </div>
      </motion.div>
      <p
        className="mb-10 text-xl italic"
        style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 30% 80%)" }}
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
        WebkitBackdropFilter: "blur(14px)",
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
