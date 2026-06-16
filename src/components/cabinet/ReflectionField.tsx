import { useState } from "react";
import { motion } from "framer-motion";
import type { PrivacyMode } from "../../lib/state";

export function ReflectionField({
  privacyMode,
  onSave,
  onClose,
}: {
  privacyMode: PrivacyMode;
  onSave: (reflection: string, stored: boolean) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const willStore = privacyMode === "temporary_entry" || privacyMode === "completion_marker_only";
  // completion_marker_only: do NOT persist the text (only mark the encounter); spec.
  const persistsText = privacyMode === "temporary_entry";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="mt-10 pt-6 border-t border-gold-aged/20"
    >
      <p className="text-gold-aged text-xs tracking-[0.3em] uppercase mb-3">What surfaced for you?</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder="Optional. Spoken only to yourself."
        className="w-full bg-obsidian/60 border border-bronze/40 rounded-sm p-3 text-parchment placeholder:text-parchment-dim/60 focus:outline-none focus:border-gold-aged text-sm"
      />
      <div className="mt-4 flex items-center justify-between">
        <span className="text-parchment-dim text-[10px] tracking-widest uppercase">
          privacy · {privacyMode.replace(/_/g, " ")}
        </span>
        <div className="flex gap-5">
          <button
            onClick={onClose}
            className="text-parchment-dim hover:text-parchment text-xs tracking-[0.3em] uppercase transition-colors duration-500"
          >
            close
          </button>
          <button
            onClick={() => onSave(persistsText ? text.trim() : "", willStore && text.trim().length > 0)}
            className="text-gold-aged hover:text-gold text-xs tracking-[0.3em] uppercase transition-colors duration-500"
          >
            keep
          </button>
        </div>
      </div>
    </motion.div>
  );
}
