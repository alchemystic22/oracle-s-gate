import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { gateById, GATES } from "../data/gates";
import { useAppState } from "../lib/useAppState";
import { MeasuredReveal } from "../components/MeasuredReveal";
import { RitualButton } from "../components/RitualButton";
import { applyPrivacy, gateLockMs } from "../lib/state";
import { obs } from "../lib/observation";
import { isDev } from "../lib/admin";

export const Route = createFileRoute("/gates/$gateId")({
  component: GatePage,
});

type Phase = "threshold" | "encounter" | "reflection" | "sealed";

function GatePage() {
  const { gateId } = Route.useParams();
  const id = Number(gateId);
  const gate = gateById(id);
  const nav = useNavigate();
  const { state, update, hydrated } = useAppState();

  useEffect(() => {
    if (hydrated && !state.invocationCompletedAt) nav({ to: "/" });
  }, [hydrated, state.invocationCompletedAt, nav]);

  const accessible = useMemo(() => {
    if (!hydrated) return false;
    if (isDev()) return true;
    // Only the next-uncompleted gate is accessible
    for (const g of GATES) {
      if (!state.gates[g.id]?.completedAt) return g.id === id;
    }
    return false;
  }, [hydrated, state, id]);

  const lockUntil = state.gates[id as 1]?.nextUnlockAt ?? 0;
  const lockedByTime = lockUntil > Date.now() && !isDev();

  if (!gate) return <Locked text="No such gate." />;
  if (!hydrated) return null;
  if (!accessible) return <Locked text="This gate is not yet yours." />;
  if (lockedByTime) {
    const hrs = Math.ceil((lockUntil - Date.now()) / (60*60*1000));
    return <Locked text={`The threshold is closed. It opens in ${hrs} hour${hrs===1?"":"s"}.`} />;
  }

  // Gate 1 — fully wired. Gates 2–7 — sealed stub.
  if (id === 1) return <GateOne />;
  return <SealedGate id={id} name={gate.name} />;
}

function Locked({ text }: { text: string }) {
  return (
    <main className="min-h-screen bg-obsidian-deep text-parchment flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-parchment text-lg leading-relaxed">{text}</p>
        <div className="mt-8">
          <Link to="/gates" className="text-xs tracking-widest uppercase text-gold-aged hover:text-gold">return to the constellation</Link>
        </div>
      </div>
    </main>
  );
}

function SealedGate({ id, name }: { id: number; name: string }) {
  useEffect(() => { obs("gate_sealed_view", { id }); }, [id]);
  return (
    <main className="min-h-screen bg-obsidian-deep text-parchment flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-parchment-dim text-xs tracking-[0.4em] uppercase">Gate {id}</p>
        <h1 className="mt-3 text-2xl text-gold">{name}</h1>
        <p className="mt-8 text-parchment italic leading-relaxed">
          This gate is sealed. Its threshold will be inscribed in time.
        </p>
        <div className="mt-10">
          <Link to="/gates" className="text-xs tracking-widest uppercase text-gold-aged hover:text-gold">return</Link>
        </div>
      </div>
    </main>
  );
}

