import { describe, expect, it } from "vitest";
import { GATE1_CANONICAL_MANIFEST, validateCanonicalManifest } from "../gate1/manifest";
import { GATE1_QUESTIONS } from "../gate1/questions";
import { GATE1_PROTECTED_ROUTE_MAP } from "../gate1/routeBindings.protected";
import type { Gate1CanonicalManifest } from "../manifest/sceneTypes";
import { validateQuestionPreparation } from "../manifest/graphValidation";

describe("Gate 1 canonical manifest", () => {
  it("contains exactly 34 scenes in the required groups", () => {
    expect(GATE1_CANONICAL_MANIFEST.scenes).toHaveLength(34);
    expect(
      Object.fromEntries(
        ["shared_opening", "false_arrival", "splintered_trust", "shared_closing"].map((group) => [
          group,
          GATE1_CANONICAL_MANIFEST.scenes.filter((scene) => scene.group === group).length,
        ]),
      ),
    ).toEqual({ shared_opening: 12, false_arrival: 8, splintered_trust: 9, shared_closing: 5 });
  });

  it("preserves every frozen major question exactly", () => {
    const prompts = GATE1_CANONICAL_MANIFEST.scenes.map((scene) => scene.participant.prompt);
    for (const question of Object.values(GATE1_QUESTIONS)) {
      expect(prompts).toContain(question.prompt);
    }
  });

  it("preserves the exact core purpose and distinctions", () => {
    expect(GATE1_CANONICAL_MANIFEST.corePurpose).toBe(
      "Recognize an inherited promise, authority, role, expectation, or structure that no longer deserves automatic obedience.",
    );
    expect(GATE1_CANONICAL_MANIFEST.coreDistinctions).toEqual([
      "Event ≠ Promise",
      "Recognition ≠ Freedom",
      "Suspicion ≠ Sovereignty",
      "Planning ≠ Reality contact",
    ]);
  });

  it("preserves the protected route laws and seal lines", () => {
    expect(Object.values(GATE1_PROTECTED_ROUTE_MAP).map((route) => route.symbolicLaw)).toEqual([
      "The first crack is not the crossing.",
      "Suspicion is not sovereignty when it refuses all signal.",
    ]);
    expect(
      Object.values(GATE1_PROTECTED_ROUTE_MAP).every((route) => route.sealLine.length > 0),
    ).toBe(true);
  });

  it("passes complete canonical validation", () => {
    expect(() => validateCanonicalManifest(GATE1_CANONICAL_MANIFEST)).not.toThrow();
  });

  it.each(Object.entries(GATE1_QUESTIONS))(
    "rejects removed or replaced preparation for the %s major question",
    (_name, question) => {
      const questionScene = GATE1_CANONICAL_MANIFEST.scenes.find(
        (scene) => scene.protected?.canonicalQuestionId === question.canonicalQuestionId,
      )!;
      const mutate = (replacement: readonly { key: string; source: "shared" }[]) =>
        ({
          ...GATE1_CANONICAL_MANIFEST,
          scenes: GATE1_CANONICAL_MANIFEST.scenes.map((scene) =>
            scene === questionScene ? { ...scene, prerequisites: replacement } : scene,
          ),
        }) as Gate1CanonicalManifest;

      expect(() => validateQuestionPreparation(mutate([]))).toThrow();
      expect(() =>
        validateQuestionPreparation(mutate([{ key: "g1.unrelated", source: "shared" }])),
      ).toThrow();
    },
  );

  it("encodes the shared and active-route preparation milestones", () => {
    const scene = (id: string) =>
      GATE1_CANONICAL_MANIFEST.scenes.find((candidate) => candidate.canonicalSceneId === id)!;
    expect(scene("G1-03").prerequisites).toContainEqual({
      key: "g1.inscription_fractured",
      source: "shared",
    });
    expect(scene("G1-06").prerequisites).toContainEqual({
      key: "g1.promise_recognition_completed",
      source: "shared",
    });
    expect(scene("G1-09").prerequisites).toContainEqual({
      key: "g1.obstruction_established",
      source: "shared",
    });
    for (const id of ["FA-03", "ST-03"]) {
      expect(scene(id).prerequisites).toContainEqual({
        key: "g1.active_route_distinction_established",
        source: "active_route",
      });
    }
    for (const id of ["FA-08", "ST-09"]) {
      expect(scene(id).prerequisites).toContainEqual({
        key: "g1.active_route_gate_act_formed",
        source: "active_route",
      });
    }
    expect(scene("G1-16").prerequisites).toContainEqual({
      key: "g1.book_withdrawn",
      source: "shared",
    });
  });

  it("rejects a broken later-route authorization chain", () => {
    const scenes = GATE1_CANONICAL_MANIFEST.scenes.map((scene) =>
      scene.canonicalSceneId === "FA-05" ? { ...scene, prerequisites: [] } : scene,
    );
    expect(() => validateCanonicalManifest({ ...GATE1_CANONICAL_MANIFEST, scenes })).toThrow(
      "sequential preparation",
    );
  });
});
