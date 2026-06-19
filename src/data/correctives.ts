// Corrective route content for the Spiral Path system.
// Gate 1 routes (false_arrival, splintered_trust) — verbatim from framework reference.
// Gate 2 routes (burned_tongue, silenced_fire) — canonical instruction.

export type RouteId =
  | "false_arrival"
  | "splintered_trust"
  | "burned_tongue"
  | "silenced_fire"
  | "hidden_grief"
  | "withheld_tears"
  | "doubled_name"
  | "binding_veil"
  | "unspoken_truth"
  | "forgotten_light";

export type GlyphId =
  | "cracked-sun"
  | "broken-compass"
  | "burned-tongue"
  | "silenced-fire"
  | "hidden-grief"
  | "withheld-tears"
  | "doubled-name"
  | "binding-veil"
  | "unspoken-truth"
  | "forgotten-light";

export type AnswerField = {
  key: string;
  label: string;
  prompt: string;
  placeholder: string;
};

// Vessel selector — required component on Gate 2+ corrective pages.
// Renders between the answer fields and the Sovereign Action Block.
export type VesselSelector = {
  title: string;
  options: string[];
};

// Three-tier safety state (Green / Amber / Red Flame).
// Routes that define `safetyTiers` get edge treatment; Red Flame blocks unlock.
export type SafetyTier = {
  id: "green" | "amber" | "red";
  label: string;
  meaning: string;
  oracleTone: string;
  blocksUnlock: boolean;
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
  /** Gate 2+ only. */
  vesselSelector?: VesselSelector;
  /** Gate 2+ only. Shared across both Gate 2 routes. */
  safetyTiers?: SafetyTier[];
};

// Shared Gate 2 safety tiers (Burned Tongue and Silenced Fire use the same set).
const GATE_2_SAFETY_TIERS: SafetyTier[] = [
  {
    id: "green",
    label: "Green Flame",
    meaning: "Avatar grounded; action small, specific, safe enough.",
    oracleTone:
      "The vessel can hold this. Make the action precise, then complete it cleanly.",
    blocksUnlock: false,
  },
  {
    id: "amber",
    label: "Amber Flame",
    meaning:
      "Avatar intense, urgent, flooded, dramatic, or action too large.",
    oracleTone:
      "The fire is present. The vessel is not yet strong enough. Make the movement smaller before you act.",
    blocksUnlock: false,
  },
  {
    id: "red",
    label: "Red Flame",
    meaning:
      "Unsafe activation: harm language, self-harm, threats, danger, destructive confrontation, crisis, dissociation.",
    oracleTone:
      "Pause the page. This threshold does not require danger. Step away from the exercise and seek immediate human support if anyone may be harmed.",
    blocksUnlock: true,
  },
];

// Shared Gate 3 safety tiers (Hidden Grief and Withheld Tears use the same set).
// Parallel to Gate 2's flame tiers; reuses the green/amber/red ids so the
// existing detectFlameTier classifier applies unchanged.
const GATE_3_SAFETY_TIERS: SafetyTier[] = [
  {
    id: "green",
    label: "Soft Stone",
    meaning:
      "Avatar grounded; the mourning or movement act is small, private, safe.",
    oracleTone:
      "The stone can hold this. Choose a gentle act, then let it be witnessed cleanly.",
    blocksUnlock: false,
  },
  {
    id: "amber",
    label: "Cracked Stone",
    meaning:
      "Avatar flooded, rushing toward catharsis, forcing breakthrough, or proposing an act too large.",
    oracleTone:
      "The grief is real. The vessel is not yet ready for that much. Make the movement smaller before you act.",
    blocksUnlock: false,
  },
  {
    id: "red",
    label: "Broken Stone",
    meaning:
      "Unsafe: acute crisis, self-harm, dissociation, retraumatization risk, inability to ground.",
    oracleTone:
      "Pause the page. This threshold does not require you to break. Step away and seek human support if the grief is more than this moment can hold.",
    blocksUnlock: true,
  },
];