function GateOne() {
  const gate = gateById(1)!;
  const { state, update } = useAppState();
  const [phase, setPhase] = useState<Phase>("threshold");
  const [thresholdReady, setThresholdReady] = useState(false);
  const [encounterReady, setEncounterReady] = useState(false);
  const [reflection, setReflection] = useState("");
  const [listening, setListening] = useState(false);

  useEffect(() => { obs("gate1_open"); update((s) => ({ ...s, gates: { ...s.gates, 1: { ...s.gates[1], visitedAt: s.gates[1]?.visitedAt ?? Date.now() } } })); /* eslint-disable-next-line */ }, []);

  // Speech recognition feature detection — silent fallback
  const SR = typeof window !== "undefined" ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null;

  function startListening() {
    if (!SR) return;
    try {
      const rec = new SR();
      rec.continuous = false; rec.interimResults = false; rec.lang = "en-US";
      rec.onresult = (e: any) => {
        const t = e.results?.[0]?.[0]?.transcript ?? "";
        setReflection((r) => (r ? r + " " : "") + t);
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);
      rec.start();
      setListening(true);
    } catch { /* silent */ }
  }

  if (phase === "threshold") {
    return (
      <Scaffold gate={gate}>
        <div className="threshold-placeholder rounded-sm h-64 md:h-80 mb-12" aria-label="Threshold of Gate 1" />
        <MeasuredReveal paragraphs={gate.thresholdCopy} step={1400} tail={5000} onComplete={() => setThresholdReady(true)} />
        <div className="mt-14 flex justify-center">
          <RitualButton disabled={!thresholdReady} onClick={() => { obs("gate1_threshold_cross"); update((s)=>({ ...s, gates: { ...s.gates, 1: { ...s.gates[1], thresholdAcknowledgedAt: Date.now() } }})); setPhase("encounter"); }}>
            cross the threshold
          </RitualButton>
        </div>
      </Scaffold>
    );
  }

  if (phase === "encounter") {
    return (
      <Scaffold gate={gate}>
        <MeasuredReveal paragraphs={gate.encounterCopy} step={1400} tail={5000} onComplete={() => setEncounterReady(true)} />
        <div className="mt-14 flex justify-center">
          <RitualButton disabled={!encounterReady} onClick={() => { obs("gate1_encounter_complete"); update((s)=>({ ...s, gates: { ...s.gates, 1: { ...s.gates[1], encounteredAt: Date.now() } }})); setPhase("reflection"); }}>
            speak the wall
          </RitualButton>
        </div>
      </Scaffold>
    );
  }

  if (phase === "reflection") {
    return (
      <Scaffold gate={gate}>
        <div className="max-w-xl mx-auto">
          <p className="text-gold-aged text-sm tracking-widest uppercase mb-4">Reflection</p>
          <p className="text-parchment text-lg italic mb-6">{gate.reflectionPrompt}</p>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            rows={6}
            placeholder="Write as if no one will read this."
            className="w-full bg-obsidian border border-bronze/40 rounded-sm p-4 text-parchment placeholder:text-parchment-dim/60 focus:outline-none focus:border-gold-aged"
          />
          <div className="mt-3 flex items-center justify-between text-xs">
            <div className="text-parchment-dim">
              Privacy mode: <span className="text-parchment">{state.privacyMode.replace("_"," ")}</span>
            </div>
            {SR && (
              <button onClick={startListening} className="text-gold-aged hover:text-gold tracking-widest">
                {listening ? "listening…" : "speak entry"}
              </button>
            )}
          </div>

          <div className="mt-10 flex justify-center">
            <RitualButton
              disabled={reflection.trim().length < 3}
              onClick={() => {
                const now = Date.now();
                const text = applyPrivacy(reflection.trim(), state.privacyMode);
                update((s) => ({
                  ...s,
                  gates: { ...s.gates, 1: { ...s.gates[1], reflectionAt: now, completedAt: now, nextUnlockAt: undefined } },
                  // Gate 2 time-locks 24h from now
                  // (we lock the *next* gate, not this one)
                }));
                update((s) => ({ ...s, gates: { ...s.gates, 2: { ...s.gates[2], nextUnlockAt: now + gateLockMs() } } }));
                update((s) => ({ ...s, grace: { ...s.grace, nextEligibleAt: s.grace.nextEligibleAt ?? (now + 3*24*60*60*1000) } }));
                obs("gate1_complete");
                setPhase("sealed");
              }}
            >
              seal this gate
            </RitualButton>
          </div>
        </div>
      </Scaffold>
    );
  }

  // sealed
  return (
    <Scaffold gate={gate}>
      <div className="text-center max-w-md mx-auto">
        <p className="text-bronze text-xs tracking-[0.4em] uppercase mb-4">Sealed</p>
        <p className="text-parchment text-lg leading-relaxed italic">
          The wall has been named. The next threshold will open when its hour comes.
        </p>
        <p className="mt-3 text-parchment-dim text-sm">Gate 2 opens in 24 hours.</p>
        <div className="mt-10">
          <Link to="/gates" className="text-xs tracking-widest uppercase text-gold-aged hover:text-gold">return to the constellation</Link>
        </div>
      </div>
    </Scaffold>
  );
}

function Scaffold({ gate, children }: { gate: ReturnType<typeof gateById>; children: React.ReactNode }) {
  if (!gate) return null;
  return (
    <main className="min-h-screen bg-obsidian-deep text-parchment px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-10">
          <p className="text-parchment-dim text-xs tracking-[0.4em] uppercase">Gate {gate.id}</p>
          <h1 className="mt-2 text-2xl md:text-3xl text-gold">{gate.name}</h1>
          <p className="mt-2 text-parchment-dim italic">{gate.epithet}</p>
          <div className="mt-6 h-px w-16 mx-auto bg-gold-aged opacity-40" />
        </header>
        {children}
      </div>
    </main>
  );
}
