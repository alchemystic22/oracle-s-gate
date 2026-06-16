// Single localStorage key. No analytics. No external calls.

import type { DomainId } from "../data/domains";

const KEY = "alchemystic_state_v2"; // legacy key, still used for v2/v3 reads (we migrate in place)

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

// ── Legacy action status (Gate 1) ─────────────────────────────────────────
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
};

// ── Gate 1 ─────────────────────────────────────────────────────────────────

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
  anchors: Partial<Record<Gate1State["phase"], number>>;
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

// ── Root state ─────────────────────────────────────────────────────────────

export type AppState = {
  version: 3;
  createdAt: number;
  invocationCompletedAt?: number;
  privacyMode: PrivacyMode;
  gates: Record<GateId, {
    visitedAt?: number;
    completedAt?: number;
    routeTaken?: "false_arrival" | "splintered_trust";
  }>;
  gate1: Gate1State;
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
    version: 3,
    createdAt: Date.now(),
    privacyMode: "completion_marker_only",
    gates: { 1: emptyGate(), 2: emptyGate(), 3: emptyGate(), 4: emptyGate(), 5: emptyGate(), 6: emptyGate(), 7: emptyGate() },
    gate1: defaultGate1(),
    cabinet: { encounters: [], recentTriads: [] },
    sovereign: { actions: [], graceMarks: 0, graceMessages: [] },
    grace: { events: [] },
    oracle: { visits: 0 },
  };
}

// ── v2 → v3 migration ─────────────────────────────────────────────────────
type V2State = Omit<AppState, "version" | "cabinet" | "sovereign"> & {
  version: 2;
  cabinet?: { drawnPassageIds?: string[]; reflectionIds?: string[] };
  sovereign?: {
    actions: Array<{
      id: string; declaredAt: number; intent: string; privateNotes?: string;
      status: "declared" | "in_progress" | "completed" | "abandoned";
      visibleEvidence: string; marksAwarded: number; completedAt?: number;
    }>;
  };
};

function migrateV2toV3(v2: V2State): AppState {
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
    if (parsed.version === 3) {
      // Defensive backfills
      if (!parsed.gate1) parsed.gate1 = defaultGate1();
      if (!parsed.cabinet) parsed.cabinet = { encounters: [], recentTriads: [] };
      if (!parsed.cabinet.encounters) parsed.cabinet.encounters = [];
      if (!parsed.cabinet.recentTriads) parsed.cabinet.recentTriads = [];
      if (!parsed.sovereign) parsed.sovereign = { actions: [], graceMarks: 0, graceMessages: [] };
      if (!parsed.sovereign.graceMessages) parsed.sovereign.graceMessages = [];
      if (typeof parsed.sovereign.graceMarks !== "number") parsed.sovereign.graceMarks = 0;
      return parsed as AppState;
    }
    if (parsed.version === 2) {
      const migrated = migrateV2toV3(parsed as V2State);
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
