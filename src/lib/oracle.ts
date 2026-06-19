import type { RouteId } from "../data/correctives";

export type OracleCategory =
  | "clarify"
  | "smaller"
  | "stuck"
  | "trust"
  | "fail"
  | "next";

export const ORACLE_CATEGORIES: { id: OracleCategory; label: string }[] = [
  { id: "clarify", label: "Help me clarify my answer" },
  { id: "smaller", label: "Help me choose a smaller action" },
  { id: "stuck", label: "I feel stuck" },
  { id: "trust", label: "Am I supposed to trust this?" },
  { id: "fail", label: "Did I fail?" },
  { id: "next", label: "What happens next?" },
];

const isGate2 = (r: RouteId) => r === "burned_tongue" || r === "silenced_fire";

export function oracleResponse(
  route: RouteId,
  cat: OracleCategory,
  question: string,
): string {
  const q = question.toLowerCase();

  // ── Universal keyword overrides ─────────────────────────────────────────
  if (q.includes("how many pages")) {
    if (isGate2(route)) {
      return "Only this page is before you now. The rest of the map is not needed for this threshold.";
    }
    return "Only this page is before you now. The rest of the map is not needed for this threshold.";
  }
  if (q.includes("skip") && q.includes("action")) {
    if (isGate2(route)) {
      return "No. Fire must enter form. The page completes when one movement touches reality.";
    }
    return "No. The page does not close through reflection alone. One action must touch lived reality.";
  }
  if (q.includes("choose") && (q.includes("for me") || q.includes("my action"))) {
    if (route === "burned_tongue") {
      return "I can help make the vessel smaller and safer. I cannot choose the fire in your place.";
    }
    if (route === "silenced_fire") {
      return "I can help make the vessel smaller and safer. I cannot choose the fire in your place.";
    }
    return "I can help you make the action smaller and clearer. I cannot choose your obedience for you.";
  }

  // ── Gate 2 keyword overrides ────────────────────────────────────────────
  if (route === "burned_tongue") {
    if (q.includes("confront")) {
      return "That room may be too large for the first breath. Speak the sentence where the old punishment cannot reach it first.";
    }
    if (q.includes("say everything") || q.includes("everything")) {
      return "Everything is too much. One true sentence is enough.";
    }
    if (q.includes("attack") || q.includes("accusation")) {
      return "The heat is real, but the blade is not needed. Remove the accusation. Keep the truth.";
    }
    if (q.includes("afraid") || q.includes("scared") || q.includes("scary")) {
      return "Then make the vessel smaller. A whisper, voice note, or private sentence may be enough.";
    }
    if (q.includes("ashamed") || q.includes("shame")) {
      return "Shame is another inherited script. The page does not ask for self-punishment. It asks for one unfamiliar honesty.";
    }
  }
  if (route === "silenced_fire") {
    if (q.includes("unleash")) {
      return "Unleashing is not the vessel. Choose one flame-movement the body and life can hold.";
    }
    if (q.includes("burn") && q.includes("down")) {
      return "Fire that destroys the vessel cannot complete this page. Choose one clean movement, not a total rupture.";
    }
    if (q.includes("prove") && (q.includes("them") || q.includes("wrong"))) {
      return "Proof still lets them hold the center. Move the flame for truth, not for their witness.";
    }
    if (q.includes("numb")) {
      return "Numbness may be the old containment. Do not force fire. Choose one small movement that does not require intensity.";
    }
    if (q.includes("not ready") || q.includes("i'm not ready") || q.includes("im not ready")) {
      return "Readiness is not the requirement. Smallness is. One sentence. To one person. The size is the protection.";
    }
  }

  // ── Category dispatch, per route ─────────────────────────────────────────
  if (cat === "fail") {
    if (isGate2(route)) {
      return "The Gate has not judged you. A hidden page has opened because the fire needs a vessel before passage continues.";
    }
    return "The Gate has not judged you. A hidden page has opened because something true must be seen before passage continues.";
  }
  if (cat === "next") {
    return "The next passage opens after this fracture is witnessed and one action enters lived reality.";
  }
  if (cat === "stuck") {
    return "Stillness is not failure. Return to the core question and answer only the part that is true right now.";
  }

  if (route === "false_arrival") {
    if (cat === "clarify")
      return "Bring it closer. What specific promise broke, and where do your choices still obey it?";
    if (cat === "smaller")
      return "Choose one action that touches reality within the next day. Not a life overhaul. One interruption.";
    if (cat === "trust")
      return "This page does not ask for trust in anything outside you. It asks where your obedience still lives.";
  }
  if (route === "splintered_trust") {
    if (cat === "clarify")
      return "Name the wound without making every signal into the wound. What is true beneath the suspicion?";
    if (cat === "smaller")
      return "Choose an action that lets discernment remain active. A small step. A low-risk signal. No surrender required.";
    if (cat === "trust")
      return "No. This page does not ask for blind trust. It asks you to find one signal that remains true without external authority.";
  }
  if (route === "burned_tongue") {
    if (cat === "clarify")
      return "Bring it to one sentence. What truth became dangerous to speak?";
    if (cat === "smaller")
      return "Make the vessel smaller. A whisper. A voice note. One private sentence read aloud alone.";
    if (cat === "trust")
      return "This page does not ask you to trust the listener. It asks you to give one truth one safe breath.";
  }
  if (route === "silenced_fire") {
    if (cat === "clarify")
      return "Name the fire first. Anger, desire, creativity, boundary, joy, body, ambition, or truth.";
    if (cat === "smaller")
      return "Choose one flame-movement small enough the body and life can hold it. Not a rupture.";
    if (cat === "trust")
      return "This page does not ask you to trust the world with your fire. It asks you to find one vessel that can hold it.";
  }

  return "Return to the page. The answer you need is closer than the question you asked.";
}
