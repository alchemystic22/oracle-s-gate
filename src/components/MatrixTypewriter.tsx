import { useEffect, useRef, useState } from "react";

type Props = {
  paragraphs: string[];
  onComplete?: () => void;
  className?: string;
  /** ms */
  minKey?: number;
  maxKey?: number;
  /** pause after a phrase finishes, before screen clear */
  holdMs?: number;
  /** extra pause after sentence-ending punctuation */
  sentencePause?: number;
};

/**
 * Matrix-style terminal typewriter.
 * - Types one char at a time with uneven cadence.
 * - Pauses on sentence punctuation.
 * - Holds the finished phrase, clears the screen, then types the next.
 * - Cursor blinks uniformly throughout (typing AND pauses).
 */
export function MatrixTypewriter({
  paragraphs,
  onComplete,
  className,
  minKey = 35,
  maxKey = 95,
  holdMs = 2200,
  sentencePause = 700,
}: Props) {
  const [text, setText] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [done, setDone] = useState(false);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    let timeout: number | undefined;

    const typePhrase = (phrase: string, onPhraseDone: () => void) => {
      let i = 0;
      setText("");
      const tick = () => {
        if (cancelled.current) return;
        if (i >= phrase.length) {
          timeout = window.setTimeout(onPhraseDone, holdMs);
          return;
        }
        const ch = phrase[i];
        i += 1;
        setText(phrase.slice(0, i));
        let delay = minKey + Math.random() * (maxKey - minKey);
        if (/[.!?]/.test(ch) && i < phrase.length) delay += sentencePause;
        else if (/[,;:—]/.test(ch)) delay += 220;
        timeout = window.setTimeout(tick, delay);
      };
      tick();
    };

    const runFrom = (idx: number) => {
      if (cancelled.current) return;
      if (idx >= paragraphs.length) {
        setDone(true);
        onComplete?.();
        return;
      }
      setPhraseIdx(idx);
      typePhrase(paragraphs[idx], () => runFrom(idx + 1));
    };

    runFrom(0);
    return () => {
      cancelled.current = true;
      if (timeout) clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paragraphs.length]);

  return (
    <div className={className}>
      <pre
        className="matrix-text whitespace-pre-wrap break-words m-0"
        style={{
          fontFamily: "'Bebas Neue', 'Inter', system-ui, sans-serif",
        }}
      >
        {done ? paragraphs[paragraphs.length - 1] : text}
        <span className="matrix-cursor" aria-hidden />
      </pre>
      <span className="sr-only">{paragraphs[phraseIdx]}</span>
    </div>
  );
}
