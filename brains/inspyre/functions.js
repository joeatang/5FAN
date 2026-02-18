/**
 * Inspyre — Brain Functions
 * Values-alignment scanning, fulfillment, cross-brain routing.
 */

import { signalStrength, pick, COOLDOWN_MS } from '../5fan.js';
import roleConfig from './roleConfig.js';

let lastResponseTime = 0;

/**
 * Scan text for values-alignment and motivational signals.
 * @param {string} text
 * @param {object} [meta]
 * @returns {{ brain: string, signal: number, themes: string[], category: string, summary: string }}
 */
export function scan(text, meta = {}) {
  const lower = text.toLowerCase();
  const themes = [];
  let category = 'neutral';

  const purposeWords = [
    'purpose', 'meaning', 'why', 'reason', 'worth', 'value', 'values',
    'believe', 'belief', 'faith', 'hope', 'dream', 'goal', 'vision',
    'mission', 'calling', 'passion', 'what\'s the point', 'no point',
    'why bother', 'give up', 'giving up', 'quit', 'quitting',
    'tired of trying', 'can\'t keep going', 'lost my way', 'off track',
  ];

  const resilienceWords = [
    'strong', 'strength', 'brave', 'courage', 'resilient', 'resilience',
    'overcome', 'overcame', 'survived', 'fought', 'fighting',
    'kept going', 'didn\'t quit', 'push through', 'hang in',
    'setback', 'failure', 'failed', 'fell', 'got back up',
  ];

  const growthWords = [
    'grew', 'growth', 'learned', 'proud', 'achievement', 'accomplished',
    'made it', 'did it', 'milestone', 'breakthrough', 'progress',
    'better than', 'improved', 'leveled up', 'next level',
  ];

  let purposeScore = 0, resilienceScore = 0, growthScore = 0;

  for (const w of purposeWords) {
    if (lower.includes(w)) { purposeScore++; themes.push(w); }
  }
  for (const w of resilienceWords) {
    if (lower.includes(w)) { resilienceScore++; themes.push(w); }
  }
  for (const w of growthWords) {
    if (lower.includes(w)) { growthScore++; themes.push(w); }
  }

  if (purposeScore >= resilienceScore && purposeScore >= growthScore && purposeScore > 0) {
    category = 'purpose';
  } else if (resilienceScore >= growthScore && resilienceScore > 0) {
    category = 'resilience';
  } else if (growthScore > 0) {
    category = 'growth';
  }

  const signal = signalStrength(text, roleConfig.triggers);

  return {
    brain: 'inspyre',
    signal,
    themes: [...new Set(themes)],
    category,
    summary: themes.length > 0
      ? `Values/motivation signals: ${category} — ${themes.slice(0, 5).join(', ')}`
      : 'No strong purpose or motivation signals detected.',
  };
}

/**
 * Generate a template-based response.
 * @param {string} text
 * @param {object} scanResult
 * @returns {string}
 */
export function fulfill(text, scanResult) {
  const templates = roleConfig.templates;
  switch (scanResult.category) {
    case 'purpose': return pick(templates.purpose);
    case 'resilience': return pick(templates.resilience);
    case 'growth': return pick(templates.growth);
    default: return pick(templates.general);
  }
}

export function log(event, data) {
  console.log(`[inspyre] ${event}:`, JSON.stringify(data).slice(0, 200));
}

export function sendTo(targetBrain, text, meta = {}) {
  return { target: targetBrain, text, meta: { ...meta, from: 'inspyre' } };
}

export function startIdle(silenceMs) {
  if (silenceMs > 300_000) {
    return pick([
      'Still thinking about what drives you. Come back when you\'re ready.',
      'Your next move is still yours. I\'m here when you\'re ready to claim it.',
      'Quiet time can be fuel. You\'re recharging.',
    ]);
  }
  return null;
}

export function isReady() {
  return Date.now() - lastResponseTime >= COOLDOWN_MS;
}

export function markResponded() {
  lastResponseTime = Date.now();
}
