/**
 * 5FAN EQ Engine — emotion-family
 *
 * Looks up an emotion family by familyId or by text scan.
 * Returns the full family object with aliases, Hi Scale range, and desire direction.
 *
 * Pure data skill — no LLM.
 *
 * @param {object} input - { familyId?: string, text?: string }
 * @returns {object} - { ok, family, emotions }
 */

import { EMOTION_FAMILIES, FAMILY_MAP, matchFamilyByText } from '../data/emotion-families.js';
import { ALL_EMOTIONS } from '../data/emotions.js';

export function handle(input) {
  const { familyId, text } = input || {};

  // Direct lookup by familyId
  if (familyId) {
    const family = FAMILY_MAP[familyId];
    if (!family) {
      return { ok: false, error: `Unknown family: ${familyId}. Available: ${EMOTION_FAMILIES.map(f => f.id).join(', ')}` };
    }

    const emotions = ALL_EMOTIONS.filter(e => e.family === familyId);

    return {
      ok: true,
      family: {
        id: family.id,
        label: family.label,
        emoji: family.emoji,
        hiScaleRange: family.hiScaleRange,
        valence: family.valence,
        description: family.description,
        desireDirection: family.desireDirection,
        color: family.color,
        aliasCount: family.aliases.length,
      },
      emotions: emotions.map(e => ({
        id: e.id,
        name: e.name,
        emoji: e.emoji,
        hiScale: e.hiScale,
      })),
      emotionCount: emotions.length,
    };
  }

  // Text-based lookup
  if (text) {
    const matched = matchFamilyByText(text);
    if (!matched) {
      return { ok: true, family: null, message: 'No family matched the given text.' };
    }

    const emotions = ALL_EMOTIONS.filter(e => e.family === matched.id);

    return {
      ok: true,
      family: {
        id: matched.id,
        label: matched.label,
        emoji: matched.emoji,
        hiScaleRange: matched.hiScaleRange,
        valence: matched.valence,
        description: matched.description,
        desireDirection: matched.desireDirection,
        color: matched.color,
        aliasCount: matched.aliases.length,
      },
      emotions: emotions.map(e => ({
        id: e.id,
        name: e.name,
        emoji: e.emoji,
        hiScale: e.hiScale,
      })),
      emotionCount: emotions.length,
      matchedBy: 'text',
    };
  }

  // No input — return all families overview
  return {
    ok: true,
    families: EMOTION_FAMILIES.map(f => ({
      id: f.id,
      label: f.label,
      emoji: f.emoji,
      hiScaleRange: f.hiScaleRange,
      valence: f.valence,
      emotionCount: ALL_EMOTIONS.filter(e => e.family === f.id).length,
    })),
    totalFamilies: EMOTION_FAMILIES.length,
  };
}
