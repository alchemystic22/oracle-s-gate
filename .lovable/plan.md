# Replace SVG art with rich generated imagery

Inventory pass found three real "SVG-as-art" surfaces still in the app. The grimoire and the gate threshold already use generated images and stay as-is. The book's noise-filter SVGs are texture (not art) and stay. The constellation seam lines are diagram, not decoration, and stay.

What gets replaced:

## 1. Corrective stance glyphs — `CrackedSun` & `BrokenCompass`
**Where:** `src/components/ritual/RitualPrimitives.tsx` (exported), rendered in `src/routes/gate.$gateId.tsx` line 441 on every corrective page (False Arrival → cracked sun; Splintered Trust → broken compass), 96×96 inside a gold-lit panel.

**Replacement:**
- Generate two ~768×768 painterly artifact images (PNG, transparent background) at premium tier, sized to a circular medallion frame:
  - `false-arrival.png` — a cracked, tarnished gilded sun-disc artifact: weathered brass radiating sunburst with a deep fracture across the face, alchemical engravings on the rim, sitting against pure black. No eye motif. No symmetrical pyramids. Reads as "the promise that split."
  - `splintered-trust.png` — a shattered antique brass mariner's compass: cracked glass face, bent needle pointing askew, verdigris patina, rosette engraving partially worn. Reads as "the bearing that broke."
- Save to `public/assets/correctives/`.
- Swap `CrackedSun` / `BrokenCompass` JSX bodies for `<img>` tags pointing at the new files; keep the breathing motion wrapper and gold drop-shadow filter so they still feel summoned. Same 96px container — no layout change.

## 2. Constellation gate nodes
**Where:** `src/routes/gates.index.tsx` `GateNode` function (lines 115–148). Currently each gate is a colored CSS circle (`bg-gold` / `bg-bronze`).

**Replacement:**
- Generate one shared `gate-seal.png` artifact (~512×512, transparent): an ornate gilded medallion — circular brass seal with concentric engraved rings, sacred geometry filigree, no figurative imagery, no eye. Reads as "a sealed gate."
- Render at 3 visual states purely through filters:
  - **active** (next gate): full opacity, warm gold drop-shadow, gentle scale-breathe
  - **sealed** (completed): smaller, bronze hue-rotate, no glow
  - **locked**: heavily desaturated + low opacity (so it reads as "not yours yet")
- Seam lines between gates stay as inline `<svg>` (those are diagram lines, not art).

## 3. Skip / keep
- **Backdrop `SacredGeometry`** — currently at 6% opacity behind the BookShell. It reads as a faint cosmic etching, not as a placeholder. Keep.
- **`CornerBrackets`** — 4 plain bordered spans, not SVG. Keep.
- **Book grain filters** — `feTurbulence` noise; this is texture, not art. Keep.
- **Constellation seam lines** — diagram, not decoration. Keep.

## Constraints honored
- No eye / "all-seeing eye" motif in any new generation (per your note).
- All new imagery generated at premium tier for legibility at small sizes.
- Tech overlays (glow, scan, breathe) stay around the imagery, never on top of it.
- No new dependencies; all changes confined to existing components and `public/assets/`.

## Files touched
- `public/assets/correctives/false-arrival.png` *(new)*
- `public/assets/correctives/splintered-trust.png` *(new)*
- `public/assets/constellation/gate-seal.png` *(new)*
- `src/components/ritual/RitualPrimitives.tsx` *(swap `CrackedSun` / `BrokenCompass` bodies)*
- `src/routes/gates.index.tsx` *(swap `GateNode` dot for medallion image with state filters)*
