import { motion } from "framer-motion";
import { CornerBrackets, SacredGeometry } from "../ritual/Backdrop";
import { type ReactNode } from "react";

export function CabinetChamber({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen text-parchment px-4 md:px-8 py-12 md:py-16 overflow-hidden">
      {/* Slow sacred geometry overlay */}
      <SacredGeometry className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vmin] h-[120vmin] opacity-15" />
      <div className="relative max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-gold text-4xl md:text-5xl"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            The Reading Cabinet
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 0.5, scaleX: 1 }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            className="mt-5 h-px w-24 mx-auto bg-gold-aged origin-center"
          />
        </header>
        <section className="relative cabinet-recess rounded-sm">
          <CornerBrackets />
          <div className="relative p-6 md:p-12 min-h-[420px]">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
