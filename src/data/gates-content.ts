import type { GateId } from "../lib/state";
import type { GateContent } from "./gate-content";
import { GATE_1_CONTENT } from "./gate1";
import { GATE_2_CONTENT } from "./gate2";
import { GATE_3_CONTENT } from "./gate3";
import { GATE_4_CONTENT } from "./gate4";
import { GATE_5_CONTENT } from "./gate5";
import { GATE_6_CONTENT } from "./gate6";

/** Registry of per-gate content packs. Gate 7 is not yet authored. */
export const GATE_CONTENT: Partial<Record<GateId, GateContent>> = {
  1: GATE_1_CONTENT,
  2: GATE_2_CONTENT,
  3: GATE_3_CONTENT,
  4: GATE_4_CONTENT,
  5: GATE_5_CONTENT,
  6: GATE_6_CONTENT,
};

export function gateContent(id: number): GateContent | undefined {
  return GATE_CONTENT[id as GateId];
}
