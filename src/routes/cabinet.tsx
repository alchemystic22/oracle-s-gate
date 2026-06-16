import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { drawNextPassageId, passageById } from "../data/cabinet";
import { useAppState } from "../lib/useAppState";
import { RitualButton } from "../components/RitualButton";
import { MeasuredReveal } from "../components/MeasuredReveal";
import { obs } from "../lib/observation";

function applyPrivacy(text: string, mode: string): string | null {
  if (mode === "completion_marker_only") return null;
  if (mode === "do_not_store_after_refresh") return null;
  return text;
}

export const Route = createFileRoute("/cabinet")({
  head: () => ({ meta: [{ title: "The Reading Cabinet" }] }),
  component: Cabinet,
});

function Cabinet() {
  const { state, update, hydrated } = useAppState();
  const nav = useNavigate();
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [reflection, setReflection] = useState("");

  useEffect(() => {
    if (hydrated && !state.invocationCompletedAt) nav({ to: "/" });
  }, [hydrated, state.invocationCompletedAt, nav]);

  useEffect(() => { obs("cabinet_open"); }, []);

  function draw() {
    const id = drawNextPassageId(state.cabinet.drawnPassageIds);
    setCurrentId(id);
    setRevealed(true);
    setReflection("");
    update((s) => ({ ...s, cabinet: { ...s.cabinet, drawnPassageIds: [...s.cabinet.drawnPassageIds, id] } }));
    obs("cabinet_draw", { id });
  }

  const passage = currentId ? passageById(currentId) : null;

  return (
    <main className="min-h-screen text-parchment px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-10">
          <p className="text-parchment-dim text-xs tracking-[0.4em] uppercase">The Reading Cabinet</p>
          <h1 className="mt-2 text-2xl text-gold">A passage will be drawn.</h1>
          <p className="mt-3 text-parchment-dim text-sm max-w-md mx-auto italic">
            You will not see the titles. You will receive what arrives.
          </p>
          <div className="mt-6 h-px w-16 mx-auto bg-gold-aged opacity-40" />
        </header>

        {!passage && (
          <div className="text-center mt-12">
            <RitualButton onClick={draw}>draw a passage</RitualButton>
            <p className="mt-6 text-parchment-dim text-xs">
              {state.cabinet.drawnPassageIds.length} drawn before
            </p>
          </div>
        )}

        {passage && revealed && (
          <article className="grimoire-panel rounded-sm p-8 md:p-12">
            <MeasuredReveal
              paragraphs={[passage.body]}
              step={1400}
              tail={3000}
              className="text-parchment"
            />
            <div className="mt-10 pt-6 border-t border-gold-aged/20">
              <p className="text-gold-aged text-xs tracking-widest uppercase mb-3">If you wish, write what arrives.</p>
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                rows={4}
                className="w-full bg-obsidian border border-bronze/40 rounded-sm p-3 text-parchment placeholder:text-parchment-dim/60 focus:outline-none focus:border-gold-aged text-sm"
                placeholder="Optional."
              />
              <div className="mt-4 flex items-center justify-between">
                <span className="text-parchment-dim text-xs">Privacy: {state.privacyMode.replace("_"," ")}</span>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setCurrentId(null); setReflection(""); }}
                    className="text-parchment-dim hover:text-parchment text-xs tracking-widest uppercase"
                  >close</button>
                  <button
                    onClick={() => {
                      if (reflection.trim()) {
                        const rid = `r_${Date.now()}`;
                        const stored = applyPrivacy(reflection.trim(), state.privacyMode);
                        update((s) => ({ ...s, cabinet: { ...s.cabinet, reflectionIds: [...s.cabinet.reflectionIds, rid] } }));
                        obs("cabinet_reflection", { mode: state.privacyMode, len: reflection.trim().length, stored: stored?.length ?? 0 });
                      }
                      setCurrentId(null); setReflection("");
                    }}
                    className="text-gold-aged hover:text-gold text-xs tracking-widest uppercase"
                  >keep</button>
                </div>
              </div>
            </div>
          </article>
        )}

        <div className="mt-16 text-center">
          <Link to="/gates" className="text-xs tracking-widest uppercase text-parchment-dim hover:text-gold">return to the constellation</Link>
        </div>
      </div>
    </main>
  );
}
