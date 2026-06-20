// Gate 7 Orchestrator — branch entry from src/routes/gate.$gateId.tsx.
//
// CANONICAL CONTRACT: this orchestrator does NOT import the corrective
// pipeline (no Book.tsx, no GateThreshold.tsx, no ROUTES, no oracle.ts,
// no GATE_CONTENT lookup). It owns its own phase machine and renders
// only Gate 7 surfaces.
//
// Phase machine:
//   threshold → bookClosure → record → completionSeal → vanishingMoment → completionFinal
//
// Phase + record answers + safe-release checks are local React state.
// On final completion (the "Complete the Gate" button on the final screen),
// state.gates[7].completedAt is written.

import { AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import type { AppState } from "../../../lib/state";
import { GATE_7, type Gate7FieldId } from "../../../data/gate7";
import { obs } from "../../../lib/observation";

import { Gate7Threshold } from "./Gate7Threshold";
import { BookClosureAcknowledgment } from "./BookClosureAcknowledgment";
import { FinalRitualRecord } from "./FinalRitualRecord";
import { VanishingStarMoment } from "./VanishingStarMoment";
import { Gate7CompletionSeal, Gate7CompletionFinal } from "./Gate7Completion";

type Phase =
  | "threshold"
  | "bookClosure"
  | "record"
  | "completionSeal"
  | "vanishingMoment"
  | "completionFinal";

type Answers = Record<Gate7FieldId, string>;

function emptyAnswers(): Answers {
  const out = {} as Answers;
  for (const f of GATE_7.recordFields) out[f.id] = "";
  return out;
}

export function Gate7Orchestrator({
  state,
  update,
}: {
  state: AppState;
  update: (u: (s: AppState) => AppState) => void;
}) {
  const [phase, setPhase] = useState<Phase>("threshold");
  const [answers, setAnswers] = useState<Answers>(() => emptyAnswers());
  const [checks, setChecks] = useState<boolean[]>(() =>
    GATE_7.safeReleaseChecks.map(() => false),
  );

  // Mark visited on first mount.
  const didVisit = useRef(false);
  useEffect(() => {
    if (didVisit.current) return;
    didVisit.current = true;
    if (!state.gates[7]?.visitedAt) {
      update((s) => ({
        ...s,
        gates: { ...s.gates, 7: { ...s.gates[7], visitedAt: Date.now() } },
      }));
    }
    obs("gate_phase", { id: 7, phase: "threshold" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    obs("gate_phase", { id: 7, phase });
  }, [phase]);

  const goTo = (p: Phase) => setPhase(p);

  const sealCompletion = () => {
    update((s) => ({
      ...s,
      gates: {
        ...s.gates,
        7: { ...s.gates[7], completedAt: s.gates[7]?.completedAt ?? Date.now() },
      },
    }));
    obs("gate_complete", { id: 7 });
  };

  return (
    <main className="min-h-screen px-6 py-12 md:py-16">
      <div className="mx-auto w-full max-w-[1080px]">
        <AnimatePresence mode="wait">
          {phase === "threshold" && (
            <Gate7Threshold key="t" onApproach={() => goTo("bookClosure")} />
          )}
          {phase === "bookClosure" && (
            <BookClosureAcknowledgment key="bc" onContinue={() => goTo("record")} />
          )}
          {phase === "record" && (
            <FinalRitualRecord
              key="rec"
              initialAnswers={answers}
              initialChecks={checks}
              onAnswersChange={setAnswers}
              onChecksChange={setChecks}
              onSeal={() => goTo("completionSeal")}
            />
          )}
          {phase === "completionSeal" && (
            <Gate7CompletionSeal key="cs" onSealed={() => goTo("vanishingMoment")} />
          )}
          {phase === "vanishingMoment" && (
            <VanishingStarMoment key="vm" onContinue={() => {
              sealCompletion();
              goTo("completionFinal");
            }} />
          )}
          {phase === "completionFinal" && <Gate7CompletionFinal key="cf" />}
        </AnimatePresence>
      </div>
    </main>
  );
}
