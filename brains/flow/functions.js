/**
 * Flow — Brain Functions
 * Habit tracking, consistency scanning, activity detection.
 */

import { signalStrength, pick, COOLDOWN_MS } from '../5fan.js';
import roleConfig from './roleConfig.js';

let lastResponseTime = 0;

/**
 * Scan text for habit/consistency/activity signals.
 * @param {string} text
 * @param {object} [meta]
 * @returns {{ brain: string, signal: number, patterns: string[], category: string, summary: string }}
 */
export function scan(text, meta = {}) {
  const lower = text.toLowerCase();
  const patterns = [];
  let category = 'neutral';

  const consistencyWords = [
    'habit', 'routine', 'daily', 'every day', 'streak', 'consistency',
    'consistent', 'discipline', 'schedule', 'ritual', 'practice',
    'day 1', 'day 2', 'day 3', 'day 4', 'day 5', 'week', 'month',
    'again', 'another', 'back at it', 'still going', 'kept at it',
  ];

  const activityWords = [
    'workout', 'exercise', 'gym', 'run', 'ran', 'walked', 'walk',
    'meditate', 'meditation', 'journal', 'journaled', 'wrote',
    'read', 'reading', 'studied', 'study', 'practiced', 'trained',
    'morning', 'woke up', 'went to bed', 'did my',
  ];

  const recoveryWords = [
    'missed', 'skipped', 'broke my streak', 'fell off', 'restart',
    'getting back', 'starting over', 'try again', 'one more time',
    'haven\'t been', 'stopped', 'took a break', 'lost my streak',
  ];

  const flowStateWords = [
    'flow', 'zone', 'rhythm', 'momentum', 'groove', 'in it',
    'focused', 'focus', 'deep work', 'locked in', 'dialed in',
  ];

  let consistencyScore = 0, activityScore = 0, recoveryScore = 0, flowScore = 0;

  for (const w of consistencyWords) {
    if (lower.includes(w)) { consistencyScore++; patterns.push(w); }
  }
  for (const w of activityWords) {
    if (lower.includes(w)) { activityScore++; patterns.push(w); }
  }
  for (const w of recoveryWords) {
    if (lower.includes(w)) { recoveryScore++; patterns.push(w); }
  }
  for (const w of flowStateWords) {
    if (lower.includes(w)) { flowScore++; patterns.push(w); }
  }

  const scores = { consistency: consistencyScore, activity: activityScore, recovery: recoveryScore, flow: flowScore };
  const max = Math.max(consistencyScore, activityScore, recoveryScore, flowScore);

  if (max > 0) {
    if (recoveryScore === max) category = 'recovery';
    else if (consistencyScore === max) category = 'consistency';
    else if (activityScore === max) category = 'activity';
    else category = 'flow';
  }

  const signal = signalStrength(text, roleConfig.triggers);

  return {
    brain: 'flow',
    signal,
    patterns: [...new Set(patterns)],
    category,
    scores,
    summary: patterns.length > 0
      ? `Habit/flow signals: ${category} — ${patterns.slice(0, 5).join(', ')}`
      : 'No strong habit or routine signals detected.',
  };
}

export function fulfill(text, scanResult) {
  const templates = roleConfig.templates;
  switch (scanResult.category) {
    case 'consistency': return pick(templates.consistency);
    case 'activity': return pick(templates.activity);
    case 'recovery': return pick(templates.recovery);
    default: return pick(templates.general);
  }
}

export function log(event, data) {
  console.log(`[flow] ${event}:`, JSON.stringify(data).slice(0, 200));
}

export function sendTo(targetBrain, text, meta = {}) {
  return { target: targetBrain, text, meta: { ...meta, from: 'flow' } };
}

export function startIdle(silenceMs) {
  if (silenceMs > 300_000) {
    return pick([
      'The river flows on. Jump back in whenever you\'re ready.',
      'Even still water reflects the sky. Rest is part of the rhythm.',
      'The current will be here. No rush.',
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
