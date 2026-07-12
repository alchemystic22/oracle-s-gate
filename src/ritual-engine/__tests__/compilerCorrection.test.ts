import { describe, expect, it } from "vitest";
import type { CanonicalSceneId } from "../domain/ids";
import { isOpaqueIdentifier } from "../compiler/opaqueIds";
import { compileParticipantManifest } from "../compiler/index.protected";
import type { ParticipantManifest } from "../compiler/types";
import { GATE1_PARTICIPANT_ASSET_REGISTRY } from "../gate1/assets";
import { FALSE_ARRIVAL_ROUTE_ID, SPLINTERED_TRUST_ROUTE_ID } from "../gate1/constants";
import { GATE1_CANONICAL_MANIFEST } from "../gate1/manifest";
import { GATE1_PROTECTED_ROUTE_MAP } from "../gate1/routeBindings.protected";
import type { Gate1CanonicalManifest } from "../manifest/sceneTypes";
import {
  COMPILED_AT,
  ROUTE_TOKEN_A,
  compileStage,
  createTestOpaqueIdFactory,
} from "./pass2Fixture";

function compileWith(manifest: Gate1CanonicalManifest): ParticipantManifest {
  return compileParticipantManifest({
    canonicalManifest: manifest,
    stage: "active_route",
    routeBinding: {
      protectedRouteId: FALSE_ARRIVAL_ROUTE_ID,
      routeToken: ROUTE_TOKEN_A,
      routeBindingRevision: 1,
    },
    opaqueIdFactory: createTestOpaqueIdFactory(),
    participantAssetRegistry: GATE1_PARTICIPANT_ASSET_REGISTRY,
    compiledAtUtc: COMPILED_AT,
  }).participantManifest;
}

describe("canonical graph compilation authority", () => {
  it("preserves compiled progression when canonical scene storage order changes", () => {
    const reordered = {
      ...GATE1_CANONICAL_MANIFEST,
      scenes: [...GATE1_CANONICAL_MANIFEST.scenes].reverse(),
    };
    expect(compileWith(reordered)).toEqual(compileWith(GATE1_CANONICAL_MANIFEST));
  });

  it("rejects a malformed canonical manifest before compilation", () => {
    const malformed = {
      ...GATE1_CANONICAL_MANIFEST,
      sceneCount: 33,
    } as unknown as Gate1CanonicalManifest;
    expect(() => compileWith(malformed)).toThrow("exactly 34");
  });

  it.each(["missing", "altered"] as const)(
    "rejects a %s canonical transition instead of replacing it with array order",
    (mutation) => {
      const scenes = GATE1_CANONICAL_MANIFEST.scenes.map((scene) =>
        scene.canonicalSceneId === "G1-10"
          ? {
              ...scene,
              transitions:
                mutation === "missing" ? [] : [{ targetSceneId: "G1-12" as CanonicalSceneId }],
            }
          : scene,
      );
      expect(() => compileWith({ ...GATE1_CANONICAL_MANIFEST, scenes })).toThrow();
    },
  );
});

describe("complete participant opacity", () => {
  it("assigns unique opaque interaction, question, and transition identities", () => {
    const factory = createTestOpaqueIdFactory();
    const manifests = [
      compileStage("pre_route", undefined, factory),
      compileStage("active_route", FALSE_ARRIVAL_ROUTE_ID, factory),
      compileStage("active_route", SPLINTERED_TRUST_ROUTE_ID, factory),
      compileStage("completion", undefined, factory),
    ];
    const interactions = manifests.flatMap((manifest) =>
      manifest.scenes.flatMap((scene) => (scene.interaction ? [scene.interaction] : [])),
    );
    const interactionIds = interactions.map((interaction) => interaction.runtimeInteractionId);
    const questionIds = interactions.flatMap((interaction) =>
      interaction.runtimeQuestionId ? [interaction.runtimeQuestionId] : [],
    );
    const transitionIds = manifests.flatMap((manifest) =>
      manifest.scenes.flatMap((scene) =>
        scene.transitions.map((transition) => transition.runtimeTransitionId),
      ),
    );

    expect(new Set(interactionIds).size).toBe(interactionIds.length);
    expect(new Set(questionIds).size).toBe(questionIds.length);
    expect(new Set(transitionIds).size).toBe(transitionIds.length);
    expect([...interactionIds, ...questionIds, ...transitionIds].every(isOpaqueIdentifier)).toBe(
      true,
    );
    for (const manifest of manifests) {
      for (const scene of manifest.scenes) {
        if (scene.interaction && (scene.prompt || scene.interaction.kind !== "acknowledgment")) {
          expect(scene.interaction.runtimeQuestionId).toBeDefined();
        }
      }
    }
    expect(JSON.stringify(manifests)).not.toMatch(/G1Q-/);
  });
});

describe("active-route symbolic law delivery", () => {
  it.each([
    [FALSE_ARRIVAL_ROUTE_ID, SPLINTERED_TRUST_ROUTE_ID],
    [SPLINTERED_TRUST_ROUTE_ID, FALSE_ARRIVAL_ROUTE_ID],
  ] as const)("delivers only the selected route law", (activeRouteId, inactiveRouteId) => {
    const serialized = JSON.stringify(compileStage("active_route", activeRouteId));
    const active = GATE1_PROTECTED_ROUTE_MAP[activeRouteId];
    const inactive = GATE1_PROTECTED_ROUTE_MAP[inactiveRouteId];
    expect(serialized).toContain(active.symbolicLaw);
    expect(serialized).toContain(active.oracleDistinction);
    expect(serialized).not.toContain(inactive.symbolicLaw);
  });
});
