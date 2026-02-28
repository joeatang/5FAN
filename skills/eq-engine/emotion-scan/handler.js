/**
 * 5FAN EQ Engine — emotion-scan
 *
 * Matches free text against the 40-emotion vocabulary (3 categories, 10 families).
 * Returns all matched emotions with Hi Scale placement, family, valence, and arousal.
 *
 * Pure data skill — no LLM, no brains, no external calls.
 *
 * @param {object} input - { text: string }
 * @returns {object} - { ok, matches, families, hiScale, dominantCategory }
 */

import { ALL_EMOTIONS, EMOTION_CATEGORIES } from '../data/emotions.js';
import { EMOTION_FAMILIES } from '../data/emotion-families.js';

export function handle(input) {
  const text = (input?.text || '').toLowerCase().trim();
  if (!text) {
    return { ok: false, error: 'text is required' };
  }

  const matches = [];
  const familyHits = new Set();

  // Check each emotion's name, id, and its family's aliases
  for (const emotion of ALL_EMOTIONS) {
    const name = emotion.name.toLowerCase();
    const id = emotion.id;

    // Direct match on emotion name or id
    if (text.includes(name) || text.includes(id)) {
      matches.push({
        id: emotion.id,
        name: emotion.name,
        emoji: emotion.emoji,
        family: emotion.family,
        category: emotion.category,
        hiScale: emotion.hiScale,
        valence: emotion.valence,
        arousal: emotion.arousal,
        matchType: 'emotion',
      });
      familyHits.add(emotion.family);
    }
  }

  // Check family aliases for additional coverage
  for (const family of EMOTION_FAMILIES) {
    for (const alias of family.aliases) {
      if (text.includes(alias) && !familyHits.has(family.id)) {
        // Found a family alias not already covered by a direct emotion match
        familyHits.add(family.id);
        matches.push({
          id: `alias:${alias}`,
          name: alias,
          emoji: family.emoji,
          family: family.id,
          category: family.valence === 1 ? 'hi' : family.valence === -1 ? 'opportunity' : 'neutral',
          hiScale: Math.round((family.hiScaleRange[0] + family.hiScaleRange[1]) / 2),
          valence: family.valence,
          arousal: 2, // default moderate
          matchType: 'alias',
        });
      }
    }
  }

  // Sort by hiScale ascending (lowest = most urgent) then by match type priority
  matches.sort((a, b) => {
    if (a.matchType !== b.matchType) return a.matchType === 'emotion' ? -1 : 1;
    return a.hiScale - b.hiScale;
  });

  // Determine dominant category
  const categoryCounts = { hi: 0, neutral: 0, opportunity: 0 };
  for (const m of matches) {
    const cat = m.category || 'neutral';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }
  const dominantCategory = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

  // Average Hi Scale
  const avgHiScale = matches.length > 0
    ? Math.round((matches.reduce((sum, m) => sum + m.hiScale, 0) / matches.length) * 10) / 10
    : 3;

  // Unique families hit
  const families = [...familyHits].map(fid => {
    const f = EMOTION_FAMILIES.find(fam => fam.id === fid);
    return f ? { id: f.id, label: f.label, emoji: f.emoji } : { id: fid };
  });

  return {
    ok: true,
    matches,
    matchCount: matches.length,
    families,
    familyCount: families.length,
    hiScale: avgHiScale,
    dominantCategory,
  };
}
