import type { CanonicalRouteId } from "../domain/ids";
import { compileParticipantManifest } from "./compileParticipantManifest";
import type { ProtectedParticipantCompilation } from "./protectedCompilation.protected";
import { validateProtectedParticipantManifestMapping } from "./protectedMappingValidation.protected";
import type { CompileParticipantManifestInput, ProtectedRouteBinding } from "./types";

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
  previousCompilation: ProtectedParticipantCompilation;
  routeBinding: ProtectedRouteBinding;
};

export function compileRouteReassessment(
  input: CompileRouteReassessmentInput,
): ProtectedParticipantCompilation & {
  protectedRecord: ProtectedReassessmentRecord;
} {
  validateProtectedParticipantManifestMapping(input.previousCompilation, input.canonicalManifest);
  const previous = input.previousCompilation.participantManifest;
  const previousBinding = input.previousCompilation.protectedMapping.routeBinding;
  if (
    previous.stage !== "active_route" ||
    !previous.routeToken ||
    previous.routeBindingRevision === undefined ||
    !previousBinding ||
    input.routeBinding.routeToken === previous.routeToken ||
    input.routeBinding.routeBindingRevision <= previous.routeBindingRevision ||
    previousBinding.routeToken !== previous.routeToken ||
    previousBinding.routeBindingRevision !== previous.routeBindingRevision ||
    input.routeBinding.protectedRouteId === previousBinding.protectedRouteId
  ) {
    throw new Error("Route reassessment binding rotation is invalid");
  }

  const compilation = compileParticipantManifest({
    canonicalManifest: input.canonicalManifest,
    stage: "active_route",
    routeBinding: input.routeBinding,
    opaqueIdFactory: input.opaqueIdFactory,
    participantAssetRegistry: input.participantAssetRegistry,
    compiledAtUtc: input.compiledAtUtc,
  });
  const { participantManifest, protectedMapping } = compilation;
  if (
    participantManifest.manifestInstanceId === previous.manifestInstanceId ||
    participantManifest.digest === previous.digest
  ) {
    throw new Error("Route reassessment manifest rotation is invalid");
  }

  return {
    participantManifest,
    protectedMapping,
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
