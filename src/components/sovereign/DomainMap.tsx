import { DOMAINS, type DomainId } from "../../data/domains";

export function DomainMap({
  weights,
  highlight,
  onSelect,
}: {
  weights: Record<DomainId, number>;
  highlight?: DomainId;
  onSelect?: (id: DomainId) => void;
}) {
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const r = 120;

  return (
    <div className="flex justify-center">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="overflow-visible">
        {/* faint ring */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="color-mix(in oklab, var(--gold-aged) 25%, transparent)" strokeWidth="0.6" />
        <circle cx={cx} cy={cy} r={r * 0.55} fill="none" stroke="color-mix(in oklab, var(--gold-aged) 12%, transparent)" strokeWidth="0.4" />
        {/* center sigil */}
        <text x={cx} y={cy + 6} textAnchor="middle" fontSize="20" fill="var(--gold-aged)" opacity="0.7">✦</text>

        {DOMAINS.map((d) => {
          const ang = -Math.PI / 2 + d.angle; // 0 at top
          const x = cx + Math.cos(ang) * r;
          const y = cy + Math.sin(ang) * r;
          const w = weights[d.id] ?? 0;
          const touched = w > 0;
          const opacity = touched ? Math.min(0.45 + w * 0.18, 1) : 0.25;
          const isHl = highlight === d.id;
          const radius = touched ? 18 + Math.min(w * 2, 8) : 14;
          return (
            <g
              key={d.id}
              transform={`translate(${x},${y})`}
              opacity={opacity}
              className={onSelect ? "cursor-pointer" : ""}
              onClick={() => onSelect?.(d.id)}
            >
              <circle
                r={radius}
                fill={isHl ? "color-mix(in oklab, var(--gold) 35%, transparent)" : "color-mix(in oklab, var(--leather) 80%, transparent)"}
                stroke={isHl ? "var(--gold)" : touched ? "var(--gold-aged)" : "color-mix(in oklab, var(--bronze) 50%, transparent)"}
                strokeWidth={isHl ? 1.3 : 0.8}
              />
              <text textAnchor="middle" y="5" fontSize="14" fill={touched ? "var(--gold)" : "var(--parchment-dim)"}>{d.glyph}</text>
              <text textAnchor="middle" y={radius + 14} fontSize="8" letterSpacing="0.2em" fill="var(--parchment-dim)">
                {d.name.toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
