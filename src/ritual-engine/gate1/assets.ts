import type { ParticipantAssetRegistry } from "../compiler/types";
import { participantAssetKey } from "./constants";

export const GATE1_ASSET_KEYS = {
  threshold: participantAssetKey("threshold-stone"),
  agreement: participantAssetKey("agreement-fracture"),
  book: participantAssetKey("hidden-book"),
  symbolA: participantAssetKey("symbol-a"),
  symbolB: participantAssetKey("symbol-b"),
} as const;

export const GATE1_PARTICIPANT_ASSET_REGISTRY: ParticipantAssetRegistry = {
  "threshold-stone": {
    key: "threshold-stone",
    url: "/assets/ritual/g1/threshold-stone.webp",
    alt: "A monumental stone threshold split by a narrow line of light",
  },
  "agreement-fracture": {
    key: "agreement-fracture",
    url: "/assets/ritual/g1/agreement-fracture.webp",
    alt: "One inscription fractured while the surrounding chamber remains standing",
  },
  "hidden-book": {
    key: "hidden-book",
    url: "/assets/ritual/g1/hidden-book.webp",
    alt: "A closed ritual book entering the field",
  },
  "symbol-a": {
    key: "symbol-a",
    url: "/assets/ritual/g1/symbol-a.webp",
    alt: "A neutral ritual symbol held in a field of fractured stone",
  },
  "symbol-b": {
    key: "symbol-b",
    url: "/assets/ritual/g1/symbol-b.webp",
    alt: "A neutral ritual symbol held beside a compass without an external heading",
  },
};
