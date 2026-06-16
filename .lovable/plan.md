# Readability Pass — Cabinet & Sovereign

Goal: keep the ritual / classy register, but stop the eye-strain. No layout, logic, or color changes — purely typographic scale, weight, and spacing.

## Guiding scale (replaces the current micro-type)

| Role | Current | New |
|---|---|---|
| Page H1 (serif) | `text-2xl` | `text-4xl md:text-5xl` |
| Section H2 (eyebrow caps) | `text-[10px] tracking-[0.4em]` | `text-xs md:text-sm tracking-[0.25em]` |
| Card title / passage body | `text-2xl` / `text-sm` | `text-3xl` / `text-lg leading-relaxed` |
| Field-manual principle | `text-sm` | `text-xl` serif |
| Field-manual action copy | `text-xs` | `text-base leading-relaxed` |
| Witness card body (Principle/Action/Benefit) | `text-sm` w/ `text-[10px]` labels | `text-base` w/ `text-xs tracking-[0.2em]` labels stacked above value |
| Inline labels in forms | `text-[10px]` w-20 inline | `text-xs` block above input, input `text-base` |
| Status row stat value | `text-3xl` | `text-4xl` (keep) — label up to `text-xs` |
| Banner / aphorism lines | `text-xs italic` | `text-base italic` |
| Footer / nav links | `text-xs tracking-[0.3em]` | `text-sm tracking-[0.2em]` |
| Caption / meta (timestamps, "· micro") | `text-[10px]` | `text-xs` |

Tightening tracking from `0.4–0.5em` → `0.2–0.25em` on eyebrows so they read as words, not Morse.

## Files touched (presentation only)

- `src/routes/cabinet.tsx` — H1, return-state copy, footer links
- `src/routes/sovereign.tsx` — H1, banner, stat row labels, every section eyebrow (`Open witness`, `Twelve Domains`, `Recommended`, `Field Manual`, `Submit an Action Card`), footer
- `src/components/cabinet/OfferingCard.tsx` — glyph caption
- `src/components/cabinet/OfferingPanel.tsx` — eyebrow + passage body to `text-lg`/`text-xl`
- `src/components/cabinet/VesselPlayer.tsx` — control labels, helper line
- `src/components/cabinet/ReflectionField.tsx` — prompt, textarea, action links
- `src/components/cabinet/CabinetChamber.tsx` — chamber eyebrow
- `src/components/sovereign/WitnessCard.tsx` — header chips, labels-above-value, textarea, action chips
- `src/components/sovereign/FieldManualDeck.tsx` — principle, action, benefit, CTA
- `src/components/sovereign/ActionCardForm.tsx` — scale chips, field labels, submit
- `src/components/sovereign/ArchiveOverlay.tsx` — H2, list copy
- `src/styles.css` — bump `.ledger-page` / `.cabinet-recess` base `font-size` floor to `1rem` and add `--text-eyebrow: 0.8125rem` token for consistent caps treatment

## Out of scope

- Palette, gradients, geometry, motion, ritual copy wording
- Sovereign sealing logic, resonance algorithm, state shape
- Gate 1 / Book of Spiral Fractures — untouched
- No new components, no removed components
