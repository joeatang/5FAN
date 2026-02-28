/**
 * 5FAN EQ Engine — reframe
 *
 * Returns bridge thoughts (reframing sentences) for an emotion family.
 * These are the INTERPRET gate — helping the mind logically accept
 * movement from current state toward the desired state.
 *
 * Optional tone filter: gentle, direct, reflective.
 *
 * Pure data skill — no LLM.
 *
 * @param {object} input - { familyId: string, tone?: string }
 * @returns {object} - { ok, bridges, bridgeCount }
 */

import { BRIDGE_LIBRARY } from '../data/bridge-library.js';
import { FAMILY_MAP } from '../data/emotion-families.js';

export function handle(input) {
  const { familyId, tone } = input || {};

  if (!familyId) {
    // Return overview of all families with bridge counts
    const overview = Object.entries(BRIDGE_LIBRARY).map(([fid, bridges]) => ({
      familyId: fid,
      label: FAMILY_MAP[fid]?.label || fid,
      emoji: FAMILY_MAP[fid]?.emoji || '',
      bridgeCount: bridges.length,
      tones: [...new Set(bridges.map(b => b.tone).filter(Boolean))],
    }));
    return { ok: true, families: overview, totalFamilies: overview.length };
  }

  const bridges = BRIDGE_LIBRARY[familyId];
  if (!bridges) {
    return {
      ok: false,
      error: `No bridges for family: ${familyId}. Available: ${Object.keys(BRIDGE_LIBRARY).join(', ')}`,
    };
  }

  let filtered = bridges;
  if (tone) {
    filtered = bridges.filter(b => b.tone === tone);
    if (filtered.length === 0) {
      const availableTones = [...new Set(bridges.map(b => b.tone).filter(Boolean))];
      return {
        ok: false,
        error: `No bridges with tone "${tone}" for ${familyId}. Available tones: ${availableTones.join(', ')}`,
      };
    }
  }

  const family = FAMILY_MAP[familyId];

  return {
    ok: true,
    familyId,
    familyLabel: family?.label || familyId,
    familyEmoji: family?.emoji || '',
    bridges: filtered.map(b => ({
      text: b.text,
      tone: b.tone,
      forDesire: b.forDesire || null,
    })),
    bridgeCount: filtered.length,
    filtered: !!tone,
  };
}
