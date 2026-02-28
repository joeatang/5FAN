/**
 * Hi Dev Collective — Emotion Families
 * Stay Hi Trac — Hi Compass Data Layer
 *
 * 10 core emotional families that group the 40 emotions into navigable
 * clusters. Each family represents a fundamental human emotional territory.
 *
 * Architecture:
 *   - Every emotion in emotions.js maps to exactly ONE family via its `family` field
 *   - Families bridge LOCATE (what you feel) → INTERPRET (what it means)
 *   - `aliases[]` seeds the self-learning keyword system (Phase 6)
 *   - `desireDirection` hints at the equal-and-opposite desire territory
 *
 * The 10 families span the full Hi Scale (1–5):
 *   1-2 (Opportunity):  grief, fear, anger, shame
 *   2-3 (Neutral):      frustration, doubt, disconnect
 *   3-5 (Hi Inspo):     peace, drive, joy
 */

export const EMOTION_FAMILIES = [
  // ── Hi Opportunity Zone (Hi Scale 1–2) ──────────────────────────────────
  {
    id: 'grief',
    label: 'Grief & Loss',
    emoji: '😢',
    hiScaleRange: [1, 2],
    valence: -1,
    description: 'Deep sadness from losing something or someone important',
    desireDirection: 'peace',
    color: '#6B7280',
    aliases: [
      'loss', 'mourning', 'heartbreak', 'missing', 'empty', 'gone',
      'passed away', 'lost someone', 'broken heart', 'letting go',
      'saying goodbye', 'hurting inside', 'heavy heart',
      'grieving', 'crushed', 'devastated', 'sad',
      'lonely', 'abandoned', 'helpless', 'victimized',
    ],
  },
  {
    id: 'fear',
    label: 'Fear & Anxiety',
    emoji: '😨',
    hiScaleRange: [1, 2],
    valence: -1,
    description: 'Something feels threatening or uncertain in a way that grips you',
    desireDirection: 'peace',
    color: '#7C3AED',
    aliases: [
      'scared', 'terrified', 'panic', 'nervous', 'anxious', 'dread',
      'afraid', 'on edge', 'can\'t breathe', 'freaking out', 'shaking',
      'what if', 'worst case', 'spiraling', 'catastrophizing',
      'stressed', 'overwhelmed', 'triggered', 'uneasy',
      'fragile', 'vulnerable', 'startled',
    ],
  },
  {
    id: 'anger',
    label: 'Anger & Rage',
    emoji: '💢',
    hiScaleRange: [1, 2],
    valence: -1,
    description: 'Intense displeasure demanding change — energy pointed outward',
    desireDirection: 'drive',
    color: '#DC2626',
    aliases: [
      'angry', 'furious', 'livid', 'pissed', 'mad', 'fuming', 'seething',
      'snapped', 'lost it', 'seeing red', 'had enough', 'fed up',
      'want to scream', 'about to explode', 'blood boiling',
      'heated', 'over it',
      'disrespected', 'violated', 'hostile', 'aggressive',
      'provoked', 'hateful', 'bitter',
    ],
  },
  {
    id: 'shame',
    label: 'Shame & Guilt',
    emoji: '😣',
    hiScaleRange: [1, 2],
    valence: -1,
    description: 'Painful self-judgment — feeling like you are the problem',
    desireDirection: 'joy',
    color: '#92400E',
    aliases: [
      'ashamed', 'embarrassed', 'humiliated', 'regret', 'remorse',
      'worthless', 'not good enough', 'i messed up', 'my fault',
      'can\'t forgive myself', 'hate myself', 'disgusted with myself',
      'cringe', 'insecure', 'guilty',
      'inferior', 'inadequate', 'ridiculed', 'submissive', 'envious',
    ],
  },

  // ── Neutral Zone (Hi Scale 2–3) ────────────────────────────────────────
  {
    id: 'frustration',
    label: 'Frustration & Irritation',
    emoji: '😤',
    hiScaleRange: [2, 3],
    valence: 0,
    description: 'Blocked energy — you know what you want but something is in the way',
    desireDirection: 'drive',
    color: '#EA580C',
    aliases: [
      'annoyed', 'irritated', 'impatient', 'stuck', 'blocked',
      'hitting a wall', 'spinning wheels', 'going nowhere', 'can\'t win',
      'so close', 'keep trying', 'nothing works', 'ugh',
      'done', 'over this', 'sick of it',
      'disgusted', 'repulsed',
    ],
  },
  {
    id: 'doubt',
    label: 'Doubt & Uncertainty',
    emoji: '🤔',
    hiScaleRange: [2, 3],
    valence: 0,
    description: 'The ground feels unstable — unsure which way to step',
    desireDirection: 'drive',
    color: '#CA8A04',
    aliases: [
      'confused', 'lost', 'second-guessing', 'indecisive', 'torn',
      'don\'t know', 'overthinking', 'what should i', 'which way',
      'not sure', 'maybe', 'i guess', 'flip-flopping', 'wishy-washy',
      'idk', 'uncertain', 'doubtful',
      'skeptical', 'suspicious',
    ],
  },
  {
    id: 'disconnect',
    label: 'Disconnect & Numbness',
    emoji: '😶',
    hiScaleRange: [2, 3],
    valence: 0,
    description: 'Checked out — the world feels distant or you feel nothing at all',
    desireDirection: 'joy',
    color: '#6B7280',
    aliases: [
      'numb', 'empty', 'flat', 'detached', 'apathetic', 'meh',
      'don\'t care', 'whatever', 'going through the motions', 'zombie',
      'on autopilot', 'checked out', 'nothing matters', 'blah',
      'bored', 'drained', 'burnt out', 'zoned out', 'tired',
      'exhausted', 'sleepy', 'isolated', 'withdrawn',
    ],
  },

  // ── Hi Inspo Zone (Hi Scale 3–5) ──────────────────────────────────────
  {
    id: 'peace',
    label: 'Peace & Calm',
    emoji: '😌',
    hiScaleRange: [3, 5],
    valence: 1,
    description: 'Centered stillness — present, grounded, accepting what is',
    desireDirection: null,
    color: '#0D9488',
    aliases: [
      'calm', 'relaxed', 'at ease', 'still', 'tranquil', 'serene',
      'content', 'settled', 'grounded', 'breathing easy', 'at peace',
      'letting it be', 'surrender', 'acceptance', 'quiet mind',
      'chilling', 'vibing', 'chill', 'cozy', 'resting', 'peaceful',
      'compassionate', 'fulfilled',
    ],
  },
  {
    id: 'drive',
    label: 'Drive & Empowerment',
    emoji: '💪',
    hiScaleRange: [4, 5],
    valence: 1,
    description: 'Fuel in the tank — you feel capable and ready to move',
    desireDirection: null,
    color: '#2563EB',
    aliases: [
      'motivated', 'determined', 'fired up', 'locked in', 'focused',
      'unstoppable', 'let\'s go', 'ready', 'bring it', 'on a mission',
      'dialed in', 'in the zone', 'crushing it', 'in my bag',
      'hyped', 'pumped', 'lit', 'wired', 'amped', 'driven',
      'curious', 'creative', 'brave', 'courageous',
    ],
  },
  {
    id: 'joy',
    label: 'Joy & Connection',
    emoji: '😊',
    hiScaleRange: [4, 5],
    valence: 1,
    description: 'Warm expansion — happiness, love, gratitude, belonging',
    desireDirection: null,
    color: '#E11D48',
    aliases: [
      'happy', 'grateful', 'blessed', 'loved', 'connected', 'alive',
      'on top of the world', 'everything is good', 'feeling myself',
      'can\'t stop smiling', 'heart is full', 'pure vibes', 'best day',
      'stoked', 'thriving', 'glowing', 'living', 'joyful',
      'playful', 'tender', 'intimate', 'belonging', 'awe', 'moved',
    ],
  },
];

/**
 * Flat lookup: familyId → family object.
 */
export const FAMILY_MAP = Object.fromEntries(
  EMOTION_FAMILIES.map(f => [f.id, f])
);

/**
 * Get a family by ID.
 */
export function getFamily(id) {
  return FAMILY_MAP[id] || null;
}

/**
 * Get all families in a given Hi Scale range.
 * @param {number} min - Minimum Hi Scale value (inclusive)
 * @param {number} max - Maximum Hi Scale value (inclusive)
 */
export function getFamiliesInRange(min, max) {
  return EMOTION_FAMILIES.filter(f =>
    f.hiScaleRange[0] <= max && f.hiScaleRange[1] >= min
  );
}

/**
 * Find which family best matches a free-text phrase.
 * Checks aliases across all families. Returns the family with the most hits.
 * This is the seed for the self-learning system — aliases grow over time.
 */
export function matchFamilyByText(text) {
  const lower = (text || '').toLowerCase();
  let best = null;
  let bestScore = 0;

  for (const family of EMOTION_FAMILIES) {
    let score = 0;
    for (const alias of family.aliases) {
      if (lower.includes(alias)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      best = family;
    }
  }

  return best;
}
