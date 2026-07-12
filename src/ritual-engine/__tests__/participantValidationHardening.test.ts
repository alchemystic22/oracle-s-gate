import { describe, expect, it } from "vitest";
import { validateParticipantManifest } from "../compiler/participantValidation";
import type { ParticipantManifest } from "../compiler/types";
import { FALSE_ARRIVAL_ROUTE_ID } from "../gate1/constants";
import { compileStage } from "./pass2Fixture";

function cloneManifest(): ParticipantManifest {
  return structuredClone(compileStage("active_route", FALSE_ARRIVAL_ROUTE_ID));
}

describe("participant graph validation hardening", () => {
  it("rejects an entry scene outside the manifest", () => {
    const manifest = { ...cloneManifest(), entryRuntimeSceneId: "opaqueentry000000000000" };
    expect(() => validateParticipantManifest(manifest)).toThrow("entry scene");
  });

  it("rejects a negative or fractional route binding revision", () => {
    for (const routeBindingRevision of [-1, 1.5]) {
      expect(() =>
        validateParticipantManifest({ ...cloneManifest(), routeBindingRevision }),
      ).toThrow("revision");
    }
  });

  it("rejects scenes that are unreachable from the entry", () => {
    const manifest = cloneManifest();
    const scenes = manifest.scenes.map((scene, index) =>
      index === 0 ? { ...scene, transitions: [] } : scene,
    );
    expect(() => validateParticipantManifest({ ...manifest, scenes })).toThrow("reachable");
  });

  it("rejects a cycle in the delivered graph", () => {
    const manifest = cloneManifest();
    const last = manifest.scenes.at(-1)!;
    const scenes = manifest.scenes.map((scene) =>
      scene.runtimeSceneId === last.runtimeSceneId
        ? {
            ...scene,
            transitions: [
              {
                runtimeTransitionId: "opaquecycletransition0001",
                targetRuntimeSceneId: manifest.entryRuntimeSceneId,
              },
            ],
          }
        : scene,
    );
    expect(() => validateParticipantManifest({ ...manifest, scenes })).toThrow("acyclic");
  });

  it("rejects a nonterminal final delivered scene", () => {
    const manifest = cloneManifest();
    const reversed = [...manifest.scenes].reverse();
    expect(() => validateParticipantManifest({ ...manifest, scenes: reversed })).toThrow(
      "final participant scene",
    );
  });
});
