import { motion } from "framer-motion";
import type { SovereignAction } from "../../lib/state";
import { domainById } from "../../data/domains";

const EXPO_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function WitnessCard({
  action,
  onChange,
  onSeal,
  readOnly,
}: {
  action: SovereignAction;
  onChange?: (patch: Partial<SovereignAction>) => void;
  onSeal?: () => void;
  readOnly?: boolean;
}) {
  const sealed = action.marksAwarded > 0;
  const domain = domainById(action.domain);

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: EXPO_OUT }}
      className="relative witness-card"
      data-sealed={sealed ? "true" : "false"}
    >
      {sealed && (
        <motion.span
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: EXPO_OUT }}
          className="absolute top-3 right-3 text-gold text-2xl"
          style={{ textShadow: "0 0 12px color-mix(in oklab, var(--gold) 60%, transparent)" }}
        >
          ✦
        </motion.span>
      )}
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-3 min-w-0">
          <span className="text-gold-aged text-lg leading-none">{domain.glyph}</span>
          <span className="text-[10px] tracking-[0.3em] uppercase text-parchment-dim">{domain.name}</span>
          <span className="text-[10px] tracking-[0.3em] uppercase text-parchment-dim/60">· {action.scale}</span>
        </div>
        <span className="text-[10px] text-parchment-dim/70 shrink-0">
          {new Date(action.declaredAt).toLocaleDateString()}
        </span>
      </div>

      {readOnly ? (
        <div className="mt-3 space-y-2 text-sm">
          {action.principle && <p><span className="text-gold-aged text-[10px] tracking-widest uppercase mr-2">Principle</span>{action.principle}</p>}
          <p><span className="text-gold-aged text-[10px] tracking-widest uppercase mr-2">Action</span>{action.action || action.intent}</p>
          {action.benefit && <p><span className="text-gold-aged text-[10px] tracking-widest uppercase mr-2">Benefit</span>{action.benefit}</p>}
          {action.visibleEvidence && (
            <p className="pt-2 border-t border-gold-aged/15">
              <span className="text-gold-aged text-[10px] tracking-widest uppercase mr-2">Witness</span>
              {action.visibleEvidence}
            </p>
          )}
        </div>
      ) : (
        <div className="mt-3 space-y-3 text-sm">
          <LedgerField label="Principle" value={action.principle} onChange={(v) => onChange?.({ principle: v })} placeholder="The principle this serves." />
          <LedgerField label="Action"    value={action.action || action.intent} onChange={(v) => onChange?.({ action: v, intent: v })} placeholder="One sentence. No more." />
          <LedgerField label="Benefit"   value={action.benefit} onChange={(v) => onChange?.({ benefit: v })} placeholder="Who or what is served." />
          <div className="mt-1 flex flex-wrap gap-2">
            {(["chosen", "scheduled", "completed", "abandoned"] as const).map((s) => (
              <button
                key={s}
                onClick={() => onChange?.({ status: s })}
                className={`text-[10px] tracking-[0.3em] uppercase px-2 py-1 rounded-sm border transition-colors duration-500 ${
                  action.status === s ? "border-gold text-gold" : "border-bronze/30 text-parchment-dim hover:text-parchment"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div>
            <label className="text-gold-aged text-[10px] tracking-[0.3em] uppercase">Visible evidence</label>
            <textarea
              value={action.visibleEvidence}
              onChange={(e) => onChange?.({ visibleEvidence: e.target.value })}
              rows={2}
              placeholder="What can be witnessed? Who saw it? What changed in the world?"
              className="mt-1 w-full bg-obsidian/60 border border-bronze/30 rounded-sm p-2 text-parchment text-sm placeholder:text-parchment-dim/50 focus:outline-none focus:border-gold-aged"
            />
          </div>
          <div className="flex items-center justify-between text-xs pt-1">
            {sealed ? (
              <span className="text-gold tracking-[0.3em] uppercase">sealed</span>
            ) : action.status === "completed" && action.visibleEvidence.trim().length > 0 ? (
              <>
                <span className="text-parchment-dim italic">Ready to seal.</span>
                <button
                  onClick={onSeal}
                  className="text-gold-aged hover:text-gold text-[10px] tracking-[0.3em] uppercase transition-colors duration-500"
                >
                  seal witness
                </button>
              </>
            ) : (
              <span className="text-parchment-dim italic">Marks are sealed when evidence is named.</span>
            )}
          </div>
        </div>
      )}
    </motion.li>
  );
}

function LedgerField({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <label className="text-gold-aged text-[10px] tracking-[0.3em] uppercase shrink-0 w-20">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent border-b border-bronze/30 focus:border-gold-aged focus:outline-none text-parchment placeholder:text-parchment-dim/50 text-sm py-1"
      />
    </div>
  );
}
