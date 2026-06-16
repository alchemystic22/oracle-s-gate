import type { ReactNode } from "react";
import { motion } from "framer-motion";

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

export const CrackedSun = () => (
  <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden>
    <defs>
      <radialGradient id="csg" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="hsl(43 80% 82%)" stopOpacity="0.9" />
        <stop offset="70%" stopColor="hsl(43 80% 60%)" stopOpacity="0.4" />
        <stop offset="100%" stopColor="hsl(43 60% 35%)" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="60" cy="60" r="46" fill="url(#csg)" />
    <circle cx="60" cy="60" r="40" fill="none" stroke="hsl(43 80% 60%)" strokeWidth="1.2" opacity="0.9" />
    <path d="M60 20 L58 60 L66 78 L62 100" fill="none" stroke="hsl(43 80% 82%)" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M40 30 L55 58" fill="none" stroke="hsl(43 80% 82%)" strokeWidth="0.8" opacity="0.7" />
  </svg>
);

export const BrokenCompass = () => (
  <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden>
    <defs>
      <radialGradient id="bcg" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="hsl(43 80% 82%)" stopOpacity="0.5" />
        <stop offset="100%" stopColor="hsl(43 60% 35%)" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="60" cy="60" r="46" fill="url(#bcg)" />
    <circle cx="60" cy="60" r="40" fill="none" stroke="hsl(43 40% 55%)" strokeWidth="1" strokeDasharray="3 4" />
    <path d="M60 24 L62 58 L60 96" fill="none" stroke="hsl(43 80% 60%)" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M28 60 L92 60" fill="none" stroke="hsl(43 40% 55%)" strokeWidth="0.6" opacity="0.5" />
    <line x1="60" y1="60" x2="78" y2="34" stroke="hsl(220 30% 80%)" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="78" cy="34" r="2" fill="hsl(220 40% 90%)" />
    <circle cx="60" cy="60" r="2.5" fill="hsl(43 80% 82%)" />
  </svg>
);
