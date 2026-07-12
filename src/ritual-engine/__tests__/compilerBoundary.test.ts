import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as participantCompiler from "../compiler";
import * as protectedCompiler from "../compiler/index.protected";

describe("compiler export boundary", () => {
  it("keeps protected compiler entry points out of the participant-safe barrel", () => {
    const participantBarrel = readFileSync(
      new URL("../compiler/index.ts", import.meta.url),
      "utf8",
    );
    for (const protectedMember of [
      "compileParticipantManifest",
      "compileRouteReassessment",
      "CompileParticipantManifestInput",
      "ProtectedRouteBinding",
      "CanonicalRoute",
    ]) {
      expect(participantBarrel).not.toContain(protectedMember);
      expect(participantCompiler).not.toHaveProperty(protectedMember);
    }
    expect(protectedCompiler).toHaveProperty("compileParticipantManifest");
    expect(protectedCompiler).toHaveProperty("compileRouteReassessment");
  });
});
