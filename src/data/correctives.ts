// Corrective route content for the Spiral Path system.
// Adapted verbatim from the framework reference (Gate 1) and from the
// canonical Gate 2 instruction. Used by the Book of Spiral Fractures.

export type RouteId =
  | "false_arrival"
  | "splintered_trust"
  | "burned_tongue"
  | "silenced_fire";

export type GlyphId =
  | "cracked-sun"
  | "broken-compass"
  | "burned-tongue"
  | "silenced-fire";

export type AnswerField = {
  key: string;
  label: string;
  prompt: string;
  placeholder: string;
};

export type RouteContent = {
  id: RouteId;
  title: string;
  glyph: GlyphId;
  symbolic: string;
  oracle: string;
  /** Oracle line shown on a return visit to this page, if any. */
  oracleReturn?: string;
  coreQuestion: string;
  scroll: string;
  answers: AnswerField[];
  /** Faint hint above the submit button. Optional. */
  submitHint?: string;
  journalPrompt: string;
  /** Header for the private reflection journal block. */
  journalHeader?: string;
  trackerTitle: string;
  trackerCopy: string;
  /** Optional copy displayed above the Sovereign Action Block. */
  actionPreamble?: string;
  examples: string[];
  invalidExamples: string[];
  /** Three optional Fractured Reflections prompts. */
  reflectionPrompts?: string[];
  readiness: string[];
  incompleteCopy: string;
  /** Optional copy shown immediately before the corrective gate epigraph. */
  preUnlock?: string;
  unlockEpigraph: string;
  sealLine: string;
};

