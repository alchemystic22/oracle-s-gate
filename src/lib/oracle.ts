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
const isGate5 = (r: RouteId) => r === "unspoken_truth" || r === "forgotten_light";
const isGate6 = (r: RouteId) => r === "fractured_pattern" || r === "erased_face";

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
    if (isGate6(route)) {
      return "No. The page completes when the pattern or erased feature enters one grounded act.";
    }
    if (isGate5(route)) {
      return "No. The page completes when word and action align.";
    }
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
    if (isGate6(route)) {
      return "I can help make the pattern smaller and clearer. I cannot crown the pattern in your place.";
    }
    if (isGate5(route)) {
      return "I can help make the sentence smaller and the action clearer. I cannot speak the word in your place.";
    }
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

  // ── Gate 6 universal overrides ──────────────────────────────────────────
  if (isGate6(route)) {
    if (q.includes("destiny")) {
      return "Destiny is too large for this page. Hold the pattern through one small act before naming its future.";
    }
    if (q.includes("legacy") || (q.includes("build") && q.includes("life work"))) {
      return "Not yet. Legacy is too large for an untested pattern. Choose one coherence act first.";
    }
    if (q.includes("name the blueprint") || (q.includes("blueprint") && q.includes("for me"))) {
      return "I can help make the pattern smaller and clearer. I cannot crown the pattern in your place.";
    }
  }

  // ── Gate 5 universal overrides ──────────────────────────────────────────
  if (isGate5(route)) {
    if (q.includes("can i just say") || (q.includes("just say") && q.includes("it"))) {
      return "Not yet. The word needs a body. Name the action that can carry it.";
    }
    if (q.includes("make this public") || q.includes("should i make this public") || q.includes("post publicly") || q.includes("post it publicly")) {
      return "Audience is not the field yet. Let the word become real in one precise vessel first.";
    }
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

  // ── Gate 5 keyword overrides ────────────────────────────────────────────
  if (route === "unspoken_truth") {
    if (q.includes("confront") || q.includes("confront them")) {
      return "The field may be too charged for the first vessel. Speak the sentence where it can stay clean before it enters conflict.";
    }
    if (q.includes("attack") || q.includes("sounds like attack") || q.includes("accusation")) {
      return "The heat is real, but the blade is not needed. Remove accusation. Keep consequence.";
    }
    if (
      q.includes("do not know the matching action") ||
      q.includes("don't know the matching action") ||
      q.includes("dont know the matching action") ||
      (q.includes("no matching action") && q.includes("know"))
    ) {
      return "Then the sentence is not ready to become world. Find the action first, or make the sentence smaller.";
    }
    if (q.includes("public validation") || (q.includes("public") && q.includes("validation"))) {
      return "Public witness may turn the word into performance. Let the truth alter one real field before it seeks an audience.";
    }
    if (q.includes("say everything") || (q.includes("want to say") && q.includes("everything"))) {
      return "Everything is too much. One precise sentence is enough for this threshold.";
    }
  }
  if (route === "forgotten_light") {
    if (q.includes("destiny")) {
      return "Destiny is too large for this page. Tend the light once before naming its future.";
    }
    if (q.includes("abandon everything") || (q.includes("abandon") && q.includes("for this light"))) {
      return "Abandonment is not allegiance. Give the light one protected act inside reality first.";
    }
    if (q.includes("prove") && (q.includes("public") || q.includes("publicly") || q.includes("light"))) {
      return "Proof still makes the audience the keeper of the flame. Feed the light before displaying it.";
    }
    if (q.includes("special") || q.includes("makes me special")) {
      return "The light is not a crown above others. It is a responsibility asking for practice.";
    }
    if (q.includes("ashamed") || q.includes("shame for forgetting")) {
      return "Shame does not feed the light. Return once. Let that be the first offering.";
    }
  }

  // ── Gate 6 keyword overrides ────────────────────────────────────────────
  if (route === "fractured_pattern") {
    if (q.includes("too many connections") || q.includes("see too many")) {
      return "Too many lines will distort the mirror. Choose three fragments only.";
    }
    if (q.includes("explains everything") || q.includes("explain everything")) {
      return "The pattern does not need to explain everything. It only needs to reveal one honest line.";
    }
    if (q.includes("make this public") || q.includes("want to make this public") || q.includes("post the pattern")) {
      return "Public meaning is too large for an untested pattern. Let the pattern become coherent privately first.";
    }
    if (q.includes("does not fit") || q.includes("doesn't fit") || q.includes("doesnt fit")) {
      return "Do not remove it yet. The fragment that does not fit may be the one protecting the truth of the pattern.";
    }
    if (q.includes("life work") || (q.includes("turn this into") && q.includes("work"))) {
      return "Life work is too large for this threshold. Build one small coherence before naming the architecture.";
    }
  }
  if (route === "erased_face") {
    if (q.includes("reveal") && (q.includes("publicly") || q.includes("erased face"))) {
      return "Public recognition is too large for the first restoration. Let one feature return privately before it enters a room.";
    }
    if (q.includes("ashamed") || q.includes("shame that this was erased") || q.includes("shame for being erased")) {
      return "Shame is another erasure. Name what had to disappear without condemning why it disappeared.";
    }
    if (q.includes("hate the surviving") || (q.includes("hate") && q.includes("surviving"))) {
      return "The surviving face protected continuity. Do not punish what kept you visible enough to remain.";
    }
    if (q.includes("become this erased") || q.includes("become this") || (q.includes("entirely") && q.includes("face"))) {
      return "The erased feature is not the whole crown. Restore one feature without making it the total identity.";
    }
    if (q.includes("do not know what was erased") || q.includes("don't know what was erased") || q.includes("dont know what was erased")) {
      return "Look for the absent signal. What part of you never gets included when the story is told?";
    }
  }

  // ── Category dispatch, per route ─────────────────────────────────────────
  if (cat === "fail") {
    if (isGate6(route)) {
      return "The Gate has not judged you. A hidden page has opened because the pattern must be held before it can become crown.";
    }
    if (isGate5(route)) {
      return "The Gate has not judged you. A hidden page has opened because the word must find its body before passage continues.";
    }
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
  if (route === "unspoken_truth") {
    if (cat === "clarify")
      return "Bring it to one sentence. What truth would change the field if spoken?";
    if (cat === "smaller")
      return "Make the sentence smaller and the action clearer. One precise truth into one right vessel, with one matching act.";
    if (cat === "trust")
      return "This page does not ask you to trust an audience with the word. It asks whether your next action can carry it.";
  }
  if (route === "forgotten_light") {
    if (cat === "clarify")
      return "Name the light simply. Gift, direction, devotion, discipline, creative current, knowing, or practice.";
    if (cat === "smaller")
      return "Choose one act of allegiance small enough to complete. Thirty minutes. One page. One protected hour.";
    if (cat === "trust")
      return "This page does not ask you to crown the light. It asks for one lived signal that you still tend it.";
  }
  if (route === "fractured_pattern") {
    if (cat === "clarify")
      return "Choose three fragments only. The whole life is too large for this page.";
    if (cat === "smaller")
      return "Make the act smaller. One honest line. One coherence-building move. No life overhaul.";
    if (cat === "trust")
      return "This page does not ask you to trust the pattern as destiny. It asks whether one honest line can hold three fragments.";
  }
  if (route === "erased_face") {
    if (cat === "clarify")
      return "Look for what never appears in the pattern. A preference. A softness. A fire. A grief. A face. A request. A voice.";
    if (cat === "smaller")
      return "Restore one feature, not the whole face. Choose an act safe enough that the mirror does not break.";
    if (cat === "trust")
      return "This page does not ask you to trust the world with the erased face. It asks whether one feature can return without forcing the whole.";
  }

  return "Return to the page. The answer you need is closer than the question you asked.";
}