// Shared Gate 4 safety tiers (Doubled Name and Binding Veil use the same set).
// Parallel to Gate 2/3; reuses the green/amber/red ids so detectFlameTier
// applies unchanged. Shattered Mirror blocks unlock. Visual edge treatment
// is a darkened reflective field with a subdued red-violet warning — never
// literal shattered glass.
const GATE_4_SAFETY_TIERS: SafetyTier[] = [
  {
    id: "green",
    label: "Clear Mirror",
    meaning:
      "Avatar grounded; the act is small, private or safely witnessed, non-destructive.",
    oracleTone:
      "The mirror can hold this. Keep the act small and let distinction be enough.",
    blocksUnlock: false,
  },
  {
    id: "amber",
    label: "Split Mirror",
    meaning:
      "Avatar exposed, ashamed, urgent, inflated, seeking public recognition or final identity, or proposing an act too large.",
    oracleTone:
      "The echo is loud. Do not break the mirror. Make the act smaller.",
    blocksUnlock: false,
  },
  {
    id: "red",
    label: "Shattered Mirror",
    meaning:
      "Unsafe: self-harm, danger to self/others, panic, dissociation, severe identity destabilization, mania-like certainty, crisis, life-rupture impulse.",
    oracleTone:
      "Pause the page. This threshold does not require you to decide who you are while unstable. Step away and seek immediate human support if there is danger or you cannot ground.",
    blocksUnlock: true,
  },
];

