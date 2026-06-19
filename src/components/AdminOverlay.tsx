import { useEffect, useState } from "react";
import { Settings2, Eye, EyeOff } from "lucide-react";
import { isAdmin, isDev, clearAdmin } from "../lib/admin";
import { loadState, resetState, saveState, type AppState, type GateId, type GatePhase, type PrivacyMode } from "../lib/state";
import type { RouteId } from "../data/correctives";
import { readObs, clearObs } from "../lib/observation";

/* Admin / Dev overlay — fixed bottom-right pill rendered from __root.tsx.
   Activated by ?admin=true or ?dev=true (persisted via sessionStorage in admin.ts).
   Not a route. Not visible to the Avatar without the URL param. */
export function AdminOverlay() {
  const [admin, setAdmin] = useState(false);
  const [dev, setDev] = useState(false);
  const [open, setOpen] = useState(false);
  const [showState, setShowState] = useState(false);
  const [state, setState] = useState<AppState | null>(null);
  const [gateId, setGateId] = useState<GateId>(1);

  useEffect(() => {
    setAdmin(isAdmin());
    setDev(isDev());
  }, []);

  useEffect(() => {
    if (open) {
      setState(loadState());
    }
  }, [open]);

  if (!admin && !dev) return null;

  const refresh = () => setState(loadState());

  const setPhase = (phase: GatePhase) => {
    const s = loadState();
    s.gateState[gateId].phase = phase;
    saveState(s);
    refresh();
    location.reload();
  };

  const setRoute = (r: RouteId) => {
    const s = loadState();
    s.gateState[gateId].activeRoute = r;
    saveState(s);
    refresh();
    location.reload();
  };

  const zeroAnchors = () => {
    const s = loadState();
    const anchors = s.gateState[gateId].anchors;
    const keys = Object.keys(anchors) as Array<keyof typeof anchors>;
    keys.forEach((k) => { anchors[k] = 1; });
    saveState(s);
    refresh();
    location.reload();
  };

  const completeGate = (id: GateId) => {
    const s = loadState();
    s.gates[id] = { ...s.gates[id], completedAt: s.gates[id]?.completedAt ?? Date.now() };
    saveState(s);
    refresh();
    location.reload();
  };

  const setPrivacy = (m: PrivacyMode) => {
    const s = loadState();
    s.privacyMode = m;
    saveState(s);
    refresh();
  };

  const routesForGate: RouteId[] =
    gateId === 1 ? ["false_arrival", "splintered_trust"]
    : gateId === 2 ? ["burned_tongue", "silenced_fire"]
    : [];


  return (
    <div className="fixed bottom-4 right-4 z-[100] max-w-sm font-mono text-xs">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 border px-3 py-2"
          style={{
            borderColor: "hsl(43 30% 55% / 0.4)",
            background: "hsl(0 0% 0% / 0.8)",
            color: "hsl(43 30% 65%)",
          }}
          aria-label="Open admin overlay"
        >
          <Settings2 size={14} />
          {admin ? "admin" : ""}{admin && dev ? " · " : ""}{dev ? "dev" : ""}
        </button>
      )}
      {open && (
        <div
          className="space-y-3 border p-4"
          style={{
            borderColor: "hsl(43 30% 55% / 0.4)",
            background: "hsl(0 0% 0% / 0.92)",
            color: "hsl(43 30% 78%)",
            maxHeight: "80vh",
            overflow: "auto",
          }}
        >
          <div className="flex items-center justify-between">
            <span className="uppercase tracking-widest" style={{ color: "hsl(43 50% 60%)" }}>
              {admin ? "admin" : ""} {dev ? "dev" : ""}
            </span>
            <button onClick={() => setOpen(false)} className="hover:text-white">close</button>
          </div>

          {dev && (
            <>
              <div>
                <div className="mb-1 uppercase tracking-widest" style={{ color: "hsl(43 50% 55%)" }}>Gate 1 phase</div>
                <div className="grid grid-cols-2 gap-1">
                  {(["threshold","encounter","obstruction","book_emergence","page_open","corrective_gate_open","relocked","completion"] as const).map((p) => (
                    <button key={p} onClick={() => setPhase(p)} className="border px-2 py-1 text-left hover:text-white" style={{ borderColor: "hsl(43 30% 55% / 0.3)" }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1 uppercase tracking-widest" style={{ color: "hsl(43 50% 55%)" }}>Active route</div>
                <div className="flex gap-1">
                  {(["false_arrival","splintered_trust"] as const).map((r) => (
                    <button key={r} onClick={() => setRoute(r)} className="flex-1 border px-2 py-1 hover:text-white" style={{ borderColor: "hsl(43 30% 55% / 0.3)" }}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={zeroAnchors} className="block w-full border px-2 py-1 hover:text-white" style={{ borderColor: "hsl(43 30% 55% / 0.3)" }}>
                bypass all time-locks
              </button>
            </>
          )}

          {state && (
            <div>
              <div className="mb-1 uppercase tracking-widest" style={{ color: "hsl(43 50% 55%)" }}>Privacy mode</div>
              <div className="flex flex-wrap gap-1">
                {(["completion_marker_only","temporary_entry","do_not_store_after_refresh"] as PrivacyMode[]).map((m) => (
                  <button key={m} onClick={() => setPrivacy(m)} className={`border px-2 py-1 hover:text-white ${state.privacyMode === m ? "text-white" : ""}`} style={{ borderColor: state.privacyMode === m ? "hsl(43 80% 70%)" : "hsl(43 30% 55% / 0.3)" }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowState((v) => !v)} className="flex items-center gap-1 border px-2 py-1 hover:text-white" style={{ borderColor: "hsl(43 30% 55% / 0.3)" }}>
              {showState ? <EyeOff size={12} /> : <Eye size={12} />} state
            </button>
            <button onClick={() => { if (confirm("Reset all state?")) { resetState(); clearObs(); location.reload(); } }} className="border px-2 py-1 hover:text-white" style={{ borderColor: "hsl(0 60% 50% / 0.5)", color: "hsl(0 60% 70%)" }}>
              reset
            </button>
            <button onClick={() => { clearAdmin(); location.href = "/"; }} className="border px-2 py-1 hover:text-white" style={{ borderColor: "hsl(43 30% 55% / 0.3)" }}>
              end session
            </button>
          </div>

          {showState && state && (
            <pre className="max-h-60 overflow-auto border p-2 text-[10px] leading-tight" style={{ borderColor: "hsl(43 30% 55% / 0.3)", background: "hsl(0 0% 0%)", color: "hsl(43 30% 60%)" }}>
              {JSON.stringify({ state, obs: readObs().slice(-30) }, null, 2)}
            </pre>
          )}

          <p className="text-[10px] italic" style={{ color: "hsl(43 30% 50%)" }}>
            Test panel only. Not visible to the Avatar.
          </p>
        </div>
      )}
    </div>
  );
}
