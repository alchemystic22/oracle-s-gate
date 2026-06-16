import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAppState } from "../lib/useAppState";
import { RitualButton } from "../components/RitualButton";
import type { SovereignAction } from "../lib/state";
import { obs } from "../lib/observation";

export const Route = createFileRoute("/sovereign")({
  head: () => ({ meta: [{ title: "Sovereign Action" }] }),
  component: Sovereign,
});

function Sovereign() {
  const { state, update, hydrated } = useAppState();
  const nav = useNavigate();
  const [intent, setIntent] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (hydrated && !state.invocationCompletedAt) nav({ to: "/" });
  }, [hydrated, state.invocationCompletedAt, nav]);

  useEffect(() => { obs("sovereign_open"); }, []);

  function declare() {
    if (intent.trim().length < 3) return;
    const action: SovereignAction = {
      id: `a_${Date.now()}`,
      declaredAt: Date.now(),
      intent: intent.trim(),
      privateNotes: notes.trim() || undefined,
      status: "declared",
      visibleEvidence: "",
      marksAwarded: 0,
    };
    update((s) => ({ ...s, sovereign: { actions: [action, ...s.sovereign.actions] } }));
    obs("sovereign_declare", { id: action.id });
    setIntent(""); setNotes("");
  }

  function updateAction(id: string, patch: Partial<SovereignAction>) {
    update((s) => ({
      ...s,
      sovereign: {
        actions: s.sovereign.actions.map((a) => {
          if (a.id !== id) return a;
          const next = { ...a, ...patch };
          // Marks awarded only when status is completed AND visibleEvidence non-empty
          if (next.status === "completed" && next.visibleEvidence.trim().length > 0 && next.marksAwarded === 0) {
            next.marksAwarded = 1;
            next.completedAt = next.completedAt ?? Date.now();
            obs("sovereign_mark", { id });
          }
          return next;
        }),
      },
    }));
  }

  return (
    <main className="min-h-screen bg-obsidian-deep text-parchment px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-10">
          <p className="text-parchment-dim text-xs tracking-[0.4em] uppercase">Sovereign Action</p>
          <h1 className="mt-2 text-2xl text-gold">Declare. Act. Name the evidence.</h1>
          <p className="mt-3 text-parchment-dim italic text-sm max-w-md mx-auto">Marks are sealed when evidence is named.</p>
          <div className="mt-6 h-px w-16 mx-auto bg-gold-aged opacity-40" />
        </header>

        <section className="grimoire-panel rounded-sm p-6 mb-10">
          <p className="text-gold-aged text-xs tracking-widest uppercase mb-3">Declare an intent</p>
          <input
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            placeholder="One sentence. No more."
            className="w-full bg-obsidian border border-bronze/40 rounded-sm p-3 text-parchment placeholder:text-parchment-dim/60 focus:outline-none focus:border-gold-aged"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Private notes (optional, never displayed)."
            className="mt-3 w-full bg-obsidian border border-bronze/40 rounded-sm p-3 text-parchment placeholder:text-parchment-dim/60 focus:outline-none focus:border-gold-aged text-sm"
          />
          <div className="mt-4 flex justify-end">
            <RitualButton disabled={intent.trim().length < 3} onClick={declare}>declare</RitualButton>
          </div>
        </section>

        <section>
          <p className="text-parchment-dim text-xs tracking-widest uppercase mb-4">Active and sealed</p>
          {state.sovereign.actions.length === 0 && (
            <p className="text-parchment-dim italic text-sm">None yet.</p>
          )}
          <ul className="space-y-4">
            {state.sovereign.actions.map((a) => (
              <li key={a.id} className="grimoire-panel rounded-sm p-5">
                <div className="flex items-baseline justify-between">
                  <div className="text-parchment text-base">{a.intent}</div>
                  <div className="text-xs text-parchment-dim ml-3">
                    {new Date(a.declaredAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {(["declared","in_progress","completed","abandoned"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateAction(a.id, { status: s })}
                      className={`text-[10px] tracking-widest uppercase px-2 py-1 rounded-sm border ${
                        a.status === s ? "border-gold text-gold" : "border-bronze/30 text-parchment-dim hover:text-parchment"
                      }`}
                    >{s.replace("_"," ")}</button>
                  ))}
                </div>

                <div className="mt-4">
                  <label className="text-gold-aged text-[10px] tracking-widest uppercase">Visible evidence</label>
                  <textarea
                    value={a.visibleEvidence}
                    onChange={(e) => updateAction(a.id, { visibleEvidence: e.target.value })}
                    rows={2}
                    placeholder="What can be witnessed? Who saw it? What changed in the world?"
                    className="mt-1 w-full bg-obsidian border border-bronze/30 rounded-sm p-2 text-parchment text-sm placeholder:text-parchment-dim/50 focus:outline-none focus:border-gold-aged"
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  {a.marksAwarded > 0 ? (
                    <span className="text-gold tracking-widest uppercase">✦ Sovereign Mark</span>
                  ) : a.status === "completed" ? (
                    <span className="text-parchment-dim italic">Marks are sealed when evidence is named.</span>
                  ) : (
                    <span className="text-parchment-dim italic">In motion.</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-16 text-center">
          <Link to="/gates" className="text-xs tracking-widest uppercase text-parchment-dim hover:text-gold">return to the constellation</Link>
        </div>
      </div>
    </main>
  );
}
