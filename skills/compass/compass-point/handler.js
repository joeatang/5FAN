/**
 * 5FAN Compass — compass-point
 *
 * POINT gate: reveals desire cards for an emotion family — the "equal and
 * opposite" destination showing where the user can move on the Hi Scale.
 *
 * Pure data skill — no LLM, no brains, no external calls.
 *
 * @param {object} input - { familyId: string }
 * @returns {object} - { ok, desires, family, direction }
 */

import { DESIRE_MAP } from '../../eq-engine/data/desire-map.js';
import { FAMILY_MAP } from '../../eq-engine/data/emotion-families.js';

export function handle(input) {
  const { familyId } = input || {};

  if (!familyId) {
    // Return overview of all families with desire counts
    const overview = Object.entries(DESIRE_MAP).map(([fid, desires]) => ({
      familyId: fid,
      label: FAMILY_MAP[fid]?.label || fid,
      emoji: FAMILY_MAP[fid]?.emoji || '',
      desireCount: desires.length,
      direction: FAMILY_MAP[fid]?.desireDirection || null,
    }));
    return {
      ok: true,
      gate: 'POINT',
      families: overview,
      totalFamilies: overview.length,
    };
  }

  const desires = DESIRE_MAP[familyId];
  if (!desires) {
    return {
      ok: false,
      error: `No desires mapped for family: ${familyId}. Available: ${Object.keys(DESIRE_MAP).join(', ')}`,
    };
  }

  const family = FAMILY_MAP[familyId];

  // Format desire cards with full detail
  const desireCards = desires.map(d => ({
    id: d.id,
    label: d.label,
    emoji: d.emoji,
    targetFamily: d.targetFamily,
    targetLabel: FAMILY_MAP[d.targetFamily]?.label || d.targetFamily,
    description: d.description,
    bridgePrompt: d.bridgePrompt,
  }));

  return {
    ok: true,
    gate: 'POINT',
    familyId,
    family: family ? {
      id: family.id,
      label: family.label,
      emoji: family.emoji,
      hiScaleRange: family.hiScaleRange,
    } : { id: familyId },
    direction: family?.desireDirection || null,
    directionLabel: FAMILY_MAP[family?.desireDirection]?.label || null,
    desires: desireCards,
    desireCount: desireCards.length,
  };
}
