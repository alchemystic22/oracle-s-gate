import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppState } from "../lib/useAppState";
import { obs } from "../lib/observation";
import { isDev } from "../lib/admin";
import { drawTriad, pushRecentTriad, type SelectionMode, type Triad } from "../lib/resonance";
import { CabinetChamber } from "../components/cabinet/CabinetChamber";
import { OfferingCard } from "../components/cabinet/OfferingCard";
import { OfferingPanel } from "../components/cabinet/OfferingPanel";
import { VesselPlayer } from "../components/cabinet/VesselPlayer";
import { ReflectionField } from "../components/cabinet/ReflectionField";
import type { CabinetEncounter } from "../lib/state";

export const Route = createFileRoute("/cabinet")({
  head: () => ({ meta: [{ title: "The Reading Cabinet" }] }),
  component: Cabinet,
});

const EXPO_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

type Phase =
  | "rising"          // cards rising
  | "held"            // oracle line, held beat
  | "awaiting"        // avatar_chose mode — waiting for click
  | "oracle_settle"   // oracle_revealed mode — 6s stillness before illuminate
  | "illuminated"     // oracle revealed; one card lit, others receding
  | "flipped"         // chosen card flipped; body unfurling
  | "reflection"      // reflection field open
  | "closed";         // post-keep / close — quiet line

