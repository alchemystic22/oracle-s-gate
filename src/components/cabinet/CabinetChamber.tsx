import { motion } from "framer-motion";
import { type ReactNode } from "react";
import { SacredGeometry } from "../ritual/Backdrop";

const CHAMBER_IMAGE = "/assets/rooms/resonant-reading-chamber.jpg";

/**
 * The chamber of The Ritual of Resonant Reading.
 * A photographic stone room is the dominant register; cosmic/geometric overlays
 * are muted to ~20-25% as a faint "ancient-meets-transmission" hint.
 *
 * Children render above the central stone altar.
 */
export function CabinetChamber({
  title,
  subtitle,
  candleLit = false,
  children,
}: {
  title?: string;
  subtitle?: string;
  candleLit?: boolean;
  children: ReactNode;
}) {
  return (
    <main className="relative min-h-screen text-parchment overflow-hidden">
      {/* Photographic chamber — full bleed base layer */}
      <div className="fixed inset-0 -z-10">
        <img
          src={CHAMBER_IMAGE}
          alt=""
          className="w-full h-full object-cover"
          aria-hidden
        />
        {/* Darken / soften the room slightly so foreground text reads */}
        <div className="absolute inset-0 bg-obsidian-deep/55" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 65%, transparent 0%, color-mix(in oklab, var(--obsidian-deep) 70%, transparent) 80%)",
          }}
        />
      </div>

      {/* Faint sacred-geometry engraving — frozen, no rotation */}
      <SacredGeometry className="pointer-events-none fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vmin] h-[120vmin] opacity-[0.08]" />

      <div className="relative max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-16">
        {title && (
          <header className="text-center mb-12">
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
              className="text-gold text-4xl md:text-5xl"
              style={{
                fontFamily: "var(--font-serif)",
                textShadow: "0 2px 24px rgba(0,0,0,0.6)",
              }}
            >
              {title}
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 0.5, scaleX: 1 }}
              transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              className="mt-5 h-px w-24 mx-auto bg-gold-aged origin-center"
            />
            {subtitle && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
                className="mt-6 text-parchment-dim italic text-base md:text-lg max-w-xl mx-auto"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                {subtitle}
              </motion.p>
            )}
          </header>
        )}

        <section className="relative min-h-[420px]">
          {children}

          {/* The lit candle (Phase II onward) — anchored to the foreground edge of the altar */}
          {candleLit && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[-2rem] md:bottom-[-3rem]"
              aria-hidden
            >
              <div className="candle-flame" />
            </motion.div>
          )}
        </section>
      </div>
    </main>
  );
}
