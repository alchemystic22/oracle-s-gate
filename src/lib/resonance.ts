// Cabinet resonance — selects a triad of offerings, weighted by Avatar state.
// Hard invariant: never the same triad twice in succession (data-structure level).

import { OFFERINGS, type Offering } from "../data/cabinet";
import type { AppState } from "./state";

export type SelectionMode = "avatar_chose" | "oracle_revealed";
export type Triad = { triad: [Offering, Offering, Offering]; mode: SelectionMode; forced?: 0 | 1 | 2 };

const KEYWORDS_FROM_TEXT = (s: string): string[] =>
  s
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length > 3);

function scoreOffering(o: Offering, themeBag: Map<string, number>, recentIds: Set<string>): number {
  let score = 1;
  for (const t of o.themes) {
    const hit = themeBag.get(t.toLowerCase());
    if (hit) score += hit * 2;
  }
  if (recentIds.has(o.id)) score *= 0.15; // not banned, just heavily damped
  return score;
}

function weightedPick<T>(items: T[], weights: number[], rng: () => number): number {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return Math.floor(rng() * items.length);
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return items.length - 1;
}

function triadKey(ids: string[]): string {
  return [...ids].sort().join("|");
}

export function drawTriad(
  state: AppState,
  opts: { forceMode?: SelectionMode; rng?: () => number } = {},
): Triad {
  const rng = opts.rng ?? Math.random;

  // Build the theme bag from Avatar state.
  const themeBag = new Map<string, number>();
  const bump = (w: string, n = 1) => themeBag.set(w, (themeBag.get(w) ?? 0) + n);

  // Active gate phase keywords — sum across all per-gate runtime states
  for (const id of [1, 2, 3, 4, 5, 6, 7] as const) {
    const g = state.gateState?.[id];
    if (!g) continue;
    bump(g.phase.replace(/_/g, " "), 1);
    if (g.activeRoute === "false_arrival") { bump("vow"); bump("promise"); bump("fracture"); }
    if (g.activeRoute === "splintered_trust") { bump("witness"); bump("discernment"); bump("trust"); }
    if (g.activeRoute === "burned_tongue") { bump("fire"); bump("voice"); bump("tongue"); bump("borrowed"); }
    if (g.activeRoute === "silenced_fire") { bump("fire"); bump("silence"); bump("vessel"); bump("speak"); }

    for (const w of KEYWORDS_FROM_TEXT(g.journal ?? "")) bump(w);
    for (const w of KEYWORDS_FROM_TEXT(g.encounterAnswer ?? "")) bump(w);
  }

  // Action intent keywords
  for (const a of state.sovereign.actions) {
    for (const w of KEYWORDS_FROM_TEXT(a.intent)) bump(w);
  }

  // Recently-shown offering ids (last 3 triads → exclusion window)
  const recent = (state.cabinet.recentTriads ?? []).flat();
  const recentSet = new Set(recent);
  const lastTriadKeys = new Set((state.cabinet.recentTriads ?? []).map(triadKey));

  // Compose pool — exclude offerings without audio file integrity etc. (none for placeholders).
  const pool = OFFERINGS.slice();

  // Try up to 8 times to find a triad whose key differs from prior triads.
  let chosen: Offering[] = [];
  for (let attempt = 0; attempt < 8; attempt++) {
    const remaining = pool.slice();
    const picked: Offering[] = [];
    while (picked.length < 3 && remaining.length > 0) {
      const weights = remaining.map((o) => scoreOffering(o, themeBag, recentSet));
      const idx = weightedPick(remaining, weights, rng);
      picked.push(remaining[idx]);
      remaining.splice(idx, 1);
    }
    if (picked.length === 3 && !lastTriadKeys.has(triadKey(picked.map((p) => p.id)))) {
      chosen = picked;
      break;
    }
    chosen = picked;
  }

  // Hard invariant final check: if we somehow matched the immediately-prior triad,
  // swap the lowest-scoring member for the highest-scoring unused offering.
  const lastIds = state.cabinet.recentTriads?.[0];
  if (lastIds && triadKey(chosen.map((c) => c.id)) === triadKey(lastIds)) {
    const used = new Set(chosen.map((c) => c.id));
    const candidate = pool.find((o) => !used.has(o.id));
    if (candidate) chosen[chosen.length - 1] = candidate;
  }

  const mode: SelectionMode = opts.forceMode ?? (rng() < 0.3 ? "oracle_revealed" : "avatar_chose");
  const triad = chosen as [Offering, Offering, Offering];
  const forced: 0 | 1 | 2 | undefined = mode === "oracle_revealed" ? (Math.floor(rng() * 3) as 0 | 1 | 2) : undefined;

  return { triad, mode, forced };
}

export function pushRecentTriad(prev: string[][], ids: string[]): string[][] {
  const next = [ids, ...prev].slice(0, 3);
  return next;
}
