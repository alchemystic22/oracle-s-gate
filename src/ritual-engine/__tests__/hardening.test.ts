import { describe, expect, it } from "vitest";
import { EvidenceEventSchema } from "../domain/evidence";
import { CanonicalManifestSchema } from "../manifest/schema";

const now = new Date(0).toISOString();

describe("evidence semantics", () => {
  it("accepts the required attestation for each evidence event", () => {
    const base = {
      evidenceEventId: "e1",
      gateActId: "a1",
      mode: "completion_marker",
      occurredAtUtc: now,
    };

    expect(
      EvidenceEventSchema.safeParse({
        ...base,
        eventType: "micro_act_completed",
        participantAttestation: "occurred_outside_reflection",
      }).success,
    ).toBe(true);
    expect(
      EvidenceEventSchema.safeParse({
        ...base,
        eventType: "continuation_scheduled",
        participantAttestation: "scheduled_only",
      }).success,
    ).toBe(true);
  });

  it("rejects contradictory evidence combinations", () => {
    const base = {
      evidenceEventId: "e1",
      gateActId: "a1",
      mode: "completion_marker",
      occurredAtUtc: now,
    };

    expect(
      EvidenceEventSchema.safeParse({
        ...base,
        eventType: "micro_act_completed",
        participantAttestation: "scheduled_only",
      }).success,
    ).toBe(false);
    expect(
      EvidenceEventSchema.safeParse({
        ...base,
        eventType: "continuation_scheduled",
        participantAttestation: "occurred_outside_reflection",
      }).success,
    ).toBe(false);
  });
});

describe("canonical manifest invariants", () => {
  const scene = {
    canonicalSceneId: "scene-1",
    type: "threshold",
    participant: {},
  };

  it("requires sceneCount to equal scenes.length", () => {
    const result = CanonicalManifestSchema.safeParse({
      manifestId: "manifest-1",
      version: "1.0.0",
      gateId: 1,
      sceneCount: 2,
      scenes: [scene],
    });
    expect(result.success).toBe(false);
  });

  it("requires unique canonical scene identifiers", () => {
    const result = CanonicalManifestSchema.safeParse({
      manifestId: "manifest-1",
      version: "1.0.0",
      gateId: 1,
      sceneCount: 2,
      scenes: [scene, { ...scene }],
    });
    expect(result.success).toBe(false);
  });
});