function Cabinet() {
  const { state, update, hydrated } = useAppState();
  const nav = useNavigate();

  // Honour invocation gate (with dev bypass).
  useEffect(() => {
    if (hydrated && !state.invocationCompletedAt && !isDev()) nav({ to: "/" });
  }, [hydrated, state.invocationCompletedAt, nav]);

  useEffect(() => { obs("cabinet_open"); }, []);

  // Parse dev ?mode=
  const forceMode: SelectionMode | undefined = useMemo(() => {
    if (typeof window === "undefined" || !isDev()) return undefined;
    const p = new URLSearchParams(window.location.search).get("mode");
    return p === "avatar_chose" || p === "oracle_revealed" ? p : undefined;
  }, []);

  const [triad, setTriad] = useState<Triad | null>(null);
  const [phase, setPhase] = useState<Phase>("rising");
  const [chosenIdx, setChosenIdx] = useState<number | null>(null);

  // Compute triad once state is hydrated.
  useEffect(() => {
    if (!hydrated || triad) return;
    const t = drawTriad(state, { forceMode });
    setTriad(t);
    obs("cabinet_triad", { ids: t.triad.map((o) => o.id), mode: t.mode });
    // Record triad immediately so a refresh inside the visit doesn't re-pick the same one.
    update((s) => ({
      ...s,
      cabinet: { ...s.cabinet, recentTriads: pushRecentTriad(s.cabinet.recentTriads, t.triad.map((o) => o.id)) },
    }));
  }, [hydrated, triad, forceMode, state, update]);

  // Drive the phase timeline.
  useEffect(() => {
    if (!triad) return;
    const timers: number[] = [];
    // Rising: 3 cards × 250ms stagger + 1200ms each → ~1.95s total.
    timers.push(window.setTimeout(() => setPhase("held"), 2200));
    // Held: 2s oracle beat
    if (triad.mode === "avatar_chose") {
      timers.push(window.setTimeout(() => setPhase("awaiting"), 4200));
    } else {
      // Oracle stillness ~6s, then auto-illuminate. Then the Avatar may click the illuminated card to engage.
      timers.push(window.setTimeout(() => {
        const idx = (triad.forced ?? 0) as 0 | 1 | 2;
        setChosenIdx(idx);
        setPhase("illuminated");
      }, 4200 + 6000));
    }
    return () => timers.forEach(clearTimeout);
  }, [triad]);

  function chooseCard(idx: number) {
    if (!triad) return;
    if (phase === "awaiting") {
      setChosenIdx(idx);
      setPhase("flipped");
    } else if (phase === "illuminated" && idx === chosenIdx) {
      setPhase("flipped");
    }
  }

  function saveReflection(text: string, stored: boolean) {
    if (!triad || chosenIdx === null) return;
    const chosen = triad.triad[chosenIdx];
    const encounter: CabinetEncounter = {
      id: `e_${Date.now()}`,
      offeringId: chosen.id,
      offeringKind: chosen.kind,
      encounteredAt: Date.now(),
      triadIds: triad.triad.map((o) => o.id),
      mode: triad.mode,
      reflection: stored && text ? text : undefined,
      reflectionStored: Boolean(stored && text),
    };
    update((s) => ({
      ...s,
      cabinet: { ...s.cabinet, encounters: [encounter, ...s.cabinet.encounters] },
    }));
    obs("cabinet_encounter", { id: chosen.id, kind: chosen.kind, mode: triad.mode, stored: encounter.reflectionStored });
    setPhase("closed");
  }

  const chosen = chosenIdx !== null && triad ? triad.triad[chosenIdx] : null;
  const repeated = chosen
    ? state.cabinet.encounters.some((e) => e.offeringId === chosen.id)
    : false;

  return (
    <CabinetChamber>
      {/* Triad layout */}
      <AnimatePresence mode="wait">
        {triad && phase !== "flipped" && phase !== "reflection" && phase !== "closed" && (
          <motion.div
            key="triad"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6, ease: EXPO_OUT } }}
            className="flex flex-col items-center"
          >
            <div className="grid grid-cols-3 gap-4 md:gap-10 mt-4 mb-12">
              {triad.triad.map((o, i) => {
                let cardState: "facedown" | "illuminated" | "receded" | "flipped" = "facedown";
                if (phase === "illuminated") {
                  cardState = i === chosenIdx ? "illuminated" : "receded";
                }
                return (
                  <OfferingCard
                    key={o.id}
                    offering={o}
                    state={cardState}
                    index={i}
                    onSelect={() => chooseCard(i)}
                  />
                );
              })}
            </div>
            {/* Oracle copy */}
            <div className="h-16 text-center">
              {(phase === "held" || phase === "awaiting" || phase === "oracle_settle") && (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.2, ease: EXPO_OUT }}
                  className="text-parchment-dim italic text-sm md:text-base max-w-lg mx-auto"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  Three offerings have appeared. Choose by resonance, or wait for one to choose you.
                </motion.p>
              )}
              {phase === "illuminated" && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.0, ease: EXPO_OUT }}
                  className="text-gold italic text-sm md:text-base"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  This one has come for you.
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unfurled selection */}
      <AnimatePresence>
        {chosen && (phase === "flipped" || phase === "reflection") && (
          <motion.div
            key="panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: EXPO_OUT, delay: 0.4 }}
          >
            <OfferingPanel
              offering={chosen}
              repeated={repeated}
              onBodyComplete={() => setPhase("reflection")}
              bodySlot={
                chosen.kind === "vessel" ? (
                  <VesselPlayer
                    audioSrc={chosen.audioSrc}
                    durationSec={chosen.durationSec}
                    onReadyForReflection={() => setPhase("reflection")}
                  />
                ) : null
              }
            />
            {phase === "reflection" && (
              <div className="max-w-2xl mx-auto">
                <ReflectionField
                  privacyMode={state.privacyMode}
                  onSave={saveReflection}
                  onClose={() => saveReflection("", false)}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Closed */}
      <AnimatePresence>
        {phase === "closed" && (
          <motion.div
            key="closed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.0, ease: EXPO_OUT }}
            className="text-center py-12"
          >
            <p className="text-parchment-dim italic text-sm">The Cabinet will offer again.</p>
            <div className="mt-8 flex justify-center gap-8">
              <Link to="/gates" className="text-xs tracking-[0.3em] uppercase text-parchment-dim hover:text-gold transition-colors duration-500">
                return to the constellation
              </Link>
              <button
                onClick={() => { setTriad(null); setChosenIdx(null); setPhase("rising"); }}
                className="text-xs tracking-[0.3em] uppercase text-parchment-dim hover:text-gold transition-colors duration-500"
              >
                approach again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CabinetChamber>
  );
}
