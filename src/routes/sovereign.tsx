import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useAppState } from "../lib/useAppState";
import { obs } from "../lib/observation";
import { isDev } from "../lib/admin";
import {
  type SovereignAction, type ActionScale, markValueForScale,
} from "../lib/state";
import { GATES } from "../data/gates";
import { DOMAINS, type DomainId } from "../data/domains";
import { LedgerShell } from "../components/sovereign/LedgerShell";
import { WitnessCard } from "../components/sovereign/WitnessCard";
import { DomainMap } from "../components/sovereign/DomainMap";
import { FieldManualDeck } from "../components/sovereign/FieldManualDeck";
import { ActionCardForm } from "../components/sovereign/ActionCardForm";
import { ArchiveOverlay } from "../components/sovereign/ArchiveOverlay";

export const Route = createFileRoute("/sovereign")({
  head: () => ({ meta: [{ title: "Sovereign Action Layer" }] }),
  component: Sovereign,
});

function activeGateName(completed: Partial<Record<number, { completedAt?: number }>>) {
  for (const g of GATES) {
    if (!completed[g.id]?.completedAt) return g.name;
  }
  return "All Gates Walked";
}

function newAction(input: {
  principle: string; action: string; benefit: string; scale: ActionScale; domain: DomainId;
}): SovereignAction {
  return {
    id: `a_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    declaredAt: Date.now(),
    principle: input.principle,
    action: input.action,
    benefit: input.benefit,
    scale: input.scale,
    domain: input.domain,
    status: "chosen",
    visibleEvidence: "",
    marksAwarded: 0,
    intent: input.action,
  };
}

const DEMO_SEED: SovereignAction[] = [
  {
    id: "demo-1", declaredAt: Date.now() - 86400000 * 5,
    principle: "The flesh is the first witness.", action: "Walked an hour outdoors at dawn.", benefit: "Returned to the body before the day claimed it.",
    scale: "micro", domain: "body", status: "completed", visibleEvidence: "Boots wet to the knee. Saw two deer at the fence line.",
    marksAwarded: 1, sealedAt: Date.now() - 86400000 * 4, completedAt: Date.now() - 86400000 * 5, intent: "Walked an hour outdoors at dawn.",
  },
  {
    id: "demo-2", declaredAt: Date.now() - 86400000 * 8,
    principle: "A true yes requires the possible no.", action: "Declined the Saturday gathering that did not resonate.", benefit: "Relations rest on honest weight.",
    scale: "meso", domain: "relations", status: "completed", visibleEvidence: "Sent the message. Was not asked to explain.",
    marksAwarded: 3, sealedAt: Date.now() - 86400000 * 7, completedAt: Date.now() - 86400000 * 7, intent: "Declined the Saturday gathering that did not resonate.",
  },
  {
    id: "demo-3", declaredAt: Date.now() - 86400000 * 12,
    principle: "The word is on fire when it is true.", action: "Said the difficult sentence to my brother.", benefit: "The line behind us can breathe.",
    scale: "macro", domain: "voice", status: "completed", visibleEvidence: "He went silent for a long minute, then thanked me. The room felt larger after.",
    marksAwarded: 7, sealedAt: Date.now() - 86400000 * 10, completedAt: Date.now() - 86400000 * 10, intent: "Said the difficult sentence to my brother.",
  },
  {
    id: "demo-4", declaredAt: Date.now() - 86400000 * 2,
    principle: "Making is the body of the soul.", action: "Spend one hour on the writing that pays nothing yet.", benefit: "The craft remembers me.",
    scale: "micro", domain: "craft", status: "scheduled", visibleEvidence: "",
    marksAwarded: 0, intent: "Spend one hour on the writing that pays nothing yet.",
  },
  {
    id: "demo-5", declaredAt: Date.now() - 86400000 * 1,
    principle: "Discernment must be exercised.", action: "Read one paragraph twice. Refuse the next.", benefit: "Attention restored.",
    scale: "micro", domain: "mind", status: "chosen", visibleEvidence: "",
    marksAwarded: 0, intent: "Read one paragraph twice. Refuse the next.",
  },
  {
    id: "demo-6", declaredAt: Date.now() - 86400000 * 3,
    principle: "Stillness is not absence.", action: "Sat ten minutes with no purpose.", benefit: "The interior spoke.",
    scale: "micro", domain: "spirit", status: "chosen", visibleEvidence: "",
    marksAwarded: 0, intent: "Sat ten minutes with no purpose.",
  },
];

function Sovereign() {
  const { state, update, hydrated } = useAppState();
  const nav = useNavigate();

  useEffect(() => {
    if (hydrated && !state.invocationCompletedAt && !isDev()) nav({ to: "/" });
  }, [hydrated, state.invocationCompletedAt, nav]);

  useEffect(() => { obs("sovereign_open"); }, []);

  // ?seed=demo (dev only) — populate demo data once if empty.
  useEffect(() => {
    if (!hydrated || !isDev()) return;
    const seed = new URLSearchParams(window.location.search).get("seed");
    if (seed === "demo" && state.sovereign.actions.length === 0) {
      update((s) => ({ ...s, sovereign: { ...s.sovereign, actions: DEMO_SEED, graceMarks: 2, graceMessages: [
        { id: "gm1", receivedAt: Date.now() - 86400000 * 6, text: "A Grace Mark has been received. The work has been seen." },
        { id: "gm2", receivedAt: Date.now() - 86400000 * 2, text: "A Grace Mark has been received." },
      ] } }));
    }
  }, [hydrated, state.sovereign.actions.length, update]);

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [graceOpen, setGraceOpen] = useState(false);
  const [marksOpen, setMarksOpen] = useState(false);

  const sealed = state.sovereign.actions.filter((a) => a.marksAwarded > 0);
  const open = state.sovereign.actions.filter((a) => a.marksAwarded === 0 && a.status !== "abandoned");
  const sovereignMarks = sealed.reduce((sum, a) => sum + a.marksAwarded, 0);
  const graceMarks = state.sovereign.graceMarks;

  const domainWeights = useMemo(() => {
    const w: Record<DomainId, number> = Object.fromEntries(DOMAINS.map((d) => [d.id, 0])) as Record<DomainId, number>;
    for (const a of state.sovereign.actions) w[a.domain] = (w[a.domain] ?? 0) + 1;
    return w;
  }, [state.sovereign.actions]);

  // Recommended: least-touched domain
  const recommendedDomain = useMemo<DomainId>(() => {
    let min = Infinity; let pick: DomainId = "spirit";
    for (const d of DOMAINS) {
      if (domainWeights[d.id] < min) { min = domainWeights[d.id]; pick = d.id; }
    }
    return pick;
  }, [domainWeights]);

  function updateAction(id: string, patch: Partial<SovereignAction>) {
    update((s) => ({
      ...s,
      sovereign: {
        ...s.sovereign,
        actions: s.sovereign.actions.map((a) => (a.id === id ? { ...a, ...patch } : a)),
      },
    }));
  }

  function sealAction(id: string) {
    update((s) => ({
      ...s,
      sovereign: {
        ...s.sovereign,
        actions: s.sovereign.actions.map((a) => {
          if (a.id !== id || a.marksAwarded > 0) return a;
          if (a.status !== "completed" || a.visibleEvidence.trim().length === 0) return a;
          return { ...a, marksAwarded: markValueForScale(a.scale), sealedAt: Date.now(), completedAt: a.completedAt ?? Date.now() };
        }),
      },
    }));
    obs("sovereign_seal", { id });
  }

  function addAction(input: { principle: string; action: string; benefit: string; scale: ActionScale; domain: DomainId }) {
    const a = newAction(input);
    update((s) => ({ ...s, sovereign: { ...s.sovereign, actions: [a, ...s.sovereign.actions] } }));
    obs("sovereign_declare", { id: a.id, scale: a.scale, domain: a.domain });
    setSubmitOpen(false);
  }

  return (
    <main className="relative min-h-screen text-parchment px-4 md:px-8 py-12 md:py-16">
      <div className="max-w-3xl mx-auto">
        {/* Locked banner */}
        <div className="text-center mb-3">
          <p className="text-[10px] tracking-[0.5em] uppercase text-gold-aged">
            Sovereign Marks are earned · Grace Marks are received
          </p>
        </div>
        <header className="text-center mb-10">
          <p className="text-parchment-dim text-[10px] tracking-[0.4em] uppercase">Sovereign Action Layer</p>
          <h1 className="mt-3 text-2xl text-gold" style={{ fontFamily: "var(--font-serif)" }}>
            Active Gate: {activeGateName(state.gates)}
          </h1>
          <div className="mt-5 h-px w-20 mx-auto bg-gold-aged opacity-40" />
        </header>

        {/* Quiet stat row */}
        <div className="grid grid-cols-3 gap-3 mb-12">
          <StatTile label="Sealed witness" value={sealed.length} onClick={() => setArchiveOpen(true)} />
          <StatTile label="Sovereign marks" value={sovereignMarks} onClick={() => setMarksOpen((v) => !v)} />
          <StatTile label="Grace marks" value={graceMarks} onClick={() => setGraceOpen((v) => !v)} />
        </div>

        {marksOpen && (
          <p className="text-center text-parchment-dim italic text-xs mb-8">
            1 mark per micro · 3 per meso · 7 per macro. Sealed when evidence is named.
          </p>
        )}
        {graceOpen && (
          <div className="mb-10">
            {state.sovereign.graceMessages.length === 0 ? (
              <p className="text-center text-parchment-dim italic text-xs">No Grace Mark has been received yet.</p>
            ) : (
              <ul className="space-y-2 max-w-md mx-auto">
                {state.sovereign.graceMessages.map((m) => (
                  <li key={m.id} className="text-center text-xs text-parchment-dim italic">
                    {new Date(m.receivedAt).toLocaleDateString()} · {m.text}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Open witness cards */}
        <section className="mb-12">
          <h2 className="text-parchment-dim text-[10px] tracking-[0.4em] uppercase mb-4">Open witness</h2>
          {open.length === 0 ? (
            <p className="text-parchment-dim italic text-sm">None yet.</p>
          ) : (
            <ul className="space-y-4">
              {open.map((a) => (
                <WitnessCard
                  key={a.id}
                  action={a}
                  onChange={(patch) => updateAction(a.id, patch)}
                  onSeal={() => sealAction(a.id)}
                />
              ))}
            </ul>
          )}
        </section>

        {/* Domain Map */}
        <section className="mb-12">
          <h2 className="text-parchment-dim text-[10px] tracking-[0.4em] uppercase mb-4 text-center">Twelve Domains</h2>
          <LedgerShell>
            <DomainMap weights={domainWeights} highlight={recommendedDomain} />
            <p className="mt-4 text-center text-parchment-dim italic text-xs">
              Quieter nodes are not asking. They are remembering you.
            </p>
          </LedgerShell>
        </section>

        {/* Recommended next action */}
        <section className="mb-12">
          <h2 className="text-parchment-dim text-[10px] tracking-[0.4em] uppercase mb-3">Recommended</h2>
          <div className="text-center text-sm text-parchment-dim italic">
            Resonance suggests an action in <span className="text-gold not-italic">{DOMAINS.find((d) => d.id === recommendedDomain)?.name}</span>.
            The Field Manual below has one waiting. Ignore if it is not yours.
          </div>
        </section>

        {/* Field Manual */}
        <section className="mb-12">
          <h2 className="text-parchment-dim text-[10px] tracking-[0.4em] uppercase mb-4">Field Manual</h2>
          <FieldManualDeck onUse={(c) => addAction({ principle: c.principle, action: c.action, benefit: c.benefit, scale: "micro", domain: c.domain })} />
        </section>

        {/* Submit Action Card */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-parchment-dim text-[10px] tracking-[0.4em] uppercase">Submit an Action Card</h2>
            <button
              onClick={() => setSubmitOpen((v) => !v)}
              className="text-gold-aged hover:text-gold text-[10px] tracking-[0.3em] uppercase transition-colors duration-500"
            >
              {submitOpen ? "close" : "open ledger entry"}
            </button>
          </div>
          {submitOpen && (
            <LedgerShell>
              <ActionCardForm onSubmit={addAction} />
              {isDev() && (
                <p className="mt-3 text-[10px] text-parchment-dim/70 italic">
                  Founder review queue (dev only): submissions enter the open ledger immediately.
                </p>
              )}
            </LedgerShell>
          )}
        </section>

        <div className="text-center pt-4">
          <Link to="/gates" className="text-xs tracking-[0.3em] uppercase text-parchment-dim hover:text-gold transition-colors duration-500">
            return to the constellation
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {archiveOpen && <ArchiveOverlay sealed={sealed} onClose={() => setArchiveOpen(false)} />}
      </AnimatePresence>
    </main>
  );
}

function StatTile({ label, value, onClick }: { label: string; value: number; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="ledger-page rounded-sm p-4 text-center hover:border-gold-aged/60 transition-colors duration-500"
    >
      <div className="text-gold text-3xl" style={{ fontFamily: "var(--font-serif)" }}>{value}</div>
      <div className="mt-1 text-parchment-dim text-[9px] tracking-[0.3em] uppercase">{label}</div>
    </button>
  );
}
