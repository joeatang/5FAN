/**
 * 5FAN Compass — shift-navigator
 *
 * Full 4-gate Compass journey: LOCATE → INTERPRET → POINT → PRACTICE.
 * Orchestrator skill — chains the 4 compass gate handlers internally.
 * Returns the complete navigation result.
 *
 * Brain-enhanced skill — uses Hear, Inspyre, Flow brains + LLM.
 *
 * @param {object} input - { text: string, context?: object, emotionId?: string }
 * @returns {Promise<object>} - { ok, locate, interpret, point, practice }
 */

import { handle as locate } from '../compass-locate/handler.js';
import { handle as interpret } from '../compass-interpret/handler.js';
import { handle as point } from '../compass-point/handler.js';
import { handle as practice } from '../compass-practice/handler.js';

export async function handle(input) {
  const { text, context = {}, emotionId } = input || {};

  if (!text && !emotionId) {
    return { ok: false, error: 'Provide text or emotionId to begin the shift journey.' };
  }

  // ── Gate 1: LOCATE ──────────────────────────────────────────────
  const locateResult = await locate({ text, emotionId });

  if (!locateResult.ok) {
    return {
      ok: false,
      error: 'Could not locate an emotion to navigate from.',
      gate: 'LOCATE',
      detail: locateResult.error,
      hearScan: locateResult.hearScan || null,
    };
  }

  const familyId = locateResult.family?.id;
  if (!familyId) {
    return {
      ok: false,
      error: 'Located an emotion but could not resolve its family.',
      gate: 'LOCATE',
      locate: locateResult,
    };
  }

  // ── Gate 2: INTERPRET ───────────────────────────────────────────
  const interpretResult = await interpret({
    familyId,
    context: { text, ...context },
  });

  // ── Gate 3: POINT ───────────────────────────────────────────────
  const pointResult = point({ familyId });

  // ── Gate 4: PRACTICE ────────────────────────────────────────────
  // If a desire was linked to the bridge, use it for practice targeting
  const desireId = interpretResult.ok ? interpretResult.bridge?.forDesire : null;

  const practiceResult = await practice({
    familyId,
    desireId: desireId || undefined,
  });

  // ── Composite Result ────────────────────────────────────────────
  return {
    ok: true,
    gate: 'SHIFT',
    journey: {
      emotion: locateResult.emotion,
      family: locateResult.family,
      hiScale: locateResult.hiScale,
      direction: pointResult.ok ? pointResult.direction : null,
    },
    locate: {
      emotion: locateResult.emotion,
      matchType: locateResult.matchType,
      hearScan: locateResult.hearScan,
      isCrisis: locateResult.hearScan?.isCrisis || false,
    },
    interpret: {
      bridge: interpretResult.ok ? interpretResult.bridge : null,
      method: interpretResult.method || 'none',
      inspyreScan: interpretResult.ok ? interpretResult.inspyreScan : null,
    },
    point: {
      desires: pointResult.ok ? pointResult.desires : [],
      desireCount: pointResult.ok ? pointResult.desireCount : 0,
      direction: pointResult.ok ? pointResult.direction : null,
    },
    practice: {
      move: practiceResult.ok ? practiceResult.move : null,
      bridge: practiceResult.ok ? practiceResult.bridge : null,
      method: practiceResult.method || 'none',
      flowScan: practiceResult.ok ? practiceResult.flowScan : null,
    },
  };
}
