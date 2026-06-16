// Single localStorage key. No analytics. No external calls.

const KEY = "alchemystic_state_v2";

export type GateId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type PrivacyMode =
  | "completion_marker_only"
  | "temporary_entry"
  | "do_not_store_after_refresh";

export type SovereignAction = {
  id: string;
  declaredAt: number;
  intent: string;
  privateNotes?: string;
  status: "declared" | "in_progress" | "completed" | "abandoned";
  visibleEvidence: string;
  marksAwarded: number;
  completedAt?: number;
};

export type ActionStatus = "not_chosen" | "chosen" | "scheduled" | "completed";

export type Gate1State = {
  phase:
    | "threshold"
    | "encounter"
    | "obstruction"
    | "book_emergence"
    | "page_open"
    | "corrective_gate_open"
    | "relocked"
    | "completion";
  activeRoute?: "false_arrival" | "splintered_trust";
  // Phase entry timestamps — anchor for time-locks. Persist so refresh doesn't reset them.
  anchors: Partial<Record<Gate1State["phase"], number>>;
  encounterAnswer: string;
  encounterSubmittedAt?: number;
  // Corrective page working state
  answers: Record<string, string>;
  journal: string;
  journalSavedAt?: number;
  actionBlock: {
    principle: string;
    action: string;
    benefit: string;
    status: ActionStatus;
    visibleEvidence: string;
    marksAwarded: number;
  };
  readiness: Record<number, boolean>;
  oracleHistory: Array<{ cat: string; q: string; a: string; t: number }>;
  safetyLocked: boolean;
};

export type AppState = {
  version: 2;
  createdAt: number;
  invocationCompletedAt?: number;
  privacyMode: PrivacyMode;
  gates: Record<GateId, {
    visitedAt?: number;
    completedAt?: number;
    routeTaken?: "false_arrival" | "splintered_trust";
  }>;
  gate1: Gate1State;
  cabinet: { drawnPassageIds: string[]; reflectionIds: string[] };
  sovereign: { actions: SovereignAction[] };
  grace: { nextEligibleAt?: number; events: Array<{ id: string; triggeredAt: number; kind: "grace" | "oracle_return"; seen: boolean }> };
  oracle: { visits: number; lastVisitAt?: number };
};

const GRACE_MIN_WAIT_MS = 3 * 24 * 60 * 60 * 1000;
export function graceWaitMs() { return GRACE_MIN_WAIT_MS; }

export function defaultGate1(): Gate1State {
  return {
    phase: "threshold",
    anchors: {},
    encounterAnswer: "",
    answers: {},
    journal: "",
    actionBlock: {
      principle: "",
      action: "",
      benefit: "",
      status: "not_chosen",
      visibleEvidence: "",
      marksAwarded: 0,
    },
    readiness: {},
    oracleHistory: [],
    safetyLocked: false,
  };
}

export function defaultState(): AppState {
  const emptyGate = () => ({});
  return {
    version: 2,
    createdAt: Date.now(),
    privacyMode: "completion_marker_only",
    gates: { 1: emptyGate(), 2: emptyGate(), 3: emptyGate(), 4: emptyGate(), 5: emptyGate(), 6: emptyGate(), 7: emptyGate() },
    gate1: defaultGate1(),
    cabinet: { drawnPassageIds: [], reflectionIds: [] },
    sovereign: { actions: [] },
    grace: { events: [] },
    oracle: { visits: 0 },
  };
}

export function loadState(): AppState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      // Try to migrate from v1 (only invocationCompletedAt is worth keeping)
      const old = localStorage.getItem("alchemystic_state_v1");
      if (old) {
        try {
          const parsed = JSON.parse(old);
          const fresh = defaultState();
          if (parsed.invocationCompletedAt) fresh.invocationCompletedAt = parsed.invocationCompletedAt;
          return fresh;
        } catch { /* fall through */ }
      }
      return defaultState();
    }
    const parsed = JSON.parse(raw) as AppState;
    if (parsed.version !== 2) return defaultState();
    // Defensive: backfill any missing slices
    if (!parsed.gate1) parsed.gate1 = defaultGate1();
    return parsed;
  } catch {
    return defaultState();
  }
}

export function saveState(s: AppState) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* quota etc. — silent */ }
}

export function resetState() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
