// Final Ritual Record — Gate 7's release artifact. NOT a Book page.
// Renders all six release fields together, two collapsible helper sections,
// the five-checkbox Safe Release gate, and the seal button. The seal button
// is disabled until every field is non-empty, the final release statement
// passes Unstable Release validation, and all five Safe Release checks are
// confirmed. Unstable Release shows the canonical redirect copy and leaves
// the textarea editable — it does NOT close the threshold.

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";

import { RitualButton } from "../RitualPrimitives";
import { GATE_7, type Gate7FieldId } from "../../../data/gate7";
import {
  detectReleaseState,
  UNSTABLE_RELEASE_COPY,
  INCOMPLETE_RELEASE_COPY,
} from "../../../lib/gate7";
import { Gate7Oracle } from "./Gate7Oracle";

type Answers = Record<Gate7FieldId, string>;

export function FinalRitualRecord({
  initialAnswers,
  initialChecks,
  onAnswersChange,
  onChecksChange,
  onSeal,
}: {
  initialAnswers: Answers;
  initialChecks: boolean[];
  onAnswersChange: (a: Answers) => void;
  onChecksChange: (c: boolean[]) => void;
  onSeal: () => void;
}) {
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [checks, setChecks] = useState<boolean[]>(initialChecks);
  const [openExamples, setOpenExamples] = useState(false);
  const [openWhatNot, setOpenWhatNot] = useState(false);

  const release = useMemo(
    () => detectReleaseState(answers.final_release_statement),
    [answers.final_release_statement],
  );
  const allFieldsFilled = useMemo(
    () => GATE_7.recordFields.every((f) => (answers[f.id] ?? "").trim().length > 0),
    [answers],
  );
  const allChecked = checks.length === GATE_7.safeReleaseChecks.length && checks.every(Boolean);
  const canSeal = allFieldsFilled && allChecked && release.state === "safe";

  const setField = (id: Gate7FieldId, v: string) => {
    const next = { ...answers, [id]: v };
    setAnswers(next);
    onAnswersChange(next);
  };
  const toggleCheck = (i: number) => {
    const next = checks.map((c, idx) => (idx === i ? !c : c));
    setChecks(next);
    onChecksChange(next);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.6 }}
      className="relative mx-auto w-full max-w-3xl py-12"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, hsl(255 50% 10% / 0.85) 0%, hsl(240 55% 5%) 65%, hsl(240 60% 3%) 100%)",
        }}
      />

      {/* Vellum / parchment surface */}
      <div
        className="relative border p-8 md:p-12"
        style={{
          borderColor: "hsl(43 35% 55% / 0.35)",
          background:
            "linear-gradient(180deg, hsl(38 18% 92% / 0.045) 0%, hsl(38 20% 88% / 0.025) 60%, hsl(38 22% 84% / 0.035) 100%)",
          boxShadow:
            "inset 0 0 60px hsl(43 30% 30% / 0.08), 0 30px 90px -40px hsl(240 60% 0% / 0.8)",
        }}
      >
        <p
          className="text-center text-[10px] uppercase tracking-[0.5em]"
          style={{ fontFamily: "'Cinzel', serif", color: "hsl(43 50% 60%)" }}
        >
          Gate 7
        </p>
        <h2
          className="mt-3 text-center text-4xl"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            color: "hsl(43 70% 86%)",
            letterSpacing: "0.04em",
          }}
        >
          Final Ritual Record
        </h2>
        <pre
          className="mx-auto mt-6 max-w-xl whitespace-pre-line text-center text-base italic leading-relaxed"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 30% 82%)" }}
        >
          {GATE_7.recordOpeningCopy}
        </pre>

        <div className="mt-10 space-y-8">
          {GATE_7.recordFields.map((f) => {
            const isStatement = f.id === "final_release_statement";
            const unstable = isStatement && release.state === "unstable";
            return (
              <div key={f.id}>
                <label
                  htmlFor={`g7-${f.id}`}
                  className="block text-xs uppercase tracking-[0.3em]"
                  style={{ fontFamily: "'Cinzel', serif", color: "hsl(43 55% 62%)" }}
                >
                  {f.label}
                </label>
                <p
                  className="mt-2 text-base italic leading-relaxed"
                  style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 30% 85%)" }}
                >
                  {f.prompt}
                </p>
                <textarea
                  id={`g7-${f.id}`}
                  value={answers[f.id] ?? ""}
                  onChange={(e) => setField(f.id, e.target.value)}
                  placeholder={f.placeholder}
                  rows={isStatement ? 4 : 3}
                  className="mt-3 w-full resize-none border bg-transparent p-3 text-base leading-relaxed outline-none"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    color: "hsl(43 30% 92%)",
                    borderColor: unstable
                      ? "hsl(15 50% 55% / 0.7)"
                      : "hsl(43 30% 55% / 0.4)",
                    background: "hsl(240 30% 6% / 0.3)",
                  }}
                />
                {unstable && (
                  <p
                    className="mt-3 border-l-2 pl-4 text-sm italic leading-relaxed"
                    style={{
                      borderColor: "hsl(15 60% 55% / 0.65)",
                      color: "hsl(38 30% 88%)",
                      fontFamily: "'Cormorant Garamond', serif",
                    }}
                  >
                    {UNSTABLE_RELEASE_COPY}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 space-y-3">
          <HelperDisclosure
            label="Release Statement Examples"
            open={openExamples}
            onToggle={() => setOpenExamples((o) => !o)}
          >
            <ul className="mt-2 space-y-2 text-base italic leading-relaxed" style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 30% 85%)" }}>
              {GATE_7.releaseExamples.map((ex) => (
                <li key={ex} className="border-l pl-3" style={{ borderColor: "hsl(43 50% 55% / 0.4)" }}>
                  {ex}
                </li>
              ))}
            </ul>
          </HelperDisclosure>
          <HelperDisclosure
            label="What This Is Not"
            open={openWhatNot}
            onToggle={() => setOpenWhatNot((o) => !o)}
          >
            <ul className="mt-2 space-y-2 text-base italic leading-relaxed" style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(15 35% 75%)" }}>
              {GATE_7.whatThisIsNot.map((ex) => (
                <li key={ex} className="border-l pl-3" style={{ borderColor: "hsl(15 50% 50% / 0.4)" }}>
                  {ex}
                </li>
              ))}
            </ul>
          </HelperDisclosure>
        </div>

        <div className="mt-12">
          <p
            className="mb-4 text-xs uppercase tracking-[0.3em]"
            style={{ fontFamily: "'Cinzel', serif", color: "hsl(43 55% 62%)" }}
          >
            Safe Release Check
          </p>
          <ul className="space-y-3">
            {GATE_7.safeReleaseChecks.map((label, i) => (
              <li key={label}>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={checks[i] ?? false}
                    onChange={() => toggleCheck(i)}
                    className="mt-1 h-4 w-4 cursor-pointer accent-[hsl(43_70%_60%)]"
                  />
                  <span
                    className="text-base italic leading-relaxed"
                    style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 30% 88%)" }}
                  >
                    {label}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <p
          className="mt-8 text-xs italic"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 30% 65%)" }}
        >
          {GATE_7.privacyNote}
        </p>

        <div className="mt-10 flex flex-col items-center gap-4">
          {!canSeal && (allFieldsFilled || allChecked || (answers.final_release_statement ?? "").length > 0) && (
            <p
              className="max-w-xl text-center text-sm italic"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 30% 75%)" }}
            >
              {INCOMPLETE_RELEASE_COPY}
            </p>
          )}
          <RitualButton onClick={onSeal} disabled={!canSeal}>
            Seal the Final Record
          </RitualButton>
        </div>
      </div>

      <Gate7Oracle />
    </motion.div>
  );
}

function HelperDisclosure({
  open,
  onToggle,
  label,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border" style={{ borderColor: "hsl(43 30% 55% / 0.2)" }}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-xs uppercase tracking-[0.3em]"
        style={{ fontFamily: "'Cinzel', serif", color: "hsl(43 50% 60%)" }}
      >
        <span>{label}</span>
        <span>{open ? "−" : "+"}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-4 pb-4"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
