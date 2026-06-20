// Static, dim, sealed Book of Spiral Fractures.
// NEVER animate as if a page is opening. NEVER reveal a hidden page.
// This is a symbolic presence only. Inline SVG so no asset dependency.

export function ClosedBookGlyph({ width = 96 }: { width?: number }) {
  const h = width * 0.72;
  return (
    <svg
      width={width}
      height={h}
      viewBox="0 0 120 86"
      aria-hidden
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id="g7-book-cover" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(240 40% 14%)" />
          <stop offset="100%" stopColor="hsl(240 50% 6%)" />
        </linearGradient>
        <linearGradient id="g7-book-edge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="hsl(43 40% 30% / 0.6)" />
          <stop offset="50%" stopColor="hsl(43 50% 45% / 0.35)" />
          <stop offset="100%" stopColor="hsl(43 40% 30% / 0.6)" />
        </linearGradient>
      </defs>

      {/* Quiet shadow under the book */}
      <ellipse cx="60" cy="80" rx="46" ry="3.5" fill="hsl(240 60% 0% / 0.6)" />

      {/* Closed cover */}
      <rect
        x="14"
        y="14"
        width="92"
        height="64"
        rx="2"
        fill="url(#g7-book-cover)"
        stroke="hsl(43 35% 28% / 0.8)"
        strokeWidth="0.7"
      />

      {/* Page edges — sealed line, no separation */}
      <rect x="14" y="44" width="92" height="2" fill="url(#g7-book-edge)" />

      {/* Faint central spiral mark — sealed sigil */}
      <g opacity="0.5" transform="translate(60 46)">
        <circle r="9" fill="none" stroke="hsl(43 50% 55% / 0.55)" strokeWidth="0.5" />
        <circle r="5.5" fill="none" stroke="hsl(43 50% 55% / 0.4)" strokeWidth="0.5" />
        <circle r="2.5" fill="none" stroke="hsl(43 50% 55% / 0.3)" strokeWidth="0.5" />
        <circle r="0.8" fill="hsl(43 70% 70% / 0.5)" />
      </g>

      {/* Seal at the spine */}
      <rect x="58" y="14" width="4" height="64" fill="hsl(240 50% 3%)" opacity="0.7" />
    </svg>
  );
}
