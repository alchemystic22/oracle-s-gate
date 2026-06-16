# The Ritual of Resonant Reading — Upgrade Pass

Route stays at `/cabinet`. Every Avatar-facing surface is renamed and reframed. Internal data model (`Offering`, `Triad`, `Passage`, `Vessel`, `kind`, `drawTriad`, `scoreOffering`, `recentTriads`) is unchanged — additive fields only.

## Phase 1 — Generate the chamber image

Use `imagegen--generate_image` with `model: "premium"`, 1920×1080, target `/public/assets/rooms/resonant-reading-chamber.jpg`. Prompt as supplied: ancient stone reading chamber, carved alchemical sigils in floor radiating from center, vertical stone walls with subtle runic engravings, single warm gold light source from right, heavy stone altar at center, dust in light, cinematic depth of field, photographic, no people, no books. After generation, inspect with `code--view` (image preview) to confirm: visible central altar surface where transmissions will rise, warm light not cool, no text/letters baked in, no human figures.

If first generation misses the altar or comes out illustrated, regenerate with refined prompt. Budget: max 2 generations.

## Phase 2 — Data model extensions (additive only)

`src/data/cabinet.ts`:
- Extend `Vessel` type: add `lyrics: string[]`, `illuminationOrder: number[]` (indices into lyrics).
- Extend `Passage` type: add optional `source?: { title: string; canonical: true }`.
- Add 6 canonical-text entries as `Passage` records with `source` set to each of the six titles (Corpus Hermeticum, Kybalion, Aurora Consurgens, Suggestive Inquiry, Picatrix, Way of Kabbalah). Body text: placeholder mystical-voice passages, ~3-5 lines each, `placeholder: true`. Title hidden until reception.
- For all 15 existing vessels: add `lyrics` (6-12 placeholder lines per track, same voice register) and `illuminationOrder` (3-4 indices marking the lines that surface for contemplation).

`src/lib/state.ts`:
- `CabinetEncounter` gains `markedLyrics: string[]`.
- v3→v4 migration: backfill `markedLyrics: []` on existing encounters. Preserves all prior state (journals, gate progress, witness cards, grace marks, recentTriads).

## Phase 3 — Phase-frame state machine

New ritual phase enum in `cabinet.tsx`:
```ts
type Phase = 'invocation' | 'reverence' | 'consecration' | 'ascertainment' | 'reception';
```

- `invocation`: opening atmospheric copy + "Begin the Rite" button. Click → `reverence`.
- `reverence` (~6s): chamber composes, PhaseLabel shows, then auto-advances.
- `consecration` (~3-4s): transmissions rise from altar (staggered ease-out, existing animation), candle glyph lights at front edge of altar. Auto-advances to `ascertainment` when last transmission has settled.
- `ascertainment`: PhaseLabel + transmissions interactive. avatar_chose → hover-warmth on transmissions; oracle_revealed → 6s stillness, then one illuminates with Oracle line, others recede. Selection → `reception`.
- `reception`: transmission unfurls (existing measured-beat reveal). For passages: parchment page with body + source title revealed. For vessels: `LyricsScroll` renders, audio auto-plays low. Reflection field opens after content settles or marked-line interaction.

## Phase 4 — New components

**`src/components/cabinet/PhaseLabel.tsx`**
- Props: `phase: Phase`, `label: string`, `description: string`.
- Renders small-caps phase line (e.g. *PHASE III — ASCERTAINMENT*) in `text-gold-aged/70`, single descriptive sentence beneath in same tone.
- 800ms cross-fade between phases via key-based remount.

**`src/components/cabinet/LyricsScroll.tsx`** (replaces `VesselPlayer.tsx` — file renamed)
- Props: `vessel: Vessel`, `onMark: (lineIndex: number) => void`, `onComplete: (markedLyrics: string[]) => void`.
- Parchment styling (`.parchment-scroll` class), serif type, ample line-height.
- `useEffect` walks `illuminationOrder` at ~10s intervals: each iteration sets `illuminatedIndex` for 3.5s with `text-gold` + warm halo, then clears.
- Clicking an illuminated line: pushes to `marked: Set<number>`, line stays gold permanently, calls `onMark`.
- Audio: `<audio>` element, autoplay at 0.4 volume, small unobtrusive play/pause icon-button lower-right of scroll. No scrubber, no time display.
- After audio ends OR 60s elapsed: calls `onComplete(markedLines)` — surfaces marked lines as seed text for reflection.

## Phase 5 — Rewrite `CabinetChamber.tsx`

