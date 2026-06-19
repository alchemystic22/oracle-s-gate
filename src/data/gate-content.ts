// Per-gate content packs. The orchestrator (src/routes/gate.$gateId.tsx) is
// content-driven; everything that differs between gates lives here.

import type { GateId } from "../lib/state";
import type { RouteId } from "./correctives";

export type StanceCard = {
  text: string;
  route: RouteId;
};

export type GateContent = {
  id: GateId;
  /** Short label above the threshold image: "Gate 1", "Gate 2", … */
  numberLabel: string;
  /** Display name, e.g. "The Broken Vow". */
  name: string;
  /** One-line subtitle shown beneath the name on the threshold. */
  subtitle: string;
  /** Optional Latin inscription shown above the threshold image. */
  inscription?: string;
  /** Optional English translation of the inscription. */
  inscriptionTranslation?: string;
  /** Path to the threshold image; falls back to the CSS placeholder if missing. */
  thresholdImage: string;
  /** CSS aspect-ratio string for the threshold image, e.g. "1024 / 1536". */
  thresholdAspect: string;
  /** Optional: hide the chin-sphere + rotating ring overlays when the threshold image already supplies its own focal composition. Defaults to true. */
  thresholdRitualOverlays?: boolean;

  /** Epithet shown in the small header above the encounter / obstruction copy. */
  headerEpithet: string;
  /** Threshold time-lock copy (after 30s). Three measured lines. */
  thresholdCopy: string;
  /** Measured-beat paragraphs of the encounter framing. */
  encounterParas: string[];
  /** Single-line prompt shown above the encounter response field. */
  encounterQuestion: string;
  /** Faint hint above the encounter submit button (after 30s lock). */
  encounterSubmitHint: string;
  /** Obstruction framing copy, paragraph-stepped reveal. */
  obstructionParas: string[];
  /** Exactly two stance cards. Order is left, right. */
  stanceCards: [StanceCard, StanceCard];
  /** Closing screen copy. */
  closingCopy: string;
};
