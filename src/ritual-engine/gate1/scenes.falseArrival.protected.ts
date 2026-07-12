import { reassessRouteAction } from "../manifest/interactions";
import type { CanonicalSceneDefinition } from "../manifest/sceneTypes";
import { FALSE_ARRIVAL_ROUTE_ID } from "./constants";
import { GATE1_ASSET_KEYS } from "./assets";
import { GATE1_QUESTIONS } from "./questions";
import {
  defineGate1Scene,
  establishes,
  requiresShared,
  transitionTo,
} from "./sceneFactory.protected";
import { GATE1_VALIDATION_KEYS as V } from "./validationKeys.protected";
import { GATE1_PROTECTED_ROUTE_MAP } from "./routeBindings.protected";

const route = GATE1_PROTECTED_ROUTE_MAP[FALSE_ARRIVAL_ROUTE_ID];
const protectedRoute = { routeId: FALSE_ARRIVAL_ROUTE_ID } as const;

export const GATE1_FALSE_ARRIVAL_SCENES: readonly CanonicalSceneDefinition[] = [
  defineGate1Scene({
    id: "FA-01",
    group: "false_arrival",
    type: "symbolic_encounter",
    title: "Visible Chain",
    purpose: "Encounter continued obedience after recognition",
    assetRefs: [GATE1_ASSET_KEYS.symbolA],
    secondaryAction: reassessRouteAction(),
    prerequisites: [requiresShared(V.bookEmerged)],
    transitions: [transitionTo("FA-02")],
    protected: protectedRoute,
  }),
  defineGate1Scene({
    id: "FA-02",
    group: "false_arrival",
    type: "oracle_distinction",
    title: "Sight and Departure",
    purpose: "Distinguish seeing the crack from crossing it",
    narration: [route.oracleDistinction],
    secondaryAction: reassessRouteAction(),
    transitions: [transitionTo("FA-03")],
    protected: protectedRoute,
  }),
  defineGate1Scene({
    id: "FA-03",
    group: "false_arrival",
    type: "question",
    title: "Route Axis Question",
    purpose: "Ask the exact False Arrival Axis Question",
    semanticSummary: "Ask the active hidden-page axis question",
    prompt: GATE1_QUESTIONS.falseArrivalAxis.prompt,
    interaction: { kind: "reflection" },
    secondaryAction: reassessRouteAction(),
    prerequisites: [requiresShared(V.gateAxisAnswered)],
    establishes: [establishes(V.routeAxisAnswered)],
    transitions: [transitionTo("FA-04")],
    protected: {
      ...protectedRoute,
      canonicalQuestionId: GATE1_QUESTIONS.falseArrivalAxis.canonicalQuestionId,
    },
  }),
  defineGate1Scene({
    id: "FA-04",
    group: "false_arrival",
    type: "question",
    title: "Broken Structure",
    purpose: "Name the broken promise or structure",
    prompt: "Name the broken promise or structure.",
    interaction: { kind: "reflection" },
    secondaryAction: reassessRouteAction(),
    transitions: [transitionTo("FA-05")],
    protected: protectedRoute,
  }),
  defineGate1Scene({
    id: "FA-05",
    group: "false_arrival",
    type: "question",
    title: "False Arrival Moment",
    purpose: "Name where recognition was mistaken for freedom",
    prompt: GATE1_QUESTIONS.falseArrivalAxis.prompt,
    interaction: { kind: "reflection" },
    secondaryAction: reassessRouteAction(),
    transitions: [transitionTo("FA-06")],
    protected: protectedRoute,
  }),
  defineGate1Scene({
    id: "FA-06",
    group: "false_arrival",
    type: "question",
    title: "Allegiance Still Active",
    purpose: "Name what still receives obedience",
    prompt: "Name what still receives obedience.",
    interaction: { kind: "reflection" },
    secondaryAction: reassessRouteAction(),
    transitions: [transitionTo("FA-07")],
    protected: protectedRoute,
  }),
  defineGate1Scene({
    id: "FA-07",
    group: "false_arrival",
    type: "gate_act",
    title: "Interruption Formation",
    purpose: "Form one bounded interruption of active allegiance",
    interaction: { kind: "gate_act" },
    secondaryAction: reassessRouteAction(),
    establishes: [establishes(V.gateActFormed)],
    transitions: [transitionTo("FA-08")],
    protected: protectedRoute,
  }),
  defineGate1Scene({
    id: "FA-08",
    group: "false_arrival",
    type: "evidence",
    title: "Reality Contact",
    purpose: "Record one immediate micro-act outside reflection",
    interaction: { kind: "evidence" },
    secondaryAction: reassessRouteAction(),
    prerequisites: [requiresShared(V.gateActFormed)],
    establishes: [establishes(V.qualifyingEvidence)],
    transitions: [transitionTo("G1-12")],
    protected: protectedRoute,
  }),
];
