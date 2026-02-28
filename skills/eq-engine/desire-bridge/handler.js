/**
 * 5FAN EQ Engine — desire-bridge
 *
 * Returns desire cards for an emotion family — the "equal and opposite"
 * destination showing where the user can move on the Hi Scale.
 *
 * Pure data skill — no LLM.
 *
 * @param {object} input - { familyId: string }
 * @returns {object} - { ok, desires, family }
 */

import { DESIRE_MAP } from '../data/desire-map.js';
import { FAMILY_MAP } from '../data/emotion-families.js';

export function handle(input) {
  const { familyId } = input || {};

  if (!familyId) {
    // Return all available families with desire counts
    const overview = Object.entries(DESIRE_MAP).map(([fid, desires]) => ({
      familyId: fid,
      label: FAMILY_MAP[fid]?.label || fid,
      emoji: FAMILY_MAP[fid]?.emoji || '',
      desireCount: desires.length,
    }));
    return { ok: true, families: overview, totalFamilies: overview.length };
  }

  const desires = DESIRE_MAP[familyId];
  if (!desires) {
    return {
      ok: false,
      error: `No desires mapped for family: ${familyId}. Available: ${Object.keys(DESIRE_MAP).join(', ')}`,
    };
  }

  const family = FAMILY_MAP[familyId];

  return {
    ok: true,
    familyId,
    familyLabel: family?.label || familyId,
    familyEmoji: family?.emoji || '',
    desireDirection: family?.desireDirection || null,
    desires: desires.map(d => ({
      id: d.id,
      label: d.label,
      emoji: d.emoji,
      targetFamily: d.targetFamily,
      description: d.description,
      bridgePrompt: d.bridgePrompt,
    })),
    desireCount: desires.length,
  };
}
