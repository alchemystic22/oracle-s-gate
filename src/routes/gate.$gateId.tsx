import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles } from "lucide-react";

import { gateById, GATES } from "../data/gates";
import { ROUTES, type RouteId } from "../data/correctives";
import { useAppState } from "../lib/useAppState";
import { type AppState, type Gate1State, type ActionStatus, defaultGate1 } from "../lib/state";
import { MeasuredReveal } from "../components/MeasuredReveal";
import { RitualButton, Section, SectionTitle, CrackedSun, BrokenCompass } from "../components/ritual/RitualPrimitives";
import { GateThreshold } from "../components/ritual/GateThreshold";
import { BookEmergence, BookShell } from "../components/ritual/Book";
import { useTimeLock } from "../lib/timelock";
import { detectSafetyConcern, SAFETY_COPY } from "../lib/safety";
import { ORACLE_CATEGORIES, oracleResponse, type OracleCategory } from "../lib/oracle";
import { obs } from "../lib/observation";
import { isDev } from "../lib/admin";

export const Route = createFileRoute("/gate/$gateId")({
  head: () => ({ meta: [{ title: "·" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: GatePage,
});

const STATUS_LABEL: Record<ActionStatus, string> = {
  not_chosen: "Not yet chosen",
  chosen: "Chosen",
  scheduled: "Scheduled",
  completed: "Completed",
};

const ENCOUNTER_PARAS = [
  "Something promised you the world.",
  "Not the literal world — but a way the world would be if you obeyed its rules. A way it would be safe. A way it would reward you. A way it would not betray you if you stayed inside its lines.",
  "That promise has broken.",
  "Or it is breaking now.",
];

const OBSTRUCTION_PARAS = [
  "The Gate stands closed.",
  "Not because your answer was wrong. The Gate is not measuring correctness.",
  "Something is asking to be seen before passage continues.",
  "Two responses rise within you when a promise breaks. Both are honest.",
  "Choose the one that is more true in this moment.",
];

function GatePage() {
  const { gateId } = Route.useParams();
  const id = Number(gateId);
  const gate = gateById(id);
  const nav = useNavigate();
  const { state, update, hydrated } = useAppState();

  useEffect(() => {
    if (hydrated && !state.invocationCompletedAt) nav({ to: "/" });
  }, [hydrated, state.invocationCompletedAt, nav]);

  if (!gate) return <Locked text="No such gate." />;
  if (!hydrated) return null;

  // Per spec: no time-lock between gates. Gate accessibility is only "the next uncompleted gate"
  // (or any gate in dev mode). No 24h cooldown is enforced.
  const accessible = (() => {
    if (isDev()) return true;
    for (const g of GATES) {
      if (!state.gates[g.id]?.completedAt) return g.id === id;
    }
    return false;
  })();

  if (!accessible) return <Locked text="This gate is not yet yours." />;

  if (id !== 1) return <SealedGate id={id as 2|3|4|5|6|7} name={gate.name} />;

  return <GateOne state={state} update={update} />;
}

function Locked({ text }: { text: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-lg italic" style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 30% 78%)" }}>{text}</p>
        <div className="mt-8">
          <Link to="/gates" className="text-xs tracking-widest uppercase" style={{ color: "hsl(43 50% 60%)" }}>return to the constellation</Link>
        </div>
      </div>
    </main>
  );
}

function SealedGate({ id, name }: { id: 2|3|4|5|6|7; name: string }) {
  useEffect(() => { obs("gate_sealed_view", { id }); }, [id]);
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-xs tracking-[0.4em] uppercase" style={{ color: "hsl(43 50% 60%)", fontFamily: "'Cinzel', serif" }}>Gate {id}</p>
        <h1 className="mt-3 text-2xl" style={{ color: "hsl(43 80% 82%)", fontFamily: "'Cormorant Garamond', serif" }}>{name}</h1>
        <p className="mt-8 italic leading-relaxed" style={{ color: "hsl(43 30% 78%)", fontFamily: "'Cormorant Garamond', serif" }}>
          This gate is sealed. Its threshold will be inscribed in time.
        </p>
        <div className="mt-10">
          <Link to="/gates" className="text-xs tracking-widest uppercase" style={{ color: "hsl(43 50% 60%)" }}>return</Link>
        </div>
      </div>
    </main>
  );
}

/* ────────────── Gate 1 orchestrator ────────────── */

function GateOne({ state, update }: { state: AppState; update: (u: (s: AppState) => AppState) => void }) {
  const g1 = state.gate1 ?? defaultGate1();
  const phase = g1.phase;

  // Anchor the current phase on first entry so time-locks survive refresh.
  useEffect(() => {
    if (!g1.anchors[phase]) {
      update((s) => ({ ...s, gate1: { ...s.gate1, anchors: { ...s.gate1.anchors, [phase]: Date.now() } } }));
    }
    // Mark Gate 1 as visited
    if (!state.gates[1]?.visitedAt) {
      update((s) => ({ ...s, gates: { ...s.gates, 1: { ...s.gates[1], visitedAt: Date.now() } } }));
    }
    obs("gate1_phase", { phase });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const setPhase = (next: Gate1State["phase"]) =>
    update((s) => ({ ...s, gate1: { ...s.gate1, phase: next, anchors: { ...s.gate1.anchors, [next]: s.gate1.anchors[next] ?? Date.now() } } }));

  return (
    <main className="min-h-screen px-6 py-12 md:py-16">
      <div className="mx-auto w-full max-w-[1080px]">
        <AnimatePresence mode="wait">
          {phase === "threshold" && (
            <ThresholdPhase key="threshold" g1={g1} setPhase={setPhase} />
          )}
          {phase === "encounter" && (
            <EncounterPhase key="encounter" g1={g1} setPhase={setPhase} update={update} />
          )}
          {phase === "obstruction" && (
            <ObstructionPhase key="obstruction" g1={g1} setPhase={setPhase} update={update} />
          )}
          {phase === "book_emergence" && (
            <motion.div key="emerge" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }}>
              <BookEmergenceWrap g1={g1} setPhase={setPhase} />
            </motion.div>
          )}
          {phase === "page_open" && (
            <PagePhase key="page" g1={g1} update={update} setPhase={setPhase} />
          )}
          {phase === "corrective_gate_open" && (
            <UnlockPhase key="unlock" g1={g1} setPhase={setPhase} />
          )}
          {phase === "relocked" && (
            <RelockedPhase key="relocked" g1={g1} setPhase={setPhase} update={update} />
          )}
          {phase === "completion" && (
            <CompletionPhase key="complete" />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

/* ─── Threshold ─── */

function ThresholdPhase({ g1, setPhase }: { g1: Gate1State; setPhase: (p: Gate1State["phase"]) => void }) {
  const anchor = g1.anchors.threshold;
  const ready = useTimeLock(anchor, 30_000) || isDev();
  return (
    <GateThreshold canApproach={ready} onApproach={() => setPhase("encounter")} />
  );
}

/* ─── Encounter ─── */

function EncounterPhase({ g1, setPhase, update }: { g1: Gate1State; setPhase: (p: Gate1State["phase"]) => void; update: (u: (s: AppState) => AppState) => void }) {
  const anchor = g1.anchors.encounter;
  // copy reveals (~6s), then field appears after 20s from phase entry, submit after 30s
  const [copyDone, setCopyDone] = useState(false);
  const fieldReady = useTimeLock(anchor, 20_000) || isDev();
  const submitReady = useTimeLock(anchor, 30_000) || isDev();
  const [text, setText] = useState(g1.encounterAnswer);
  const [submitted, setSubmitted] = useState(false);

  const safety = detectSafetyConcern(text);

  const onSubmit = () => {
    update((s) => ({ ...s, gate1: { ...s.gate1, encounterAnswer: text, encounterSubmittedAt: Date.now(), safetyLocked: s.gate1.safetyLocked || safety } }));
    obs("gate1_encounter_submit", { len: text.length });
    setSubmitted(true);
    // brief acknowledgement, then to obstruction
    window.setTimeout(() => setPhase("obstruction"), 2200);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }} className="mx-auto max-w-2xl">
      <Header epithet="Gate 1 — The Broken Vow" />
      <MeasuredReveal paragraphs={ENCOUNTER_PARAS} step={1600} tail={1200} onComplete={() => setCopyDone(true)} className="text-[hsl(43_30%_85%)]" />

      <AnimatePresence>
        {copyDone && fieldReady && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: "easeOut" }} className="mt-12">
            <label className="block mb-3 text-base italic" style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 30% 82%)" }}>
              What promise of the world broke for you?
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder="Write what is true. No more."
              className="w-full resize-y border bg-[hsl(240_30%_8%/0.5)] p-4 placeholder:italic placeholder:text-[hsl(43_20%_50%/0.6)] focus:outline-none"
              style={{ borderColor: "hsl(43 30% 55% / 0.3)", color: "hsl(43 30% 88%)" }}
            />
            {safety && <SafetyLine />}
            <div className="mt-6 flex flex-col items-center">
              {submitReady ? (
                <>
                  <p className="mb-4 text-xs italic" style={{ color: "hsl(43 30% 60%)" }}>There is no answer here that is too small.</p>
                  {!submitted ? (
                    <RitualButton onClick={onSubmit} disabled={text.trim().length < 1}>Submit Answer</RitualButton>
                  ) : (
                    <p className="italic" style={{ color: "hsl(43 30% 80%)", fontFamily: "'Cormorant Garamond', serif" }}>Your answer has been received.</p>
                  )}
                </>
              ) : (
                <p className="text-xs italic" style={{ color: "hsl(43 30% 55%)" }}>…</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Obstruction / Layer 3 routing ─── */

function ObstructionPhase({ g1, setPhase, update }: { g1: Gate1State; setPhase: (p: Gate1State["phase"]) => void; update: (u: (s: AppState) => AppState) => void }) {
  const anchor = g1.anchors.obstruction;
  // 3s pause before the copy, then ~8s reveal, then stance cards. Time-lock to clickable: 15s from phase entry.
  const [copyShown, setCopyShown] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const clickable = useTimeLock(anchor, 15_000) || isDev();

  useEffect(() => {
    const t = window.setTimeout(() => setCopyShown(true), 3000);
    return () => window.clearTimeout(t);
  }, []);

  const choose = (route: RouteId) => {
    update((s) => ({ ...s, gate1: { ...s.gate1, activeRoute: route, phase: "book_emergence", anchors: { ...s.gate1.anchors, book_emergence: Date.now() } } }));
    obs("gate1_stance_chosen", { route });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }} className="mx-auto max-w-2xl text-center">
      <Header epithet="Gate 1 — The Broken Vow" />
      {copyShown && (
        <MeasuredReveal
          paragraphs={OBSTRUCTION_PARAS}
          step={1700}
          tail={800}
          onComplete={() => setCopyDone(true)}
          className="text-[hsl(43_30%_85%)]"
        />
      )}

      <div className="mt-14 grid gap-6 md:grid-cols-2">
        <StanceCard
          delayMs={0}
          visible={copyDone}
          clickable={clickable}
          onClick={() => choose("false_arrival")}
          text="I see what was false. I am no longer bound by it."
        />
        <StanceCard
          delayMs={150}
          visible={copyDone}
          clickable={clickable}
          onClick={() => choose("splintered_trust")}
          text="I see what was false. I cannot trust what comes next."
        />
      </div>
    </motion.div>
  );
}

function StanceCard({ visible, clickable, onClick, text, delayMs }: { visible: boolean; clickable: boolean; onClick: () => void; text: string; delayMs: number }) {
  const active = visible && clickable;
  return (
    <motion.button
      onClick={active ? onClick : undefined}
      disabled={!active}
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? (clickable ? 1 : 0.3) : 0 }}
      transition={{ duration: 1.2, ease: "easeOut", delay: visible && clickable ? delayMs / 1000 : 0 }}
      className="group relative overflow-hidden border p-8 text-left transition-shadow disabled:cursor-default"
      style={{
        borderColor: "hsl(43 80% 70% / 0.4)",
        background: "linear-gradient(135deg, hsl(240 30% 10% / 0.7) 0%, hsl(270 35% 9% / 0.7) 100%)",
        boxShadow: active ? "0 0 40px -10px hsl(43 80% 60% / 0.4), inset 0 0 30px hsl(280 60% 40% / 0.15)" : "none",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background: "linear-gradient(135deg, hsl(43 80% 55% / 0.08) 0%, hsl(280 60% 45% / 0.08) 100%)",
        }}
      />
      <p
        className="relative text-xl italic leading-relaxed"
        style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 30% 88%)" }}
      >
        {text}
      </p>
    </motion.button>
  );
}