- Full-bleed `<img src="/assets/rooms/resonant-reading-chamber.jpg">` as base layer (or CSS `background-image` on the outer wrapper).
- Cosmic backdrop + starfield: opacity reduced to ~25%.
- Sacred geometry: **frozen** (no rotation), opacity ~20%, reads as carved-overlay engraving on the room. (Per my recommendation in option (b) above — confirm or override.)
- CornerBrackets: opacity ~40%.
- Transmissions positioned to rise from the central altar in the image (tune `top` / vertical offset to land them on the altar surface, not floating in mid-air).
- Candle glyph: small SVG flame anchored at front edge of altar, gentle 4s opacity flicker (CSS keyframes, no bounce). Appears in `consecration`, persists through `reception`.

## Phase 6 — Rewrite `cabinet.tsx` route

- Replace current header with the invocation block (existing `MeasuredReveal` cadence):
  > *You have entered the Ritual of Resonant Reading.*
  > *What is here was transmitted by those who walked the work before you. Some came as written word, some as song. The form does not matter. The frequency does.*
  > *Three transmissions are present in this chamber. You will know yours by the wholeness it produces when you stand near it.*
  > *Begin the rite when you are ready.*
- "Begin the Rite" button fades in 5s after final line.
- Phase state machine drives `<PhaseLabel>` + `<CabinetChamber>` content.
- Page H1 (visible at top, or in document head): **The Ritual of Resonant Reading**.
- Subtitle: *An initiatory procedure to align with the right transmission, using intuition and archetype.*

## Phase 7 — Rewrite `OfferingPanel.tsx`

- Replaces "Three offerings have appeared..." copy with: *"Three transmissions are present. Allow your instinct to draw you toward the one whose resonance is yours. Or remain still until one names you."*
- Oracle reveal line: *"This one has come for you."*
- Repeat-encounter copy:
  - Passages: *"This transmission has come to you before. You are not the same person who first received it."*
  - Vessels: *"This transmission returns. It has more to give you."*
- Hover state on transmissions: warm pulse from glyph (existing animation, retuned — slow warm fade in/out, not a UI hover-glow).

## Phase 8 — Avatar-facing copy sweep

`rg -n` for any Avatar-visible occurrence of: `cabinet`, `card`, `draw`, `deck`, `offering` (Avatar-facing only — keep in types/dev tools). Replace with: `chamber`, `transmission`, `rite`. Includes:
- Constellation footer link in `src/routes/gates.tsx` (or `gates.index.tsx`): "The Reading Cabinet" → **"The Ritual of Resonant Reading."**
- Any tooltips, dev banners (`?dev=1` chrome unchanged — that's dev tooling), error messages visible to Avatar.

Internal: `OFFERINGS`, `drawTriad`, `Triad`, `kind: 'passage' | 'vessel'`, file/component names like `OfferingCard.tsx` — unchanged.

## Phase 9 — Styles

`src/styles.css` additions:
- `.parchment-scroll`: yellowed off-white background (`oklch` warm), subtle vignette/curl shadow at edges (box-shadow inset + drop-shadow), serif font-family from existing stack, line-height ~1.9, padding generous.
- `.phase-label`: small-caps, letter-spacing `0.25em`, `text-gold-aged/70`, `text-xs md:text-sm`.
- `.candle-flame`: flicker keyframe (opacity 0.7 ↔ 1.0 over 4s, ease-in-out, infinite).
- `.illuminated-line`: `color: var(--gold)`, `text-shadow: 0 0 12px color-mix(in oklab, var(--gold) 40%, transparent)`, 600ms transition.

## Phase 10 — Verification

- `code--view` the generated chamber image to confirm altar is visible and warm.
- `rg -n "Reading Cabinet|cabinet drawer|offerings have appeared|This passage has come"` returns empty for Avatar-facing strings.
- Walk both modes: `/cabinet?dev=1&mode=avatar_chose` and `/cabinet?dev=1&mode=oracle_revealed`. Confirm phase labels cross-fade, candle appears in Phase II, parchment scroll renders for vessel selection with audio at low volume, marked-line flow seeds reflection field.
- Confirm v3→v4 state migration runs cleanly (preserves prior encounters, backfills `markedLyrics: []`).
- Confirm `drawTriad` still composes passages + vessels from one pool — `kind` never read in scoring.

## Out of scope

- Replacing 15 silent placeholder mp3s with Suno masters.
- Finalizing canonical six text bodies (project owner refines).
- Wiring `markedLyrics` into Phase 2 observation analytics.
- Sovereign Action Layer (untouched this pass).
- Gate 2 wiring (still held).

## Open question for confirmation

**Sacred-geometry overlay over the room: freeze static (option b, my recommendation) or slow rotation at 15-20% opacity (option a)?** Awaiting your call before Phase 5 implementation.
