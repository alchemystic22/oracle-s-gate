import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppState } from "../lib/useAppState";
import { obs } from "../lib/observation";
import { isDev } from "../lib/admin";
import { drawTriad, pushRecentTriad, type SelectionMode, type Triad } from "../lib/resonance";
import { CabinetChamber } from "../components/cabinet/CabinetChamber";
import { TransmissionObject, type TransmissionState } from "../components/cabinet/TransmissionObject";
import { OfferingPanel } from "../components/cabinet/OfferingPanel";
import { LyricsScroll } from "../components/cabinet/LyricsScroll";
import { ReflectionField } from "../components/cabinet/ReflectionField";
import { PhaseLabel } from "../components/cabinet/PhaseLabel";
import { MeasuredReveal } from "../components/MeasuredReveal";
import type { CabinetEncounter } from "../lib/state";

export const Route = createFileRoute("/cabinet")({
  head: () => ({
    meta: [
      { title: "The Ritual of Resonant Reading" },
      { name: "description", content: "An initiatory procedure to align with the right transmission, using intuition and archetype." },
    ],
  }),
  component: Cabinet,
});

const EXPO_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

type Phase =
  | "invocation"      // opening atmospheric copy + Begin the Rite
  | "reverence"       // chamber composes — Phase I
  | "consecration"    // transmissions rise, candle lights — Phase II
  | "ascertainment"   // resonance check; choose or be chosen — Phase III
  | "reception"       // transmission unfurls — Phase IV
  | "closed";         // post-keep — quiet line

type Mode = "avatar_chose" | "oracle_revealed";

function phaseCopy(phase: Phase, mode: Mode | null): { label: string; description: string } | null {
  switch (phase) {
    case "reverence":
      return {
        label: "PHASE I · REVERENCE",
        description: "Approach with humility. Acknowledge that what is here was transmitted.",
      };
    case "consecration":
      return {
        label: "PHASE II · CONSECRATION",
        description: "Light the inner candle. Place your attention on the heart.",
      };
    case "ascertainment":
      return {
        label: "PHASE III · ASCERTAINMENT",
        description:
          mode === "oracle_revealed"
            ? "Remain still. Allow the transmission to name you."
            : "Ask within: are you my guide? Feel for the wholeness response.",
      };
    case "reception":
      return {
        label: "PHASE IV · RECEPTION",
        description: "Receive the transmission. It came for you. Let it.",
      };
    default:
      return null;
  }
}

const INVOCATION_LINES = [
  "You have entered the Ritual of Resonant Reading.",
  "What is here was transmitted by those who walked the work before you. Some came as written word, some as song. The form does not matter. The frequency does.",
  "Three transmissions are present in this chamber. You will know yours by the wholeness it produces when you stand near it.",
  "Begin the rite when you are ready.",
];