/* ─── Book emergence wrap (handles open-ready time-lock) ─── */

function BookEmergenceWrap({ g1, setPhase }: { g1: Gate1State; setPhase: (p: Gate1State["phase"]) => void }) {
  // Allow opening immediately after the 2.4s emergence animation
  const ready = useTimeLock(g1.anchors.book_emergence, 3000) || isDev();
  return <BookEmergence onOpen={() => setPhase("page_open")} ready={ready} />;
}

/* ─── Page open — the corrective page ─── */

function PagePhase({ g1, update, setPhase }: { g1: Gate1State; update: (u: (s: AppState) => AppState) => void; setPhase: (p: Gate1State["phase"]) => void }) {
  const routeId = (g1.activeRoute ?? "false_arrival") as RouteId;
  const route = ROUTES[routeId];

  const [showScroll, setShowScroll] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [showInvalid, setShowInvalid] = useState(false);

  // Per-answer time-locks: anchor = first focus on that answer field
  const [answerFocusedAt, setAnswerFocusedAt] = useState<Record<string, number>>({});
  const [journalFocusedAt, setJournalFocusedAt] = useState<number | undefined>();
  // submit/save 30s locks
  const lastKey = route.answers[route.answers.length - 1]?.key;
  const lastFocusAnchor = lastKey ? answerFocusedAt[lastKey] : undefined;
  const answersSubmitReady = useTimeLock(lastFocusAnchor, 30_000) || isDev();
  const journalSaveReady = useTimeLock(journalFocusedAt, 30_000) || isDev();

  // Oracle
  const [oracleCat, setOracleCat] = useState<OracleCategory>("clarify");
  const [oracleQ, setOracleQ] = useState("");
  const [oracleA, setOracleA] = useState<string | null>(null);

  // local mirrors of state (for snappier typing)
  const setAnswer = (k: string, v: string) =>
    update((s) => ({ ...s, gate1: { ...s.gate1, answers: { ...s.gate1.answers, [k]: v } } }));
  const setJournal = (v: string) =>
    update((s) => ({ ...s, gate1: { ...s.gate1, journal: v } }));
  const setAction = (patch: Partial<Gate1State["actionBlock"]>) =>
    update((s) => ({ ...s, gate1: { ...s.gate1, actionBlock: { ...s.gate1.actionBlock, ...patch } } }));
  const setReadiness = (i: number, v: boolean) =>
    update((s) => ({ ...s, gate1: { ...s.gate1, readiness: { ...s.gate1.readiness, [i]: v } } }));

  const allReady = route.readiness.every((_, i) => g1.readiness[i]);

  // safety scan across all Avatar text
  const safety = detectSafetyConcern(
    g1.encounterAnswer,
    g1.journal,
    g1.actionBlock.principle,
    g1.actionBlock.action,
    g1.actionBlock.benefit,
    g1.actionBlock.visibleEvidence,
    ...Object.values(g1.answers),
  );
  useEffect(() => {
    if (safety && !g1.safetyLocked) {
      update((s) => ({ ...s, gate1: { ...s.gate1, safetyLocked: true } }));
      obs("gate1_safety_triggered");
    }
  }, [safety, g1.safetyLocked, update]);

  const safetyLocked = g1.safetyLocked || safety;

  const askOracle = () => {
    const a = oracleResponse(routeId, oracleCat, oracleQ);
    setOracleA(a);
    update((s) => ({ ...s, gate1: { ...s.gate1, oracleHistory: [...s.gate1.oracleHistory, { cat: oracleCat, q: oracleQ, a, t: Date.now() }] } }));
    obs("gate1_oracle", { cat: oracleCat });
  };

  // Save reflection feedback
  const [journalSaved, setJournalSaved] = useState(false);

  // Action status -> completed without evidence: show quiet line
  const completedWithoutEvidence =
    g1.actionBlock.status === "completed" && g1.actionBlock.visibleEvidence.trim().length === 0;

  // Award marks when completed + evidence present
  useEffect(() => {
    if (g1.actionBlock.status === "completed" && g1.actionBlock.visibleEvidence.trim().length > 0 && g1.actionBlock.marksAwarded === 0) {
      update((s) => ({ ...s, gate1: { ...s.gate1, actionBlock: { ...s.gate1.actionBlock, marksAwarded: 1 } } }));
      obs("gate1_mark_awarded");
    }
  }, [g1.actionBlock.status, g1.actionBlock.visibleEvidence, g1.actionBlock.marksAwarded, update]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <BookShell>
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.5em]" style={{ fontFamily: "'Cinzel', serif", color: "hsl(43 50% 60%)" }}>
            Book of Spiral Fractures
          </p>
          <p className="mb-8 text-sm italic" style={{ color: "hsl(43 30% 65%)" }}>
            A hidden page has opened.
          </p>
          <h1
            className="text-3xl md:text-4xl"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              letterSpacing: "0.04em",
              color: "hsl(43 80% 82%)",
              textShadow: "0 0 40px hsl(43 80% 60% / 0.25)",
            }}
          >
            {route.title}
          </h1>
          <div className="mx-auto mt-6 h-px w-32" style={{ background: "linear-gradient(90deg, transparent, hsl(43 30% 55% / 0.6), transparent)" }} />
        </div>

        <div className="md:grid md:grid-cols-12 md:gap-12">
          <div className="md:col-span-5 md:sticky md:top-10 md:self-start">
            <div className="mx-auto mb-8 h-24 w-24 opacity-90">
              {route.glyph === "cracked-sun" ? <CrackedSun /> : <BrokenCompass />}
            </div>
            <Section className="border-t-0 pt-0">
              <p
                className="text-center text-xl md:text-2xl italic"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 30% 88%)" }}
              >
                {route.symbolic}
              </p>
              <p className="mt-5 text-center text-sm leading-relaxed" style={{ color: "hsl(43 30% 65%)" }}>
                {route.oracle}
              </p>
              <button
                onClick={() => setShowScroll((v) => !v)}
                className="mx-auto mt-6 block text-xs uppercase tracking-[0.3em]"
                style={{ fontFamily: "'Cinzel', serif", color: "hsl(43 50% 60%)" }}
              >
                {showScroll ? "− Hide the Scroll" : "+ Read the Scroll"}
              </button>
              <AnimatePresence>
                {showScroll && (
                  <motion.pre
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mx-auto mt-5 max-w-2xl whitespace-pre-wrap text-center text-base leading-loose"
                    style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 30% 78%)" }}
                  >
                    {route.scroll}
                  </motion.pre>
                )}
              </AnimatePresence>
            </Section>

            <Section className="mt-8">
              <SectionTitle>The Core Question</SectionTitle>
              <p
                className="text-2xl"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 80% 82%)" }}
              >
                {route.coreQuestion}
              </p>
            </Section>
          </div>

          <div className="md:col-span-7 mt-10 md:mt-0">
            {safetyLocked && (
              <div className="mb-10 border p-5 italic" style={{ borderColor: "hsl(43 60% 60% / 0.4)", background: "hsl(240 30% 8% / 0.6)", color: "hsl(43 30% 85%)", fontFamily: "'Cormorant Garamond', serif" }}>
                {SAFETY_COPY}
              </div>
            )}

            <Section className="border-t-0 pt-0">
              <SectionTitle>The Witnessing</SectionTitle>
              <div className="space-y-7">
                {route.answers.map((f) => (
                  <div key={f.key}>
                    <label className="mb-2 block text-lg" style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 80% 82%)" }}>
                      {f.label}
                    </label>
                    <p className="mb-3 text-sm" style={{ color: "hsl(43 30% 70%)" }}>{f.prompt}</p>
                    <textarea
                      value={g1.answers[f.key] || ""}
                      onChange={(e) => setAnswer(f.key, e.target.value)}
                      onFocus={() => setAnswerFocusedAt((a) => (a[f.key] ? a : { ...a, [f.key]: Date.now() }))}
                      placeholder={f.placeholder}
                      rows={3}
                      className="w-full resize-y border bg-[hsl(240_30%_8%/0.5)] p-4 placeholder:italic focus:outline-none"
                      style={{ borderColor: "hsl(43 30% 55% / 0.3)", color: "hsl(43 30% 88%)" }}
                    />
                  </div>
                ))}
                <p className="text-xs italic" style={{ color: "hsl(43 30% 55%)" }}>
                  {answersSubmitReady ? "Your witnessing is recorded as you write." : "The page receives. The submit will come."}
                </p>
              </div>
            </Section>

            <Section className="mt-10">
              <SectionTitle>Private Reflection</SectionTitle>
              <p className="mb-3 text-base italic" style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 30% 80%)" }}>
                {route.journalPrompt}
              </p>
              <textarea
                value={g1.journal}
                onChange={(e) => { setJournal(e.target.value); setJournalSaved(false); }}
                onFocus={() => setJournalFocusedAt((t) => t ?? Date.now())}
                rows={5}
                placeholder="Write only what is true."
                className="w-full resize-y border bg-[hsl(240_30%_8%/0.5)] p-4 placeholder:italic focus:outline-none"
                style={{ borderColor: "hsl(43 30% 55% / 0.3)", color: "hsl(43 30% 88%)" }}
              />
              <div className="mt-4 flex items-center gap-4">
                {journalSaveReady ? (
                  <RitualButton
                    variant="ghost"
                    disabled={!g1.journal.trim()}
                    onClick={() => { update((s) => ({ ...s, gate1: { ...s.gate1, journalSavedAt: Date.now() } })); setJournalSaved(true); }}
                  >
                    Save Reflection
                  </RitualButton>
                ) : (
                  <span className="text-xs italic" style={{ color: "hsl(43 30% 55%)" }}>The page is still receiving.</span>
                )}
                {journalSaved && (
                  <span className="text-sm italic" style={{ color: "hsl(43 30% 65%)" }}>Your reflection has been sealed into your record.</span>
                )}
              </div>
            </Section>

            {/* Sovereign Action Block */}
            <Section className="mt-10">
              <SectionTitle>{route.trackerTitle} — Sovereign Action</SectionTitle>
              <p className="mb-4 text-sm" style={{ color: "hsl(43 30% 75%)" }}>{route.trackerCopy}</p>
              <div className="grid gap-4 md:grid-cols-3">
                {(["principle","action","benefit"] as const).map((k) => (
                  <div key={k}>
                    <label className="block mb-1 text-xs uppercase tracking-[0.3em]" style={{ fontFamily: "'Cinzel', serif", color: "hsl(43 50% 60%)" }}>{k}</label>
                    <textarea
                      value={g1.actionBlock[k]}
                      onChange={(e) => setAction({ [k]: e.target.value } as Partial<Gate1State["actionBlock"]>)}
                      rows={3}
                      disabled={safetyLocked}
                      placeholder={k === "principle" ? "Why this action?" : k === "action" ? "What exactly?" : "What changes in lived reality?"}
                      className="w-full resize-y border bg-[hsl(240_30%_8%/0.5)] p-3 text-sm placeholder:italic focus:outline-none disabled:opacity-50"
                      style={{ borderColor: "hsl(43 30% 55% / 0.3)", color: "hsl(43 30% 88%)" }}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {(Object.keys(STATUS_LABEL) as ActionStatus[]).map((s) => (
                  <button
                    key={s}
                    disabled={safetyLocked}
                    onClick={() => setAction({ status: s })}
                    className={`border px-4 py-2 text-xs uppercase tracking-[0.2em] disabled:opacity-40 ${
                      g1.actionBlock.status === s ? "text-white" : ""
                    }`}
                    style={{
                      fontFamily: "'Cinzel', serif",
                      borderColor: g1.actionBlock.status === s ? "hsl(43 80% 70%)" : "hsl(43 30% 55% / 0.3)",
                      color: g1.actionBlock.status === s ? "hsl(43 80% 82%)" : "hsl(43 50% 60%)",
                      background: g1.actionBlock.status === s ? "hsl(43 80% 60% / 0.1)" : "transparent",
                    }}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>

              <div className="mt-5">
                <label className="block mb-1 text-xs uppercase tracking-[0.3em]" style={{ fontFamily: "'Cinzel', serif", color: "hsl(43 50% 60%)" }}>Visible evidence</label>
                <textarea
                  value={g1.actionBlock.visibleEvidence}
                  onChange={(e) => setAction({ visibleEvidence: e.target.value })}
                  rows={2}
                  disabled={safetyLocked}
                  placeholder="What can be witnessed? Who saw it? What changed in the world?"
                  className="w-full resize-y border bg-[hsl(240_30%_8%/0.5)] p-3 text-sm placeholder:italic focus:outline-none disabled:opacity-50"
                  style={{ borderColor: "hsl(43 30% 55% / 0.3)", color: "hsl(43 30% 88%)" }}
                />
                <div className="mt-2 text-xs italic">
                  {g1.actionBlock.marksAwarded > 0 ? (
                    <span style={{ color: "hsl(43 80% 75%)", letterSpacing: "0.15em" }}>✦ Sovereign Mark</span>
                  ) : completedWithoutEvidence ? (
                    <span style={{ color: "hsl(43 30% 60%)" }}>Marks are sealed when evidence is named.</span>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Disclosure open={showExamples} onToggle={() => setShowExamples((v) => !v)} label="Examples of valid actions">
                  <ul className="list-disc space-y-2 pl-6 text-sm" style={{ color: "hsl(43 30% 80%)" }}>
                    {route.examples.map((e) => <li key={e}>{e}</li>)}
                  </ul>
                </Disclosure>
                <Disclosure open={showInvalid} onToggle={() => setShowInvalid((v) => !v)} label="What does not count">
                  <ul className="list-disc space-y-2 pl-6 text-sm" style={{ color: "hsl(43 30% 60%)" }}>
                    {route.invalidExamples.map((e) => <li key={e}>{e}</li>)}
                  </ul>
                </Disclosure>
              </div>
            </Section>

            {/* Readiness */}
            <Section className="mt-10">
              <SectionTitle>The Readiness</SectionTitle>
              <ul className="space-y-3">
                {route.readiness.map((r, i) => (
                  <li key={i}>
                    <label className="flex cursor-pointer items-start gap-3 text-sm" style={{ color: "hsl(43 30% 85%)" }}>
                      <input
                        type="checkbox"
                        checked={!!g1.readiness[i]}
                        disabled={safetyLocked}
                        onChange={(e) => setReadiness(i, e.target.checked)}
                        className="mt-1 h-4 w-4 accent-[hsl(43_80%_60%)]"
                      />
                      <span>{r}</span>
                    </label>
                  </li>
                ))}
              </ul>

              <div className="mt-8 text-center">
                {!allReady && (
                  <p className="mb-5 text-sm italic" style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 30% 65%)" }}>
                    {route.incompleteCopy}
                  </p>
                )}
                <div className="relative mx-auto mb-6 h-px w-48 overflow-hidden">
                  <div className="absolute inset-0" style={{ background: "hsl(43 30% 55% / 0.2)" }} />
                  <motion.div
                    initial={false}
                    animate={{ scaleX: allReady ? 1 : 0.15, opacity: allReady ? 1 : 0.4 }}
                    transition={{ duration: 1.4, ease: "easeOut" }}
                    style={{ transformOrigin: "center", background: "linear-gradient(90deg, transparent, hsl(43 80% 82%), transparent)", boxShadow: "0 0 18px hsl(43 80% 60% / 0.5)" }}
                    className="absolute inset-0"
                  />
                </div>
                <RitualButton
                  onClick={() => setPhase("corrective_gate_open")}
                  disabled={!allReady || safetyLocked}
                >
                  Open the Corrective Gate
                </RitualButton>
              </div>
            </Section>

            {/* Oracle */}
            <Section className="mt-10">
              <SectionTitle>Ask the Oracle</SectionTitle>
              <div className="border p-5" style={{ borderColor: "hsl(43 30% 55% / 0.25)", background: "hsl(240 30% 8% / 0.4)" }}>
                <div className="mb-4 flex flex-wrap gap-2">
                  {ORACLE_CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setOracleCat(c.id)}
                      className="border px-3 py-1.5 text-[11px] uppercase tracking-[0.2em]"
                      style={{
                        fontFamily: "'Cinzel', serif",
                        borderColor: oracleCat === c.id ? "hsl(43 80% 70%)" : "hsl(43 30% 55% / 0.3)",
                        color: oracleCat === c.id ? "hsl(43 80% 82%)" : "hsl(43 50% 60%)",
                      }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={oracleQ}
                  onChange={(e) => setOracleQ(e.target.value)}
                  rows={2}
                  placeholder="Speak your question."
                  className="mb-3 w-full resize-y border bg-[hsl(240_30%_8%/0.6)] p-3 text-sm placeholder:italic focus:outline-none"
                  style={{ borderColor: "hsl(43 30% 55% / 0.3)", color: "hsl(43 30% 88%)" }}
                />
                <RitualButton variant="ghost" onClick={askOracle}>
                  <Sparkles size={14} /> Ask
                </RitualButton>
                {oracleA && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-5 border-l-2 pl-4 text-base italic leading-relaxed"
                    style={{ fontFamily: "'Cormorant Garamond', serif", borderColor: "hsl(43 80% 60% / 0.5)", color: "hsl(43 30% 85%)" }}
                  >
                    {oracleA}
                  </motion.p>
                )}
              </div>
            </Section>
          </div>
        </div>
      </BookShell>
    </motion.article>
  );
}

function Disclosure({ open, onToggle, label, children }: { open: boolean; onToggle: () => void; label: string; children: React.ReactNode }) {
  return (
    <div className="border" style={{ borderColor: "hsl(43 30% 55% / 0.2)" }}>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-xs uppercase tracking-[0.25em]"
        style={{ fontFamily: "'Cinzel', serif", color: "hsl(43 50% 60%)" }}
      >
        <span>{label}</span>
        <span>{open ? "−" : "+"}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden px-4 pb-4">
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SafetyLine() {
  return (
    <p className="mt-4 border-l-2 pl-4 text-sm italic" style={{ borderColor: "hsl(43 60% 60% / 0.6)", color: "hsl(43 30% 80%)", fontFamily: "'Cormorant Garamond', serif" }}>
      {SAFETY_COPY}
    </p>
  );
}

/* ─── Unlock / Seal ─── */

function UnlockPhase({ g1, setPhase }: { g1: Gate1State; setPhase: (p: Gate1State["phase"]) => void }) {
  const route = ROUTES[(g1.activeRoute ?? "false_arrival") as RouteId];
  // Sequence: epigraph -> Corrective Gate line -> Seal line -> Seal the Page button (~6s)
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t1 = window.setTimeout(() => setStage(1), 2800);
    const t2 = window.setTimeout(() => setStage(2), 5600);
    const t3 = window.setTimeout(() => setStage(3), 8400);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); window.clearTimeout(t3); };
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.6 }} className="flex min-h-[80vh] flex-col items-center justify-center text-center">
      <div className="relative mb-12 flex items-end justify-center" style={{ height: "18rem" }}>
        <motion.div
          aria-hidden
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2.4, ease: "easeOut" }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: "22rem",
            height: "22rem",
            background:
              "radial-gradient(circle, hsl(43 80% 82% / 0.45) 0%, hsl(43 80% 60% / 0.18) 40%, transparent 72%)",
          }}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.8, delay: 0.4 }}
          className="relative"
          style={{
            width: "9rem",
            height: "17rem",
            borderTopLeftRadius: "9rem",
            borderTopRightRadius: "9rem",
            border: "1px solid hsl(43 80% 82% / 0.6)",
            borderBottom: "none",
            background: "linear-gradient(180deg, hsl(43 80% 60% / 0.18) 0%, hsl(43 80% 60% / 0.06) 60%, transparent 100%)",
            boxShadow: "0 0 80px hsl(43 80% 60% / 0.45), inset 0 0 60px hsl(43 80% 60% / 0.18)",
          }}
        />
      </div>

      <pre className="mb-10 whitespace-pre-line text-2xl italic leading-loose" style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 80% 82%)" }}>
        {route.unlockEpigraph}
      </pre>

      {stage >= 1 && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.4 }} className="mb-10 text-base italic" style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 30% 80%)" }}>
          The fracture has been witnessed.<br />The Corrective Gate now opens.
        </motion.p>
      )}

      {stage >= 2 && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.6 }} className="mb-12 max-w-xl text-xl italic leading-relaxed" style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 80% 82%)" }}>
          {route.sealLine}
        </motion.p>
      )}

      {stage >= 3 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}>
          <RitualButton onClick={() => setPhase("relocked")}>Seal the Page</RitualButton>
        </motion.div>
      )}
    </motion.div>
  );
}

