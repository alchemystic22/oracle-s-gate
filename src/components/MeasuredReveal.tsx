import { useEffect, useState, type ReactNode } from "react";

type Props = {
  paragraphs: ReactNode[];
  /** ms between paragraph starts */
  step?: number;
  /** ms after last paragraph before onComplete fires */
  tail?: number;
  onComplete?: () => void;
  className?: string;
};

/** Measured-beats reveal: each paragraph fades in (1s), staggered by `step`. Not a typewriter. */
export function MeasuredReveal({ paragraphs, step = 1400, tail = 5000, onComplete, className }: Props) {
  const [shown, setShown] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setShown(0); setDone(false);
    const timers: number[] = [];
    paragraphs.forEach((_, i) => {
      timers.push(window.setTimeout(() => setShown(i + 1), i * step));
    });
    const total = (paragraphs.length - 1) * step + 1000 + tail;
    timers.push(window.setTimeout(() => { setDone(true); onComplete?.(); }, total));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paragraphs.length]);

  return (
    <div className={className}>
      {paragraphs.map((p, i) => (
        <p
          key={i}
          className="measured-fade mb-8 leading-relaxed text-xl md:text-2xl"
          style={{ animationDelay: `${i * step}ms`, visibility: i < shown ? "visible" : "hidden", fontFamily: "'Cormorant Garamond', serif" }}
        >
          {p}
        </p>
      ))}
      {!done && <div aria-hidden className="sr-only">…</div>}
    </div>
  );
}
