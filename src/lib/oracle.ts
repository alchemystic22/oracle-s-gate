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
const isGate3 = (r: RouteId) => r === "hidden_grief" || r === "withheld_tears";
const isGate4 = (r: RouteId) => r === "doubled_name" || r === "binding_veil";

export function oracleResponse(
  route: RouteId,
  cat: OracleCategory,
  question: string,
): string {
  const q = question.toLowerCase();

  // ── Universal keyword overrides ─────────────────────────────────────────
  if (q.includes("how many pages")) {
    return "Only this page is before you now. The rest of the map is not needed for this threshold.";
  }
  if (q.includes("skip") && q.includes("action")) {
    if (isGate4(route)) {
      return "No. The page completes when one small act separates echo from truth.";
    }
    if (isGate3(route)) {
      return "No. Grief is honored through one act, not through understanding alone. The page completes when one small act touches reality.";
    }
    if (isGate2(route)) {
      return "No. Fire must enter form. The page completes when one movement touches reality.";
    }
    return "No. The page does not close through reflection alone. One action must touch lived reality.";
  }
  if (q.includes("choose") && (q.includes("for me") || q.includes("my action"))) {
    if (isGate4(route)) {
      return "I can help make the act smaller and safer. I cannot name you in your place.";
    }
    if (route === "burned_tongue" || route === "silenced_fire") {
      return "I can help make the vessel smaller and safer. I cannot choose the fire in your place.";
    }
    if (isGate3(route)) {
      return "I can help make the vessel gentler and the act smaller. I cannot grieve in your place.";
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

  // ── Gate 3 keyword overrides ────────────────────────────────────────────
  if (route === "hidden_grief") {
    if (q.includes("heal it now") || q.includes("want to heal") || q.includes("heal this now")) {
      return "Healing is not the task here. Being seen is. Let it be found before you ask it to leave.";
    }
    if (q.includes("should be over") || q.includes("over this")) {
      return "Grief does not keep a calendar. What waited beneath your strength does not need to apologize for still being here.";
    }
    if (q.includes("don't know what i'm grieving") || q.includes("dont know what i'm grieving") || q.includes("don't know what i am grieving")) {
      return "Then name only the weight. The grief does not need a name yet to be witnessed.";
    }
    if (q.includes("too big")) {
      return "Then make the vessel smaller. A single candle, a single name, is enough for one mourning act.";
    }
  }
  if (route === "withheld_tears") {
    if (q.includes("can't cry") || q.includes("cant cry") || q.includes("can not cry")) {
      return "Tears are not the task. One safe movement is. The body does not have to break to be honored.";
    }
    if (q.includes("fall apart") || q.includes("falling apart")) {
      return "Then make the movement smaller. One breath, one hand on the heart. The body sets the pace, not the grief.";
    }
    if (q.includes("nothing moves") || q.includes("numb")) {
      return "Numbness is also a holding. Do not force it open. Choose one movement gentle enough that the body does not need to defend.";
    }
    if (q.includes("already processed")) {
      return "The mind may have. The body keeps its own time. This page is for what the body still holds.";
    }
  }

  // ── Gate 4 keyword overrides ────────────────────────────────────────────
  if (route === "doubled_name") {
    if (q.includes("hate") && (q.includes("performed") || q.includes("name"))) {
      return "Hatred keeps the performed name at the center. Name what it protected before you separate from it.";
    }
    if (q.includes("everyone") && (q.includes("real me") || q.includes("know the real"))) {
      return "Public recognition is too large for the first vessel. Let the true name move privately before it enters a room.";
    }
    if (
      q.includes("do not know what is beneath") ||
      q.includes("don't know what is beneath") ||
      q.includes("dont know what is beneath")
    ) {
      return "Then name the cost first. What has the approved name required you to withhold?";
    }
    if (q.includes("final identity") || (q.includes("want") && q.includes("final"))) {
      return "Finality is not required. The page asks for one distinction, not a permanent doctrine of self.";
    }
    if (q.includes("was useful") || q.includes("useful")) {
      return "Then honor its function. The work is not to despise it. The work is to stop letting it answer first.";
    }
  }
  if (route === "binding_veil") {
    if (q.includes("reveal everything") || q.includes("should reveal")) {
      return "Tearing the veil is not the work. Find one seam that can open without violating what is sacred.";
    }
    if (
      q.includes("do not know what is fear") ||
      q.includes("don't know what is fear") ||
      q.includes("dont know what is fear")
    ) {
      return "Do not decide all of it now. Name one part that protects timing, and one part that protects fear.";
    }
    if (q.includes("ashamed") || q.includes("shame for hiding")) {
      return "Shame is another veil. Concealment once had a reason. Open one seam without condemning the cloth.";
    }
    if (q.includes("privacy") && (q.includes("avoidance") || q.includes("just avoidance"))) {
      return "Some privacy is sacred. Some concealment is fear. This page asks you to distinguish them, not destroy them both.";
    }
    if (q.includes("collapse") && q.includes("boundary")) {
      return "A collapsed boundary is not truth. Keep what protects the sacred. Open only what protects fear.";
    }
  }

  // ── Category dispatch, per route ─────────────────────────────────────────
  if (cat === "fail") {
    if (isGate4(route)) {
      return "The Gate has not judged you. A hidden page has opened because an echo must be distinguished before passage continues.";
    }
    if (isGate3(route)) {
      return "The Gate has not judged you. A hidden page has opened because the grief asks to be witnessed before passage continues.";
    }
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
  if (route === "hidden_grief") {
    if (cat === "clarify")
      return "Name the sorrow first. Not its story. Just the sorrow itself.";
    if (cat === "smaller")
      return "Make the vessel smaller. A single candle. A single name. One act gentle enough to complete.";
    if (cat === "trust")
      return "This page does not ask you to trust anyone with the grief. It asks that the grief be allowed to be seen.";
  }
  if (route === "withheld_tears") {
    if (cat === "clarify")
      return "Name the sorrow you already know. Then name where the body holds it.";
    if (cat === "smaller")
      return "Choose one movement small enough the body does not need to defend. A breath. A hand on the heart.";
    if (cat === "trust")
      return "This page does not ask the body to release. It asks for one safe movement the body can survive.";
  }
  if (route === "doubled_name") {
    if (cat === "clarify")
      return "Bring it to one name. What identity learned to answer for approval?";
    if (cat === "smaller")
      return "Make the act smaller. One private sentence. One choice made without performing the role. No public reveal.";
    if (cat === "trust")
      return "This page does not ask you to trust an audience with the truer name. It asks you to stop letting the performed one answer first.";
  }
  if (route === "binding_veil") {
    if (cat === "clarify")
      return "Bring it to one veil. What remains hidden and called mystery?";
    if (cat === "smaller")
      return "Open one seam, not the whole cloth. One honest sentence without full disclosure is enough.";
    if (cat === "trust")
      return "This page does not ask you to trust the world with the hidden thing. It asks you to distinguish sacred privacy from fear.";
  }

  return "Return to the page. The answer you need is closer than the question you asked.";
}
