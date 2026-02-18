/**
 * Hear — Brain Functions
 * Emotional scanning, fulfillment, logging, cross-brain routing.
 */

import { signalStrength, pick, COOLDOWN_MS } from '../5fan.js';
import roleConfig from './roleConfig.js';

let lastResponseTime = 0;

/**
 * Scan text for emotional signals.
 * Returns a scan result with signal strength, detected emotions, and category.
 *
 * @param {string} text
 * @param {object} [meta] - optional context (userId, channel, etc.)
 * @returns {{ brain: string, signal: number, emotions: string[], category: string, summary: string }}
 */
export function scan(text, meta = {}) {
  const lower = text.toLowerCase();
  const detected = [];
  let category = 'neutral';

  // Pain detection
  const painWords = [
    'hurt', 'pain', 'sad', 'angry', 'frustrated', 'anxious', 'scared',
    'afraid', 'worried', 'stressed', 'overwhelmed', 'exhausted', 'tired',
    'broken', 'lost', 'alone', 'lonely', 'empty', 'numb', 'hopeless',
    'depressed', 'crying', 'tears', 'grief', 'mourning', 'miss',
    'betrayed', 'abandoned', 'rejected', 'ashamed', 'guilty', 'regret',
    'suffering', 'struggling', 'can\'t', 'won\'t', 'never', 'worst',
    'hate', 'dying', 'dead', 'suicide', 'kill', 'end it',
  ];

  // Joy detection
  const joyWords = [
    'happy', 'joy', 'excited', 'grateful', 'thankful', 'proud',
    'relieved', 'peaceful', 'calm', 'content', 'blessed', 'amazing',
    'wonderful', 'love', 'loved', 'appreciate', 'celebrate', 'win',
    'won', 'success', 'accomplished', 'breakthrough', 'milestone',
  ];

  // Crisis detection (high-priority emotional signals)
  const crisisWords = [
    'suicide', 'kill myself', 'end it all', 'want to die', 'no reason to live',
    'self-harm', 'cutting', 'overdose', 'don\'t want to be here',
  ];

  let painScore = 0;
  let joyScore = 0;
  let isCrisis = false;

  for (const word of crisisWords) {
    if (lower.includes(word)) {
      isCrisis = true;
      detected.push(`crisis:${word}`);
    }
  }

  for (const word of painWords) {
    if (lower.includes(word)) {
      painScore++;
      detected.push(word);
    }
  }

  for (const word of joyWords) {
    if (lower.includes(word)) {
      joyScore++;
      detected.push(word);
    }
  }

  if (isCrisis) {
    category = 'crisis';
  } else if (painScore > joyScore && painScore > 0) {
    category = 'pain';
  } else if (joyScore > painScore && joyScore > 0) {
    category = 'joy';
  } else if (painScore > 0 || joyScore > 0) {
    category = 'mixed';
  }

  const signal = signalStrength(text, roleConfig.triggers);

  return {
    brain: 'hear',
    signal,
    emotions: detected,
    category,
    isCrisis,
    summary: isCrisis
      ? `CRISIS detected — user may need immediate support. Emotions: ${detected.join(', ')}`
      : detected.length > 0
        ? `Emotional signals: ${category} — ${detected.slice(0, 5).join(', ')}`
        : 'No strong emotional signals detected.',
  };
}

/**
 * Generate a template-based response (no LLM).
 * @param {string} text
 * @param {object} scanResult - output of scan()
 * @returns {string}
 */
export function fulfill(text, scanResult) {
  const { category, isCrisis } = scanResult;

  if (isCrisis) {
    return 'I hear you, and what you\'re feeling matters. You\'re not alone in this. ' +
      'If you\'re in crisis, please reach out to the 988 Suicide & Crisis Lifeline ' +
      '(call or text 988) or Crisis Text Line (text HOME to 741741). ' +
      'Someone is there for you right now.';
  }

  const templates = roleConfig.templates;
  switch (category) {
    case 'pain': return pick(templates.pain);
    case 'joy': return pick(templates.joy);
    case 'mixed': return pick(templates.mirror);
    default: return pick(templates.general);
  }
}

/**
 * Log a scan/response event (extensible — override for persistence).
 * @param {string} event
 * @param {object} data
 */
export function log(event, data) {
  console.log(`[hear] ${event}:`, JSON.stringify(data).slice(0, 200));
}

/**
 * Route a message to another brain (cross-brain communication).
 * @param {string} targetBrain
 * @param {string} text
 * @param {object} meta
 * @returns {{ target: string, text: string, meta: object }}
 */
export function sendTo(targetBrain, text, meta = {}) {
  return { target: targetBrain, text, meta: { ...meta, from: 'hear' } };
}

/**
 * Start idle behavior — Hear doesn't initiate, but can nudge if silence is long.
 * @param {number} silenceMs - milliseconds of silence
 * @returns {string | null}
 */
export function startIdle(silenceMs) {
  if (silenceMs > 300_000) { // 5 minutes
    return pick([
      'Still here whenever you\'re ready.',
      'No rush. I\'m not going anywhere.',
      'Take your time. I\'ll be here.',
      'Silence is OK. I\'m still listening.',
    ]);
  }
  return null;
}

/**
 * Check cooldown — prevent rapid-fire responses.
 * @returns {boolean}
 */
export function isReady() {
  return Date.now() - lastResponseTime >= COOLDOWN_MS;
}

/**
 * Mark that a response was just sent.
 */
export function markResponded() {
  lastResponseTime = Date.now();
}
