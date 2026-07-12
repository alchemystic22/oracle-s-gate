import type { ProtectedRouteCanon } from "../manifest/sceneTypes";
import { FALSE_ARRIVAL_ROUTE_ID, SPLINTERED_TRUST_ROUTE_ID } from "./constants";

export const GATE1_PROTECTED_ROUTE_MAP = {
  [FALSE_ARRIVAL_ROUTE_ID]: {
    routeId: FALSE_ARRIVAL_ROUTE_ID,
    symbolicLaw: "The first crack is not the crossing.",
    oracleDistinction:
      "Do not confuse the crack with the crossing. Name what still has your obedience.",
    unlockEpigraph: "You saw the crack. Now you have stepped through it.",
    sealLine: "I do not mistake the crack for the crossing. What I saw, I now leave.",
    stanceMapping: "I see what was false. I am no longer bound by it.",
  },
  [SPLINTERED_TRUST_ROUTE_ID]: {
    routeId: SPLINTERED_TRUST_ROUTE_ID,
    symbolicLaw: "Suspicion is not sovereignty when it refuses all signal.",
    oracleDistinction:
      "Do not trust blindly. Do not distrust blindly. Find the signal that remains when authority is removed.",
    unlockEpigraph: "Trust need not return whole. It must return true.",
    sealLine:
      "I do not protect myself by refusing all signal. I listen with the discernment I have earned.",
    stanceMapping: "I see what was false. I cannot trust what comes next.",
  },
} as const satisfies Readonly<Record<string, ProtectedRouteCanon>>;