function RelockedPhase({ g1, setPhase, update }: { g1: Gate1State; setPhase: (p: Gate1State["phase"]) => void; update: (u: (s: AppState) => AppState) => void }) {
  // Mark Gate 1 complete on entry; then auto-transition to completion screen.
  const did = useRef(false);
  useEffect(() => {
    if (did.current) return;
    did.current = true;
    update((s) => ({
      ...s,
      gates: { ...s.gates, 1: { ...s.gates[1], completedAt: s.gates[1]?.completedAt ?? Date.now(), routeTaken: g1.activeRoute } },
    }));
    obs("gate1_complete", { route: g1.activeRoute });
    const t = window.setTimeout(() => setPhase("completion"), 2800);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.4 }} className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-xl italic" style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 30% 80%)" }}>
        The Book has closed.
      </p>
    </motion.div>
  );
}

function CompletionPhase() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.6 }} className="flex min-h-[70vh] flex-col items-center justify-center text-center mx-auto max-w-xl">
      <pre className="mb-12 whitespace-pre-line text-xl italic leading-loose" style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 30% 88%)" }}>
{`Gate 1 has been crossed.

The Book remembers. The Codex remembers. You may now return to the Sovereign Action Layer, or remain in stillness.

The next threshold has opened. It does not require you to enter today.`}
      </pre>
      <div className="flex flex-col items-center gap-6">
        <Link to="/sovereign">
          <RitualButton>Return to the Sovereign Action Layer</RitualButton>
        </Link>
        <Link to="/gates" className="text-xs tracking-widest uppercase" style={{ fontFamily: "'Cinzel', serif", color: "hsl(43 50% 60%)" }}>
          Remain in stillness
        </Link>
      </div>
    </motion.div>
  );
}

function Header({ epithet }: { epithet: string }) {
  return (
    <header className="text-center mb-10">
      <p className="text-xs tracking-[0.4em] uppercase" style={{ fontFamily: "'Cinzel', serif", color: "hsl(43 50% 60%)" }}>
        {epithet}
      </p>
      <div className="mt-6 h-px w-16 mx-auto" style={{ background: "hsl(43 30% 55% / 0.4)" }} />
    </header>
  );
}

// useRef import — required by RelockedPhase
import { useRef } from "react";
