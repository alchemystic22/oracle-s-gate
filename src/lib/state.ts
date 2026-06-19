// Single localStorage key. No analytics. No external calls.

import type { DomainId } from "../data/domains";
import type { RouteId } from "../data/correctives";

const KEY = "alchemystic_state_v2"; // legacy key, still used for v2/v3/v4/v5 reads (we migrate in place)

export type GateId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type PrivacyMode =
  | "completion_marker_only"
  | "temporary_entry"
  | "do_not_store_after_refresh";

// ── Sovereign Action Layer ─────────────────────────────────────────────────

export type ActionScale = "micro" | "meso" | "macro";
export type ActionStatusV3 = "chosen" | "scheduled" | "completed" | "abandoned";

export type SovereignAction = {
  id: string;
  declaredAt: number;
  // v3 fields
  principle: string;
  action: string;        // canonical "intent" replacement; legacy intent is mirrored here on migration
  benefit: string;
  scale: ActionScale;
  domain: DomainId;
  status: ActionStatusV3;
  visibleEvidence: string;
  privateNotes?: string;
  marksAwarded: number;  // 0 until sealed; 1/3/7 per scale once sealed
  sealedAt?: number;
  completedAt?: number;
  // legacy field, kept for backwards-compat readers
  intent: string;
};

export type GraceMessage = { id: string; receivedAt: number; text: string };

// ── Legacy action status (used inside the per-gate page state) ────────────
export type ActionStatus = "not_chosen" | "chosen" | "scheduled" | "completed";

// ── Cabinet ────────────────────────────────────────────────────────────────

export type CabinetEncounter = {
  id: string;                  // encounter id
  offeringId: string;          // which offering
  offeringKind: "passage" | "vessel";
  encounteredAt: number;
  triadIds: string[];          // the three offered
  mode: "avatar_chose" | "oracle_revealed";
  reflection?: string;         // may be omitted by privacy mode
  reflectionStored: boolean;
  markedLyrics: string[];      // lines marked during a vessel reception; [] for passages
};

// ── Per-gate runtime state ────────────────────────────────────────────────
// Generalised from the original Gate1State. Every gate uses the same shape.

export type GatePhase =
  | "threshold"
  | "encounter"
  | "obstruction"
  | "book_emergence"
  | "page_open"
  | "corrective_gate_open"
  | "relocked"
  | "completion";

