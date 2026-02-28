/**
 * 5FAN Compass — compass-locate
 *
 * LOCATE gate: resolves free text or an emotion ID into a confirmed
 * emotion + family + Hi Scale position + Hear brain scan.
 *
 * Brain-enhanced skill — uses Hear brain for emotional signal detection.
 *
 * @param {object} input - { text?: string, emotionId?: string }
 * @returns {object} - { ok, emotion, family, hiScale, hearScan }
 */

import { ALL_EMOTIONS } from '../../eq-engine/data/emotions.js';
import { EMOTION_FAMILIES, FAMILY_MAP, matchFamilyByText } from '../../eq-engine/data/emotion-families.js';
import { scan as hearScan } from '../../../brains/hear/functions.js';

/**
 * Find an emotion by ID.
 * @param {string} id
 * @returns {object|null}
 */
function findEmotionById(id) {
  return ALL_EMOTIONS.find(e => e.id === id) || null;
}

/**
 * Find an emotion by name (case-insensitive).
 * @param {string} name
 * @returns {object|null}
 */
function findEmotionByName(name) {
  const lower = name.toLowerCase();
  return ALL_EMOTIONS.find(e => e.name.toLowerCase() === lower) || null;
}

/**
 * Match text against emotions (name/id) and family aliases.
 * Returns the best match.
 * @param {string} text
 * @returns {{ emotion: object|null, family: object|null, matchType: string }}
 */
function resolveFromText(text) {
  const lower = text.toLowerCase().trim();

  // 1. Try exact emotion name match
  const byName = findEmotionByName(lower);
  if (byName) {
    const family = FAMILY_MAP[byName.family] || null;
    return { emotion: byName, family, matchType: 'exact-emotion' };
  }

  // 2. Try emotion ID match
  const byId = findEmotionById(lower);
  if (byId) {
    const family = FAMILY_MAP[byId.family] || null;
    return { emotion: byId, family, matchType: 'emotion-id' };
  }

  // 3. Scan all emotions for partial match (emotion name in text)
  for (const emotion of ALL_EMOTIONS) {
    if (lower.includes(emotion.name.toLowerCase()) || lower.includes(emotion.id)) {
      const family = FAMILY_MAP[emotion.family] || null;
      return { emotion, family, matchType: 'partial-emotion' };
    }
  }

  // 4. Try family alias match
  const familyMatch = matchFamilyByText(text);
  if (familyMatch) {
    // Pick the first emotion in this family as representative
    const representative = ALL_EMOTIONS.find(e => e.family === familyMatch.id) || null;
    return { emotion: representative, family: familyMatch, matchType: 'family-alias' };
  }

  return { emotion: null, family: null, matchType: 'none' };
}

export async function handle(input) {
  const { text, emotionId } = input || {};

  if (!text && !emotionId) {
    return { ok: false, error: 'Provide text or emotionId to locate an emotion.' };
  }

  let emotion = null;
  let family = null;
  let matchType = 'none';

  // Resolve by emotionId if provided
  if (emotionId) {
    emotion = findEmotionById(emotionId);
    if (!emotion) {
      return {
        ok: false,
        error: `Unknown emotionId: ${emotionId}. Available: ${ALL_EMOTIONS.map(e => e.id).join(', ')}`,
      };
    }
    family = FAMILY_MAP[emotion.family] || null;
    matchType = 'direct-id';
  } else {
    // Resolve from text
    const resolved = resolveFromText(text);
    emotion = resolved.emotion;
    family = resolved.family;
    matchType = resolved.matchType;
  }

  // Run Hear brain scan on the text (or emotion name if only ID was given)
  const scanText = text || emotion?.name || '';
  const hear = scanText ? hearScan(scanText) : null;

  if (!emotion && !family) {
    return {
      ok: false,
      error: 'Could not locate an emotion from the provided input.',
      hearScan: hear,
      suggestion: 'Try using a more specific emotion word (e.g., "anxious", "grateful", "frustrated").',
    };
  }

  return {
    ok: true,
    gate: 'LOCATE',
    emotion: emotion ? {
      id: emotion.id,
      name: emotion.name,
      emoji: emotion.emoji,
      category: emotion.category,
      hiScale: emotion.hiScale,
      valence: emotion.valence,
      arousal: emotion.arousal,
    } : null,
    family: family ? {
      id: family.id,
      label: family.label,
      emoji: family.emoji,
      hiScaleRange: family.hiScaleRange,
      desireDirection: family.desireDirection,
    } : null,
    matchType,
    hiScale: emotion?.hiScale ?? Math.round((family.hiScaleRange[0] + family.hiScaleRange[1]) / 2 * 10) / 10,
    hearScan: hear ? {
      signal: hear.signal,
      category: hear.category,
      emotions: hear.emotions,
      summary: hear.summary,
      isCrisis: hear.isCrisis || false,
    } : null,
  };
}
