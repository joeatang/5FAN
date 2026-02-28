/**
 * Hi Dev Collective — Desire Map
 * Stay Hi Trac — Hi Compass Data Layer
 *
 * The "equal and opposite" destination for each emotion family.
 * When a user LOCATEs their current emotion (family), the Compass
 * POINTs them toward desire cards — the relieving state one notch
 * higher on the Hi Scale.
 *
 * Architecture:
 *   - Each family has 3–5 desire cards
 *   - Desires are NOT emotions — they're *states you want to move toward*
 *   - bridgePrompt seeds the INTERPRET gate (the reframing thought)
 *   - Each desire links back to a target emotion family for the Hi Scale shift
 *
 * Key principle: Relief, not perfection. The desire is always the NEXT
 * relieving step — not a giant leap to the top of the scale.
 */

export const DESIRE_MAP = {
  // ── Grief & Loss → Peace, Connection ────────────────────────────────────
  grief: [
    {
      id: 'grief_acceptance',
      label: 'Acceptance',
      emoji: '🕊️',
      targetFamily: 'peace',
      description: 'Not forgetting — just allowing what is',
      bridgePrompt: 'What if this pain is proof of how much it mattered?',
    },
    {
      id: 'grief_gentleness',
      label: 'Gentleness with Myself',
      emoji: '🤲',
      targetFamily: 'peace',
      description: 'Permission to not be okay right now',
      bridgePrompt: 'What if there\'s no timeline for this — and that\'s okay?',
    },
    {
      id: 'grief_connection',
      label: 'Feeling Connected Again',
      emoji: '🤝',
      targetFamily: 'joy',
      description: 'Remembering you\'re not alone in this',
      bridgePrompt: 'Who or what still makes you feel held, even in this?',
    },
    {
      id: 'grief_meaning',
      label: 'Finding Meaning',
      emoji: '🌱',
      targetFamily: 'peace',
      description: 'This loss becoming part of your story, not the end of it',
      bridgePrompt: 'What would honoring this look like going forward?',
    },
  ],

  // ── Fear & Anxiety → Peace, Safety ──────────────────────────────────────
  fear: [
    {
      id: 'fear_safety',
      label: 'Feeling Safe',
      emoji: '🏠',
      targetFamily: 'peace',
      description: 'The ground under your feet is solid',
      bridgePrompt: 'What is actually true right now — not the story, but right now?',
    },
    {
      id: 'fear_courage',
      label: 'Quiet Courage',
      emoji: '🛡️',
      targetFamily: 'drive',
      description: 'Not fearless — just willing to move anyway',
      bridgePrompt: 'What if you\'ve already survived harder things than this?',
    },
    {
      id: 'fear_clarity',
      label: 'Clarity',
      emoji: '🔍',
      targetFamily: 'peace',
      description: 'Separating what you can control from what you can\'t',
      bridgePrompt: 'What\'s the one thing in this situation that IS in your hands?',
    },
    {
      id: 'fear_trust',
      label: 'Trust in the Process',
      emoji: '🌊',
      targetFamily: 'peace',
      description: 'Letting go of needing to know every outcome',
      bridgePrompt: 'What if uncertainty isn\'t danger — it\'s just the unknown?',
    },
  ],

  // ── Anger & Rage → Drive, Clarity ───────────────────────────────────────
  anger: [
    {
      id: 'anger_boundary',
      label: 'Clear Boundaries',
      emoji: '🚧',
      targetFamily: 'drive',
      description: 'Using this energy to protect what matters',
      bridgePrompt: 'What boundary does this anger want you to set?',
    },
    {
      id: 'anger_channel',
      label: 'Channeled Energy',
      emoji: '⚡',
      targetFamily: 'drive',
      description: 'Converting fire into focused action',
      bridgePrompt: 'This energy is fuel. What would you build with it instead of burn?',
    },
    {
      id: 'anger_release',
      label: 'Release',
      emoji: '💨',
      targetFamily: 'peace',
      description: 'Letting it move through you instead of holding it',
      bridgePrompt: 'What if holding onto this costs more than letting it go?',
    },
    {
      id: 'anger_justice',
      label: 'Constructive Justice',
      emoji: '⚖️',
      targetFamily: 'drive',
      description: 'Turning outrage into action that actually changes something',
      bridgePrompt: 'What change do you actually want to see — and what\'s one step toward it?',
    },
  ],

  // ── Shame & Guilt → Joy, Self-worth ─────────────────────────────────────
  shame: [
    {
      id: 'shame_compassion',
      label: 'Self-Compassion',
      emoji: '💛',
      targetFamily: 'joy',
      description: 'Treating yourself like someone you care about',
      bridgePrompt: 'What would you say to a friend going through this exact thing?',
    },
    {
      id: 'shame_forgiveness',
      label: 'Self-Forgiveness',
      emoji: '🔓',
      targetFamily: 'peace',
      description: 'You did something wrong — you are not something wrong',
      bridgePrompt: 'What if the lesson has already been learned, and you can release the weight?',
    },
    {
      id: 'shame_worthiness',
      label: 'Remembering My Worth',
      emoji: '👑',
      targetFamily: 'joy',
      description: 'One action doesn\'t define you — your pattern does',
      bridgePrompt: 'Name three things about yourself that are still true despite this moment.',
    },
    {
      id: 'shame_repair',
      label: 'Making It Right',
      emoji: '🔧',
      targetFamily: 'drive',
      description: 'Turning regret into action — repair is always available',
      bridgePrompt: 'What\'s one concrete thing you could do to start making this right?',
    },
  ],

  // ── Frustration & Irritation → Drive, Flow ──────────────────────────────
  frustration: [
    {
      id: 'frustration_patience',
      label: 'Patient Persistence',
      emoji: '🐢',
      targetFamily: 'peace',
      description: 'Slowing down doesn\'t mean giving up',
      bridgePrompt: 'What if progress is happening — just not at the speed you expected?',
    },
    {
      id: 'frustration_approach',
      label: 'New Approach',
      emoji: '🔄',
      targetFamily: 'drive',
      description: 'Same destination, different path',
      bridgePrompt: 'If the front door is locked, what\'s the side door?',
    },
    {
      id: 'frustration_progress',
      label: 'Seeing Progress',
      emoji: '📈',
      targetFamily: 'drive',
      description: 'Zooming out to see how far you\'ve actually come',
      bridgePrompt: 'Compare where you are now to where you were 30 days ago. What moved?',
    },
    {
      id: 'frustration_acceptance',
      label: 'Accepting the Block',
      emoji: '🧘',
      targetFamily: 'peace',
      description: 'Some walls aren\'t yours to push through right now',
      bridgePrompt: 'What if this resistance is redirecting you, not stopping you?',
    },
  ],

  // ── Doubt & Uncertainty → Drive, Clarity ────────────────────────────────
  doubt: [
    {
      id: 'doubt_confidence',
      label: 'Quiet Confidence',
      emoji: '🌟',
      targetFamily: 'drive',
      description: 'You don\'t need certainty to take the next step',
      bridgePrompt: 'What do you know for sure — even if it\'s just one thing?',
    },
    {
      id: 'doubt_experiment',
      label: 'Experimenting',
      emoji: '🧪',
      targetFamily: 'drive',
      description: 'Treating it as a test, not a permanent decision',
      bridgePrompt: 'What if you gave yourself permission to try it for just one week?',
    },
    {
      id: 'doubt_intuition',
      label: 'Trusting My Gut',
      emoji: '🫀',
      targetFamily: 'peace',
      description: 'Your instinct already knows — the noise is just loud',
      bridgePrompt: 'If you turned off everyone else\'s voice, what does yours say?',
    },
    {
      id: 'doubt_action',
      label: 'Clarity Through Action',
      emoji: '🏃',
      targetFamily: 'drive',
      description: 'Movement creates clarity — standing still does not',
      bridgePrompt: 'What\'s the smallest possible step you could take in the next hour?',
    },
  ],

  // ── Disconnect & Numbness → Joy, Presence ───────────────────────────────
  disconnect: [
    {
      id: 'disconnect_presence',
      label: 'Being Present',
      emoji: '🌿',
      targetFamily: 'peace',
      description: 'Coming back to right here, right now',
      bridgePrompt: 'Name 3 things you can see, 2 you can touch, 1 you can hear. Right now.',
    },
    {
      id: 'disconnect_spark',
      label: 'A Small Spark',
      emoji: '🕯️',
      targetFamily: 'joy',
      description: 'Not a bonfire — just one tiny thing that feels real',
      bridgePrompt: 'What\'s the last thing that made you feel something — even a little?',
    },
    {
      id: 'disconnect_body',
      label: 'Feeling My Body',
      emoji: '🫁',
      targetFamily: 'peace',
      description: 'Getting out of your head and into your senses',
      bridgePrompt: 'Put your hand on your chest. Feel your heartbeat. You\'re here.',
    },
    {
      id: 'disconnect_reach',
      label: 'Reaching Out',
      emoji: '📱',
      targetFamily: 'joy',
      description: 'One message, one call — breaking the isolation pattern',
      bridgePrompt: 'Who haven\'t you talked to in a while that would be glad to hear from you?',
    },
  ],

  // ── Peace & Calm → (Deepen / Maintain) ──────────────────────────────────
  peace: [
    {
      id: 'peace_deepen',
      label: 'Deepening This',
      emoji: '🧘',
      targetFamily: 'peace',
      description: 'Not rushing past the calm — staying in it intentionally',
      bridgePrompt: 'What\'s creating this peace? How can you protect it?',
    },
    {
      id: 'peace_gratitude',
      label: 'Gratitude',
      emoji: '🌻',
      targetFamily: 'joy',
      description: 'Noticing what\'s good — not as a fix, but as fuel',
      bridgePrompt: 'What\'s one thing today that you\'d miss if it were gone?',
    },
    {
      id: 'peace_share',
      label: 'Sharing the Calm',
      emoji: '🌊',
      targetFamily: 'joy',
      description: 'Extending this energy to someone who might need it',
      bridgePrompt: 'Who in your life could use some of what you\'re feeling right now?',
    },
  ],

  // ── Drive & Empowerment → (Sustain / Celebrate) ─────────────────────────
  drive: [
    {
      id: 'drive_focus',
      label: 'Laser Focus',
      emoji: '🎯',
      targetFamily: 'drive',
      description: 'Channeling this energy into the ONE thing that matters most',
      bridgePrompt: 'If you could only accomplish one thing today, what would it be?',
    },
    {
      id: 'drive_celebrate',
      label: 'Celebrate the Work',
      emoji: '🏆',
      targetFamily: 'joy',
      description: 'Acknowledging what got you here before sprinting ahead',
      bridgePrompt: 'What did you do this week that you haven\'t given yourself credit for?',
    },
    {
      id: 'drive_sustain',
      label: 'Sustainable Pace',
      emoji: '🔋',
      targetFamily: 'peace',
      description: 'Keeping the fire without burning out',
      bridgePrompt: 'What does this energy need from you to last — rest, fuel, or boundaries?',
    },
  ],

  // ── Joy & Connection → (Amplify / Ground) ──────────────────────────────
  joy: [
    {
      id: 'joy_amplify',
      label: 'Amplify This',
      emoji: '📣',
      targetFamily: 'joy',
      description: 'Turn it up — share it, name it, let it ripple',
      bridgePrompt: 'What would it look like to fully own this feeling today?',
    },
    {
      id: 'joy_ground',
      label: 'Ground It',
      emoji: '🌳',
      targetFamily: 'peace',
      description: 'Anchor this so you can find your way back',
      bridgePrompt: 'What\'s the one thing creating this? Name it — so you can return to it.',
    },
    {
      id: 'joy_extend',
      label: 'Pay It Forward',
      emoji: '🤝',
      targetFamily: 'joy',
      description: 'Joy grows when shared — send some outward',
      bridgePrompt: 'Who can you Hi5 today? ✋',
    },
  ],
};

/**
 * Get desires for a given emotion family.
 * @param {string} familyId - The emotion family id
 * @returns {Array} Array of desire cards, or empty array if family not found
 */
export function getDesiresForFamily(familyId) {
  return DESIRE_MAP[familyId] || [];
}

/**
 * Get a specific desire card by its ID.
 * @param {string} desireId - The desire card id (e.g., 'grief_acceptance')
 * @returns {object|null} The desire card, or null
 */
export function getDesire(desireId) {
  for (const desires of Object.values(DESIRE_MAP)) {
    const found = desires.find(d => d.id === desireId);
    if (found) return found;
  }
  return null;
}

/**
 * Total count of all desire cards across all families.
 */
export const TOTAL_DESIRES = Object.values(DESIRE_MAP)
  .reduce((sum, arr) => sum + arr.length, 0);
