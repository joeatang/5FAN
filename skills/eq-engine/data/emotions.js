/**
 * Hi Dev Collective — Emotions Catalog
 * Stay Hi Trac — 40 emotions across 3 categories
 *
 * Categories map to energy states:
 *   Hi Inspo       — positive/uplifting states (18)
 *   Neutral      — middle-ground states (11)
 *   Hi Opportunity — growth-edge states (11)
 *
 * Compass fields (added for Hi Compass — non-breaking):
 *   id       — unique slug for lookups and storage
 *   family   — links to emotion-families.js family id
 *   hiScale  — 1–5 placement on the Hi Scale
 *   valence  — -1 (opportunity), 0 (neutral), +1 (hi inspo)
 *   arousal  — 1 (low/still), 2 (moderate), 3 (high/intense)
 */

export const EMOTION_CATEGORIES = [
  {
    id: 'hi',
    label: 'Hi Inspo',
    items: [
      { emoji: '😊', name: 'Joy', desc: 'A warm sense of happiness and delight', id: 'joy', family: 'joy', hiScale: 5, valence: 1, arousal: 2 },
      { emoji: '🙏', name: 'Appreciation', desc: 'Deep recognition of goodness around you', id: 'appreciation', family: 'joy', hiScale: 5, valence: 1, arousal: 1 },
      { emoji: '💪', name: 'Empowerment', desc: 'Feeling strong and capable', id: 'empowerment', family: 'drive', hiScale: 5, valence: 1, arousal: 3 },
      { emoji: '🦅', name: 'Freedom', desc: 'Lightness and liberation', id: 'freedom', family: 'peace', hiScale: 5, valence: 1, arousal: 2 },
      { emoji: '❤️', name: 'Love', desc: 'Unconditional warmth and connection', id: 'love', family: 'joy', hiScale: 5, valence: 1, arousal: 2 },
      { emoji: '🔥', name: 'Passion', desc: 'Intense drive and enthusiasm', id: 'passion', family: 'drive', hiScale: 5, valence: 1, arousal: 3 },
      { emoji: '🎉', name: 'Enthusiasm', desc: 'Eager excitement about life', id: 'enthusiasm', family: 'drive', hiScale: 5, valence: 1, arousal: 3 },
      { emoji: '✨', name: 'Eagerness', desc: 'Ready and willing energy', id: 'eagerness', family: 'drive', hiScale: 4, valence: 1, arousal: 2 },
      { emoji: '😄', name: 'Happiness', desc: 'Pure contentment and cheer', id: 'happiness', family: 'joy', hiScale: 5, valence: 1, arousal: 2 },
      { emoji: '🌟', name: 'Belief', desc: 'Trust in yourself and the process', id: 'belief', family: 'drive', hiScale: 4, valence: 1, arousal: 1 },
      { emoji: '🌈', name: 'Optimism', desc: 'Seeing the bright side naturally', id: 'optimism', family: 'peace', hiScale: 4, valence: 1, arousal: 1 },
      { emoji: '🕊️', name: 'Hopefulness', desc: 'Gentle confidence in what\'s ahead', id: 'hopefulness', family: 'peace', hiScale: 4, valence: 1, arousal: 1 },
      { emoji: '😌', name: 'Calm', desc: 'Peaceful and centered stillness', id: 'calm', family: 'peace', hiScale: 4, valence: 1, arousal: 1 },
      { emoji: '💡', name: 'Inspired', desc: 'Creative spark and motivation', id: 'inspired', family: 'drive', hiScale: 4, valence: 1, arousal: 2 },
      { emoji: '🤝', name: 'Connected', desc: 'Feeling part of something bigger', id: 'connected', family: 'joy', hiScale: 4, valence: 1, arousal: 1 },
      { emoji: '🌻', name: 'Gratitude', desc: 'Thankful awareness of blessings', id: 'gratitude', family: 'joy', hiScale: 5, valence: 1, arousal: 1 },
      { emoji: '🏆', name: 'Proud', desc: 'Earned sense of accomplishment', id: 'proud', family: 'drive', hiScale: 5, valence: 1, arousal: 2 },
      { emoji: '😮‍💨', name: 'Relief', desc: 'Weight lifted, tension released', id: 'relief', family: 'peace', hiScale: 3, valence: 1, arousal: 1 },
    ],
  },
  {
    id: 'neutral',
    label: 'Neutral',
    items: [
      { emoji: '😑', name: 'Boredom', desc: 'Restless lack of engagement', id: 'boredom', family: 'disconnect', hiScale: 3, valence: 0, arousal: 1 },
      { emoji: '😞', name: 'Pessimism', desc: 'Expecting the worst outcome', id: 'pessimism', family: 'doubt', hiScale: 2, valence: 0, arousal: 1 },
      { emoji: '😤', name: 'Frustration', desc: 'Blocked energy needing release', id: 'frustration', family: 'frustration', hiScale: 3, valence: 0, arousal: 3 },
      { emoji: '😫', name: 'Overwhelm', desc: 'Too much happening at once', id: 'overwhelm', family: 'frustration', hiScale: 2, valence: 0, arousal: 3 },
      { emoji: '😔', name: 'Disappointment', desc: 'Unmet expectations weighing on you', id: 'disappointment', family: 'frustration', hiScale: 2, valence: 0, arousal: 1 },
      { emoji: '🤔', name: 'Doubt', desc: 'Uncertainty about the right path', id: 'doubt', family: 'doubt', hiScale: 3, valence: 0, arousal: 1 },
      { emoji: '😟', name: 'Worry', desc: 'Anxious thoughts about the future', id: 'worry', family: 'fear', hiScale: 2, valence: 0, arousal: 2 },
      { emoji: '😠', name: 'Blame', desc: 'Directing frustration outward', id: 'blame', family: 'anger', hiScale: 2, valence: 0, arousal: 3 },
      { emoji: '😩', name: 'Discouragement', desc: 'Feeling like giving up', id: 'discouragement', family: 'doubt', hiScale: 2, valence: 0, arousal: 1 },
      { emoji: '🤷', name: 'Uncertain', desc: 'Not sure where you stand', id: 'uncertain', family: 'doubt', hiScale: 3, valence: 0, arousal: 1 },
      { emoji: '😶', name: 'Apathy', desc: 'Emotional numbness or disconnect', id: 'apathy', family: 'disconnect', hiScale: 2, valence: 0, arousal: 1 },
    ],
  },
  {
    id: 'opportunity',
    label: 'Hi Opportunity',
    items: [
      { emoji: '💢', name: 'Anger', desc: 'Intense displeasure demanding change', id: 'anger', family: 'anger', hiScale: 2, valence: -1, arousal: 3 },
      { emoji: '👊', name: 'Revenge', desc: 'Desire to retaliate or get even', id: 'revenge', family: 'anger', hiScale: 1, valence: -1, arousal: 3 },
      { emoji: '🤬', name: 'Rage', desc: 'Explosive, uncontrolled anger', id: 'rage', family: 'anger', hiScale: 1, valence: -1, arousal: 3 },
      { emoji: '💚', name: 'Jealousy', desc: 'Wanting what someone else has', id: 'jealousy', family: 'shame', hiScale: 2, valence: -1, arousal: 2 },
      { emoji: '😰', name: 'Insecurity', desc: 'Doubting your own worth', id: 'insecurity', family: 'shame', hiScale: 1, valence: -1, arousal: 2 },
      { emoji: '😣', name: 'Guilt', desc: 'Regret weighing on your conscience', id: 'guilt', family: 'shame', hiScale: 1, valence: -1, arousal: 2 },
      { emoji: '😨', name: 'Fear', desc: 'Something feels threatening', id: 'fear', family: 'fear', hiScale: 1, valence: -1, arousal: 3 },
      { emoji: '😢', name: 'Grief', desc: 'Deep sadness from loss', id: 'grief', family: 'grief', hiScale: 1, valence: -1, arousal: 2 },
      { emoji: '😞', name: 'Powerlessness', desc: 'Feeling unable to change things', id: 'powerlessness', family: 'grief', hiScale: 1, valence: -1, arousal: 1 },
      { emoji: '😒', name: 'Resentment', desc: 'Lingering bitterness from the past', id: 'resentment', family: 'anger', hiScale: 2, valence: -1, arousal: 2 },
      { emoji: '🖤', name: 'Hopeless', desc: 'Can\'t see a way forward', id: 'hopeless', family: 'grief', hiScale: 1, valence: -1, arousal: 1 },
    ],
  },
];

/**
 * Flat list of all 40 emotions for quick lookups.
 */
export const ALL_EMOTIONS = EMOTION_CATEGORIES.flatMap(cat =>
  cat.items.map(item => ({ ...item, category: cat.id }))
);

/**
 * Find an emotion by name (case-insensitive).
 */
export function findEmotion(name) {
  return ALL_EMOTIONS.find(e => e.name.toLowerCase() === name.toLowerCase()) || null;
}

/**
 * Find an emotion by its unique id slug.
 * @param {string} id - e.g., 'joy', 'frustration', 'anger'
 */
export function findEmotionById(id) {
  return ALL_EMOTIONS.find(e => e.id === id) || null;
}

/**
 * Get all emotions that belong to a given family.
 * @param {string} familyId - e.g., 'grief', 'drive', 'joy'
 * @returns {Array} Emotions in that family
 */
export function getEmotionsByFamily(familyId) {
  return ALL_EMOTIONS.filter(e => e.family === familyId);
}
