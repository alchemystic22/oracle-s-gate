import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MeasuredReveal } from "../components/MeasuredReveal";
import { RitualButton } from "../components/RitualButton";
import { useAppState } from "../lib/useAppState";
import { obs } from "../lib/observation";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Alchemystic Oracle's Seven Gates" },
      { name: "description", content: "Invocation." },
    ],
  }),
  component: Invocation,
});

const PARAGRAPHS = [
  "You have arrived at a threshold. Not a course. Not a dashboard. Not a place that will hurry you.",
  "Seven gates wait. You will only see the one in front of you. The others are not hidden from you — they are not yet relevant to you.",
  "There will be silences. There will be pauses you cannot skip. The pacing is the work.",
  "If you are here to be entertained, leave now, kindly. If you are here to be witnessed, enter slowly.",
];

function Invocation() {
  const nav = useNavigate();
  const { state, update, hydrated } = useAppState();
  const [ready, setReady] = useState(false);

  useEffect(() => { obs("invocation_open"); }, []);

  // If already past invocation, surface a soft re-entry link but still allow re-reading.
  const alreadyEntered = hydrated && !!state.invocationCompletedAt;

  return (
    <main className="min-h-screen text-parchment flex items-center justify-center px-6 py-20">
      <div className="max-w-2xl w-full">
        <header className="mb-12 text-center">
          <p className="text-parchment-dim text-xs tracking-[0.4em] uppercase">Alchemystic Oracle</p>
          <h1 className="mt-3 text-3xl md:text-4xl text-gold tracking-wide">The Seven Gates</h1>
          <div className="mt-6 h-px w-24 mx-auto bg-gold-aged opacity-50" />
        </header>

        <MeasuredReveal
          paragraphs={PARAGRAPHS}
          step={1500}
          tail={5000}
          onComplete={() => setReady(true)}
          className="text-parchment"
        />

        <div className="mt-16 flex flex-col items-center">
          <RitualButton
            disabled={!ready}
            onClick={() => {
              const now = Date.now();
              update((s) => ({ ...s, invocationCompletedAt: s.invocationCompletedAt ?? now }));
              obs("invocation_accept");
              nav({ to: "/gates" });
            }}
          >
            I am ready to begin
          </RitualButton>
          {alreadyEntered && (
            <button
              onClick={() => nav({ to: "/gates" })}
              className="mt-8 text-xs tracking-widest uppercase text-parchment-dim hover:text-parchment"
            >
              return to the constellation
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