export const ROUTES: Record<RouteId, RouteContent> = {
  false_arrival: {
    id: "false_arrival",
    title: "False Arrival",
    glyph: "cracked-sun",
    symbolic: "The first crack is not the crossing.",
    oracle:
      "Do not confuse the crack with the crossing. Name what still has your obedience.",
    coreQuestion: "Where did you mistake recognition for freedom?",
    scroll: `You saw the promise break.
For a moment, the old world lost its spell.
But sight is not severance.
A chain can be seen and still obeyed.
A cage can be named and still entered each morning.
This page opens where recognition began wearing the mask of freedom.
Do not condemn the insight.
Do not crown it too soon.
Name what still receives your obedience.`,
    answers: [
      {
        key: "promise",
        label: "The Promise That Broke",
        prompt:
          "What promise, authority, identity, system, relationship, belief, or life-structure did you finally see as false, incomplete, or broken?",
        placeholder: "Name the promise without explaining it away.",
      },
      {
        key: "moment",
        label: "The Moment You Mistook Sight for Freedom",
        prompt:
          "When did you believe that seeing the illusion meant you were already free from it?",
        placeholder: "Describe the moment recognition became a false arrival.",
      },
      {
        key: "allegiance",
        label: "The Allegiance Still Active",
        prompt: "Where do your choices still obey the broken promise?",
        placeholder:
          "Name the behavior, attachment, approval loop, comfort, fear, duty, or reward that still holds power.",
      },
      {
        key: "interruption",
        label: "The Concrete Interruption",
        prompt:
          "What one action will interrupt that allegiance in lived reality?",
        placeholder:
          "Choose one action small enough to complete, true enough to matter, and specific enough to verify.",
      },
    ],
    journalPrompt:
      "What old promise still governs your choices even after you saw it break?",
    trackerTitle: "Concrete Interruption",
    trackerCopy:
      "Choose one action that interrupts obedience to the broken promise in lived reality.",
    examples: [
      "Speak one honest sentence where compliance was expected.",
      "Cancel one performative obligation.",
      "Refuse one comfort that keeps the illusion intact.",
      "Stop seeking approval from one false authority for one specific decision.",
      "Choose one act of truth over one act of image-maintenance.",
    ],
    invalidExamples: [
      "I will be more authentic.",
      "I now understand the illusion.",
      "I am free from the system.",
      "I will change my whole life.",
    ],
    readiness: [
      "I have named the false promise without defending it.",
      "I have identified where recognition became false arrival.",
      "I have named what still receives obedience.",
      "I have chosen one concrete interruption.",
      "The interruption has been completed or scheduled in lived reality.",
    ],
    incompleteCopy:
      "The page remains open. Return when the action has touched reality.",
    unlockEpigraph: `You saw the crack.
Now you have stepped through it.`,
    sealLine:
      "I do not mistake the crack for the crossing. What I saw, I now leave.",
  },

  splintered_trust: {
    id: "splintered_trust",
    title: "Splintered Trust",
    glyph: "broken-compass",
    symbolic: "Suspicion is not sovereignty when it refuses all signal.",
    oracle:
      "Do not trust blindly. Do not distrust blindly. Find the signal that remains when authority is removed.",
    coreQuestion:
      "What broke your trust so deeply that truth now feels dangerous?",
    scroll: `Something broke.
Not softly.
Not cleanly.
A promise failed, and with it, the map you were given.
Now every voice carries the scent of deception.
Every threshold looks like a trap.
Every guide resembles the one who misled you.
This page does not ask you to trust blindly.
Blind trust is how the wound began.
But total distrust is not freedom.
It is the old wound wearing armor.
Find the signal that remains when authority is removed.`,
    answers: [
      {
        key: "broken",
        label: "The Broken Trust",
        prompt:
          "What person, system, teaching, authority, relationship, institution, promise, or version of reality broke trust so deeply that truth now feels unsafe?",
        placeholder:
          "Name what broke trust without turning every signal into that wound.",
      },
      {
        key: "suspicion",
        label: "The Protective Suspicion",
        prompt:
          "Where has suspicion begun protecting the wound more than the truth?",
        placeholder:
          "Name the place where distrust feels safer than discernment.",
      },
      {
        key: "pattern",
        label: "The False Authority Pattern",
        prompt: "What kind of authority now triggers immediate distrust in you?",
        placeholder:
          "Name the pattern, tone, promise, claim, role, posture, or energy that makes you withdraw.",
      },
      {
        key: "signal",
        label: "The Remaining Signal",
        prompt:
          "What signal remains true even after the old authority is removed?",
        placeholder:
          "Name one perception, bodily knowing, direct observation, value, or inner yes/no that does not depend on external permission.",
      },
      {
        key: "act",
        label: "The Small Act of Discerned Trust",
        prompt:
          "What one small act of trust can you take without surrendering discernment?",
        placeholder:
          "Choose an action that restores signal without requiring blind surrender.",
      },
    ],
    journalPrompt:
      "Where has suspicion begun protecting the wound more than the truth?",
    trackerTitle: "Discerned Trust Action",
    trackerCopy:
      "Choose one small act of trust that does not require surrendering discernment.",
    examples: [
      "Trust one direct perception without asking an external authority to confirm it.",
      "Tell one truth to a safe witness.",
      "Follow one inner signal in a low-risk action.",
      "Name one place where distrust has become identity.",
      "Take one step through a threshold while retaining the right to pause.",
    ],
    invalidExamples: [
      "I will trust everyone again.",
      "I will never trust anyone.",
      "I will surrender to the Codex.",
      "I will reject all systems.",
      "I will only trust myself forever.",
    ],
    readiness: [
      "I have named what broke trust.",
      "I have identified where suspicion is protecting the wound.",
      "I have named the kind of authority I now reflexively distrust.",
      "I have found one signal that remains true without external authority.",
      "I have chosen one small act of discerned trust.",
      "The action has been completed or scheduled in lived reality.",
    ],
    incompleteCopy:
      "The page remains open. Trust need not return whole. It must return true.",
    unlockEpigraph: `Trust need not return whole.
It must return true.`,
    sealLine:
      "I do not protect myself by refusing all signal. I listen with the discernment I have earned.",
  },

  // ── Gate 2 — Soul Fire ────────────────────────────────────────────────────

  burned_tongue: {
    id: "burned_tongue",
    title: "Burned Tongue",
    glyph: "burned-tongue",
    symbolic: `The tongue that speaks borrowed fire burns with another's heat.
Until it learns silence, it will mistake the burn for warmth.`,
    oracle: "The fire is not consuming you. It is consuming what was never yours to carry.",
    oracleReturn:
      "You have stood here before. The tongue still speaks the borrowed fire. What word has remained un-burned?",
    coreQuestion:
      "What conviction do you defend most fluently — and where did that fluency actually come from?",
    scroll: `You have spoken what was handed to you. You named it conviction.

But conviction borrowed is conviction unsourced. The fire that came with the words did not come from you. It came from those who spoke before you and trained the tongue to carry their flame.

This page has opened because the words still issue from a mouth that has not yet found its own voice. The corrective is not to renounce what you have spoken. It is to fall silent long enough for what is yours to surface.`,
    answers: [
      {
        key: "origin",
        label: "The Origin of the Fluency",
        prompt:
          "Name the conviction you defend most fluently. Then name where that fluency actually came from — whose voice, whose lineage, whose room.",
        placeholder: "Name not the conviction but its origin.",
      },
    ],
    submitHint: "Name not the conviction but its origin.",
    journalPrompt:
      "What sentence have you been speaking that, when you actually feel into it, was never yours?",
    journalHeader: "Burned Tongue — Private Reflection",
    trackerTitle: "Unfamiliar Honesty",
    trackerCopy:
      "Speak one sentence today that you have never spoken because it would not be received well by those who taught you to speak.",
    actionPreamble:
      "The tongue cannot be re-sourced through declaration. Only through small acts of unfamiliar honesty.",
    examples: [
      "Refuse to repeat a phrase, opinion, or framing you have used reflexively for years.",
      "Speak aloud a disagreement to someone whose approval has been shaping your voice.",
      "Write one paragraph in your own words, then delete every sentence that sounds like someone else.",
      "Stay silent in a conversation where your reflexive contribution would be performative.",
    ],
    invalidExamples: [
      "I will find my own voice.",
      "I will be more authentic in my speech.",
      "I will stop sounding like them.",
      "I will think more independently from now on.",
    ],
    reflectionPrompts: [
      "What did this Spiral Path allow you to see?",
      "Whose voice did you mistake for your own?",
      "What single sentence have you been repeating that, if you stopped saying it, would change what you do tomorrow?",
    ],
    readiness: [
      "I have named a conviction I have defended fluently.",
      "I have traced its origin to someone other than myself.",
      "I have chosen one specific sentence to speak — or refuse to speak — in lived reality.",
      "The act has been scheduled or completed.",
      "I am not using this to perform a different identity. I am using it to find my own voice.",
    ],
    incompleteCopy:
      "The page remains open. The tongue does not return to its source through resolve alone.",
    preUnlock:
      "The fire has taken what was not yours. What remains is what was always yours to speak.",
    unlockEpigraph: `The fire has taken what was not yours.
What remains is what was always yours to speak.`,
    sealLine: `I do not borrow my fire from those who taught me to speak.
What burns in me now is mine.`,
  },

  silenced_fire: {
    id: "silenced_fire",
    title: "Silenced Fire",
    glyph: "silenced-fire",
    symbolic: `The fire kept inside the vessel does not extinguish.
It burns the vessel from within.`,
    oracle: "The fire is not the problem. The vessel sealing it is.",
    oracleReturn:
      "You have stood here before. The fire still burns in silence. What sentence has remained unspoken?",
    coreQuestion:
      "What true thing have you not been saying — and what does not saying it cost you?",
    scroll: `You have been silent. You called it wisdom. You called it patience. You called it not being one of those people who speaks too quickly.

But the fire that you have not spoken is still in you. It has been burning quietly in places you have stopped looking. The cost is paid in the body, in the breath, in the slow erosion of capacity to feel what you actually know.

This page has opened because the silence is no longer chosen. It is enforced. The corrective is not to declare yourself loudly. It is to speak the one true sentence you have been swallowing.`,
    answers: [
      {
        key: "sentence",
        label: "The Sentence Unspoken",
        prompt:
          "Name the true sentence you have not been saying. Then name what not saying it has cost you.",
        placeholder: "Name not the topic but the sentence.",
      },
    ],
    submitHint: "Name not the topic but the sentence.",
    journalPrompt:
      "What true sentence has been waiting in your mouth, and what has it cost you to keep it there?",
    journalHeader: "Silenced Fire — Private Reflection",
    trackerTitle: "One True Sentence",
    trackerCopy:
      "Speak one true sentence aloud to one specific person who has not heard it from you before.",
    actionPreamble:
      "Fire returns to the world through small spoken acts — not through declarations.",
    examples: [
      "Tell one person something you have known to be true about them, or about your shared situation, for longer than a year.",
      "Decline an obligation aloud that you have been quietly resenting.",
      "State a preference that has historically been buried under accommodation.",
      "Write the message you have drafted many times and never sent. Send it once. To one person. Without spectacle.",
    ],
    invalidExamples: [
      "I will start speaking my truth more.",
      "I will be braver in conversations.",
      "I will share what I really think on social media.",
      "I will write a long letter announcing my breakthrough.",
    ],
    reflectionPrompts: [
      "What did this Spiral Path allow you to see?",
      "Where has your silence stopped being chosen and started being enforced?",
      "What would change if the sentence you have been swallowing were spoken once, to one person, today?",
    ],
    readiness: [
      "I have named a true sentence I have been keeping silent.",
      "I have named what the silence has cost.",
      "I have chosen one specific person to speak it to, or to.",
      "The act has been scheduled or completed.",
      "I am not using this to perform breakthrough. I am using it to return fire to my own voice.",
    ],
    incompleteCopy:
      "The page remains open. The vessel does not break through resolve alone.",
    preUnlock:
      "The vessel has cracked. The fire has returned to your mouth.",
    unlockEpigraph: `The vessel has cracked.
The fire has returned to your mouth.`,
    sealLine: `I do not keep my fire sealed for the comfort of those who would prefer my silence.
What is mine to speak, I speak.`,
  },
};
