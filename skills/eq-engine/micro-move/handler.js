/**
 * 5FAN EQ Engine — micro-move
 *
 * Returns micro-move exercises for an emotion family.
 * These are small, actionable practices (30s-5min) that help
 * shift emotional state. Optional type filter.
 *
 * Pure data skill — no LLM.
 *
 * @param {object} input - { familyId: string, type?: string }
 * @returns {object} - { ok, moves, moveCount }
 */

import { MICRO_MOVES } from '../data/micro-moves.js';
import { FAMILY_MAP } from '../data/emotion-families.js';

export function handle(input) {
  const { familyId, type } = input || {};

  if (!familyId) {
    // Return overview of all families with move counts
    const overview = Object.entries(MICRO_MOVES).map(([fid, moves]) => ({
      familyId: fid,
      label: FAMILY_MAP[fid]?.label || fid,
      emoji: FAMILY_MAP[fid]?.emoji || '',
      moveCount: moves.length,
      types: [...new Set(moves.map(m => m.type).filter(Boolean))],
    }));
    return { ok: true, families: overview, totalFamilies: overview.length };
  }

  const moves = MICRO_MOVES[familyId];
  if (!moves) {
    return {
      ok: false,
      error: `No micro-moves for family: ${familyId}. Available: ${Object.keys(MICRO_MOVES).join(', ')}`,
    };
  }

  let filtered = moves;
  if (type) {
    filtered = moves.filter(m => m.type === type);
    if (filtered.length === 0) {
      const availableTypes = [...new Set(moves.map(m => m.type).filter(Boolean))];
      return {
        ok: false,
        error: `No moves of type "${type}" for ${familyId}. Available types: ${availableTypes.join(', ')}`,
      };
    }
  }

  const family = FAMILY_MAP[familyId];

  return {
    ok: true,
    familyId,
    familyLabel: family?.label || familyId,
    familyEmoji: family?.emoji || '',
    moves: filtered.map(m => ({
      id: m.id,
      label: m.label,
      emoji: m.emoji,
      type: m.type,
      duration: m.duration,
      description: m.description,
      steps: m.steps,
      journalPrompt: m.journalPrompt || null,
    })),
    moveCount: filtered.length,
    filtered: !!type,
  };
}
