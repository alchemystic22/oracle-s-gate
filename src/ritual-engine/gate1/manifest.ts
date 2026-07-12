import type { CanonicalSceneGroup, Gate1CanonicalManifest } from "../manifest/sceneTypes";
import {
  ManifestValidationError,
  resolveCanonicalPath,
  validateQuestionPreparation,
  validatePreparationFlow,
  validateRouteConvergence,
  validateSceneGraph,
} from "../manifest/graphValidation";
import {
  GATE1_FORMAL_NAME,
  GATE1_MANIFEST_VERSION,
  GATE1_ROUTE_IDS,
  GATE1_SUBTITLE,
} from "./constants";
import { GATE1_QUESTIONS } from "./questions";
import { GATE1_SHARED_CLOSING_SCENES, GATE1_SHARED_OPENING_SCENES } from "./scenes.shared";
import { GATE1_FALSE_ARRIVAL_SCENES } from "./scenes.falseArrival.protected";
import { GATE1_SPLINTERED_TRUST_SCENES } from "./scenes.splinteredTrust.protected";
import { GATE1_PROTECTED_ROUTE_MAP } from "./routeBindings.protected";

export const GATE1_CANONICAL_MANIFEST: Gate1CanonicalManifest = {
  manifestId: "gate1-broken-vow-canonical-v1",
  version: GATE1_MANIFEST_VERSION,
  gateId: 1,
  formalName: GATE1_FORMAL_NAME,
  subtitle: GATE1_SUBTITLE,
  corePurpose:
    "Recognize an inherited promise, authority, role, expectation, or structure that no longer deserves automatic obedience.",
  coreDistinctions: [
    "Event ≠ Promise",
    "Recognition ≠ Freedom",
    "Suspicion ≠ Sovereignty",
    "Planning ≠ Reality contact",
  ],
  sceneCount: 34,
  scenes: [
    ...GATE1_SHARED_OPENING_SCENES,
    ...GATE1_FALSE_ARRIVAL_SCENES,
    ...GATE1_SPLINTERED_TRUST_SCENES,
    ...GATE1_SHARED_CLOSING_SCENES,
  ],
  protectedRouteMap: GATE1_PROTECTED_ROUTE_MAP,
};

const EXPECTED_GROUP_COUNTS: Record<CanonicalSceneGroup, number> = {
  shared_opening: 12,
  false_arrival: 8,
  splintered_trust: 9,
  shared_closing: 5,
};

export function validateCanonicalManifest(manifest: Gate1CanonicalManifest): void {
  if (manifest.sceneCount !== 34 || manifest.scenes.length !== 34) {
    throw new ManifestValidationError("Gate 1 requires exactly 34 canonical scenes");
  }

  for (const [group, count] of Object.entries(EXPECTED_GROUP_COUNTS)) {
    if (manifest.scenes.filter((scene) => scene.group === group).length !== count) {
      throw new ManifestValidationError("Gate 1 canonical scene group count is invalid");
    }
  }

  validateSceneGraph(manifest);
  validatePreparationFlow(manifest, GATE1_ROUTE_IDS);
  validateQuestionPreparation(manifest);
  validateRouteConvergence(manifest, GATE1_ROUTE_IDS);

  const prompts = new Set(manifest.scenes.map((scene) => scene.participant.prompt));
  for (const question of Object.values(GATE1_QUESTIONS)) {
    if (!prompts.has(question.prompt)) {
      throw new ManifestValidationError("A frozen Gate 1 question is missing or changed");
    }
  }

  const hiddenPage = manifest.scenes.find((scene) => scene.canonicalSceneId === "G1-11");
  if (
    hiddenPage?.group !== "shared_opening" ||
    hiddenPage.prerequisites.length !== 1 ||
    hiddenPage.prerequisites[0]?.key !== "g1.book_emerged"
  ) {
    throw new ManifestValidationError("The shared hidden page prerequisite is invalid");
  }

  const readiness = manifest.scenes.find((scene) => scene.canonicalSceneId === "G1-12");
  if (
    readiness?.prerequisites.filter((requirement) => requirement.source === "active_route")
      .length !== 2
  ) {
    throw new ManifestValidationError("Readiness must require active-route action and evidence");
  }

  const pathLengths = GATE1_ROUTE_IDS.map(
    (routeId) => resolveCanonicalPath(manifest, routeId).length,
  );
  if (pathLengths[0] !== 25 || pathLengths[1] !== 26) {
    throw new ManifestValidationError("Gate 1 canonical path lengths are invalid");
  }
}

validateCanonicalManifest(GATE1_CANONICAL_MANIFEST);
