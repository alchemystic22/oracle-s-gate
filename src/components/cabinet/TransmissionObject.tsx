import { motion } from "framer-motion";
import { useState } from "react";
import type { Offering, ObjectArchetype, MistColor } from "../../data/cabinet";

const BASE = "/assets/cabinet/objects";
const ARCHETYPE_SRC: Record<ObjectArchetype, string> = {
  "leather-book":  `${BASE}/leather-book.png`,
  "stone-tablet":  `${BASE}/stone-tablet.png`,
  "open-codex":    `${BASE}/open-codex.png`,
  "book-on-side":  `${BASE}/book-on-side.png`,
  "scroll":        `${BASE}/scroll.png`,
  "lectern":       `${BASE}/lectern.png`,
  "abalone-shell": `${BASE}/abalone-shell.png`,
  "brass-bowl":    `${BASE}/brass-bowl.png`,
  "tuning-fork":   `${BASE}/tuning-fork.png`,
  "glass-vial":    `${BASE}/glass-vial.png`,
  "bone-flute":    `${BASE}/bone-flute.png`,
  "bronze-bell":   `${BASE}/bronze-bell.png`,
};
const VIAL_STOPPER_SRC = `${BASE}/glass-vial-stopper.png`;

const MIST_COLOR: Record<MistColor, string> = {
  rose:   "oklch(0.78 0.13 18)",
  blue:   "oklch(0.72 0.12 240)",
  gold:   "oklch(0.82 0.14 78)",
  violet: "oklch(0.65 0.15 300)",
};

export type TransmissionState = "present" | "receded" | "illuminated" | "opening";

const EXPO_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Renders a single transmission as its distinct ritual object on the altar.
 *  The object IS the visual — no card primitive. Hover raises a warm halo from
 *  beneath; selection plays a per-archetype gesture before the next phase. */
export function TransmissionObject({
  offering,
  state,
  index,
  onSelect,
}: {
  offering: Offering;
  state: TransmissionState;
  index: number;
  onSelect?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const interactable = state === "present" || state === "illuminated";
  const archetype = offering.objectArchetype;
  const src = ARCHETYPE_SRC[archetype];
  const isVial = archetype === "glass-vial";
  const mistColor = isVial && offering.kind === "vessel" && offering.mistColor
    ? MIST_COLOR[offering.mistColor] : MIST_COLOR.gold;

  // Rise-and-settle entrance: object rises from the altar, settles.
  const animate = {
    present:     { opacity: 1,    y: 0,  filter: "brightness(1)",    scale: 1    },
    illuminated: { opacity: 1,    y: 0,  filter: "brightness(1.35)", scale: 1.04 },
    receded:     { opacity: 0.22, y: 14, filter: "brightness(0.65)", scale: 0.95 },
    opening:     { opacity: 1,    y: -6, filter: "brightness(1.45)", scale: 1.06 },
  }[state];

  return (
    <motion.button
      type="button"
      onClick={interactable ? onSelect : undefined}
      disabled={!interactable}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      initial={{ opacity: 0, y: 90, scale: 0.92 }}
      animate={animate}
      transition={{
        opacity: { duration: state === "receded" ? 0.6 : 1.4, ease: EXPO_OUT, delay: state === "present" || state === "illuminated" ? index * 0.28 : 0 },
        y:       { duration: state === "receded" ? 0.6 : 1.4, ease: EXPO_OUT, delay: state === "present" || state === "illuminated" ? index * 0.28 : 0 },
        filter:  { duration: 0.8, ease: EXPO_OUT },
        scale:   { duration: 0.9, ease: EXPO_OUT },
      }}
      className="transmission-object group relative disabled:cursor-default focus:outline-none"
      aria-label={interactable ? `Transmission ${index + 1}` : undefined}
    >
      {/* Warm halo rising from beneath — not a UI hover state, but the object
          itself responding to attention. */}
      <div
        aria-hidden
        className="transmission-halo"
        style={{
          opacity: state === "illuminated" ? 0.55 : hovered && interactable ? 0.4 : 0,
        }}
      />

      {/* Object container — the archetype image, with gesture transforms applied
          on the "opening" state. The transform class drives the per-archetype
          gesture (defined in styles.css). */}
      <div
        className={`transmission-figure transmission-${archetype} ${state === "opening" ? "is-opening" : ""}`}
      >
        <img
          src={src}
          alt={offering.title}
          loading="lazy"
          draggable={false}
          className="transmission-img select-none"
        />

        {/* Per-archetype overlays — rendered only when meaningful. */}
        {isVial && (
          <>
            {/* Colored mist overlay tinted by the vessel's mistColor */}
            <div
              aria-hidden
              className="vial-mist"
              style={{
                background: `radial-gradient(ellipse at 50% 60%, ${mistColor} 0%, transparent 70%)`,
              }}
            />
            {/* Stopper that lifts and floats on opening */}
            <img
              src={glassVialStopper}
              alt=""
              aria-hidden
              draggable={false}
              className="vial-stopper"
            />
          </>
        )}

        {/* Bowl: expanding ring overlay on opening */}
        {archetype === "brass-bowl" && (
          <div aria-hidden className="bowl-ring" />
        )}

        {/* Shell: sound-wave ripple */}
        {archetype === "abalone-shell" && (
          <div aria-hidden className="shell-ripple" />
        )}

        {/* Flute: light tracing along its length */}
        {archetype === "bone-flute" && (
          <div aria-hidden className="flute-trace" />
        )}

        {/* Bell: halo ring on tilt */}
        {archetype === "bronze-bell" && (
          <div aria-hidden className="bell-halo" />
        )}
      </div>
    </motion.button>
  );
}
