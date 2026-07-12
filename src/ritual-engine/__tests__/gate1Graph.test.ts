import { describe, expect, it } from "vitest";
import type { CanonicalSceneId } from "../domain/ids";
import type { Gate1CanonicalManifest } from "../manifest/sceneTypes";
import {
  resolveCanonicalPath,
  validateRouteConvergence,
  validateSceneGraph,
} from "../manifest/graphValidation";
import { GATE1_CANONICAL_MANIFEST } from "../gate1/manifest";
import { GATE1_ROUTE_IDS } from "../gate1/constants";

describe("Gate 1 canonical graph", () => {
  it("rejects duplicate canonical scene IDs", () => {
    const duplicate = {
      ...GATE1_CANONICAL_MANIFEST,
      scenes: [...GATE1_CANONICAL_MANIFEST.scenes, GATE1_CANONICAL_MANIFEST.scenes[0]!],
    } as Gate1CanonicalManifest;
    expect(() => validateSceneGraph(duplicate)).toThrow();
  });

  it("rejects missing transition targets", () => {
    const scenes = GATE1_CANONICAL_MANIFEST.scenes.map((scene) =>
      scene.canonicalSceneId === "G1-00"
        ? {
            ...scene,
            transitions: [{ targetSceneId: "MISSING" as CanonicalSceneId }],
          }
        : scene,
    );
    expect(() => validateSceneGraph({ ...GATE1_CANONICAL_MANIFEST, scenes })).toThrow();
  });

  it("converges both routes at the shared closing", () => {
    expect(() => validateRouteConvergence(GATE1_CANONICAL_MANIFEST, GATE1_ROUTE_IDS)).not.toThrow();
    for (const routeId of GATE1_ROUTE_IDS) {
      expect(resolveCanonicalPath(GATE1_CANONICAL_MANIFEST, routeId)).toContain("G1-12");
    }
  });

  it("has exact full path lengths of 25 and 26", () => {
    expect(
      GATE1_ROUTE_IDS.map(
        (routeId) => resolveCanonicalPath(GATE1_CANONICAL_MANIFEST, routeId).length,
      ),
    ).toEqual([25, 26]);
  });

  it("keeps the hidden page shared and readiness active-route conditional", () => {
    const hiddenPage = GATE1_CANONICAL_MANIFEST.scenes.find(
      (scene) => scene.canonicalSceneId === "G1-11",
    )!;
    const readiness = GATE1_CANONICAL_MANIFEST.scenes.find(
      (scene) => scene.canonicalSceneId === "G1-12",
    )!;
    expect(hiddenPage.group).toBe("shared_opening");
    expect(hiddenPage.prerequisites).toEqual([{ key: "g1.book_emerged", source: "shared" }]);
    expect(
      readiness.prerequisites.filter((requirement) => requirement.source === "active_route"),
    ).toHaveLength(2);
  });
});
