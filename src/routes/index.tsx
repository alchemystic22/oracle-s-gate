import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MatrixTypewriter } from "../components/MatrixTypewriter";
import { RitualButton } from "../components/RitualButton";
import { ScrambleText } from "../components/ScrambleText";
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

// Title sequence — last entry's `wait` is unused; the cycle ends on it.
const TITLE_SEQUENCE: { hideThe: boolean; tail: string; wait: number }[] = [
  { hideThe: false, tail: "Seven Gates",   wait: 20000 }, // 0 — The Seven Gates
  { hideThe: true,  tail: "Seven Gates",   wait: 8000  }, // 1 — Seven Gates (The hidden)
  { hideThe: true,  tail: "One Outcome",   wait: 3000  }, // 2
  { hideThe: true,  tail: "One Blueprint", wait: 3000  }, // 3
  { hideThe: true,  tail: "YOUR Blueprint",wait: 6000  }, // 4 — emphasis
  { hideThe: true,  tail: "",              wait: 1200  }, // 5 — hesitation
  { hideThe: false, tail: "Seven Gates",   wait: 0     }, // 6 — return
];

function Invocation() {
  const nav = useNavigate();
  const { state, update, hydrated } = useAppState();
  const [ready, setReady] = useState(false);
  const [titleStep, setTitleStep] = useState(0);
  const [titleCycleDone, setTitleCycleDone] = useState(false);

  useEffect(() => { obs("invocation_open"); }, []);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const advance = (i: number) => {
      if (cancelled || i >= TITLE_SEQUENCE.length - 1) {
        if (!cancelled) setTitleCycleDone(true);
        return;
      }
      timer = setTimeout(() => {
        if (cancelled) return;
        const next = i + 1;
        setTitleStep(next);
        if (next === TITLE_SEQUENCE.length - 1) {
          // landed on final step — begin the subliminal pull
          setTitleCycleDone(true);
        }
        advance(next);
      }, TITLE_SEQUENCE[i].wait);
    };
    advance(0);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [ready]);

  const alreadyEntered = hydrated && !!state.invocationCompletedAt;
  const current = TITLE_SEQUENCE[titleStep];

  return (
    <>
      <main className="min-h-screen text-parchment flex items-center justify-center px-6 py-20">
        <div className="max-w-3xl w-full">
          <header className="mb-16 text-center">
            <p className="text-parchment-dim text-[1.3125rem] tracking-[0.4em] uppercase">Alchemystic Oracle</p>
            <h1 className="mt-4 text-5xl md:text-6xl text-gold tracking-wide" style={{ fontFamily: "'Cinzel', serif" }}>
              <span className="inline-block">
                <span style={{ visibility: current.hideThe ? "hidden" : "visible" }}>The </span>
                <ScrambleText value={current.tail} emphasizeToken="YOUR" />
              </span>
            </h1>
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
              summoning={ready && titleCycleDone}
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
    </>
  );
}

