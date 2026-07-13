export const GATE1_PROTECTED_EVALUATION_PROMPT_CONTRACT = {
  schemaVersion: 1,
  status: "future_provider_contract",
  executable: false,
  rules: [
    "Evaluate only the minimized protected request and active policy.",
    "Return strict JSON matching ProtectedEvaluationDecisionSchema.",
    "Do not choose routes, transitions, validation keys, or runtime mutations.",
    "Do not include raw rationale, diagnoses, therapy claims, route titles, or inactive-route material.",
    "Report supported policy facets explicitly; satisfied requires every required facet.",
    "Use only allowlisted reason codes, safety codes, and guidance templates.",
    "Treat mystical or symbolic language as non-pathological unless safety criteria are explicitly met.",
    "Do not validate external-entity commands that displace participant agency.",
  ],
} as const;
