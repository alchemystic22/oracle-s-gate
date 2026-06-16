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

export function oracleResponse(
  route: RouteId,
  cat: OracleCategory,
  question: string,
): string {
  const q = question.toLowerCase();
  if (q.includes("how many pages")) {
    return "Only this page is before you now. The rest of the map is not needed for this threshold.";
  }
  if (q.includes("choose") && (q.includes("for me") || q.includes("my action"))) {
    return "I can help you make the action smaller and clearer. I cannot choose your obedience for you.";
  }
  if (cat === "fail") {
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
  } else {
    if (cat === "clarify")
      return "Name the wound without making every signal into the wound. What is true beneath the suspicion?";
    if (cat === "smaller")
      return "Choose an action that lets discernment remain active. A small step. A low-risk signal. No surrender required.";
    if (cat === "trust")
      return "No. This page does not ask for blind trust. It asks you to find one signal that remains true without external authority.";
  }
  return "Return to the page. The answer you need is closer than the question you asked.";
}
