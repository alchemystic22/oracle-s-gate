import { motion } from "framer-motion";
import type { Offering } from "../../data/cabinet";

type State = "facedown" | "illuminated" | "receded" | "flipped";

const EXPO_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** A single offering card. Renders face-down, illuminated (oracle-chose), receded, or flipped (selected). */
export function OfferingCard({
  offering,
  state,
  index,
  onSelect,
}: {
  offering: Offering;
  state: State;
  index: number;
  onSelect?: () => void;
}) {
  const interactable = state === "facedown" || state === "illuminated";

  // Rise stagger — slow ease-out, ~1200ms per card, 250ms stagger.
  const initial = { opacity: 0, y: 80, rotateY: 0 };
  const animateByState = {
    facedown:    { opacity: 1,    y: 0,  rotateY: 0,   filter: "brightness(1)",    scale: 1 },
    illuminated: { opacity: 1,    y: 0,  rotateY: 0,   filter: "brightness(1.35)", scale: 1.02 },
    receded:     { opacity: 0.25, y: 16, rotateY: 0,   filter: "brightness(0.7)",  scale: 0.96 },
    flipped:     { opacity: 1,    y: 0,  rotateY: 180, filter: "brightness(1.1)",  scale: 1 },
  }[state];

  const isVessel = offering.kind === "vessel";

  return (
    <motion.button
      type="button"
      onClick={interactable ? onSelect : undefined}
      disabled={!interactable}
      initial={initial}
      animate={animateByState}
      transition={{
        opacity:   { duration: state === "receded" ? 0.6 : 1.2, ease: EXPO_OUT, delay: state === "facedown" || state === "illuminated" ? index * 0.25 : 0 },
        y:         { duration: state === "receded" ? 0.6 : 1.2, ease: EXPO_OUT, delay: state === "facedown" || state === "illuminated" ? index * 0.25 : 0 },
        rotateY:   { duration: 0.7, ease: EXPO_OUT },
        filter:    { duration: state === "illuminated" ? 0.8 : 0.6, ease: EXPO_OUT },
        scale:     { duration: 0.8, ease: EXPO_OUT },
      }}
      className="relative cabinet-card group disabled:cursor-default"
      style={{ transformStyle: "preserve-3d", perspective: 1200 }}
      aria-label={interactable ? `Offering ${index + 1}` : undefined}
    >
      {/* Face down side */}
      <div
        className="cabinet-card-face"
        style={{ backfaceVisibility: "hidden" }}
      >
        <div className="cabinet-card-inner">
          <div
            className="absolute inset-0 rounded-sm"
            style={{
              background:
                state === "illuminated"
                  ? "radial-gradient(ellipse at center, color-mix(in oklab, var(--gold) 35%, transparent) 0%, transparent 70%)"
                  : undefined,
              transition: "background 800ms cubic-bezier(0.16,1,0.3,1)",
            }}
          />
          <div className="relative h-full flex flex-col items-center justify-center">
            <span
              className="text-3xl text-gold-aged group-hover:text-gold transition-colors duration-700"
              style={{
                textShadow: state === "illuminated" ? "0 0 24px color-mix(in oklab, var(--gold) 70%, transparent)" : undefined,
                fontFamily: isVessel ? "serif" : "var(--font-serif)",
              }}
            >
              {offering.glyph}
            </span>
            <span className="mt-3 text-[9px] tracking-[0.5em] uppercase text-parchment-dim/50">
              {isVessel ? "vessel" : "passage"}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
