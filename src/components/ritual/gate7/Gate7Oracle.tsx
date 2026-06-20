// Witness-only Oracle for Gate 7.
//
// CANONICAL CONTRACT: This oracle does NOT assign Spirals, does NOT
// diagnose failure, does NOT route the Avatar to a corrective page,
// does NOT reveal hidden architecture, does NOT crown the Avatar.
// It only witnesses. It does not import the corrective oracleResponse()
// router. Categories are fixed; responses are canned.

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type WitnessId =
  | "fail"
  | "where_book"
  | "which_spiral"
  | "disappear"
  | "releasing"
  | "responsibility"
  | "no_longer_matter"
  | "refine";

const WITNESS: { id: WitnessId; label: string; answer: string }[] = [
  {
    id: "fail",
    label: "Did I fail?",
    answer:
      "No hidden page opens here. This threshold is not a correction. It asks what can be released now that the work can stand.",
  },
  {
    id: "where_book",
    label: "Where is the Book?",
    answer: "The Book has closed. Its work was correction. This Gate is release.",
  },
  {
    id: "which_spiral",
    label: "Which Spiral is this?",
    answer:
      "There is no Spiral here. The final threshold does not route the fracture. It releases the claim.",
  },
  {
    id: "disappear",
    label: "Do I need to disappear?",
    answer:
      "No. The Vanishing Star does not ask you to disappear from life. It asks the name to stop standing in front of the work.",
  },
  {
    id: "releasing",
    label: "What am I releasing?",
    answer:
      "Release the need to be seen as the source. Let the work remain without asking the name to guard it.",
  },
  {
    id: "responsibility",
    label: "Do I still have responsibility?",
    answer: "Yes. Ownership can be released without abandoning stewardship.",
  },
  {
    id: "no_longer_matter",
    label: "Can I write that I no longer matter?",
    answer:
      "No. The final statement must not erase the being. Release source-claim, not worth.",
  },
  {
    id: "refine",
    label: "Help me refine the release statement",
    answer: "Make it quieter. Release ownership. Keep responsibility intact.",
  },
];

export function Gate7Oracle() {
  const [active, setActive] = useState<WitnessId | null>(null);
  const current = WITNESS.find((w) => w.id === active);

  return (
    <section
      className="mt-12 border p-6"
      style={{
        borderColor: "hsl(43 30% 55% / 0.25)",
        background: "hsl(240 40% 6% / 0.4)",
      }}
    >
      <p
        className="mb-1 text-[10px] uppercase tracking-[0.4em]"
        style={{ fontFamily: "'Cinzel', serif", color: "hsl(43 50% 60%)" }}
      >
        Witness
      </p>
      <p
        className="mb-5 text-sm italic"
        style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 30% 70%)" }}
      >
        The Gate 7 witness does not diagnose, route, or crown. It only answers.
      </p>

      <div className="flex flex-wrap gap-2">
        {WITNESS.map((w) => {
          const selected = active === w.id;
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => setActive(selected ? null : w.id)}
              className="border px-3 py-2 text-xs transition"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                borderColor: selected ? "hsl(43 70% 65% / 0.7)" : "hsl(43 30% 55% / 0.3)",
                color: selected ? "hsl(43 80% 88%)" : "hsl(43 30% 78%)",
                background: selected ? "hsl(43 70% 50% / 0.1)" : "transparent",
              }}
            >
              {w.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {current && (
          <motion.p
            key={current.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-5 border-l-2 pl-4 text-base italic leading-relaxed"
            style={{
              borderColor: "hsl(43 60% 60% / 0.5)",
              color: "hsl(43 30% 88%)",
              fontFamily: "'Cormorant Garamond', serif",
            }}
          >
            {current.answer}
          </motion.p>
        )}
      </AnimatePresence>
    </section>
  );
}
