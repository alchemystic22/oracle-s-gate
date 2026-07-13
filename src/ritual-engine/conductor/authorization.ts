export type AuthorizationFailureCode =
  | "rejected_stale"
  | "rejected_unauthorized"
  | "rejected_invalid";

export class ConductorAuthorizationError extends Error {
  constructor(
    readonly code: AuthorizationFailureCode,
    message: string,
  ) {
    super(message);
  }
}
