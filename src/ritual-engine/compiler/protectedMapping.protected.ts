import type { CanonicalRouteId } from "../domain/ids";
import { compileParticipantManifest } from "./compileParticipantManifest";
import type {
  CompileParticipantManifestInput,
  ParticipantManifest,
  ProtectedRouteBinding,
} from "./types";

export type ProtectedReassessmentRecord = {
  priorManifestInstanceId: string;
  priorRouteToken: string;
  priorRouteBindingRevision: number;
  newManifestInstanceId: string;
  newRouteToken: string;
  newRouteBindingRevision: number;
  priorProtectedRouteId: CanonicalRouteId;
  newProtectedRouteId: CanonicalRouteId;
  retainedSharedOpening: true;
  staleDomains: readonly ["responses", "gate_act", "evidence", "validations"];
  reassessedAtUtc: string;
};

export type CompileRouteReassessmentInput = Omit<
  CompileParticipantManifestInput,
  "stage" | "routeBinding"
> & {
  previousManifest: ParticipantManifest;
  previousRouteBinding: ProtectedRouteBinding;
  routeBinding: ProtectedRouteBinding;
};

export function compileRouteReassessment(input: CompileRouteReassessmentInput): {
  participantManifest: ParticipantManifest;
  protectedRecord: ProtectedReassessmentRecord;
} {
  const previous = input.previousManifest;
  const previousBinding = input.previousRouteBinding;
  if (
    previous.stage !== "active_route" ||
    !previous.routeToken ||
    previous.routeBindingRevision === undefined ||
    input.routeBinding.routeToken === previous.routeToken ||
    input.routeBinding.routeBindingRevision <= previous.routeBindingRevision ||
    previousBinding.routeToken !== previous.routeToken ||
    previousBinding.routeBindingRevision !== previous.routeBindingRevision ||
    input.routeBinding.protectedRouteId === previousBinding.protectedRouteId
  ) {
    throw new Error("Route reassessment binding rotation is invalid");
  }

  const participantManifest = compileParticipantManifest({
    canonicalManifest: input.canonicalManifest,
    stage: "active_route",
    routeBinding: input.routeBinding,
    opaqueIdFactory: input.opaqueIdFactory,
    participantAssetRegistry: input.participantAssetRegistry,
    compiledAtUtc: input.compiledAtUtc,
  });
  if (
    participantManifest.manifestInstanceId === previous.manifestInstanceId ||
    participantManifest.digest === previous.digest
  ) {
    throw new Error("Route reassessment manifest rotation is invalid");
  }

  return {
    participantManifest,
    protectedRecord: {
      priorManifestInstanceId: previous.manifestInstanceId,
      priorRouteToken: previous.routeToken,
      priorRouteBindingRevision: previous.routeBindingRevision,
      newManifestInstanceId: participantManifest.manifestInstanceId,
      newRouteToken: input.routeBinding.routeToken,
      newRouteBindingRevision: input.routeBinding.routeBindingRevision,
      priorProtectedRouteId: previousBinding.protectedRouteId,
      newProtectedRouteId: input.routeBinding.protectedRouteId,
      retainedSharedOpening: true,
      staleDomains: ["responses", "gate_act", "evidence", "validations"],
      reassessedAtUtc: input.compiledAtUtc,
    },
  };
}
