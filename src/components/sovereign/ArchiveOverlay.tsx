import { motion } from "framer-motion";
import type { SovereignAction } from "../../lib/state";
import { WitnessCard } from "./WitnessCard";

export function ArchiveOverlay({
  sealed,
  onClose,
}: {
  sealed: SovereignAction[];
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 bg-obsidian-deep/85 backdrop-blur-sm overflow-y-auto"
    >
      <div className="max-w-2xl mx-auto px-4 py-12">
        <header className="flex items-baseline justify-between mb-8">
          <h2 className="text-gold text-xl tracking-wide" style={{ fontFamily: "var(--font-serif)" }}>Sealed Witness Cards</h2>
          <button
            onClick={onClose}
            className="text-parchment-dim hover:text-parchment text-xs tracking-[0.3em] uppercase transition-colors duration-500"
          >
            close
          </button>
        </header>
        {sealed.length === 0 ? (
          <p className="text-parchment-dim italic text-sm">No witness has been sealed yet.</p>
        ) : (
          <ul className="space-y-4">
            {sealed.map((a) => <WitnessCard key={a.id} action={a} readOnly />)}
          </ul>
        )}
      </div>
    </motion.div>
  );
}
