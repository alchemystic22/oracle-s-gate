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
      "ProtectedParticipantCompilation",
      "ProtectedParticipantManifestMapping",
      "protectedMapping",
    ]) {
      expect(participantBarrel).not.toContain(protectedMember);
      expect(participantCompiler).not.toHaveProperty(protectedMember);
    }
    expect(protectedCompiler).toHaveProperty("compileParticipantManifest");
    expect(protectedCompiler).toHaveProperty("compileRouteReassessment");
    expect(protectedCompiler).toHaveProperty("validateProtectedParticipantManifestMapping");
  });

  it("keeps protected mapping modules out of participant-safe compiler modules", () => {
    for (const moduleName of [
      "index.ts",
      "types.ts",
      "participantAllowlist.ts",
      "participantAssets.ts",
      "participantValidation.ts",
      "opaqueIds.ts",
      "concealmentScanner.ts",
    ]) {
      const source = readFileSync(new URL(`../compiler/${moduleName}`, import.meta.url), "utf8");
      expect(source).not.toMatch(/protected(?:Compilation|MappingValidation)\.protected/);
    }
  });
});
