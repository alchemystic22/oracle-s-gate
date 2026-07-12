import { validateParticipantManifest } from "./participantValidation";
import type { Gate1CanonicalManifest } from "../manifest/sceneTypes";
import { validateCanonicalManifest } from "../gate1/manifest";
import { resolveParticipantGraph } from "./activeGraph";
import type { ProtectedParticipantCompilation } from "./protectedCompilation.protected";

function assertRecord(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Protected ${label} mapping must be a record`);
  }
}

function assertExactKeys(
  record: Readonly<Record<string, unknown>>,
  expected: readonly string[],
  label: string,
): void {
  const actual = Object.keys(record);
  if (
    actual.length !== expected.length ||
    actual.some((runtimeId) => !expected.includes(runtimeId))
  ) {
    throw new Error(`Protected ${label} mapping does not match delivered identifiers`);
  }
}

export function validateProtectedParticipantManifestMapping(
  compilation: ProtectedParticipantCompilation,
  canonicalManifest: Gate1CanonicalManifest,
): void {
  const { participantManifest: manifest, protectedMapping: mapping } = compilation;
  validateCanonicalManifest(canonicalManifest);
  validateParticipantManifest(manifest);
  if (
    mapping.schemaVersion !== 1 ||
    mapping.manifestInstanceId !== manifest.manifestInstanceId ||
    mapping.manifestDigest !== manifest.digest ||
    mapping.gateManifestVersion !== manifest.gateManifestVersion ||
    mapping.gateManifestVersion !== canonicalManifest.version ||
    mapping.stage !== manifest.stage ||
    mapping.compiledAtUtc !== manifest.compiledAtUtc
  ) {
    throw new Error("Protected mapping manifest binding is invalid");
  }

  if (manifest.stage === "active_route") {
    if (
      !mapping.routeBinding ||
      !mapping.routeBinding.protectedRouteId ||
      mapping.routeBinding.routeToken !== manifest.routeToken ||
      mapping.routeBinding.routeBindingRevision !== manifest.routeBindingRevision
    ) {
      throw new Error("Protected mapping route binding is invalid");
    }
  } else if (mapping.routeBinding !== undefined) {
    throw new Error("Protected mapping must not invent a route binding");
  }

  assertRecord(mapping.scenes, "scene");
  assertRecord(mapping.interactions, "interaction");
  assertRecord(mapping.questions, "question");
  assertRecord(mapping.transitions, "transition");

  const sceneIds = manifest.scenes.map((scene) => scene.runtimeSceneId);
  const interactionIds = manifest.scenes.flatMap((scene) =>
    scene.interaction ? [scene.interaction.runtimeInteractionId] : [],
  );
  const questionIds = manifest.scenes.flatMap((scene) =>
    scene.interaction?.runtimeQuestionId ? [scene.interaction.runtimeQuestionId] : [],
  );
  const transitionIds = manifest.scenes.flatMap((scene) =>
    scene.transitions.map((transition) => transition.runtimeTransitionId),
  );
  const allRuntimeIds = [...sceneIds, ...interactionIds, ...questionIds, ...transitionIds];
  if (new Set(allRuntimeIds).size !== allRuntimeIds.length) {
    throw new Error("Protected mapping runtime identifiers must be globally unique");
  }
  assertExactKeys(mapping.scenes, sceneIds, "scene");
  assertExactKeys(mapping.interactions, interactionIds, "interaction");
  assertExactKeys(mapping.questions, questionIds, "question");
  assertExactKeys(mapping.transitions, transitionIds, "transition");

  const resolved = resolveParticipantGraph(canonicalManifest, manifest.stage, mapping.routeBinding);
  if (resolved.scenes.length !== manifest.scenes.length) {
    throw new Error("Protected mapping canonical stage is invalid");
  }

  const canonicalSceneIds = new Set<string>();
  const canonicalInteractionScenes = new Set<string>();
  const canonicalQuestionScenes = new Set<string>();
  const canonicalQuestionIds = new Set<string>();
  const canonicalTransitionSources = new Set<string>();

  for (const [index, scene] of manifest.scenes.entries()) {
    const sceneMapping = mapping.scenes[scene.runtimeSceneId]!;
    const canonical = resolved.scenes[index]!;
    if (sceneMapping.canonicalSceneId !== canonical.scene.canonicalSceneId) {
      throw new Error("Protected scene mapping canonical source is invalid");
    }
    if (canonicalSceneIds.has(sceneMapping.canonicalSceneId)) {
      throw new Error("Protected scene mappings must have unique canonical sources");
    }
    canonicalSceneIds.add(sceneMapping.canonicalSceneId);

    if (scene.interaction) {
      const interactionMapping = mapping.interactions[scene.interaction.runtimeInteractionId]!;
      if (
        interactionMapping.canonicalSceneId !== sceneMapping.canonicalSceneId ||
        interactionMapping.kind !== scene.interaction.kind ||
        interactionMapping.kind !== canonical.scene.participant.interaction?.kind ||
        canonicalInteractionScenes.has(interactionMapping.canonicalSceneId)
      ) {
        throw new Error("Protected interaction mapping is invalid");
      }
      canonicalInteractionScenes.add(interactionMapping.canonicalSceneId);

      if (scene.interaction.runtimeQuestionId) {
        const questionMapping = mapping.questions[scene.interaction.runtimeQuestionId]!;
        if (
          questionMapping.canonicalSceneId !== sceneMapping.canonicalSceneId ||
          questionMapping.canonicalQuestionId !== canonical.scene.protected?.canonicalQuestionId ||
          canonicalQuestionScenes.has(questionMapping.canonicalSceneId)
        ) {
          throw new Error("Protected question mapping is invalid");
        }
        canonicalQuestionScenes.add(questionMapping.canonicalSceneId);
        if (questionMapping.canonicalQuestionId) {
          if (canonicalQuestionIds.has(questionMapping.canonicalQuestionId)) {
            throw new Error("Protected canonical question mappings must be unique");
          }
          canonicalQuestionIds.add(questionMapping.canonicalQuestionId);
        }
      }
    }

    for (const transition of scene.transitions) {
      const transitionMapping = mapping.transitions[transition.runtimeTransitionId]!;
      const targetMapping = mapping.scenes[transition.targetRuntimeSceneId]!;
      if (
        transitionMapping.fromCanonicalSceneId !== sceneMapping.canonicalSceneId ||
        transitionMapping.toCanonicalSceneId !== targetMapping.canonicalSceneId ||
        transitionMapping.toCanonicalSceneId !== canonical.transition?.targetSceneId ||
        transitionMapping.canonicalRouteId !== canonical.transition?.routeId ||
        canonicalTransitionSources.has(transitionMapping.fromCanonicalSceneId)
      ) {
        throw new Error("Protected transition mapping is invalid");
      }
      if (
        transitionMapping.canonicalRouteId !== undefined &&
        transitionMapping.canonicalRouteId !== mapping.routeBinding?.protectedRouteId
      ) {
        throw new Error("Protected transition route mapping is invalid");
      }
      canonicalTransitionSources.add(transitionMapping.fromCanonicalSceneId);
    }
  }
}
