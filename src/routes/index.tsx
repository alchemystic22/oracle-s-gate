import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MatrixTypewriter } from "../components/MatrixTypewriter";
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
  "What you are entering is not an experience. It is a structure that has held seekers for as long as there have been seekers. The Codex does not unfold at the speed of devices. It unfolds at the speed of the soul.",
  "Move forward at the pace your heart whispers, not as your mind may loudly declare.",
  "The Gates are not levels. They are thresholds. Some Avatars cross one in an hour. Some cross one in a year. Both are right. Neither is delay.",
  "Begin only when you are willing to walk this without performance. Otherwise, return when you are.",
];

function Invocation() {
  const nav = useNavigate();
  const { state, update, hydrated } = useAppState();
  const [ready, setReady] = useState(false);

  useEffect(() => { obs("invocation_open"); }, []);

  const alreadyEntered = hydrated && !!state.invocationCompletedAt;

  return (
    <>
      <main className="min-h-screen text-parchment flex items-center justify-center px-6 py-20">
        <div className="max-w-3xl w-full">
          <header className="mb-16 text-center">
            <p className="text-parchment-dim text-sm tracking-[0.4em] uppercase">Alchemystic Oracle</p>
            <h1 className="mt-4 text-5xl md:text-6xl text-gold tracking-wide" style={{ fontFamily: "'Cinzel', serif" }}>The Seven Gates</h1>
            <div className="mt-8 h-px w-32 mx-auto bg-gold-aged opacity-50" />
          </header>

          <MatrixTypewriter
            paragraphs={PARAGRAPHS}
            onComplete={() => setReady(true)}
            className="min-h-[14rem] md:min-h-[16rem]"
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
      <div className="crt-vignette" aria-hidden />
      <div className="crt-scanlines" aria-hidden />
    </>
  );
}

