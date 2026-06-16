// Single localStorage key. No analytics. No external calls.
// Time-locks persist server-side... actually client-side per Phase 1 spec.

const KEY = "alchemystic_state_v1";

export type GateId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type SovereignAction = {
  id: string;
  declaredAt: number; // ms
  intent: string; // short
  privateNotes?: string;
  status: "declared" | "in_progress" | "completed" | "abandoned";
  visibleEvidence: string; // required for Marks
  marksAwarded: number; // 0 until evidence
  completedAt?: number;
};

export type ReflectionEntry = {
  id: string;
  gateId: GateId | "cabinet";
  at: number;
  // Privacy modes:
  //   "private_summary" (default): only first 80 chars kept as summary
  //   "full": full text stored
  //   "ephemeral": not stored at all (only that it happened)
  mode: "private_summary" | "full" | "ephemeral";
  text?: string; // omitted if ephemeral; truncated if private_summary
  cabinetPassageId?: string;
};

export type GraceEvent = {
  id: string;
  triggeredAt: number;
  kind: "grace" | "oracle_return";
  seen: boolean;
};

export type AppState = {
  version: 1;
  createdAt: number;
  invocationCompletedAt?: number;
  privacyMode: ReflectionEntry["mode"];
  gates: Record<GateId, {
    visitedAt?: number;
    thresholdAcknowledgedAt?: number;
    encounteredAt?: number;
    reflectionAt?: number;
    completedAt?: number;
    nextUnlockAt?: number; // time-lock
  }>;
  cabinet: {
    drawnPassageIds: string[]; // order matters
    reflectionIds: string[];
  };
  sovereign: {
    actions: SovereignAction[];
  };
  grace: {
    nextEligibleAt?: number;
    events: GraceEvent[];
  };
  oracle: {
    visits: number;
    lastVisitAt?: number;
  };
};

const MIN_GATE_LOCK_MS = 24 * 60 * 60 * 1000; // 24h between gates
const GRACE_MIN_WAIT_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

export function gateLockMs() { return MIN_GATE_LOCK_MS; }
export function graceWaitMs() { return GRACE_MIN_WAIT_MS; }

const emptyGate = () => ({});

export function defaultState(): AppState {
  return {
    version: 1,
    createdAt: Date.now(),
    privacyMode: "private_summary",
    gates: { 1: emptyGate(), 2: emptyGate(), 3: emptyGate(), 4: emptyGate(), 5: emptyGate(), 6: emptyGate(), 7: emptyGate() },
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
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as AppState;
    if (parsed.version !== 1) return defaultState();
    return parsed;
  } catch {
    return defaultState();
  }
}

export function saveState(s: AppState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function resetState() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function applyPrivacy(text: string, mode: ReflectionEntry["mode"]) {
  if (mode === "ephemeral") return undefined;
  if (mode === "full") return text;
  return text.slice(0, 80) + (text.length > 80 ? "…" : "");
}
