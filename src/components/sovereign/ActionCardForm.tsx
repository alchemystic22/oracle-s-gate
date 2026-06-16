import { useState } from "react";
import { DOMAINS, type DomainId } from "../../data/domains";
import type { ActionScale } from "../../lib/state";

export function ActionCardForm({
  onSubmit,
}: {
  onSubmit: (v: { principle: string; action: string; benefit: string; scale: ActionScale; domain: DomainId }) => void;
}) {
  const [principle, setPrinciple] = useState("");
  const [action, setAction] = useState("");
  const [benefit, setBenefit] = useState("");
  const [scale, setScale] = useState<ActionScale>("micro");
  const [domain, setDomain] = useState<DomainId>("spirit");

  const ready = principle.trim() && action.trim() && benefit.trim();

  return (
    <div className="space-y-3">
      <FieldRow label="Principle">
        <input value={principle} onChange={(e) => setPrinciple(e.target.value)}
          placeholder="The principle this serves."
          className="ledger-input" />
      </FieldRow>
      <FieldRow label="Action">
        <input value={action} onChange={(e) => setAction(e.target.value)}
          placeholder="One sentence. No more."
          className="ledger-input" />
      </FieldRow>
      <FieldRow label="Benefit">
        <input value={benefit} onChange={(e) => setBenefit(e.target.value)}
          placeholder="Who or what is served."
          className="ledger-input" />
      </FieldRow>
      <FieldRow label="Scale">
        <div className="flex gap-3">
          {(["micro", "meso", "macro"] as ActionScale[]).map((s) => (
            <button key={s} onClick={() => setScale(s)}
              className={`text-[10px] tracking-[0.3em] uppercase px-3 py-1 rounded-sm border transition-colors duration-500 ${
                scale === s ? "border-gold text-gold" : "border-bronze/30 text-parchment-dim hover:text-parchment"
              }`}>
              {s} · {s === "micro" ? 1 : s === "meso" ? 3 : 7}
            </button>
          ))}
        </div>
      </FieldRow>
      <FieldRow label="Domain">
        <select
          value={domain}
          onChange={(e) => setDomain(e.target.value as DomainId)}
          className="ledger-input bg-obsidian/60"
        >
          {DOMAINS.map((d) => <option key={d.id} value={d.id}>{d.glyph}  {d.name}</option>)}
        </select>
      </FieldRow>
      <div className="flex justify-end pt-2">
        <button
          disabled={!ready}
          onClick={() => {
            onSubmit({ principle: principle.trim(), action: action.trim(), benefit: benefit.trim(), scale, domain });
            setPrinciple(""); setAction(""); setBenefit("");
          }}
          className="ritual-button px-5 py-2 text-xs tracking-[0.3em] uppercase rounded-sm disabled:opacity-30"
        >
          submit to ledger
        </button>
      </div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3">
      <label className="text-gold-aged text-[10px] tracking-[0.3em] uppercase shrink-0 w-20">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  );
}
