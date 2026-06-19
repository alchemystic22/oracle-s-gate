import type { GateId } from "../lib/state";
import type { GateContent } from "./gate-content";
import { GATE_1_CONTENT } from "./gate1";
import { GATE_2_CONTENT } from "./gate2";

/** Registry of per-gate content packs. Gates 3–7 are not yet authored. */
export const GATE_CONTENT: Partial<Record<GateId, GateContent>> = {
  1: GATE_1_CONTENT,
  2: GATE_2_CONTENT,
};

export function gateContent(id: number): GateContent | undefined {
  return GATE_CONTENT[id as GateId];
}
