/**
 * 5FAN EQ Engine — emotion-blend (NEW)
 *
 * Multi-family scoring from text. Detects co-occurrence of emotions
 * across families and classifies the blend type:
 *   - transition: moving from one family to another (e.g., grief → peace)
 *   - conflict: opposing families active simultaneously (e.g., anger + joy)
 *   - resonance: multiple families in the same valence zone reinforcing
 *
 * Also produces a Hi Scale vector (position per family) and an overall
 * blend signature for longitudinal tracking.
 *
 * Pure data skill — no LLM.
 *
 * @param {object} input - { text: string }
 * @returns {object} - { ok, blend, families, hiScaleVector, blendType, signature }
 */

import { ALL_EMOTIONS } from '../data/emotions.js';
import { EMOTION_FAMILIES, FAMILY_MAP } from '../data/emotion-families.js';

export function handle(input) {
  const text = (input?.text || '').toLowerCase().trim();
  if (!text) {
    return { ok: false, error: 'text is required' };
  }

  // Score each family by alias + emotion name hits
  const familyScores = {};
  for (const family of EMOTION_FAMILIES) {
    let score = 0;
    const hits = [];

    // Check aliases
    for (const alias of family.aliases) {
      if (text.includes(alias)) {
        score += alias.length >= 5 ? 2 : 1; // Longer aliases are more specific
        hits.push(alias);
      }
    }

    // Check emotion names in this family
    const familyEmotions = ALL_EMOTIONS.filter(e => e.family === family.id);
    for (const emo of familyEmotions) {
      const name = emo.name.toLowerCase();
      if (text.includes(name)) {
        score += 3; // Direct emotion name is strongest signal
        hits.push(emo.name);
      }
    }

    if (score > 0) {
      familyScores[family.id] = { score, hits };
    }
  }

  const activeFamilies = Object.entries(familyScores)
    .sort((a, b) => b[1].score - a[1].score)
    .map(([fid, data]) => {
      const fam = FAMILY_MAP[fid];
      return {
        familyId: fid,
        label: fam?.label || fid,
        emoji: fam?.emoji || '',
        valence: fam?.valence ?? 0,
        hiScaleRange: fam?.hiScaleRange || [3, 3],
        score: data.score,
        hits: data.hits,
      };
    });

  if (activeFamilies.length === 0) {
    return {
      ok: true,
      blendType: 'none',
      activeFamilyCount: 0,
      families: [],
      hiScaleVector: {},
      message: 'No emotional content detected.',
    };
  }

  // Build Hi Scale vector — weighted average position per active family
  const hiScaleVector = {};
  for (const f of activeFamilies) {
    hiScaleVector[f.familyId] = Math.round(((f.hiScaleRange[0] + f.hiScaleRange[1]) / 2) * 10) / 10;
  }

  // Classify blend type
  let blendType = 'single';
  if (activeFamilies.length >= 2) {
    const valences = activeFamilies.map(f => f.valence);
    const hasPositive = valences.some(v => v === 1);
    const hasNegative = valences.some(v => v === -1);
    const hasNeutral = valences.some(v => v === 0);

    if (hasPositive && hasNegative) {
      blendType = 'conflict';   // Opposing valences active
    } else if (activeFamilies.length >= 2 && (hasPositive || hasNegative) && !hasPositive !== !hasNegative) {
      // Check if the families have a desireDirection relationship
      const primary = activeFamilies[0];
      const secondary = activeFamilies[1];
      const primaryFam = FAMILY_MAP[primary.familyId];
      if (primaryFam?.desireDirection === secondary.familyId) {
        blendType = 'transition'; // Moving from one toward the other
      } else {
        blendType = 'resonance';
      }
    } else {
      blendType = 'resonance';  // Same-zone reinforcement
    }
  }

  // Generate blend signature for tracking (e.g., "grief+fear:conflict")
  const familyIds = activeFamilies.map(f => f.familyId).slice(0, 3);
  const signature = `${familyIds.join('+')}:${blendType}`;

  // Overall Hi Scale (weighted average of active families)
  const totalScore = activeFamilies.reduce((s, f) => s + f.score, 0);
  const weightedHiScale = activeFamilies.reduce((s, f) => {
    const mid = (f.hiScaleRange[0] + f.hiScaleRange[1]) / 2;
    return s + mid * (f.score / totalScore);
  }, 0);

  return {
    ok: true,
    blendType,
    signature,
    hiScale: Math.round(weightedHiScale * 10) / 10,
    activeFamilyCount: activeFamilies.length,
    families: activeFamilies,
    hiScaleVector,
    primary: activeFamilies[0] || null,
    secondary: activeFamilies[1] || null,
  };
}
