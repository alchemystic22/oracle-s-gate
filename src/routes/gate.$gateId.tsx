import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";

import { gateById, GATES } from "../data/gates";
import { ROUTES, type RouteId } from "../data/correctives";
import { gateContent } from "../data/gates-content";
import type { GateContent } from "../data/gate-content";
import { useAppState } from "../lib/useAppState";
import {
  type AppState,
  type GateId,
  type GatePhase,
  type GateRuntimeState,
  type ActionStatus,
  defaultGateRuntime,
} from "../lib/state";
import { MeasuredReveal } from "../components/MeasuredReveal";
import { RitualButton, Section, SectionTitle, Glyph } from "../components/ritual/RitualPrimitives";
import { GateThreshold } from "../components/ritual/GateThreshold";
import { BookEmergence, BookShell } from "../components/ritual/Book";
import { useTimeLock } from "../lib/timelock";
import { detectSafetyConcern, SAFETY_COPY, detectFlameTier, type FlameTier } from "../lib/safety";
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

function GatePage() {
  const { gateId } = Route.useParams();
  const id = Number(gateId) as GateId;
  const gate = gateById(id);
  const content = gateContent(id);
  const nav = useNavigate();
  const { state, update, hydrated } = useAppState();

  useEffect(() => {
    if (hydrated && !state.invocationCompletedAt && !isDev()) nav({ to: "/" });
  }, [hydrated, state.invocationCompletedAt, nav]);

  if (!gate) return <Locked text="No such gate." />;
  if (!hydrated) return null;

  // Sequence rule: only the next uncompleted gate is accessible (or any gate in dev mode).
  const accessible = (() => {
    if (isDev()) return true;
    for (const g of GATES) {
      if (!state.gates[g.id]?.completedAt) return g.id === id;
    }
    return false;
  })();

  if (!accessible) return <Locked text="This gate is not yet yours." />;

  // Gates without authored content are sealed.
  if (!content) return <SealedGate id={id} name={gate.name} />;

  return <GateOrchestrator id={id} content={content} state={state} update={update} />;
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

function SealedGate({ id, name }: { id: GateId; name: string }) {
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

/* ────────────── Gate orchestrator (content-driven) ────────────── */

type OrchestratorProps = {
  id: GateId;
  content: GateContent;
  state: AppState;
  update: (u: (s: AppState) => AppState) => void;
};

function GateOrchestrator({ id, content, state, update }: OrchestratorProps) {
  const gs = state.gateState[id] ?? defaultGateRuntime();
  const phase = gs.phase;

  // Anchor the current phase on first entry so time-locks survive refresh.
  useEffect(() => {
    if (!gs.anchors[phase]) {
      update((s) => ({
        ...s,
        gateState: {
          ...s.gateState,
          [id]: {
            ...s.gateState[id],
            anchors: { ...s.gateState[id].anchors, [phase]: Date.now() },
          },
        },
      }));
    }
    if (!state.gates[id]?.visitedAt) {
      update((s) => ({ ...s, gates: { ...s.gates, [id]: { ...s.gates[id], visitedAt: Date.now() } } }));
    }
    obs("gate_phase", { id, phase });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Admin: ?phase=<name> jumps the active gate directly to that phase (dev only)
  useEffect(() => {
    if (!isDev() || typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search).get("phase");
    const valid: GatePhase[] = [
      "threshold", "encounter", "obstruction",
      "book_emergence", "page_open",
      "corrective_gate_open", "relocked", "completion",
    ];
    if (p && valid.includes(p as GatePhase) && p !== gs.phase) {
      setPhase(p as GatePhase);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setPhase = (next: GatePhase) =>
    update((s) => ({
      ...s,
      gateState: {
        ...s.gateState,
        [id]: {
          ...s.gateState[id],
          phase: next,
          anchors: { ...s.gateState[id].anchors, [next]: s.gateState[id].anchors[next] ?? Date.now() },
        },
      },
    }));

  const patchGate = (patch: Partial<GateRuntimeState>) =>
    update((s) => ({
      ...s,
      gateState: { ...s.gateState, [id]: { ...s.gateState[id], ...patch } },
    }));

  return (
    <main className="min-h-screen px-6 py-12 md:py-16">
      <div className="mx-auto w-full max-w-[1080px]">
        <AnimatePresence mode="wait">
          {phase === "threshold" && (
            <ThresholdPhase key="threshold" content={content} gs={gs} setPhase={setPhase} />
          )}
          {phase === "encounter" && (
            <EncounterPhase key="encounter" content={content} gs={gs} setPhase={setPhase} patchGate={patchGate} />
          )}
          {phase === "obstruction" && (
            <ObstructionPhase key="obstruction" content={content} gs={gs} patchGate={patchGate} />
          )}
          {phase === "book_emergence" && (
            <motion.div key="emerge" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }}>
              <BookEmergenceWrap gs={gs} setPhase={setPhase} />
            </motion.div>
          )}
          {phase === "page_open" && (
            <PagePhase key="page" id={id} content={content} gs={gs} patchGate={patchGate} setPhase={setPhase} />
          )}
          {phase === "corrective_gate_open" && (
            <UnlockPhase key="unlock" gs={gs} setPhase={setPhase} />
          )}
          {phase === "relocked" && (
            <RelockedPhase key="relocked" id={id} gs={gs} setPhase={setPhase} update={update} />
          )}
          {phase === "completion" && (
            <CompletionPhase key="complete" id={id} content={content} />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

/* ─── Threshold ─── */

function ThresholdPhase({ content, gs, setPhase }: { content: GateContent; gs: GateRuntimeState; setPhase: (p: GatePhase) => void }) {
  const anchor = gs.anchors.threshold;
  const ready = useTimeLock(anchor, 30_000) || isDev();
  return (
    <GateThreshold
      numberLabel={content.numberLabel}
      name={content.name}
      subtitle={content.subtitle}
      inscription={content.inscription}
      inscriptionTranslation={content.inscriptionTranslation}
      imageSrc={content.thresholdImage}
      imageAspect={content.thresholdAspect}
      thresholdCopy={content.thresholdCopy}
      canApproach={ready}
      onApproach={() => setPhase("encounter")}
    />
  );
}

/* ─── Encounter ─── */

function EncounterPhase({
  content,
  gs,
  setPhase,
  patchGate,
}: {
  content: GateContent;
  gs: GateRuntimeState;
  setPhase: (p: GatePhase) => void;
  patchGate: (patch: Partial<GateRuntimeState>) => void;
}) {
  const anchor = gs.anchors.encounter;
  const [copyDone, setCopyDone] = useState(false);
  const fieldReady = useTimeLock(anchor, 20_000) || isDev();
  const submitReady = useTimeLock(anchor, 30_000) || isDev();
  const [text, setText] = useState(gs.encounterAnswer);
  const [submitted, setSubmitted] = useState(false);

  const safety = detectSafetyConcern(text);

  const onSubmit = () => {
    patchGate({
      encounterAnswer: text,
      encounterSubmittedAt: Date.now(),
      safetyLocked: gs.safetyLocked || safety,
    });
    obs("gate_encounter_submit", { id: content.id, len: text.length });
    setSubmitted(true);
    window.setTimeout(() => setPhase("obstruction"), 2200);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }} className="mx-auto max-w-2xl">
      <Header epithet={content.headerEpithet} />
      <MeasuredReveal paragraphs={content.encounterParas} step={1600} tail={1200} onComplete={() => setCopyDone(true)} className="text-[hsl(43_30%_85%)]" />

      <AnimatePresence>
        {copyDone && fieldReady && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: "easeOut" }} className="mt-12">
            <label className="block mb-3 text-base italic" style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 30% 82%)" }}>
              {content.encounterQuestion}
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
                  <p className="mb-4 text-xs italic" style={{ color: "hsl(43 30% 60%)" }}>{content.encounterSubmitHint}</p>
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

function ObstructionPhase({
  content,
  gs,
  patchGate,
}: {
  content: GateContent;
  gs: GateRuntimeState;
  patchGate: (patch: Partial<GateRuntimeState>) => void;
}) {
  const anchor = gs.anchors.obstruction;
  const [copyShown, setCopyShown] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const clickable = useTimeLock(anchor, 15_000) || isDev();

  useEffect(() => {
    const t = window.setTimeout(() => setCopyShown(true), 3000);
    return () => window.clearTimeout(t);
  }, []);

  const choose = (route: RouteId) => {
    patchGate({
      activeRoute: route,
      phase: "book_emergence",
      anchors: { ...gs.anchors, book_emergence: Date.now() },
    });
    obs("gate_stance_chosen", { id: content.id, route });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }} className="mx-auto max-w-2xl text-center">
      <Header epithet={content.headerEpithet} />
      {copyShown && (
        <MeasuredReveal
          paragraphs={content.obstructionParas}
          step={1700}
          tail={800}
          onComplete={() => setCopyDone(true)}
          className="text-[hsl(43_30%_85%)]"
        />
      )}

      <div className="mt-14 grid gap-6 md:grid-cols-2">
        {content.stanceCards.map((card, i) => (
          <StanceCard
            key={card.route}
            delayMs={i * 150}
            visible={copyDone}
            clickable={clickable}
            onClick={() => choose(card.route)}
            text={card.text}
          />
        ))}
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

/* ─── Book emergence wrap ─── */

function BookEmergenceWrap({ gs, setPhase }: { gs: GateRuntimeState; setPhase: (p: GatePhase) => void }) {
  const ready = useTimeLock(gs.anchors.book_emergence, 3000) || isDev();
  return <BookEmergence onOpen={() => setPhase("page_open")} ready={ready} />;
}

/* ─── Page open — the corrective page ─── */

function PagePhase({
  id,
  content,
  gs,
  patchGate,
  setPhase,
}: {
  id: GateId;
  content: GateContent;
  gs: GateRuntimeState;
  patchGate: (patch: Partial<GateRuntimeState>) => void;
  setPhase: (p: GatePhase) => void;
}) {
  const fallbackRoute = content.stanceCards[0].route;
  const routeId = (gs.activeRoute ?? fallbackRoute) as RouteId;
  const route = ROUTES[routeId];

  const [showScroll, setShowScroll] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [showInvalid, setShowInvalid] = useState(false);

  // Per-answer time-locks: anchor = first focus on that answer field
  const [answerFocusedAt, setAnswerFocusedAt] = useState<Record<string, number>>({});
  const [journalFocusedAt, setJournalFocusedAt] = useState<number | undefined>();
  const lastKey = route.answers[route.answers.length - 1]?.key;
  const lastFocusAnchor = lastKey ? answerFocusedAt[lastKey] : undefined;
  const answersSubmitReady = useTimeLock(lastFocusAnchor, 30_000) || isDev();
  const journalSaveReady = useTimeLock(journalFocusedAt, 30_000) || isDev();

  // Oracle
  const [oracleCat, setOracleCat] = useState<OracleCategory>("clarify");
  const [oracleQ, setOracleQ] = useState("");
  const [oracleA, setOracleA] = useState<string | null>(null);

  const setAnswer = (k: string, v: string) =>
    patchGate({ answers: { ...gs.answers, [k]: v } });
  const setJournal = (v: string) => patchGate({ journal: v });
  const setAction = (patch: Partial<GateRuntimeState["actionBlock"]>) =>
    patchGate({ actionBlock: { ...gs.actionBlock, ...patch } });
  const setReadiness = (i: number, v: boolean) =>
    patchGate({ readiness: { ...gs.readiness, [i]: v } });

  const allReady = route.readiness.every((_, i) => gs.readiness[i]);

  // safety scan across all Avatar text
  const safety = detectSafetyConcern(
    gs.encounterAnswer,
    gs.journal,
    gs.actionBlock.principle,
    gs.actionBlock.action,
    gs.actionBlock.benefit,
    gs.actionBlock.visibleEvidence,
    ...Object.values(gs.answers),
  );
  useEffect(() => {
    if (safety && !gs.safetyLocked) {
      patchGate({ safetyLocked: true });
      obs("gate_safety_triggered", { id });
    }
  }, [safety, gs.safetyLocked, id, patchGate]);

  const safetyLocked = gs.safetyLocked || safety;

  // Flame tier — Gate 2+ corrective routes only
  const flameTier: FlameTier | null = route.safetyTiers
    ? detectFlameTier(
        gs.encounterAnswer,
        gs.journal,
        gs.actionBlock.principle,
        gs.actionBlock.action,
        gs.actionBlock.benefit,
        gs.actionBlock.visibleEvidence,
        ...Object.values(gs.answers),
      )
    : null;
  const activeTier = flameTier && route.safetyTiers
    ? route.safetyTiers.find((t) => t.id === flameTier) ?? null
    : null;
  const flameBlocksUnlock = activeTier?.blocksUnlock ?? false;

  const askOracle = () => {
    const a = oracleResponse(routeId, oracleCat, oracleQ);
    setOracleA(a);
    patchGate({
      oracleHistory: [...gs.oracleHistory, { cat: oracleCat, q: oracleQ, a, t: Date.now() }],
    });
    obs("gate_oracle", { id, cat: oracleCat });
  };

  // First-visit vs return-visit Oracle line
  const oracleLine =
    route.oracleReturn && gs.oracleHistory.length > 0 ? route.oracleReturn : route.oracle;

  const [journalSaved, setJournalSaved] = useState(false);

  const completedWithoutEvidence =
    gs.actionBlock.status === "completed" && gs.actionBlock.visibleEvidence.trim().length === 0;

  useEffect(() => {
    if (gs.actionBlock.status === "completed" && gs.actionBlock.visibleEvidence.trim().length > 0 && gs.actionBlock.marksAwarded === 0) {
      patchGate({ actionBlock: { ...gs.actionBlock, marksAwarded: 1 } });
      obs("gate_mark_awarded", { id });
    }
  }, [gs.actionBlock.status, gs.actionBlock.visibleEvidence, gs.actionBlock.marksAwarded, id, patchGate, gs.actionBlock]);

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
              <Glyph id={route.glyph} />
            </div>
            <Section className="border-t-0 pt-0">
              <pre
                className="whitespace-pre-line text-center text-xl md:text-2xl italic leading-relaxed"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 30% 88%)" }}
              >
                {route.symbolic}
              </pre>
              <p className="mt-5 text-center text-sm leading-relaxed" style={{ color: "hsl(43 30% 65%)" }}>
                {oracleLine}
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
            {activeTier && activeTier.id !== "green" && (
              <FlameBanner tier={activeTier} />
            )}
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
                      value={gs.answers[f.key] || ""}
                      onChange={(e) => setAnswer(f.key, e.target.value)}
                      onFocus={() => setAnswerFocusedAt((a) => (a[f.key] ? a : { ...a, [f.key]: Date.now() }))}
                      placeholder={f.placeholder}
                      rows={route.answers.length === 1 ? 5 : 3}
                      className="w-full resize-y border bg-[hsl(240_30%_8%/0.5)] p-4 placeholder:italic focus:outline-none"
                      style={{ borderColor: "hsl(43 30% 55% / 0.3)", color: "hsl(43 30% 88%)" }}
                    />
                  </div>
                ))}
                {route.submitHint && (
                  <p className="text-xs italic" style={{ color: "hsl(43 30% 55%)" }}>
                    {answersSubmitReady ? route.submitHint : "The page receives. The submit will come."}
                  </p>
                )}
                {!route.submitHint && (
                  <p className="text-xs italic" style={{ color: "hsl(43 30% 55%)" }}>
                    {answersSubmitReady ? "Your witnessing is recorded as you write." : "The page receives. The submit will come."}
                  </p>
                )}
              </div>
            </Section>

            {route.reflectionPrompts && (
              <Section className="mt-10">
                <SectionTitle>Fractured Reflections</SectionTitle>
                <ol className="space-y-3 list-decimal pl-5" style={{ color: "hsl(43 30% 80%)" }}>
                  {route.reflectionPrompts.map((p, i) => (
                    <li key={i} className="text-base italic" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                      {p}
                    </li>
                  ))}
                </ol>
              </Section>
            )}

            <Section className="mt-10">
              <SectionTitle>{route.journalHeader ?? "Private Reflection"}</SectionTitle>
              <p className="mb-3 text-base italic" style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 30% 80%)" }}>
                {route.journalPrompt}
              </p>
              <textarea
                value={gs.journal}
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
                    disabled={!gs.journal.trim()}
                    onClick={() => { patchGate({ journalSavedAt: Date.now() }); setJournalSaved(true); }}
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

            {route.vesselSelector && (
              <VesselSelectorBlock
                title={route.vesselSelector.title}
                options={route.vesselSelector.options}
                value={gs.answers["vesselChoice"] || ""}
                disabled={safetyLocked}
                onChange={(v) => setAnswer("vesselChoice", v)}
              />
            )}

            {/* Sovereign Action Block */}
            <Section className="mt-10">
              <SectionTitle>{route.trackerTitle} — Sovereign Action</SectionTitle>
              {route.actionPreamble && (
                <p className="mb-4 text-base italic" style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 30% 85%)" }}>
                  {route.actionPreamble}
                </p>
              )}
              <p className="mb-4 text-sm" style={{ color: "hsl(43 30% 75%)" }}>{route.trackerCopy}</p>
              <div className="grid gap-4 md:grid-cols-3">
                {(["principle","action","benefit"] as const).map((k) => (
                  <div key={k}>
                    <label className="block mb-1 text-xs uppercase tracking-[0.3em]" style={{ fontFamily: "'Cinzel', serif", color: "hsl(43 50% 60%)" }}>{k}</label>
                    <textarea
                      value={gs.actionBlock[k]}
                      onChange={(e) => setAction({ [k]: e.target.value } as Partial<GateRuntimeState["actionBlock"]>)}
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
                      gs.actionBlock.status === s ? "text-white" : ""
                    }`}
                    style={{
                      fontFamily: "'Cinzel', serif",
                      borderColor: gs.actionBlock.status === s ? "hsl(43 80% 70%)" : "hsl(43 30% 55% / 0.3)",
                      color: gs.actionBlock.status === s ? "hsl(43 80% 82%)" : "hsl(43 50% 60%)",
                      background: gs.actionBlock.status === s ? "hsl(43 80% 60% / 0.1)" : "transparent",
                    }}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>

              <div className="mt-5">
                <label className="block mb-1 text-xs uppercase tracking-[0.3em]" style={{ fontFamily: "'Cinzel', serif", color: "hsl(43 50% 60%)" }}>Visible evidence</label>
                <textarea
                  value={gs.actionBlock.visibleEvidence}
                  onChange={(e) => setAction({ visibleEvidence: e.target.value })}
                  rows={2}
                  disabled={safetyLocked}
                  placeholder="What can be witnessed? Who saw it? What changed in the world?"
                  className="w-full resize-y border bg-[hsl(240_30%_8%/0.5)] p-3 text-sm placeholder:italic focus:outline-none disabled:opacity-50"
                  style={{ borderColor: "hsl(43 30% 55% / 0.3)", color: "hsl(43 30% 88%)" }}
                />
                <div className="mt-2 text-xs italic">
                  {gs.actionBlock.marksAwarded > 0 ? (
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
                        checked={!!gs.readiness[i]}
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
                  disabled={!allReady || safetyLocked || flameBlocksUnlock}
                >
                  Open the Corrective Gate
                </RitualButton>
                {flameBlocksUnlock && activeTier && (
                  <p className="mt-4 text-sm italic" style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(12 65% 70%)" }}>
                    {activeTier.oracleTone}
                  </p>
                )}
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

function UnlockPhase({ gs, setPhase }: { gs: GateRuntimeState; setPhase: (p: GatePhase) => void }) {
  const fallback = (Object.keys(ROUTES) as RouteId[])[0];
  const route = ROUTES[(gs.activeRoute ?? fallback) as RouteId];
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
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.6 }} className="mb-12 max-w-xl text-xl italic leading-relaxed whitespace-pre-line" style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 80% 82%)" }}>
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

function RelockedPhase({
  id,
  gs,
  setPhase,
  update,
}: {
  id: GateId;
  gs: GateRuntimeState;
  setPhase: (p: GatePhase) => void;
  update: (u: (s: AppState) => AppState) => void;
}) {
  const did = useRef(false);
  useEffect(() => {
    if (did.current) return;
    did.current = true;
    update((s) => ({
      ...s,
      gates: { ...s.gates, [id]: { ...s.gates[id], completedAt: s.gates[id]?.completedAt ?? Date.now(), routeTaken: gs.activeRoute } },
    }));
    obs("gate_complete", { id, route: gs.activeRoute });
    const t = window.setTimeout(() => setPhase("completion"), 2800);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.4 }} className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-xl italic" style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 30% 80%)" }}>
        The Book has closed.
      </p>
    </motion.div>
  );
}

function CompletionPhase({ id, content }: { id: GateId; content: GateContent }) {
  void id;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.6 }} className="flex min-h-[70vh] flex-col items-center justify-center text-center mx-auto max-w-xl">
      <pre className="mb-12 whitespace-pre-line text-xl italic leading-loose" style={{ fontFamily: "'Cormorant Garamond', serif", color: "hsl(43 30% 88%)" }}>
        {content.closingCopy}
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
