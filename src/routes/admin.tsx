import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { isAdmin, isDev, clearAdmin } from "../lib/admin";
import { useAppState } from "../lib/useAppState";
import { readObs, clearObs } from "../lib/observation";
import { resetState } from "../lib/state";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "·" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: Admin,
});

function Admin() {
  const [allowed, setAllowed] = useState(false);
  const { state, update } = useAppState();
  const [obsEvents, setObsEvents] = useState<ReturnType<typeof readObs>>([]);

  useEffect(() => {
    setAllowed(isAdmin() || isDev());
    setObsEvents(readObs());
  }, []);

  if (!allowed) {
    return (
      <main className="min-h-screen bg-obsidian-deep flex items-center justify-center px-6">
        <p className="text-parchment-dim text-sm">Not found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-obsidian-deep text-parchment px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <p className="text-gold-aged text-xs tracking-widest uppercase">Hidden — {isAdmin() ? "admin" : ""} {isDev() ? "dev" : ""}</p>
          <h1 className="mt-1 text-2xl text-gold">Cabinet of Workings</h1>
        </header>

        <section className="grimoire-panel rounded-sm p-5 mb-6">
          <h2 className="text-gold-aged text-xs tracking-widest uppercase mb-3">Privacy mode</h2>
          <div className="flex gap-2">
            {(["private_summary","full","ephemeral"] as const).map((m) => (
              <button key={m} onClick={() => update((s) => ({ ...s, privacyMode: m }))}
                className={`text-xs px-3 py-1 rounded-sm border ${state.privacyMode === m ? "border-gold text-gold" : "border-bronze/30 text-parchment-dim"}`}>
                {m.replace("_"," ")}
              </button>
            ))}
          </div>
        </section>

        <section className="grimoire-panel rounded-sm p-5 mb-6">
          <h2 className="text-gold-aged text-xs tracking-widest uppercase mb-3">State</h2>
          <pre className="text-[11px] text-parchment-dim overflow-auto max-h-64">{JSON.stringify(state, null, 2)}</pre>
          <div className="mt-3 flex gap-2">
            <button onClick={() => { if (confirm("Reset all state?")) { resetState(); location.reload(); } }}
              className="text-xs px-3 py-1 rounded-sm border border-destructive/50 text-destructive hover:bg-destructive/10">reset state</button>
            <button onClick={() => { clearAdmin(); location.href = "/"; }}
              className="text-xs px-3 py-1 rounded-sm border border-bronze/40 text-parchment-dim">end admin session</button>
          </div>
        </section>

        <section className="grimoire-panel rounded-sm p-5 mb-6">
          <h2 className="text-gold-aged text-xs tracking-widest uppercase mb-3">Observation log ({obsEvents.length})</h2>
          <div className="text-[11px] text-parchment-dim font-mono max-h-64 overflow-auto">
            {obsEvents.slice().reverse().map((e, i) => (
              <div key={i}>{new Date(e.t).toLocaleString()} · {e.kind}{e.meta ? " · " + JSON.stringify(e.meta) : ""}</div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => { clearObs(); setObsEvents([]); }} className="text-xs px-3 py-1 rounded-sm border border-bronze/40 text-parchment-dim">clear log</button>
          </div>
        </section>

        <div className="text-center mt-12">
          <Link to="/gates" className="text-xs tracking-widest uppercase text-parchment-dim hover:text-gold">return</Link>
        </div>
      </div>
    </main>
  );
}
