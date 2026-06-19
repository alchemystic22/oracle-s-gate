import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { GlyphId } from "../../data/correctives";

export function RitualButton({
  children,
  onClick,
  disabled,
  variant = "primary",
  className = "",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost";
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden px-8 py-3.5 font-serif text-sm uppercase tracking-[0.18em] transition-all duration-700 ${
        variant === "primary"
          ? "border border-[hsl(43_80%_70%/0.6)] bg-[hsl(240_30%_8%/0.6)] text-[hsl(43_80%_82%)] backdrop-blur-md hover:border-[hsl(43_80%_82%)] hover:shadow-[0_0_50px_-8px_hsl(43_80%_60%/0.7),inset_0_0_30px_hsl(280_60%_40%/0.25)]"
          : "border border-transparent text-[hsl(43_30%_65%)] hover:text-[hsl(43_80%_82%)]"
      } disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[hsl(43_30%_55%)] disabled:hover:shadow-none ${className}`}
      style={{ fontFamily: "'Cinzel', serif" }}
    >
      {variant === "primary" && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                "linear-gradient(135deg, hsl(43 80% 55% / 0.12) 0%, hsl(280 60% 45% / 0.12) 50%, hsl(210 80% 55% / 0.12) 100%)",
            }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-[hsl(43_80%_82%/0.3)] to-transparent opacity-0 transition-all duration-1000 group-hover:left-full group-hover:opacity-100"
          />
        </>
      )}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      {variant === "primary" && !disabled && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-[hsl(43_80%_60%/0.7)] to-transparent opacity-60"
        />
      )}
    </button>
  );
}

export function Section({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`border-t border-[hsl(43_30%_55%/0.2)] pt-8 ${className}`}>
      {children}
    </section>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3
      className="mb-4 text-xs uppercase tracking-[0.4em] text-[hsl(43_50%_60%)]"
      style={{ fontFamily: "'Cinzel', serif" }}
    >
      {children}
    </h3>
  );
}

function Artifact({ src, alt }: { src: string; alt: string }) {
  return (
    <motion.img
      src={src}
      alt={alt}
      loading="lazy"
      draggable={false}
      className="h-full w-full select-none object-contain"
      style={{
        filter:
          "drop-shadow(0 0 22px hsl(43 85% 60% / 0.55)) drop-shadow(0 0 6px hsl(48 95% 80% / 0.35))",
      }}
      animate={{ opacity: [0.85, 1, 0.85], scale: [1, 1.015, 1] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export const CrackedSun = () => (
  <Artifact src="/assets/correctives/false-arrival.png" alt="A cracked gilded sun-disc, the promise that split" />
);

export const BrokenCompass = () => (
  <Artifact src="/assets/correctives/splintered-trust.png" alt="A shattered antique compass, the bearing that broke" />
);

export const BurnedTongue = () => (
  <Artifact src="/assets/glyphs/gate-2/burned-tongue.svg" alt="A tongue rising into flame, an ember at its tip" />
);

export const SilencedFire = () => (
  <Artifact src="/assets/glyphs/gate-2/silenced-fire.svg" alt="A flame sealed inside a stoppered vial, embers glowing through the seal" />
);

export const HiddenGrief = () => (
  <Artifact src="/assets/glyphs/gate-3/hidden-grief.png" alt="A stone seed beneath a weeping willow, cracked by a single root of gold" />
);

export const WithheldTears = () => (
  <Artifact src="/assets/glyphs/gate-3/withheld-tears.png" alt="A silver tear suspended inside a closed stone basin, a crack beneath it where water begins to move" />
);

type GlyphComponent = () => ReactNode;

const GLYPHS: Record<GlyphId, GlyphComponent> = {
  "cracked-sun": CrackedSun,
  "broken-compass": BrokenCompass,
  "burned-tongue": BurnedTongue,
  "silenced-fire": SilencedFire,
  "hidden-grief": HiddenGrief,
  "withheld-tears": WithheldTears,
};

export function Glyph({ id }: { id: GlyphId }) {
  const C = GLYPHS[id] ?? CrackedSun;
  return <C />;
}

