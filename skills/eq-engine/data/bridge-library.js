/**
 * Hi Dev Collective — Bridge Library
 * Stay Hi Trac — Hi Compass Data Layer
 *
 * Bridge thoughts are the INTERPRET gate — reframing sentences that help
 * the mind logically accept movement from the current emotional state
 * toward the desired state. This is the core of the Abraham-Hicks
 * "reach for the next better feeling thought" concept.
 *
 * Architecture:
 *   - Keyed by familyId → array of bridges
 *   - Each bridge has a `tone` (gentle, direct, reflective) for LLM matching
 *   - When LLM is available, these seed the prompt; LLM personalizes further
 *   - When LLM is offline, these serve directly as template responses
 *   - `forDesire` optionally links a bridge to a specific desire card
 */

export const BRIDGE_LIBRARY = {
  // ── Grief & Loss ────────────────────────────────────────────────────────
  grief: [
    {
      text: 'This pain is not a sign that something went wrong. It\'s proof that something mattered deeply.',
      tone: 'gentle',
      forDesire: null,
    },
    {
      text: 'You don\'t have to be over it. You just have to be in it — honestly.',
      tone: 'gentle',
      forDesire: 'grief_gentleness',
    },
    {
      text: 'Grief isn\'t the absence of strength. It\'s love with nowhere to go right now.',
      tone: 'reflective',
      forDesire: 'grief_acceptance',
    },
    {
      text: 'The weight won\'t always be this heavy. Today it is, and that\'s allowed.',
      tone: 'gentle',
      forDesire: null,
    },
    {
      text: 'What you lost is part of your story now — not the ending, but a chapter that changed you.',
      tone: 'reflective',
      forDesire: 'grief_meaning',
    },
    {
      text: 'You\'re still here. That matters more than it feels like right now.',
      tone: 'direct',
      forDesire: 'grief_connection',
    },
  ],

  // ── Fear & Anxiety ──────────────────────────────────────────────────────
  fear: [
    {
      text: 'Your mind is trying to protect you. The alarm is real — the fire might not be.',
      tone: 'reflective',
      forDesire: 'fear_clarity',
    },
    {
      text: 'You\'ve survived 100% of your worst days so far. The track record is perfect.',
      tone: 'direct',
      forDesire: 'fear_courage',
    },
    {
      text: 'Fear and excitement live in the same room. What if this is the second one wearing a mask?',
      tone: 'reflective',
      forDesire: null,
    },
    {
      text: 'Right now, in this exact moment, you are safe. Start there.',
      tone: 'gentle',
      forDesire: 'fear_safety',
    },
    {
      text: 'You don\'t need to see the whole staircase. Just the next step.',
      tone: 'direct',
      forDesire: 'fear_trust',
    },
    {
      text: 'The worst-case scenario in your head has a 90% chance of not happening. What about the other scenarios?',
      tone: 'reflective',
      forDesire: 'fear_clarity',
    },
  ],

  // ── Anger & Rage ────────────────────────────────────────────────────────
  anger: [
    {
      text: 'This anger is information. It\'s telling you something matters. What is it?',
      tone: 'reflective',
      forDesire: 'anger_boundary',
    },
    {
      text: 'You have every right to feel this. You also get to choose what you do with it.',
      tone: 'direct',
      forDesire: 'anger_channel',
    },
    {
      text: 'Anger is energy. The question isn\'t whether to feel it — it\'s where to aim it.',
      tone: 'direct',
      forDesire: 'anger_channel',
    },
    {
      text: 'Holding onto this takes your energy. Letting go doesn\'t mean they were right.',
      tone: 'gentle',
      forDesire: 'anger_release',
    },
    {
      text: 'The best revenge is building something they can\'t take from you.',
      tone: 'direct',
      forDesire: 'anger_justice',
    },
    {
      text: 'You\'re not weak for being angry. You\'re human for being pushed.',
      tone: 'gentle',
      forDesire: null,
    },
  ],

  // ── Shame & Guilt ──────────────────────────────────────────────────────
  shame: [
    {
      text: 'You did something you regret. That is not the same as being a bad person.',
      tone: 'direct',
      forDesire: 'shame_compassion',
    },
    {
      text: 'The fact that you feel guilt means your values are still intact. That\'s evidence, not a verdict.',
      tone: 'reflective',
      forDesire: 'shame_worthiness',
    },
    {
      text: 'If your best friend told you this story, would you judge them the way you\'re judging yourself?',
      tone: 'gentle',
      forDesire: 'shame_compassion',
    },
    {
      text: 'Repair is always an option. It starts with one honest step.',
      tone: 'direct',
      forDesire: 'shame_repair',
    },
    {
      text: 'You can carry the lesson without carrying the weight forever.',
      tone: 'reflective',
      forDesire: 'shame_forgiveness',
    },
    {
      text: 'Shame wants you isolated. Connection is the antidote.',
      tone: 'gentle',
      forDesire: null,
    },
  ],

  // ── Frustration & Irritation ───────────────────────────────────────────
  frustration: [
    {
      text: 'You\'re frustrated because you care about the outcome. That\'s fuel, not failure.',
      tone: 'reflective',
      forDesire: null,
    },
    {
      text: 'The wall in front of you isn\'t the end of the road. It\'s just the end of THIS road.',
      tone: 'direct',
      forDesire: 'frustration_approach',
    },
    {
      text: 'Zoom out. Where were you 30 days ago? Progress hides inside frustration.',
      tone: 'reflective',
      forDesire: 'frustration_progress',
    },
    {
      text: 'What if the delay is building something in you that the shortcut would have skipped?',
      tone: 'gentle',
      forDesire: 'frustration_patience',
    },
    {
      text: 'You\'re not going backward. You\'re loading the spring.',
      tone: 'direct',
      forDesire: 'frustration_progress',
    },
    {
      text: 'Sometimes the block is the message. What is this resistance actually saying?',
      tone: 'reflective',
      forDesire: 'frustration_acceptance',
    },
  ],

  // ── Doubt & Uncertainty ────────────────────────────────────────────────
  doubt: [
    {
      text: 'Clarity doesn\'t come from thinking harder. It comes from moving and adjusting.',
      tone: 'direct',
      forDesire: 'doubt_action',
    },
    {
      text: 'You don\'t need permission to try. Give it one week. Data beats doubt.',
      tone: 'direct',
      forDesire: 'doubt_experiment',
    },
    {
      text: 'The people who seem certain aren\'t more sure than you — they just started before they were ready.',
      tone: 'reflective',
      forDesire: 'doubt_confidence',
    },
    {
      text: 'Your gut has been right before. What\'s it saying right now if you actually listen?',
      tone: 'gentle',
      forDesire: 'doubt_intuition',
    },
    {
      text: 'Not knowing isn\'t a problem to solve. It\'s a space to move through.',
      tone: 'reflective',
      forDesire: null,
    },
    {
      text: 'The smallest step forward gives you more information than any amount of thinking.',
      tone: 'direct',
      forDesire: 'doubt_action',
    },
  ],

  // ── Disconnect & Numbness ──────────────────────────────────────────────
  disconnect: [
    {
      text: 'You don\'t have to feel everything at once. Just feel one thing. Start there.',
      tone: 'gentle',
      forDesire: 'disconnect_spark',
    },
    {
      text: 'Your body is still here even when your mind checks out. Come back to it.',
      tone: 'gentle',
      forDesire: 'disconnect_body',
    },
    {
      text: 'Numbness is not nothing. It\'s your system saying "too much." Honor the pause.',
      tone: 'reflective',
      forDesire: null,
    },
    {
      text: 'One text. One voice memo. One "hey." Human connection is the exit door.',
      tone: 'direct',
      forDesire: 'disconnect_reach',
    },
    {
      text: '3 things you see. 2 you can touch. 1 you hear. You\'re here right now.',
      tone: 'direct',
      forDesire: 'disconnect_presence',
    },
    {
      text: 'Autopilot is a survival mode, not a life mode. You\'re allowed to come back.',
      tone: 'gentle',
      forDesire: 'disconnect_presence',
    },
  ],

  // ── Peace & Calm ──────────────────────────────────────────────────────
  peace: [
    {
      text: 'This calm is earned, not accidental. What created it? Protect that.',
      tone: 'reflective',
      forDesire: 'peace_deepen',
    },
    {
      text: 'Don\'t rush past the good moments. They\'re building your baseline.',
      tone: 'gentle',
      forDesire: 'peace_deepen',
    },
    {
      text: 'Peace isn\'t the absence of problems. It\'s the presence of perspective.',
      tone: 'reflective',
      forDesire: null,
    },
    {
      text: 'What would it look like to share some of this energy with someone who needs it?',
      tone: 'gentle',
      forDesire: 'peace_share',
    },
  ],

  // ── Drive & Empowerment ───────────────────────────────────────────────
  drive: [
    {
      text: 'This fire is yours. Point it at the ONE thing that matters most today.',
      tone: 'direct',
      forDesire: 'drive_focus',
    },
    {
      text: 'Don\'t forget what got you here. Celebrate the reps before starting new ones.',
      tone: 'gentle',
      forDesire: 'drive_celebrate',
    },
    {
      text: 'Sustainable beats intense. What does this energy need to last?',
      tone: 'reflective',
      forDesire: 'drive_sustain',
    },
    {
      text: 'You\'re in the zone. Respect it — don\'t waste it on the trivial.',
      tone: 'direct',
      forDesire: 'drive_focus',
    },
  ],

  // ── Joy & Connection ──────────────────────────────────────────────────
  joy: [
    {
      text: 'This is real. Name it. Remember it. You\'ll want to find your way back here.',
      tone: 'gentle',
      forDesire: 'joy_ground',
    },
    {
      text: 'Joy wasn\'t given to you — you created the conditions for it. Own that.',
      tone: 'direct',
      forDesire: 'joy_amplify',
    },
    {
      text: 'Who can you share this with? Joy is one of the few things that multiplies when you give it away.',
      tone: 'gentle',
      forDesire: 'joy_extend',
    },
    {
      text: 'Don\'t dim this because other things are hard. Both can be true.',
      tone: 'reflective',
      forDesire: null,
    },
  ],
};

/**
 * Get bridge thoughts for a family.
 * @param {string} familyId
 * @returns {Array} Bridge objects
 */
export function getBridgesForFamily(familyId) {
  return BRIDGE_LIBRARY[familyId] || [];
}

/**
 * Get bridge thoughts that match a specific desire.
 * @param {string} familyId
 * @param {string} desireId
 * @returns {Array} Filtered bridge objects
 */
export function getBridgesForDesire(familyId, desireId) {
  const all = BRIDGE_LIBRARY[familyId] || [];
  const specific = all.filter(b => b.forDesire === desireId);
  // If no specific bridges, return the general ones (forDesire === null)
  return specific.length > 0 ? specific : all.filter(b => b.forDesire === null);
}

/**
 * Pick a random bridge for a family, optionally filtered by tone.
 * @param {string} familyId
 * @param {string} [tone] - 'gentle', 'direct', or 'reflective'
 * @returns {object|null} A bridge object, or null
 */
export function pickBridge(familyId, tone) {
  let pool = BRIDGE_LIBRARY[familyId] || [];
  if (tone) pool = pool.filter(b => b.tone === tone);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
