import { motion } from "framer-motion";

/* Cosmic backdrop — deep gradient + nebula bloom + HUD grid + drifting starfield + scanline.
   Mounted from __root.tsx so every route inherits the temple/futurism atmosphere. */
export function CosmicBackdrop() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-50"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% 0%, hsl(270 55% 16%) 0%, hsl(240 35% 8%) 45%, hsl(240 30% 4%) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-40 opacity-60 mix-blend-screen"
        style={{
          background:
            "radial-gradient(ellipse 40% 30% at 18% 22%, hsl(280 70% 40% / 0.35) 0%, transparent 60%), radial-gradient(ellipse 35% 30% at 82% 30%, hsl(210 80% 45% / 0.28) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 50% 100%, hsl(43 80% 45% / 0.18) 0%, transparent 65%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-40 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(43 80% 70% / 1) 1px, transparent 1px), linear-gradient(90deg, hsl(43 80% 70% / 1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 80%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-40"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 20% 30%, hsl(45 80% 85% / 0.8), transparent 60%), radial-gradient(1px 1px at 70% 80%, hsl(210 80% 85% / 0.7), transparent 60%), radial-gradient(1px 1px at 40% 70%, hsl(43 80% 80% / 0.7), transparent 60%), radial-gradient(1px 1px at 85% 15%, hsl(280 80% 85% / 0.7), transparent 60%), radial-gradient(1px 1px at 12% 85%, hsl(45 80% 85% / 0.6), transparent 60%), radial-gradient(1.2px 1.2px at 55% 12%, hsl(43 80% 90% / 0.9), transparent 60%)",
          backgroundSize: "100% 100%",
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 -z-30 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, hsl(43 90% 75% / 0.45), hsl(210 90% 75% / 0.4), transparent)",
          boxShadow: "0 0 12px hsl(43 90% 70% / 0.5)",
        }}
        initial={{ top: "-2%" }}
        animate={{ top: "102%" }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      />
    </>
  );
}

export function SacredGeometry({ className = "" }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 400 400"
      className={`pointer-events-none ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 220, repeat: Infinity, ease: "linear" }}
      aria-hidden
    >
      <defs>
        <radialGradient id="sg-fade" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(43 90% 75%)" stopOpacity="0.6" />
          <stop offset="70%" stopColor="hsl(280 60% 55%)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="hsl(43 80% 55%)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g fill="none" stroke="url(#sg-fade)" strokeWidth="0.7" transform="translate(200 200)">
        <circle r="180" />
        <circle r="150" />
        <circle r="110" />
        <circle r="70" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * Math.PI) / 6;
          const x = Math.cos(a) * 70;
          const y = Math.sin(a) * 70;
          return <circle key={i} cx={x} cy={y} r="70" opacity="0.5" />;
        })}
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i * Math.PI) / 3;
          return (
            <line key={`r${i}`} x1="0" y1="0" x2={Math.cos(a) * 180} y2={Math.sin(a) * 180} opacity="0.4" />
          );
        })}
      </g>
    </motion.svg>
  );
}

export function CornerBrackets() {
  return (
    <>
      {[
        "top-2 left-2 border-l border-t",
        "top-2 right-2 border-r border-t",
        "bottom-2 left-2 border-l border-b",
        "bottom-2 right-2 border-r border-b",
      ].map((pos, i) => (
        <span
          key={i}
          aria-hidden
          className={`pointer-events-none absolute h-5 w-5 ${pos}`}
          style={{
            borderColor: "hsl(43 80% 70% / 0.7)",
            boxShadow: "0 0 10px hsl(43 70% 55% / 0.35)",
          }}
        />
      ))}
    </>
  );
}
