import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { GATES } from "../data/gates";
import { useAppState } from "../lib/useAppState";
import { gateLockMs } from "../lib/state";
import { obs } from "../lib/observation";

export const Route = createFileRoute("/gates/")({
  head: () => ({ meta: [{ title: "The Constellation" }] }),
  component: Constellation,
});

function Constellation() {
  const { state, hydrated } = useAppState();
  const nav = useNavigate();

  useEffect(() => {
    if (hydrated && !state.invocationCompletedAt) nav({ to: "/" });
  }, [hydrated, state.invocationCompletedAt, nav]);

  useEffect(() => { obs("gates_open"); }, []);

  const nextUnlockable = nextGateId(state);

  return (
    <main className="min-h-screen bg-obsidian-deep text-parchment px-6 py-12">
      <header className="max-w-3xl mx-auto text-center mb-10">
        <p className="text-parchment-dim text-xs tracking-[0.4em] uppercase">The Constellation</p>
        <h1 className="mt-2 text-2xl md:text-3xl text-gold">Seven Gates</h1>
        <p className="mt-4 text-parchment-dim text-sm max-w-md mx-auto leading-relaxed">
          Only the next gate is yours. The others wait. They are not hidden from you — they are not yet relevant.
        </p>
      </header>

      {/* Mobile: vertical list */}
      <ol className="lg:hidden max-w-md mx-auto space-y-3">
        {GATES.map((g) => {
          const locked = g.id !== nextUnlockable;
          const completed = !!state.gates[g.id]?.completedAt;
          return (
            <li key={g.id}>
              <GateCell gate={g} locked={locked} completed={completed} timeLockUntil={state.gates[g.id]?.nextUnlockAt} />
            </li>
          );
        })}
      </ol>

      {/* Desktop: constellation */}
      <div className="hidden lg:block relative max-w-3xl mx-auto" style={{ height: 560 }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          {/* seam lines, Tree-of-Life-adjacent — not literal sephirot */}
          {[
            ["1","2"],["1","3"],["2","3"],["2","4"],["3","5"],["4","5"],
            ["4","6"],["5","7"],["6","7"],["2","6"],["3","7"],
          ].map(([a,b],i)=>{
            const A = GATES.find(g=>String(g.id)===a)!; const B = GATES.find(g=>String(g.id)===b)!;
            return <line key={i} x1={A.pos.x} y1={A.pos.y} x2={B.pos.x} y2={B.pos.y} stroke="currentColor" strokeWidth="0.15" className="text-gold-aged opacity-25"/>;
          })}
        </svg>
        {GATES.map((g) => {
          const locked = g.id !== nextUnlockable;
          const completed = !!state.gates[g.id]?.completedAt;
          return (
            <div key={g.id} className="absolute -translate-x-1/2 -translate-y-1/2"
                 style={{ left: `${g.pos.x}%`, top: `${g.pos.y}%` }}>
              <GateNode gate={g} locked={locked} completed={completed} timeLockUntil={state.gates[g.id]?.nextUnlockAt} />
            </div>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <Link to="/cabinet" className="text-xs tracking-widest uppercase text-parchment-dim hover:text-gold">the reading cabinet</Link>
        <span className="text-parchment-dim mx-3">·</span>
        <Link to="/sovereign" className="text-xs tracking-widest uppercase text-parchment-dim hover:text-gold">sovereign action</Link>
      </div>
    </main>
  );
}

function nextGateId(state: ReturnType<typeof useAppState>["state"]) {
  for (const g of GATES) {
    const gs = state.gates[g.id];
    if (!gs?.completedAt) return g.id;
  }
  return 7;
}

function lockStatus(timeLockUntil?: number) {
  if (!timeLockUntil) return null;
  const ms = timeLockUntil - Date.now();
  if (ms <= 0) return null;
  const hrs = Math.ceil(ms / (60*60*1000));
  return hrs;
}

function GateCell({ gate, locked, completed, timeLockUntil }: { gate: typeof GATES[number]; locked: boolean; completed: boolean; timeLockUntil?: number }) {
  const lockHrs = lockStatus(timeLockUntil);
  const accessible = !locked && !lockHrs && !completed;
  const inner = (
    <div className={`grimoire-panel rounded-sm p-5 transition-all ${accessible ? "hover:border-gold cursor-pointer" : "opacity-50"}`}>
      <div className="flex items-baseline justify-between">
        <span className="text-gold-aged text-xs tracking-[0.3em]">GATE {gate.id}</span>
        {completed && <span className="text-bronze text-xs tracking-widest">SEALED</span>}
        {!completed && locked && <span className="text-parchment-dim text-xs tracking-widest">not yet</span>}
        {!completed && !locked && lockHrs && <span className="text-parchment-dim text-xs">{lockHrs}h</span>}
      </div>
      <div className="mt-2 text-parchment text-lg">{accessible || completed ? gate.name : "—"}</div>
      {(accessible || completed) && <div className="mt-1 text-parchment-dim text-sm italic">{gate.epithet}</div>}
    </div>
  );
  if (accessible) return <Link to="/gates/$gateId" params={{ gateId: String(gate.id) }}>{inner}</Link>;
  return inner;
}

function GateNode({ gate, locked, completed, timeLockUntil }: { gate: typeof GATES[number]; locked: boolean; completed: boolean; timeLockUntil?: number }) {
  const lockHrs = lockStatus(timeLockUntil);
  const accessible = !locked && !lockHrs && !completed;
  const dot = (
    <div className="flex flex-col items-center select-none">
      <div className={`w-4 h-4 rounded-full border ${
        completed ? "bg-bronze border-bronze" :
        accessible ? "bg-gold border-gold seam-breathe" :
        "bg-transparent border-parchment-dim opacity-40"
      }`} />
      <div className="mt-2 text-[10px] tracking-[0.3em] text-parchment-dim">
        {accessible || completed ? `GATE ${gate.id}` : "·"}
      </div>
      {(accessible || completed) && (
        <div className="text-[11px] text-parchment-dim italic mt-0.5 max-w-[120px] text-center">{gate.epithet}</div>
      )}
    </div>
  );
  if (accessible) return <Link to="/gates/$gateId" params={{ gateId: String(gate.id) }}>{dot}</Link>;
  return dot;
}