export type GateRuntimeState = {
  phase: GatePhase;
  activeRoute?: RouteId;
  anchors: Partial<Record<GatePhase, number>>;
  encounterAnswer: string;
  encounterSubmittedAt?: number;
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

/** Back-compat alias — old code may still import this name. */
export type Gate1State = GateRuntimeState;

// ── Root state ─────────────────────────────────────────────────────────────

export type AppState = {
  version: 5;
  createdAt: number;
  invocationCompletedAt?: number;
  privacyMode: PrivacyMode;
  gates: Record<GateId, {
    visitedAt?: number;
    completedAt?: number;
    routeTaken?: RouteId;
  }>;
  /** Per-gate runtime state, keyed by gate id. */
  gateState: Record<GateId, GateRuntimeState>;
  cabinet: {
    encounters: CabinetEncounter[];
    recentTriads: string[][];   // last 3 triads (newest first)
  };
  sovereign: {
    actions: SovereignAction[];
    graceMarks: number;
    graceMessages: GraceMessage[];
  };
  grace: { nextEligibleAt?: number; events: Array<{ id: string; triggeredAt: number; kind: "grace" | "oracle_return"; seen: boolean }> };
  oracle: { visits: number; lastVisitAt?: number };
};

const GRACE_MIN_WAIT_MS = 3 * 24 * 60 * 60 * 1000;
export function graceWaitMs() { return GRACE_MIN_WAIT_MS; }

export function markValueForScale(s: ActionScale): number {
  return s === "micro" ? 1 : s === "meso" ? 3 : 7;
}

export function defaultGateRuntime(): GateRuntimeState {
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

/** Back-compat alias — old code may still import this name. */
export const defaultGate1 = defaultGateRuntime;

function emptyGateState(): Record<GateId, GateRuntimeState> {
  return {
    1: defaultGateRuntime(),
    2: defaultGateRuntime(),
    3: defaultGateRuntime(),
    4: defaultGateRuntime(),
    5: defaultGateRuntime(),
    6: defaultGateRuntime(),
    7: defaultGateRuntime(),
  };
}

export function defaultState(): AppState {
  const emptyGate = () => ({});
  return {
    version: 5,
    createdAt: Date.now(),
    privacyMode: "completion_marker_only",
    gates: { 1: emptyGate(), 2: emptyGate(), 3: emptyGate(), 4: emptyGate(), 5: emptyGate(), 6: emptyGate(), 7: emptyGate() },
    gateState: emptyGateState(),
    cabinet: { encounters: [], recentTriads: [] },
    sovereign: { actions: [], graceMarks: 0, graceMessages: [] },
    grace: { events: [] },
    oracle: { visits: 0 },
  };
}

// ── v2 → v3 migration ─────────────────────────────────────────────────────
type V2State = {
  version: 2;
  createdAt: number;
  invocationCompletedAt?: number;
  privacyMode: PrivacyMode;
  gates: AppState["gates"];
  gate1: GateRuntimeState;
  cabinet?: { drawnPassageIds?: string[]; reflectionIds?: string[] };
  sovereign?: {
    actions: Array<{
      id: string; declaredAt: number; intent: string; privateNotes?: string;
      status: "declared" | "in_progress" | "completed" | "abandoned";
      visibleEvidence: string; marksAwarded: number; completedAt?: number;
    }>;
  };
  grace: AppState["grace"];
  oracle: AppState["oracle"];
};

type V3State = {
  version: 3;
  createdAt: number;
  invocationCompletedAt?: number;
  privacyMode: PrivacyMode;
  gates: AppState["gates"];
  gate1: GateRuntimeState;
  cabinet: {
    encounters: Array<Omit<CabinetEncounter, "markedLyrics"> & { markedLyrics?: string[] }>;
    recentTriads: string[][];
  };
  sovereign: AppState["sovereign"];
  grace: AppState["grace"];
  oracle: AppState["oracle"];
};

type V4State = Omit<AppState, "version" | "gateState"> & {
  version: 4;
  gate1: GateRuntimeState;
};

function migrateV2toV3(v2: V2State): V3State {
  const statusMap: Record<string, ActionStatusV3> = {
    declared: "chosen",
    in_progress: "scheduled",
    completed: "completed",
    abandoned: "abandoned",
  };
  const migratedActions: SovereignAction[] = (v2.sovereign?.actions ?? []).map((a) => ({
    id: a.id,
    declaredAt: a.declaredAt,
    principle: "",
    action: a.intent,
    benefit: "",
    scale: "micro" as ActionScale,
    domain: "spirit" as DomainId,
    status: statusMap[a.status] ?? "chosen",
    visibleEvidence: a.visibleEvidence,
    privateNotes: a.privateNotes,
    marksAwarded: a.marksAwarded,
    completedAt: a.completedAt,
    sealedAt: a.marksAwarded > 0 ? a.completedAt : undefined,
    intent: a.intent,
  }));

  return {
    version: 3,
    createdAt: v2.createdAt,
    invocationCompletedAt: v2.invocationCompletedAt,
    privacyMode: v2.privacyMode,
    gates: v2.gates,
    gate1: v2.gate1,
    cabinet: { encounters: [], recentTriads: [] }, // v2 cabinet was placeholder data only
    sovereign: { actions: migratedActions, graceMarks: 0, graceMessages: [] },
    grace: v2.grace,
    oracle: v2.oracle,
  };
}

// ── v3 → v4 migration: backfill markedLyrics on every cabinet encounter ───
function migrateV3toV4(v3: V3State): V4State {
  return {
    version: 4,
    createdAt: v3.createdAt,
    invocationCompletedAt: v3.invocationCompletedAt,
    privacyMode: v3.privacyMode,
    gates: v3.gates,
    gate1: v3.gate1,
    cabinet: {
      encounters: (v3.cabinet?.encounters ?? []).map((e) => ({
        ...e,
        markedLyrics: e.markedLyrics ?? [],
      })),
      recentTriads: v3.cabinet?.recentTriads ?? [],
    },
    sovereign: v3.sovereign,
    grace: v3.grace,
    oracle: v3.oracle,
  };
}

// ── v4 → v5 migration: lift state.gate1 into state.gateState[1] ───────────
function migrateV4toV5(v4: V4State): AppState {
  const fresh = emptyGateState();
  fresh[1] = v4.gate1 ?? defaultGateRuntime();
  return {
    version: 5,
    createdAt: v4.createdAt,
    invocationCompletedAt: v4.invocationCompletedAt,
    privacyMode: v4.privacyMode,
    gates: v4.gates,
    gateState: fresh,
    cabinet: v4.cabinet,
    sovereign: v4.sovereign,
    grace: v4.grace,
    oracle: v4.oracle,
  };
}

function hydrateV5(parsed: Record<string, unknown>): AppState {
  const s = parsed as AppState;
  if (!s.gateState) s.gateState = emptyGateState();
  // Backfill any missing gate slots.
  ([1, 2, 3, 4, 5, 6, 7] as GateId[]).forEach((id) => {
    if (!s.gateState[id]) s.gateState[id] = defaultGateRuntime();
  });
  if (!s.cabinet) s.cabinet = { encounters: [], recentTriads: [] };
  if (!s.cabinet.encounters) s.cabinet.encounters = [];
  if (!s.cabinet.recentTriads) s.cabinet.recentTriads = [];
  s.cabinet.encounters = s.cabinet.encounters.map((e) => ({
    ...e,
    markedLyrics: Array.isArray(e.markedLyrics) ? e.markedLyrics : [],
  }));
  if (!s.sovereign) s.sovereign = { actions: [], graceMarks: 0, graceMessages: [] };
  if (!s.sovereign.graceMessages) s.sovereign.graceMessages = [];
  if (typeof s.sovereign.graceMarks !== "number") s.sovereign.graceMarks = 0;
  return s;
}

export function loadState(): AppState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
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
    const parsed = JSON.parse(raw);
    if (parsed.version === 5) {
      return hydrateV5(parsed);
    }
    if (parsed.version === 4) {
      const migrated = migrateV4toV5(parsed as V4State);
      saveState(migrated);
      return migrated;
    }
    if (parsed.version === 3) {
      const migrated = migrateV4toV5(migrateV3toV4(parsed as V3State));
      saveState(migrated);
      return migrated;
    }
    if (parsed.version === 2) {
      const migrated = migrateV4toV5(migrateV3toV4(migrateV2toV3(parsed as V2State)));
      saveState(migrated);
      return migrated;
    }
    return defaultState();
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
