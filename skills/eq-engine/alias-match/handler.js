/**
 * 5FAN EQ Engine — alias-match
 *
 * Fuzzy-matches free text against emotion names (40) and family aliases (130+).
 * Returns ranked results sorted by relevance score.
 *
 * Server-side version of stay-hi-trac's alias-matcher.js.
 * No learned aliases (API-dependent) — uses static data only.
 *
 * Pure data skill — no LLM.
 *
 * @param {object} input - { text: string }
 * @returns {object} - { ok, matches }
 */

import { ALL_EMOTIONS } from '../data/emotions.js';
import { EMOTION_FAMILIES } from '../data/emotion-families.js';

export function handle(input) {
  const text = (input?.text || '').trim().toLowerCase();
  if (!text || text.length < 2) {
    return { ok: false, error: 'text must be at least 2 characters.' };
  }

  const familyScores = {}; // familyId → { score, matchType, matchedOn }

  function scoreFamily(familyId, score, type, matched) {
    if (!familyScores[familyId] || familyScores[familyId].score < score) {
      familyScores[familyId] = { score, matchType: type, matchedOn: matched };
    }
  }

  // 1. Static family aliases (130+ words across 10 families)
  for (const family of EMOTION_FAMILIES) {
    for (const alias of family.aliases) {
      if (alias === text) {
        scoreFamily(family.id, 100, 'exact', alias);
      } else if (alias.startsWith(text)) {
        scoreFamily(family.id, 80, 'starts', alias);
      } else if (text.length >= 3 && alias.includes(text)) {
        scoreFamily(family.id, 60, 'partial', alias);
      }
    }
  }

  // 2. Emotion names (40 emotions)
  for (const emo of ALL_EMOTIONS) {
    const name = emo.name.toLowerCase();
    if (name === text) {
      scoreFamily(emo.family, 100, 'emotion', emo.name);
    } else if (name.startsWith(text)) {
      scoreFamily(emo.family, 85, 'emotion-starts', emo.name);
    } else if (text.length >= 3 && name.includes(text)) {
      scoreFamily(emo.family, 65, 'emotion-partial', emo.name);
    }
  }

  // Build results array sorted by score descending
  const matches = Object.entries(familyScores).map(([familyId, hit]) => {
    const family = EMOTION_FAMILIES.find(f => f.id === familyId);
    return {
      familyId,
      label: family?.label || familyId,
      emoji: family?.emoji || '',
      color: family?.color || '#888',
      score: hit.score,
      matchType: hit.matchType,
      matchedOn: hit.matchedOn,
    };
  });

  matches.sort((a, b) => b.score - a.score);

  return {
    ok: true,
    query: text,
    matches,
    matchCount: matches.length,
    topMatch: matches[0] || null,
  };
}
