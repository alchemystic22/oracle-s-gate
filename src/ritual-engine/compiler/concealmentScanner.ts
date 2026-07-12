const PROTECTED_PATTERNS: readonly RegExp[] = [
  /false arrival/i,
  /splintered trust/i,
  /false_arrival/i,
  /splintered_trust/i,
  /false-arrival/i,
  /splintered-trust/i,
  /\b(?:G1|FA|ST)-\d{2}\b/i,
  /\bG1Q-[A-Z0-9-]+\b/i,
  /canonicalRouteId/i,
  /canonicalSceneId/i,
  /canonicalQuestionId/i,
  /architectMeaning/i,
  /founderNotes/i,
  /evaluatorContractId/i,
  /safetyProfileId/i,
];

export function scanParticipantObjectForProtectedTerms(value: unknown): readonly string[] {
  const findings: string[] = [];

  function scan(current: unknown, path: string): void {
    if (typeof current === "string") {
      if (PROTECTED_PATTERNS.some((pattern) => pattern.test(current))) findings.push(path);
      return;
    }
    if (Array.isArray(current)) {
      current.forEach((item, index) => scan(item, `${path}[${index}]`));
      return;
    }
    if (!current || typeof current !== "object") return;
    for (const [key, nested] of Object.entries(current)) {
      if (PROTECTED_PATTERNS.some((pattern) => pattern.test(key))) findings.push(`${path}.${key}`);
      scan(nested, `${path}.${key}`);
    }
  }

  scan(value, "$participant");
  return findings;
}
