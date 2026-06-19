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

  // ── Universal keyword overrides (apply across all routes) ────────────────
  if (q.includes("how many pages")) {
    return "Only this page is before you now. The rest of the map is not needed for this threshold.";
  }
  if (q.includes("skip") && q.includes("action")) {
    if (route === "burned_tongue") {
      return "No. The tongue does not change through reflection alone. One sentence must actually be spoken, or unspoken, in lived reality.";
    }
    if (route === "silenced_fire") {
      return "No. The fire is not released through naming it. One sentence must actually be spoken in lived reality.";
    }
    return "No. The page does not close through reflection alone. One action must touch lived reality.";
  }
  if (q.includes("choose") && (q.includes("for me") || q.includes("my action"))) {
    if (route === "burned_tongue") {
      return "I can help you find a smaller sentence. I cannot speak it for you.";
    }
    if (route === "silenced_fire") {
      return "I can help you find a smaller sentence. I cannot speak it through your mouth.";
    }
    return "I can help you make the action smaller and clearer. I cannot choose your obedience for you.";
  }
  if (q.includes("ashamed") || q.includes("shame")) {
    if (route === "burned_tongue") {
      return "Shame is another inherited script. The page does not ask for self-punishment. It asks for one unfamiliar honesty.";
    }
  }
  if (q.includes("not ready") || q.includes("i'm not ready") || q.includes("im not ready")) {
    if (route === "silenced_fire") {
      return "Readiness is not the requirement. Smallness is. One sentence. To one person. The size is the protection.";
    }
  }
  if (q.includes("whole voice") || q.includes("everything is borrowed") || q.includes("all borrowed")) {
    if (route === "burned_tongue") {
      return "Then the work is simpler. Stop speaking for a measured stretch. What rises in the silence is the beginning of your own voice.";
    }
  }
  if (q.includes("don't know") && q.includes("voice")) {
    if (route === "burned_tongue") {
      return "Listen for the word that comes most automatically when you are tested. That word's origin will name itself.";
    }
  }
  if (q.includes("wrong") || q.includes("what if i'm wrong")) {
    if (route === "silenced_fire") {
      return "Then you will be the one who said something honest and was wrong. That is a survivable thing. The unsaid sentence is not survivable in the same way.";
    }
  }
  if ((q.includes("cost") || q.includes("costs")) && route === "silenced_fire") {
    return "It will. The page is not asking you to ignore the cost. It is asking you to weigh the cost against what the silence has already taken.";
  }

  // ── Category dispatch, per route ─────────────────────────────────────────
  if (cat === "fail") {
    if (route === "burned_tongue") {
      return "The Gate has not judged you. The page opened because the voice has not yet found its source.";
    }
    if (route === "silenced_fire") {
      return "The Gate has not judged you. The page opened because the fire has not yet returned to your voice.";
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
      return "Name one phrase you have spoken many times. Then ask: would I say this if no one I respect were watching?";
    if (cat === "smaller")
      return "Choose one sentence. One. Spoken or unspoken. Today. Not a redefinition of how you speak.";
    if (cat === "trust")
      return "This page does not ask you to trust the new voice. It asks you to stop performing the borrowed one.";
  }
  if (route === "silenced_fire") {
    if (cat === "clarify")
      return "What sentence have you composed many times in your head and never said aloud? That one.";
    if (cat === "smaller")
      return "One sentence. One person. One conversation. Not a declaration. Not a manifesto.";
    if (cat === "trust")
      return "This page does not ask you to trust the listener. It asks you to stop swallowing what you already know.";
  }

  return "Return to the page. The answer you need is closer than the question you asked.";
}
