import { DOMAINS, type DomainId } from "../../data/domains";

type Card = { domain: DomainId; principle: string; action: string; benefit: string };

export const FIELD_MANUAL: Card[] = [
  { domain: "body",      principle: "The flesh is the first witness.",     action: "Walk thirty minutes outdoors without a phone.", benefit: "Sovereignty is felt in the body before it is named." },
  { domain: "mind",      principle: "Discernment must be exercised.",       action: "Read one paragraph twice. Refuse to consume the next.", benefit: "Attention restored to the size of a single thing." },
  { domain: "spirit",    principle: "Stillness is not absence.",            action: "Sit five minutes with no purpose.",        benefit: "The interior speaks when nothing is asked of it." },
  { domain: "relations", principle: "A true yes requires the possible no.", action: "Decline one social obligation that does not resonate.", benefit: "Relations rest on honest weight." },
  { domain: "work",      principle: "Labour answers to a centre.",          action: "End the workday at the time you set.",     benefit: "The body learns the boundary it has been told to forget." },
  { domain: "craft",     principle: "Making is the body of the soul.",      action: "Spend one hour on the work that pays nothing yet.", benefit: "The craft remembers you." },
  { domain: "money",     principle: "Money is a measure of consent.",       action: "Refuse one small purchase made from drift.",     benefit: "The flow narrows to what is true." },
  { domain: "home",      principle: "Order is a kindness to the self.",     action: "Restore one surface to its bare condition.", benefit: "The room exhales." },
  { domain: "earth",     principle: "The land is the older council.",       action: "Place hands on living ground for ten minutes.", benefit: "Frequency adjusts itself." },
  { domain: "lineage",   principle: "Some weight is not yours to keep.",    action: "Name one inherited belief aloud and set it down.", benefit: "The line behind you can breathe." },
  { domain: "voice",     principle: "The word is on fire when it is true.", action: "Say the difficult sentence to the person who needs to hear it.", benefit: "Voice that does not perform is voice that lands." },
  { domain: "service",   principle: "What is given without price is paid.", action: "Offer one act of help that you do not document.", benefit: "The unwitnessed gift is the cleanest." },
];

export function FieldManualDeck({ onUse }: { onUse: (card: Card) => void }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x snap-mandatory">
      {FIELD_MANUAL.map((c) => {
        const d = DOMAINS.find((x) => x.id === c.domain)!;
        return (
          <article key={c.domain} className="snap-start min-w-[300px] max-w-[300px] field-card p-6 flex flex-col">
            <header className="flex items-center gap-3 mb-4">
              <span className="text-gold-aged text-2xl leading-none">{d.glyph}</span>
              <span className="text-sm tracking-[0.2em] uppercase text-parchment-dim">{d.name}</span>
            </header>
            <p className="text-parchment text-xl italic mb-3 leading-snug" style={{ fontFamily: "var(--font-serif)" }}>“{c.principle}”</p>
            <p className="text-parchment-dim text-base leading-relaxed mb-4">{c.action}</p>
            <p className="text-gold-aged/90 text-xs tracking-[0.2em] uppercase mb-5">{c.benefit}</p>
            <button
              onClick={() => onUse(c)}
              className="mt-auto self-start text-gold-aged hover:text-gold text-sm tracking-[0.2em] uppercase transition-colors duration-500"
            >
              draw into ledger
            </button>
          </article>
        );
      })}
    </div>
  );
}