function Cabinet() {
  const { state, update, hydrated } = useAppState();
  const nav = useNavigate();

  useEffect(() => {
    if (hydrated && !state.invocationCompletedAt && !isDev()) nav({ to: "/" });
  }, [hydrated, state.invocationCompletedAt, nav]);

  useEffect(() => { obs("cabinet_open"); }, []);

  const forceMode: SelectionMode | undefined = useMemo(() => {
    if (typeof window === "undefined" || !isDev()) return undefined;
    const p = new URLSearchParams(window.location.search).get("mode");
    return p === "avatar_chose" || p === "oracle_revealed" ? p : undefined;
  }, []);

  const [triad, setTriad] = useState<Triad | null>(null);
  const [phase, setPhase] = useState<Phase>("invocation");
  const [chosenIdx, setChosenIdx] = useState<number | null>(null);
  const [invocationDone, setInvocationDone] = useState(false);
  const [showBegin, setShowBegin] = useState(false);
  const [markedLyrics, setMarkedLyrics] = useState<string[]>([]);
  const [openingIdx, setOpeningIdx] = useState<number | null>(null);

  // Reveal the Begin button 5s after the invocation completes.
  useEffect(() => {
    if (!invocationDone) return;
    const t = window.setTimeout(() => setShowBegin(true), 5000);
    return () => clearTimeout(t);
  }, [invocationDone]);

  function beginRite() {
    if (!hydrated || triad) return;
    const t = drawTriad(state, { forceMode });
    setTriad(t);
    obs("cabinet_triad", { ids: t.triad.map((o) => o.id), mode: t.mode });
    update((s) => ({
      ...s,
      cabinet: { ...s.cabinet, recentTriads: pushRecentTriad(s.cabinet.recentTriads, t.triad.map((o) => o.id)) },
    }));
    setPhase("reverence");
  }

  // Phase I → II → III timeline.
  useEffect(() => {
    if (!triad) return;
    const timers: number[] = [];
    if (phase === "reverence") {
      // ~6s holding Phase I before consecration begins.
      timers.push(window.setTimeout(() => setPhase("consecration"), 6000));
    } else if (phase === "consecration") {
      // Transmissions rise (3 × 250ms stagger + ~1.2s each ≈ 1.95s). Hold ~3.5s after the last lands.
      timers.push(window.setTimeout(() => setPhase("ascertainment"), 3800));
    } else if (phase === "ascertainment" && triad.mode === "oracle_revealed") {
      // Oracle stillness ~6s, then illuminate.
      timers.push(window.setTimeout(() => {
        const idx = (triad.forced ?? 0) as 0 | 1 | 2;
        setChosenIdx(idx);
      }, 6000));
    }
    return () => timers.forEach(clearTimeout);
  }, [triad, phase]);

  function chooseCard(idx: number) {
    if (!triad || phase !== "ascertainment" || openingIdx !== null) return;
    const isAvatarPick = triad.mode === "avatar_chose";
    const isOracleConfirm = triad.mode === "oracle_revealed" && chosenIdx !== null && idx === chosenIdx;
    if (!isAvatarPick && !isOracleConfirm) return;
    // Set chosen now so it's stable for the panel mount; play the object's gesture
    // before the reception view replaces the triad. Vessels get a longer gesture
    // (~1.8s) than passages (~0.9s) — the object's gesture IS the transition.
    setChosenIdx(idx);
    setOpeningIdx(idx);
    const gestureMs = triad.triad[idx].kind === "vessel" ? 1800 : 900;
    window.setTimeout(() => {
      setPhase("reception");
      setOpeningIdx(null);
    }, gestureMs);
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
      markedLyrics,
    };
    update((s) => ({
      ...s,
      cabinet: { ...s.cabinet, encounters: [encounter, ...s.cabinet.encounters] },
    }));
    obs("cabinet_encounter", {
      id: chosen.id,
      kind: chosen.kind,
      mode: triad.mode,
      stored: encounter.reflectionStored,
      marked: markedLyrics.length,
    });
    setPhase("closed");
  }

  const chosen = chosenIdx !== null && triad ? triad.triad[chosenIdx] : null;
  const repeated = chosen
    ? state.cabinet.encounters.some((e) => e.offeringId === chosen.id)
    : false;
  const phaseLine = phaseCopy(phase, triad?.mode ?? null);
  const showCandle = phase === "consecration" || phase === "ascertainment" || phase === "reception";

  // INVOCATION SCREEN — pre-rite atmosphere.
  if (phase === "invocation") {
    return (
      <CabinetChamber
        title="The Ritual of Resonant Reading"
        subtitle="An initiatory procedure to align with the right transmission, using intuition and archetype."
      >
        <div className="max-w-2xl mx-auto pt-4">
          <MeasuredReveal
            paragraphs={INVOCATION_LINES}
            step={2200}
            tail={1500}
            onComplete={() => setInvocationDone(true)}
            className="text-parchment text-lg md:text-xl leading-relaxed text-center italic"
          />
          <AnimatePresence>
            {showBegin && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, ease: EXPO_OUT }}
                className="mt-12 text-center"
              >
                <button
                  onClick={beginRite}
                  className="ritual-button px-8 py-3 rounded-sm text-sm tracking-[0.3em] uppercase"
                >
                  Begin the Rite
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CabinetChamber>
    );
  }

  return (
    <CabinetChamber candleLit={showCandle}>
      {phaseLine && (
        <PhaseLabel phaseKey={phase} label={phaseLine.label} description={phaseLine.description} />
      )}

      {/* Triad layout — visible from consecration through ascertainment. */}
      <AnimatePresence mode="wait">
        {triad && (phase === "reverence" || phase === "consecration" || phase === "ascertainment") && (
          <motion.div
            key="triad"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6, ease: EXPO_OUT } }}
            className="flex flex-col items-center"
          >
            {/* Reverence: the chamber composes; transmissions have not yet risen. */}
            {phase === "reverence" ? (
              <div className="h-[280px] md:h-[340px]" aria-hidden />
            ) : (
              <div className="grid grid-cols-3 gap-6 md:gap-14 mt-2 mb-12 items-end">
                {triad.triad.map((o, i) => {
                  let objState: TransmissionState = "present";
                  if (openingIdx !== null) {
                    objState = i === openingIdx ? "opening" : "receded";
                  } else if (phase === "ascertainment" && chosenIdx !== null && triad.mode === "oracle_revealed") {
                    objState = i === chosenIdx ? "illuminated" : "receded";
                  }
                  return (
                    <TransmissionObject
                      key={o.id}
                      offering={o}
                      state={objState}
                      index={i}
                      onSelect={() => chooseCard(i)}
                    />
                  );
                })}
              </div>
            )}
            {/* Oracle revelation line, when applicable. */}
            {phase === "ascertainment" && chosenIdx !== null && triad.mode === "oracle_revealed" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.0, ease: EXPO_OUT }}
                className="text-gold italic text-lg md:text-xl"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                This one has come for you.
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reception — transmission unfurls */}
      <AnimatePresence>
        {chosen && phase === "reception" && (
          <motion.div
            key="panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: EXPO_OUT, delay: 0.4 }}
          >
            <OfferingPanel
              offering={chosen}
              repeated={repeated}
              onBodyComplete={chosen.kind === "passage" ? undefined : undefined}
              bodySlot={
                chosen.kind === "vessel" ? (
                  <LyricsScroll
                    vessel={chosen}
                    onMark={(i) => {
                      setMarkedLyrics((prev) => prev.includes(chosen.lyrics[i]) ? prev : [...prev, chosen.lyrics[i]]);
                    }}
                    onComplete={() => { /* reflection field shown below regardless */ }}
                  />
                ) : null
              }
            />
            <div className="max-w-2xl mx-auto">
              <ReflectionField
                privacyMode={state.privacyMode}
                seedLines={markedLyrics}
                onSave={saveReflection}
                onClose={() => saveReflection("", false)}
              />
            </div>
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
            <p className="text-parchment-dim italic text-lg md:text-xl" style={{ fontFamily: "var(--font-serif)" }}>
              The chamber will offer again.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-x-10 gap-y-3">
              <Link to="/gates" className="text-sm tracking-[0.2em] uppercase text-parchment-dim hover:text-gold transition-colors duration-500">
                return to the constellation
              </Link>
              <button
                onClick={() => {
                  setTriad(null); setChosenIdx(null); setMarkedLyrics([]);
                  setInvocationDone(false); setShowBegin(false); setPhase("invocation");
                }}
                className="text-sm tracking-[0.2em] uppercase text-parchment-dim hover:text-gold transition-colors duration-500"
              >
                approach the chamber again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CabinetChamber>
  );
}
