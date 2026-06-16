// Corrective route content for Gate 1 — "The Broken Vow".
// Adapted verbatim from the framework reference. Used by the Book of Spiral Fractures.

export type RouteId = "false_arrival" | "splintered_trust";

export type AnswerField = {
  key: string;
  label: string;
  prompt: string;
  placeholder: string;
};

export type RouteContent = {
  id: RouteId;
  title: string;
  glyph: "cracked-sun" | "broken-compass";
  symbolic: string;
  oracle: string;
  coreQuestion: string;
  scroll: string;
  answers: AnswerField[];
  journalPrompt: string;
  trackerTitle: string;
  trackerCopy: string;
  examples: string[];
  invalidExamples: string[];
  readiness: string[];
  incompleteCopy: string;
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
};
