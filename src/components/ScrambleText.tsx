import { useEffect, useRef, useState } from "react";

const POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789☿☉☽✦†⌖";
const SCRAMBLE_FRAMES = 8; // glyph cycles per letter before locking
const STAGGER_MS = 30;
const FRAME_MS = 45;

function randGlyph() {
  return POOL[Math.floor(Math.random() * POOL.length)];
}

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

type LetterState = { settled: boolean; framesLeft: number; startAt: number };

export function ScrambleText({
  value,
  className = "",
  emphasizeToken,
}: {
  value: string;
  className?: string;
  emphasizeToken?: string;
}) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const statesRef = useRef<LetterState[]>([]);
  const targetRef = useRef<string>(value);

  useEffect(() => {
    targetRef.current = value;

    if (prefersReducedMotion()) {
      setDisplay(value);
      return;
    }

    const target = value;
    const maxLen = Math.max(display.length, target.length);
    statesRef.current = Array.from({ length: maxLen }, (_, i) => ({
      settled: false,
      framesLeft: SCRAMBLE_FRAMES + Math.floor(Math.random() * 4),
      startAt: i * STAGGER_MS,
    }));
    startRef.current = performance.now();

    let lastTick = 0;
    const tick = (now: number) => {
      if (targetRef.current !== target) return; // superseded
      if (now - lastTick < FRAME_MS) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      lastTick = now;
      const elapsed = now - startRef.current;
      const states = statesRef.current;
      let allSettled = true;
      const chars: string[] = [];
      for (let i = 0; i < maxLen; i++) {
        const targetChar = target[i] ?? "";
        const st = states[i];
        if (elapsed < st.startAt) {
          // not started yet — show old char if exists, else blank
          chars.push(display[i] ?? "");
          allSettled = false;
          continue;
        }
        if (st.settled) {
          chars.push(targetChar);
          continue;
        }
        if (targetChar === " ") {
          st.settled = true;
          chars.push(" ");
          continue;
        }
        if (targetChar === "") {
          st.settled = true;
          chars.push("");
          continue;
        }
        st.framesLeft -= 1;
        if (st.framesLeft <= 0) {
          st.settled = true;
          chars.push(targetChar);
        } else {
          chars.push(randGlyph());
          allSettled = false;
        }
      }
      setDisplay(chars.join(""));
      if (!allSettled) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Emphasize a token (e.g. "YOUR") if present in the settled value
  const settled = display === value;
  if (settled && emphasizeToken && value.includes(emphasizeToken)) {
    const idx = value.indexOf(emphasizeToken);
    const before = value.slice(0, idx);
    const after = value.slice(idx + emphasizeToken.length);
    return (
      <span className={className} style={{ display: "inline-block" }}>
        {before}
        <span key={`emph-${value}`} className="your-emphasis">
          {emphasizeToken}
        </span>
        {after}
      </span>
    );
  }

  return (
    <span className={className} style={{ display: "inline-block", whiteSpace: "pre" }}>
      {display}
    </span>
  );
}
