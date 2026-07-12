import type { ParticipantAssetRecord, ParticipantAssetRegistry } from "./types";

const ROUTE_BEARING_ASSET_PATTERN = /false[-_ ]?arrival|splintered[-_ ]?trust/i;

export function resolveParticipantAssets(
  keys: readonly string[],
  registry: ParticipantAssetRegistry,
): readonly ParticipantAssetRecord[] {
  return [...new Set(keys)].map((key) => {
    const asset = registry[key];
    if (!asset || ROUTE_BEARING_ASSET_PATTERN.test(JSON.stringify(asset))) {
      throw new Error("Participant asset registry contains an unsafe asset");
    }
    return { key: asset.key, url: asset.url, alt: asset.alt };
  });
}
