import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { PrivacyMode } from "../../lib/state";

export function ReflectionField({
  privacyMode,
  seedLines,
  onSave,
  onClose,
}: {
  privacyMode: PrivacyMode;
  seedLines?: string[];
  onSave: (reflection: string, stored: boolean) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const willStore = privacyMode === "temporary_entry" || privacyMode === "completion_marker_only";
  const persistsText = privacyMode === "temporary_entry";

  // If a line was marked during the vessel reception, pre-seed the field with a
  // gentle reference and the marked line(s) themselves, then let the Avatar continue.
  useEffect(() => {
    if (seedLines && seedLines.length > 0 && !text) {
      const seed = seedLines.map((l) => `“${l}”`).join("\n\n");
      setText(seed + "\n\n");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedLines?.join("|")]);

  const hasSeed = (seedLines?.length ?? 0) > 0;
  const prompt = hasSeed
    ? "What did you notice when this line surfaced for you?"
    : "What surfaced for you?";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
      className="mt-10 pt-6 border-t border-gold-aged/20"
    >
      <p className="text-gold-aged text-sm tracking-[0.2em] uppercase mb-4">{prompt}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={hasSeed ? 7 : 4}
        placeholder="Optional. Spoken only to yourself."
        className="w-full bg-obsidian/60 border border-bronze/40 rounded-sm p-4 text-parchment placeholder:text-parchment-dim/60 focus:outline-none focus:border-gold-aged text-base leading-relaxed"
        style={{ fontFamily: "var(--font-serif)" }}
      />
      <div className="mt-5 flex items-center justify-between flex-wrap gap-3">
        <span className="text-parchment-dim text-xs tracking-[0.2em] uppercase">
          privacy · {privacyMode.replace(/_/g, " ")}
        </span>
        <div className="flex gap-6">
          <button
            onClick={onClose}
            className="text-parchment-dim hover:text-parchment text-sm tracking-[0.2em] uppercase transition-colors duration-500"
          >
            close
          </button>
          <button
            onClick={() => onSave(persistsText ? text.trim() : "", willStore && text.trim().length > 0)}
            className="text-gold-aged hover:text-gold text-sm tracking-[0.2em] uppercase transition-colors duration-500"
          >
            keep
          </button>
        </div>
      </div>
    </motion.div>
  );
}
