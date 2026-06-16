## Goal

Elevate the title sequence from a soft opacity crossfade into a cinematic, Matrix-aligned ritual that ends by quietly tugging the viewer's eye down to the **I am ready to begin** button — an unspoken invitation that The Seven Gates await their choice.

---

## 1. New transition: per-letter glitch-scramble

Replace the 600ms opacity fade on the tail word(s) with a Matrix-style scramble that visually rhymes with the typewriter above it.

- New component `ScrambleText` (in `src/components/ScrambleText.tsx`) renders a target string and, whenever the target changes, animates each character through ~6–10 random glyphs from a curated set (Latin caps, digits, a few alchemical/runic glyphs: ☿ ☉ ☽ ✦ † ⌖) before locking to the final character.
- Per-letter stagger: ~25ms between letters starting their scramble; each letter settles after ~350–500ms. Total transition ≈ 600–900ms depending on word length.
- While scrambling, glyphs render in a slightly desaturated gold; on lock-in they snap to full `text-gold` with a one-frame brightness pulse — feels like the word "decides" itself.
- "The " stays governed by `hideThe` as today (instant visibility toggle), so the S anchor never shifts.
- Respect `prefers-reduced-motion`: skip scrambling, just swap text instantly.

## 2. Breathing pacing

Re-tune `TITLE_SEQUENCE` waits so the reveal accelerates into the personal turn, then hesitates:

| Step | Text | Wait | Why |
|---|---|---|---|
| 0 | The Seven Gates | 20s | unchanged — matches Matrix completion beat |
| 1 | _Seven Gates_ (The hidden) | **8s** | longer hold; viewer registers "something changed" |
| 2 | One Outcome | 3s | tight — momentum building |
| 3 | One Blueprint | 3s | tight |
| 4 | **YOUR** Blueprint | **6s** | emotional payload, deserves room |
| 4.5 | _(blank tail, "The" hidden)_ | **1.2s** | **the hesitation** — a held breath before the return |
| 5 | The Seven Gates | — | snap back; the ritual completes |

The 1.2s blank is implemented as a sixth sequence entry with `tail: ""` so the scrambler animates letters _away_ into nothing, then back in for step 5.

## 3. Emphasis on YOUR

- "YOUR" renders inside its own span with a one-shot animation on entry: scale 1 → 1.06 → 1.0 over 700ms, plus a brief gold drop-shadow pulse (`filter: drop-shadow(0 0 14px hsl(43 85% 60% / 0.7))` fading to 0).
- Letter-spacing widens by ~0.04em while emphasized, then relaxes. Makes the personal pivot unmistakable without being loud.

## 4. Subliminal button pull at the end

The real payoff: as the title returns to "The Seven Gates" (step 5), attention should drift downward to the CTA.

- Add a `titleCycleDone` state, set true when step 5 lands.
- When true, `RitualButton` receives a `summoning` prop that enables:
  - A slow gold breathing pulse: `box-shadow` / outer glow oscillating between `0 0 0` and `0 0 28px hsl(43 85% 60% / 0.45)` on a 2.6s ease-in-out loop.
  - A barely-perceptible 1.0 → 1.015 → 1.0 scale on the same cadence.
  - A single-pass shimmer sweep (diagonal gold gradient) across the button face every ~6s.
- All pulse effects are gated by `prefers-reduced-motion` (replaced by a static, slightly brighter border).
- The pulse never stops while the user remains on the page — it is the unspoken reminder that the Gates await their choice.

## 5. Files touched

- **new** `src/components/ScrambleText.tsx` — the per-letter scrambler (props: `value: string`, `className?`, `charPool?`, `onSettled?`).
- **edit** `src/routes/index.tsx`
  - Insert step 4.5 (`tail: ""`, 1.2s) into `TITLE_SEQUENCE`; retune waits as above.
  - Replace the inline tail `<span>` with `<ScrambleText value={current.tail} />`.
  - Wrap `YOUR ` detection inside `ScrambleText`'s render so that token gets the emphasis treatment when present.
  - Track `titleCycleDone` and pass `summoning={titleCycleDone}` to `RitualButton`.
- **edit** `src/components/RitualButton.tsx` — accept `summoning?: boolean`; when true, apply the breathing-glow + shimmer classes.
- **edit** `src/styles.css` — add keyframes: `summon-breath`, `summon-shimmer`, `your-pulse`; add `.summoning` utility; honor `@media (prefers-reduced-motion)`.

## 6. Technical notes

- Scrambler uses a single `requestAnimationFrame` loop keyed to `value`; on unmount or value change mid-flight it cancels cleanly. Each character holds its own `{ settled: boolean, remaining: number }` state in a ref array — no per-char React renders.
- Char pool excludes whitespace; spaces in the target string stay as spaces throughout the animation so word shape is preserved.
- The S-anchor invariant (no horizontal jitter when "The " hides) is preserved because `ScrambleText` only governs the tail span; the `hideThe` visibility toggle stays on the leading "The " span exactly as today.
- No business-logic / route / state changes beyond the title sequence and button visual prop.