// Shared Gate 5 safety tiers (Unspoken Truth and Forgotten Light use the same set).
// Parallel to Gate 2/3/4; reuses green/amber/red ids so detectFlameTier
// applies unchanged. Wild Tongue blocks unlock. Visual edge treatment is a
// darkened word-field with a subdued red-gold warning — never dramatic.
const GATE_5_SAFETY_TIERS: SafetyTier[] = [
  {
    id: "green",
    label: "Aligned Flame",
    meaning:
      "Avatar grounded; speech precise; right vessel and matching action chosen; no public-proof impulse, attack, coercion, domination, or grandiose command language.",
    oracleTone:
      "The word can be held. Speak it through the vessel and give it one body.",
    blocksUnlock: false,
  },
  {
    id: "amber",
    label: "Flared Word",
    meaning:
      "Avatar wants to say too much, declare publicly, command reality without action, prove, persuade, dominate, or be witnessed.",
    oracleTone:
      "The word is becoming larger than its body. Make the sentence smaller and the action clearer.",
    blocksUnlock: false,
  },
  {
    id: "red",
    label: "Wild Tongue",
    meaning:
      "Unsafe: threats, harm language, coercive intent, crisis-level intensity, mania-like certainty, delusional command language, spiritual domination, public destruction impulse, inability to ground, danger to self/others.",
    oracleTone:
      "Pause the page. This threshold does not require speech that can harm. Step away and seek immediate human support if there is danger or you cannot ground.",
    blocksUnlock: true,
  },
];

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
    symbolic: "The tongue remembers what the soul no longer serves.",
    oracle: "Do not force the voice open. Give the truth one safe breath.",
    oracleReturn:
      "You have stood here before. The truth has not yet found its safe breath. What one sentence is ready?",
    coreQuestion: "What truth became dangerous to speak?",
    scroll: `There is a truth that did not disappear.
It learned to stay behind the tongue.
Not because it was false.
Because speaking once carried consequence.
Punishment. Ridicule. Loss. Abandonment. Heat.
So the tongue remembered danger even after the soul outgrew the old room.
This page does not ask you to shout.
It does not ask you to confront.
It does not ask you to say everything.
It asks for one true sentence to touch air in a vessel safe enough to hold it.`,
    answers: [
      {
        key: "truth",
        label: "The Dangerous Truth",
        prompt: "What truth became dangerous to speak?",
        placeholder: "Name one truth. Not the whole story.",
      },
      {
        key: "punishment",
        label: "The Speech Punishment Memory",
        prompt:
          "Where did speaking, disagreeing, asking, refusing, needing, or naming truth become unsafe?",
        placeholder:
          "Name the room, pattern, authority, relationship, or memory without forcing details.",
      },
      {
        key: "silence",
        label: "The Old Silence Still Active",
        prompt: "Where does the old silence still govern you now?",
        placeholder:
          "Name the choice, relationship, topic, boundary, or expression still held behind the tongue.",
      },
      {
        key: "vessel",
        label: "The Safe Vessel",
        prompt:
          "What vessel is safe enough for the first breath of this truth?",
        placeholder: "Choose a vessel before choosing the action.",
      },
      {
        key: "sentence",
        label: "The Small True Sentence",
        prompt:
          "What is the one small true sentence that can safely touch air?",
        placeholder:
          "One sentence. No attack. No performance. No apology before the truth.",
      },
    ],
    vesselSelector: {
      title: "Choose the Safe Speech Vessel",
      options: [
        "Private voice note",
        "Mirror sentence",
        "Written sentence read aloud alone",
        "Candle-side spoken sentence",
        "Safe witness",
        "Unsent boundary sentence",
        "App spoken entry",
      ],
    },
    safetyTiers: GATE_2_SAFETY_TIERS,
    journalPrompt:
      "What truth still waits behind the tongue because the body remembers consequence?",
    journalHeader: "Burned Tongue — Private Reflection",
    trackerTitle: "Safe Speech Action",
    trackerCopy:
      "Speak one small true sentence in a vessel safe enough to hold it.",
    examples: [
      "Speak one true sentence into a private voice note.",
      "Read one boundary sentence aloud alone.",
      'Tell one safe witness: "I was afraid to say this."',
      'Say into the mirror: "I did not agree, but I stayed silent."',
      "Write the sentence and read it aloud beside a candle.",
    ],
    invalidExamples: [
      "I will speak my truth from now on.",
      "I will confront everyone who silenced me.",
      "I will never stay quiet again.",
      "I will finally say everything.",
      "I am now fearless.",
      "I will post the truth publicly.",
    ],
    reflectionPrompts: [
      "What did this Spiral Path allow you to see?",
      "What did speaking once cost you?",
      "Where does the old silence still issue orders today?",
    ],
    readiness: [
      "I have named the truth that became dangerous to speak.",
      "I have identified where speech became unsafe or punished.",
      "I have named where the old silence still governs me.",
      "I have chosen a safe vessel.",
      "I have written one small true sentence.",
      "The sentence has been spoken, recorded, or scheduled in the safe vessel.",
      "I am not using this action for revenge, public exposure, or unsafe confrontation.",
    ],
    incompleteCopy:
      "The page remains open. The voice does not need force. It needs one safe breath.",
    preUnlock:
      "The sentence has touched air. The flame did not destroy you.",
    unlockEpigraph: `The sentence has touched air.
The flame did not destroy you.`,
    // FLAGGED FOR OWNER REVIEW — drafted sealLine in Words Between Worlds voice
    sealLine:
      "I do not force the voice. I give one true sentence one safe breath.",
  },

  silenced_fire: {
    id: "silenced_fire",
    title: "Silenced Fire",
    glyph: "silenced-fire",
    symbolic: "Fire does not need permission. It needs right vessel.",
    oracle: "Do not break the vessel. Let one flame move through it.",
    oracleReturn:
      "You have stood here before. The fire still waits for its vessel. What one movement can hold it?",
    coreQuestion:
      "What fire did you silence to remain safe, acceptable, or controlled?",
    scroll: `There is a fire that did not die.
It learned containment.
It learned usefulness.
It learned to become pleasant, productive, quiet, acceptable, controlled.
Perhaps it was anger.
Perhaps desire.
Perhaps creativity.
Perhaps a no that became obedience.
Perhaps a yes that became shame.
This page does not ask you to unleash everything.
It does not ask you to burn the old life down.
It asks for one true flame to move through a vessel that can hold it.`,
    answers: [
      {
        key: "fire",
        label: "The Silenced Fire",
        prompt:
          "What fire did you silence to remain safe, acceptable, useful, loved, or controlled?",
        placeholder:
          "Name the fire: anger, desire, creativity, boundary, truth, joy, ambition, body, or another living force.",
      },
      {
        key: "unsafe",
        label: "Why It Became Unsafe",
        prompt:
          "Why did this fire become unsafe, unacceptable, dangerous, selfish, shameful, or too much?",
        placeholder:
          "Name the rule, room, authority, relationship, or fear that contained it.",
      },
      {
        key: "hid",
        label: "How You Hid It",
        prompt:
          "How have you contained, hidden, over-controlled, performed, or disguised this fire?",
        placeholder: "Name the strategy without condemning it.",
      },
      {
        key: "vessel",
        label: "The Right Vessel",
        prompt: "What vessel can hold one safe movement of this fire?",
        placeholder: "Choose the form before choosing the action.",
      },
      {
        key: "movement",
        label: "The Flame-Movement",
        prompt:
          "What one small movement can let this fire become real without becoming eruption?",
        placeholder:
          "Choose one action small enough to complete and true enough to matter.",
      },
    ],
    vesselSelector: {
      title: "Choose the Right Vessel",
      options: [
        "Body movement",
        "Creative work",
        "Clean boundary sentence",
        "Direct request",
        "Private uncensored paragraph",
        "Small visible preference",
        "Rest instead of over-functioning",
        "Desire named without performance",
      ],
    },
    safetyTiers: GATE_2_SAFETY_TIERS,
    journalPrompt:
      "Where has your fire become acceptable at the cost of being alive?",
    journalHeader: "Silenced Fire — Private Reflection",
    trackerTitle: "Right Vessel Action",
    trackerCopy:
      "Complete one small flame-movement through a vessel that can hold it.",
    examples: [
      "Move the body for five minutes without making it performance.",
      "Write one uncensored paragraph and keep it private.",
      "Say one clean no.",
      "Spend 30 minutes on a creative act you stopped permitting.",
      "Make one direct request without overexplaining.",
      "Let anger become a boundary sentence instead of attack.",
      "Let desire become one honest choice.",
    ],
    invalidExamples: [
      "I will unleash everything.",
      "I will burn my old life down.",
      "I will tell everyone off.",
      "I will become unstoppable.",
      "I will never control myself again.",
      "My fire is my destiny.",
      "I will prove them all wrong.",
    ],
    reflectionPrompts: [
      "What did this Spiral Path allow you to see?",
      "What did containing this fire cost you?",
      "What one movement would let it live without becoming eruption?",
    ],
    readiness: [
      "I have named the fire I silenced.",
      "I have identified why it became unsafe or unacceptable.",
      "I have named how I contained or hid it.",
      "I have chosen a right vessel.",
      "I have chosen one small flame-movement.",
      "The flame-movement has been completed or scheduled in lived reality.",
      "I am not using this action for revenge, spectacle, rupture, or proving myself.",
    ],
    incompleteCopy:
      "The page remains open. The fire does not need spectacle. It needs right vessel.",
    preUnlock: "The flame has moved without consuming the vessel.",
    unlockEpigraph: "The flame has moved without consuming the vessel.",
    // FLAGGED FOR OWNER REVIEW — drafted sealLine in Words Between Worlds voice
    sealLine:
      "I do not break the vessel. I let one true flame move through it.",
  },

  // ── Gate 3 — The Stone Garden of Grief ───────────────────────────────────

  hidden_grief: {
    id: "hidden_grief",
    title: "Hidden Grief",
    glyph: "hidden-grief",
    symbolic: "What was buried did not vanish. It waited beneath strength.",
    oracle: "Let the hidden grief be found. Not fixed. Found.",
    oracleReturn:
      "You have stood here before. The grief has not yet been allowed to be seen. What waits beneath the strength?",
    coreQuestion:
      "What sorrow have you kept hidden beneath strength, function, or meaning?",
    scroll: `There is a sorrow that learned to live underground.
It did not disappear.
It became useful.
It became composed.
It became wise too quickly.
It learned to stand while something inside remained kneeling.
Perhaps others needed you strong.
Perhaps the room had no place for grief.
Perhaps meaning arrived before mourning.
This page does not ask you to explain the sorrow.
It does not ask you to heal it.
It asks that the hidden grief be found without being hurried into purpose.`,
    answers: [
      {
        key: "sorrow",
        label: "The Hidden Sorrow",
        prompt:
          "What sorrow have you kept hidden beneath strength, composure, usefulness, numbness, or meaning?",
        placeholder:
          "Name the sorrow without explaining why it should already be gone.",
      },
      {
        key: "covering",
        label: "The Covering Form",
        prompt:
          "What has covered this grief: strength, duty, wisdom, busyness, humor, numbness, caretaking, spiritual meaning, achievement, or silence?",
        placeholder: "Name the form that kept grief buried.",
      },
      {
        key: "why_hidden",
        label: "Why It Stayed Hidden",
        prompt: "Why did this grief have to remain unseen?",
        placeholder:
          "Name the reason: safety, responsibility, shame, timing, fear, lack of witness, survival, or another true reason.",
      },
      {
        key: "vessel",
        label: "The Mourning Vessel",
        prompt:
          "What private or safely witnessed vessel can receive this grief without forcing it to perform?",
        placeholder: "Choose a vessel before choosing the mourning act.",
      },
      {
        key: "act",
        label: "The Mourning Act",
        prompt: "What one small act can honor this grief without fixing it?",
        placeholder:
          "Choose one act small enough to complete and gentle enough to hold.",
      },
    ],
    vesselSelector: {
      title: "Choose the Mourning Vessel",
      options: [
        "Private candle",
        "Stone placed in a bowl",
        "Letter never sent",
        "Name spoken aloud alone",
        "Safe witness",
        "Grave / place / memory visit",
        "Quiet music and stillness",
        "Flower, water, or earth offering",
        "App journal entry only",
      ],
    },
    safetyTiers: GATE_3_SAFETY_TIERS,
    journalPrompt:
      "What grief has remained unseen because you became strong too soon?",
    journalHeader: "Hidden Grief — Private Reflection",
    trackerTitle: "Mourning Act",
    trackerCopy:
      "Complete one private or safely witnessed act that lets the hidden grief be found without forcing it to become useful.",
    examples: [
      "Light a candle and say the name of what was lost.",
      "Place a stone in a bowl and let it represent the hidden grief.",
      "Write a letter that will not be sent.",
      "Sit for five minutes with music that allows the sorrow to be near.",
      'Tell one safe witness: "There is grief here I have not let be seen."',
      "Visit a place connected to the grief without requiring a breakthrough.",
      "Place flowers, water, or earth as a private acknowledgment.",
    ],
    invalidExamples: [
      "I will finally heal this.",
      "I will turn this grief into purpose.",
      "I will tell everyone everything.",
      "I will cry until it is gone.",
      "I will prove I am over it.",
      "I will understand why this happened.",
      "I will forgive now.",
    ],
    reflectionPrompts: [
      "What did this Spiral Path allow you to see?",
      "What did carrying this grief in silence cost you?",
      "What would it mean to let this sorrow be witnessed without being fixed?",
    ],
    readiness: [
      "I have named the hidden sorrow.",
      "I have identified what covered it.",
      "I have named why it stayed hidden.",
      "I have chosen a mourning vessel.",
      "I have chosen one mourning act.",
      "The mourning act has been completed or scheduled.",
      "I am not forcing this grief to become useful, public, resolved, or explained.",
    ],
    incompleteCopy:
      "The page remains open. The grief does not need meaning yet. It needs witness.",
    preUnlock:
      "The hidden grief has been found. It does not need to become anything else yet.",
    unlockEpigraph: `The hidden grief has been found.
It does not need to become anything else yet.`,
    // FLAGGED FOR OWNER REVIEW — drafted sealLine in Words Between Worlds voice
    sealLine: "I do not bury my grief beneath strength. I let it be seen.",
  },

  withheld_tears: {
    id: "withheld_tears",
    title: "Withheld Tears",
    glyph: "withheld-tears",
    symbolic:
      "The body may hold the sorrow long after the mind has named it.",
    oracle: "Do not force the tears. Give the sorrow one safe movement.",
    oracleReturn:
      "You have stood here before. The body still holds the gate closed. What one small movement can it allow?",
    coreQuestion: "What sorrow do you know, but still cannot let move?",
    scroll: `You may already know the grief.
You may have named it many times.
You may understand its history.
You may have spoken of it clearly.
Still, the body may hold the gate closed.
Not because it refuses healing.
Because movement once felt unsafe.
Because tears once changed nothing.
Because release once brought no witness.
This page does not command you to cry.
It does not ask for catharsis.
It asks for one safe movement, small enough that the body does not need to defend against it.`,
    answers: [
      {
        key: "known_sorrow",
        label: "The Known Sorrow",
        prompt:
          "What sorrow do you already know or feel, but still cannot let move?",
        placeholder: "Name the sorrow without requiring tears.",
      },
      {
        key: "holding",
        label: "The Body's Holding Pattern",
        prompt:
          "How does the body hold this sorrow: tight throat, chest pressure, frozen belly, numbness, jaw tension, shallow breath, tiredness, collapse, or another pattern?",
        placeholder: "Name the holding pattern gently.",
      },
      {
        key: "why_unsafe",
        label: "Why Movement Felt Unsafe",
        prompt:
          "Why might emotional movement have felt unsafe, useless, dangerous, shameful, or unwitnessed?",
        placeholder: "Name the reason without forcing memory.",
      },
      {
        key: "vessel",
        label: "The Safe Movement Vessel",
        prompt:
          "What vessel can hold one small movement of sorrow without forcing catharsis?",
        placeholder: "Choose the vessel before choosing the movement.",
      },
      {
        key: "movement",
        label: "The Small Movement",
        prompt:
          "What one small movement can let sorrow move one degree without demanding tears?",
        placeholder: "Choose one movement the body can survive.",
      },
    ],
    vesselSelector: {
      title: "Choose the Movement Vessel",
      options: [
        "Hand on heart",
        "Slow breath",
        "Music and stillness",
        "Gentle walk",
        "Water ritual",
        "Private voice note",
        "Soft body movement",
        "Sitting beside a candle",
        "Safe witness presence",
        "App journal entry only",
      ],
    },
    safetyTiers: GATE_3_SAFETY_TIERS,
    journalPrompt:
      "Where does sorrow remain held in the body even after it has been named?",
    journalHeader: "Withheld Tears — Private Reflection",
    trackerTitle: "Safe Movement Act",
    trackerCopy:
      "Allow one safe movement of sorrow without requiring tears, catharsis, or explanation.",
    examples: [
      "Place a hand on the chest and breathe slowly for one minute.",
      "Listen to one song and let the body respond however it responds.",
      "Take a slow walk while naming the grief once.",
      "Hold a bowl of water and let it represent what could not move.",
      'Record a private voice note beginning: "This sorrow is allowed one breath."',
      "Sit with a safe witness without explaining everything.",
      "Let the face soften for thirty seconds without forcing tears.",
    ],
    invalidExamples: [
      "I will make myself cry.",
      "I will release it all tonight.",
      "I will finally break down.",
      "I will force my body to feel it.",
      "I will relive the whole event.",
      "I will prove I am healed.",
      "I will tell everyone how much I suffered.",
    ],
    reflectionPrompts: [
      "What did this Spiral Path allow you to see?",
      "Where does the body still hold the gate closed?",
      "What one small movement could the body allow without being forced?",
    ],
    readiness: [
      "I have named the known sorrow.",
      "I have identified how the body holds it.",
      "I have named why movement may have felt unsafe.",
      "I have chosen a movement vessel.",
      "I have chosen one small movement.",
      "The movement has been completed or scheduled.",
      "I am not forcing tears, catharsis, memory, public exposure, or emotional breakthrough.",
    ],
    incompleteCopy:
      "The page remains open. Tears are not required. One safe movement is enough.",
    preUnlock: "The sorrow has moved one degree. Nothing was forced.",
    unlockEpigraph: `The sorrow has moved one degree.
Nothing was forced.`,
    // FLAGGED FOR OWNER REVIEW — drafted sealLine in Words Between Worlds voice
    sealLine:
      "I do not force the tears. I give the sorrow one safe movement.",
  },

  // ── Gate 4 — The Echoed Self ────────────────────────────────────────────

  doubled_name: {
    id: "doubled_name",
    title: "The Doubled Name",
    glyph: "doubled-name",
    symbolic: "The name that was praised may not be the name that is true.",
    oracle:
      "Do not destroy the performed name. Separate it from the one beneath.",
    oracleReturn:
      "You have stood here before. The performed name still answers first. What waits beneath it?",
    coreQuestion:
      "What name, role, or identity still performs for approval against the truth of being?",
    scroll: `There is a name the world learned to call you.
Perhaps it was responsible.
Gifted.
Difficult.
Strong.
Pleasant.
Useful.
Special.
Safe.
Perhaps the name was never spoken aloud, but every room rewarded it.
So the name became a face.
Then the face became a rule.
This page does not ask you to hate the name that helped you survive.
It asks you to see where that name still answers before truth can speak.`,
    answers: [
      {
        key: "approved_name",
        label: "The Approved Name",
        prompt:
          "What name, role, identity, persona, reputation, or mask has been rewarded by others?",
        placeholder: "Name the identity that learned to perform.",
      },
      {
        key: "rewarding_room",
        label: "The Rewarding Room",
        prompt:
          "Who or what rewarded this name: family, authority, relationship, institution, audience, marketplace, community, spiritual group, or survival pattern?",
        placeholder: "Name the room that trained the echo.",
      },
      {
        key: "cost",
        label: "The Cost of the Name",
        prompt:
          "What did this approved name cost in truth, expression, rest, desire, boundary, grief, fire, or freedom?",
        placeholder:
          "Name what the performance required you to withhold.",
      },
      {
        key: "name_beneath",
        label: "The Name Beneath",
        prompt:
          "What quieter name, quality, truth, or signal waits beneath the performed identity?",
        placeholder: "Name only what is safe enough to name now.",
      },
      {
        key: "reclaiming_act",
        label: "The Reclaiming Act",
        prompt:
          "What one small act can let the name beneath move without destroying the old name?",
        placeholder:
          "Choose one act of distinction, not a dramatic identity rupture.",
      },
    ],
    vesselSelector: {
      title: "Choose the Naming Vessel",
      options: [
        "Private mirror sentence",
        "App journal entry only",
        "Unsent letter to the approved name",
        "Safe witness",
        "Small boundary sentence",
        "One choice made without performing the role",
        "Symbolic object or nameplate",
        "Private voice note",
        "Quiet refusal of one performance",
      ],
    },
    safetyTiers: GATE_4_SAFETY_TIERS,
    journalPrompt:
      "Where does the name the world rewarded still answer before the truer one can speak?",
    journalHeader: "The Doubled Name — Private Reflection",
    trackerTitle: "Reclaiming Act",
    trackerCopy:
      "Complete one small act that lets the name beneath move without destroying the name that protected you.",
    examples: [
      'Privately write: "This is the name they rewarded; this is the name beneath."',
      "Make one choice without performing the approved role.",
      "Tell one safe witness one true thing the performed name would hide.",
      "Refuse one performance the rewarding room expects.",
      "Say a quiet mirror sentence naming what is true beneath.",
      "Write an unsent letter to the approved name, thanking it and setting it down.",
    ],
    invalidExamples: [
      "I will destroy who I used to be.",
      "I will tell everyone the real me.",
      "I will quit everything and start over as a new person.",
      "I will prove I was never that role.",
      "I will become my true self overnight.",
      "I will reject everyone who knew the old name.",
    ],
    reflectionPrompts: [
      "What did this Spiral Path allow you to see?",
      "What has the approved name required you to withhold?",
      "What would it mean to let the name beneath move without destroying the old one?",
    ],
    readiness: [
      "I have named the approved identity.",
      "I have named the room that rewarded it.",
      "I have named what the performance cost me.",
      "I have named the quieter truth beneath it.",
      "I have chosen a naming vessel.",
      "I have chosen one act of distinction.",
      "The reclaiming act has been completed or scheduled.",
      "I am not using this action to destroy the old name, force a final identity, or perform a new one publicly.",
    ],
    incompleteCopy:
      "The page remains open. The echo does not need to be destroyed. It needs to stop answering first.",
    preUnlock: "The echo has been named. It no longer answers first.",
    unlockEpigraph: `The echo has been named.
It no longer answers first.`,
    // FLAGGED FOR OWNER REVIEW — drafted sealLine in Words Between Worlds voice
    sealLine:
      "I do not destroy the name that protected me. I let the truer one speak.",
  },

  binding_veil: {
    id: "binding_veil",
    title: "The Binding Veil",
    glyph: "binding-veil",
    symbolic: "Not every mystery is sacred. Some are fear dressed in silk.",
    oracle:
      "Do not tear the veil. Find where it protects fear and let one seam open.",
    oracleReturn:
      "You have stood here before. The veil still hangs whole. Which seam protects fear, not the sacred?",
    coreQuestion:
      "Where have you called concealment sacred because exposure felt unsafe?",
    scroll: `Some veils are holy.
They protect what must ripen in darkness.
They keep the sacred from becoming spectacle.
But some veils are woven from fear and named mystery.
Some concealment becomes beautiful because it keeps truth from asking anything of the body.
Some silence becomes spiritual because exposure once carried consequence.
This page does not ask you to unveil everything.
It does not ask you to become transparent.
It asks you to find the seam where fear has borrowed the language of the sacred.`,
    answers: [
      {
        key: "veil",
        label: "The Veil",
        prompt:
          "What have you kept hidden, unnamed, vague, mystical, private, or untouchable?",
        placeholder: "Name the veil without forcing disclosure.",
      },
      {
        key: "fear_beneath",
        label: "The Fear Beneath",
        prompt:
          "What fear might this veil protect: rejection, exposure, loss, judgment, responsibility, change, intimacy, consequence, or another truth?",
        placeholder: "Name the fear gently.",
      },
      {
        key: "sacred_story",
        label: "The Sacred Story",
        prompt:
          "What story has made the concealment feel sacred, wise, spiritual, refined, mysterious, or necessary?",
        placeholder: "Name the story without shaming it.",
      },
      {
        key: "truly_sacred",
        label: "What Remains Truly Sacred",
        prompt:
          "What part of the veil is legitimate protection, sacred privacy, timing, or discernment?",
        placeholder:
          "Keep what is truly sacred from being torn open.",
      },
      {
        key: "seam",
        label: "The Seam to Open",
        prompt:
          "What one seam can open without exposing what should remain protected?",
        placeholder:
          "Choose one small act of clarification, not full revelation.",
      },
    ],
    vesselSelector: {
      title: "Choose the Veil-Thinning Vessel",
      options: [
        "Private naming in the app",
        "Mirror sentence",
        "One safe witness",
        "Unsent letter",
        "Boundary clarification",
        "One honest sentence without full disclosure",
        "Symbolic veil / cloth ritual",
        "Removing one unnecessary concealment",
        "Private voice note",
      ],
    },
    safetyTiers: GATE_4_SAFETY_TIERS,
    journalPrompt: "Where has fear borrowed the language of mystery?",
    journalHeader: "The Binding Veil — Private Reflection",
    trackerTitle: "Veil-Thinning Act",
    trackerCopy:
      "Complete one precise act that separates sacred mystery from fear-made concealment.",
    examples: [
      'Privately write: "This part is sacred; this part is fear."',
      "Tell one safe witness one honest sentence without revealing everything.",
      "Remove one unnecessary vagueness from a boundary, request, or answer.",
      "Name one fear that has been disguised as mystery.",
      "Place a cloth over a mirror, then open one corner to symbolize one seam.",
      "Clarify one private truth to yourself without making it public.",
      "Keep one sacred boundary while releasing one protective excuse.",
    ],
    invalidExamples: [
      "I will reveal everything.",
      "I will stop hiding anything.",
      "I will confess all of it publicly.",
      "I will tear down every boundary.",
      "I will become completely transparent.",
      "I will expose myself so I can be free.",
      "I will prove I have nothing to hide.",
    ],
    reflectionPrompts: [
      "What did this Spiral Path allow you to see?",
      "What does this veil protect — sacred timing, or fear?",
      "What one seam could open without violating what is genuinely sacred?",
    ],
    readiness: [
      "I have named the veil without forcing exposure.",
      "I have identified the fear the veil may protect.",
      "I have named the sacred story around the concealment.",
      "I have distinguished what remains truly sacred from what is fear-made concealment.",
      "I have chosen a veil-thinning vessel.",
      "I have chosen one seam to open.",
      "The veil-thinning act has been completed or scheduled.",
      "I am not using this action for public confession, forced vulnerability, boundary collapse, or self-exposure.",
    ],
    incompleteCopy:
      "The page remains open. The veil does not need to be torn. One seam is enough.",
    preUnlock: "One seam has opened. The sacred remains protected.",
    unlockEpigraph: `One seam has opened.
The sacred remains protected.`,
    // FLAGGED FOR OWNER REVIEW — drafted sealLine in Words Between Worlds voice
    sealLine:
      "I do not tear the veil. I open one seam where fear wore the sacred's name.",
  },
};
