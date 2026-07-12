import { describe, expect, it } from "vitest";
import {
  validateProtectedParticipantManifestMapping,
  type ProtectedParticipantCompilation,
} from "../compiler/index.protected";
import { scanParticipantObjectForProtectedTerms } from "../compiler/concealmentScanner";
import { FALSE_ARRIVAL_ROUTE_ID, SPLINTERED_TRUST_ROUTE_ID } from "../gate1/constants";
import { GATE1_CANONICAL_MANIFEST } from "../gate1/manifest";
import { compileStageProtected, createTestOpaqueIdFactory } from "./pass2Fixture";

const canonicalScenes = new Map(
  GATE1_CANONICAL_MANIFEST.scenes.map((scene) => [scene.canonicalSceneId, scene]),
);

describe("protected participant compilation mapping", () => {
  it.each([FALSE_ARRIVAL_ROUTE_ID, SPLINTERED_TRUST_ROUTE_ID])(
    "maps every delivered runtime identity for %s",
    (routeId) => {
      const compilation = compileStageProtected("active_route", routeId);
      const { participantManifest: manifest, protectedMapping: mapping } = compilation;

      expect(mapping.manifestInstanceId).toBe(manifest.manifestInstanceId);
      expect(mapping.manifestDigest).toBe(manifest.digest);
      expect(mapping.gateManifestVersion).toBe(manifest.gateManifestVersion);
      expect(mapping.stage).toBe(manifest.stage);
      expect(mapping.compiledAtUtc).toBe(manifest.compiledAtUtc);
      expect(mapping.routeBinding).toEqual({
        protectedRouteId: routeId,
        routeToken: manifest.routeToken,
        routeBindingRevision: manifest.routeBindingRevision,
      });

      for (const scene of manifest.scenes) {
        const sceneMapping = mapping.scenes[scene.runtimeSceneId];
        expect(sceneMapping).toBeDefined();
        const canonicalScene = canonicalScenes.get(sceneMapping!.canonicalSceneId)!;

        if (scene.interaction) {
          expect(mapping.interactions[scene.interaction.runtimeInteractionId]).toEqual({
            canonicalSceneId: sceneMapping!.canonicalSceneId,
            kind: scene.interaction.kind,
          });
          if (scene.interaction.runtimeQuestionId) {
            expect(mapping.questions[scene.interaction.runtimeQuestionId]).toEqual({
              canonicalSceneId: sceneMapping!.canonicalSceneId,
              canonicalQuestionId: canonicalScene.protected?.canonicalQuestionId,
            });
          }
        }

        for (const transition of scene.transitions) {
          const transitionMapping = mapping.transitions[transition.runtimeTransitionId];
          const targetMapping = mapping.scenes[transition.targetRuntimeSceneId];
          expect(transitionMapping).toEqual({
            fromCanonicalSceneId: sceneMapping!.canonicalSceneId,
            toCanonicalSceneId: targetMapping!.canonicalSceneId,
            canonicalRouteId: canonicalScene.transitions.find(
              (candidate) => candidate.targetSceneId === targetMapping!.canonicalSceneId,
            )?.routeId,
          });
        }
      }
      expect(() =>
        validateProtectedParticipantManifestMapping(compilation, GATE1_CANONICAL_MANIFEST),
      ).not.toThrow();
    },
  );

  it("keeps active route mappings isolated", () => {
    const falseArrival = compileStageProtected("active_route", FALSE_ARRIVAL_ROUTE_ID);
    const splinteredTrust = compileStageProtected("active_route", SPLINTERED_TRUST_ROUTE_ID);
    const falseArrivalIds = Object.values(falseArrival.protectedMapping.scenes).map(
      (entry) => entry.canonicalSceneId,
    );
    const splinteredTrustIds = Object.values(splinteredTrust.protectedMapping.scenes).map(
      (entry) => entry.canonicalSceneId,
    );
    expect(falseArrivalIds.some((id) => id.startsWith("ST-"))).toBe(false);
    expect(splinteredTrustIds.some((id) => id.startsWith("FA-"))).toBe(false);
  });

  it("maps pre-route only to G1-00 through G1-09 without a route binding", () => {
    const { protectedMapping } = compileStageProtected("pre_route");
    expect(Object.values(protectedMapping.scenes).map((entry) => entry.canonicalSceneId)).toEqual(
      Array.from({ length: 10 }, (_, index) => `G1-${String(index).padStart(2, "0")}`),
    );
    expect(protectedMapping.routeBinding).toBeUndefined();
  });

  it("maps completion only to G1-16 without a route binding", () => {
    const { protectedMapping } = compileStageProtected("completion");
    expect(Object.values(protectedMapping.scenes)).toEqual([{ canonicalSceneId: "G1-16" }]);
    expect(protectedMapping.routeBinding).toBeUndefined();
  });

  it("keeps the protected mapping entirely outside participant output", () => {
    const { participantManifest } = compileStageProtected("active_route", FALSE_ARRIVAL_ROUTE_ID);
    expect(scanParticipantObjectForProtectedTerms(participantManifest)).toEqual([]);
    const serialized = JSON.stringify(participantManifest);
    for (const protectedField of [
      "protectedMapping",
      "canonicalSceneId",
      "canonicalQuestionId",
      "canonicalRouteId",
      "protectedRouteId",
    ]) {
      expect(serialized).not.toContain(protectedField);
    }
  });

  it("rejects removed, duplicated, and orphaned mapping entries", () => {
    const original = compileStageProtected("active_route", FALSE_ARRIVAL_ROUTE_ID);
    const sceneIds = Object.keys(original.protectedMapping.scenes);

    const removed = structuredClone(original) as ProtectedParticipantCompilation;
    delete (removed.protectedMapping.scenes as Record<string, unknown>)[sceneIds[0]!];
    expect(() =>
      validateProtectedParticipantManifestMapping(removed, GATE1_CANONICAL_MANIFEST),
    ).toThrow();

    const duplicated = structuredClone(original) as ProtectedParticipantCompilation;
    (duplicated.protectedMapping.scenes as Record<string, unknown>)[sceneIds[1]!] = {
      ...duplicated.protectedMapping.scenes[sceneIds[0]!],
    };
    expect(() =>
      validateProtectedParticipantManifestMapping(duplicated, GATE1_CANONICAL_MANIFEST),
    ).toThrow();

    const orphaned = structuredClone(original) as ProtectedParticipantCompilation;
    (orphaned.protectedMapping.scenes as Record<string, unknown>).opaqueorphan00000001 = {
      canonicalSceneId: "G1-16",
    };
    expect(() =>
      validateProtectedParticipantManifestMapping(orphaned, GATE1_CANONICAL_MANIFEST),
    ).toThrow();
  });

  it("creates independent mappings for repeated compilations", () => {
    const factory = createTestOpaqueIdFactory();
    const first = compileStageProtected("active_route", FALSE_ARRIVAL_ROUTE_ID, factory);
    const snapshot = structuredClone(first.protectedMapping);
    const second = compileStageProtected("active_route", FALSE_ARRIVAL_ROUTE_ID, factory);
    expect(first.protectedMapping).toEqual(snapshot);
    expect(second.protectedMapping).not.toBe(first.protectedMapping);
    expect(second.protectedMapping.manifestInstanceId).not.toBe(
      first.protectedMapping.manifestInstanceId,
    );
  });
});
