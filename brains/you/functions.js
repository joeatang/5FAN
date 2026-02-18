/**
 * You — Brain Functions
 * Pattern recognition, self-awareness scanning, identity tracking.
 */

import { signalStrength, pick, COOLDOWN_MS } from '../5fan.js';
import roleConfig from './roleConfig.js';

let lastResponseTime = 0;

/** Simple in-memory user profile tracker (per session) */
const userProfiles = new Map();

/**
 * Get or create a lightweight profile for a user.
 * @param {string} userId
 * @returns {object}
 */
function getProfile(userId) {
  if (!userProfiles.has(userId)) {
    userProfiles.set(userId, {
      messageCount: 0,
      themes: {},
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      wordFrequency: {},
    });
  }
  const profile = userProfiles.get(userId);
  profile.lastSeen = Date.now();
  profile.messageCount++;
  return profile;
}

/**
 * Update word frequency from text.
 * @param {object} profile
 * @param {string} text
 */
function updateWordFrequency(profile, text) {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  for (const word of words) {
    profile.wordFrequency[word] = (profile.wordFrequency[word] || 0) + 1;
  }
}

/**
 * Get top recurring themes from user profile.
 * @param {object} profile
 * @param {number} [n=3]
 * @returns {string[]}
 */
function getTopThemes(profile, n = 3) {
  return Object.entries(profile.wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([word]) => word);
}

/**
 * Scan text for self-awareness, identity, and pattern signals.
 * @param {string} text
 * @param {object} [meta]
 * @returns {{ brain: string, signal: number, markers: string[], category: string, userStats: object|null, summary: string }}
 */
export function scan(text, meta = {}) {
  const lower = text.toLowerCase();
  const markers = [];
  let category = 'neutral';

  const awarenessWords = [
    'pattern', 'patterns', 'notice', 'noticed', 'realize', 'realized',
    'always do', 'always say', 'tend to', 'keep doing', 'every time',
    'theme', 'recurring', 'same thing', 'cycle', 'loop',
    'i see myself', 'looking back', 'in hindsight', 'self-aware',
  ];

  const identityWords = [
    'i am', 'i\'m', 'myself', 'who am i', 'authentic', 'real me',
    'true self', 'unique', 'different', 'weird', 'normal', 'fit in',
    'belong', 'personality', 'character', 'identity',
  ];

  const progressWords = [
    'how many', 'how often', 'how long', 'my stats', 'my progress',
    'track', 'tracking', 'data', 'numbers', 'count', 'score',
    'history', 'record', 'log', 'frequency',
  ];

  const expressionWords = [
    'express', 'voice', 'share', 'sharing', 'truth', 'honest',
    'real talk', 'vulnerable', 'open up', 'opened up', 'raw', 'unfiltered',
  ];

  let awarenessScore = 0, identityScore = 0, progressScore = 0, expressionScore = 0;

  for (const w of awarenessWords) {
    if (lower.includes(w)) { awarenessScore++; markers.push(w); }
  }
  for (const w of identityWords) {
    if (lower.includes(w)) { identityScore++; markers.push(w); }
  }
  for (const w of progressWords) {
    if (lower.includes(w)) { progressScore++; markers.push(w); }
  }
  for (const w of expressionWords) {
    if (lower.includes(w)) { expressionScore++; markers.push(w); }
  }

  const max = Math.max(awarenessScore, identityScore, progressScore, expressionScore);
  if (max > 0) {
    if (awarenessScore === max) category = 'awareness';
    else if (identityScore === max) category = 'identity';
    else if (progressScore === max) category = 'progress';
    else category = 'identity'; // expression maps to identity
  }

  // Update user profile if userId available
  let userStats = null;
  if (meta.userId) {
    const profile = getProfile(meta.userId);
    updateWordFrequency(profile, text);
    userStats = {
      messageCount: profile.messageCount,
      topThemes: getTopThemes(profile),
      sessionDuration: Date.now() - profile.firstSeen,
    };
  }

  const signal = signalStrength(text, roleConfig.triggers);

  return {
    brain: 'you',
    signal,
    markers: [...new Set(markers)],
    category,
    userStats,
    summary: markers.length > 0
      ? `Self/identity signals: ${category} — ${markers.slice(0, 5).join(', ')}`
      : 'No strong identity or self-awareness signals detected.',
  };
}

export function fulfill(text, scanResult) {
  const templates = roleConfig.templates;
  switch (scanResult.category) {
    case 'awareness': return pick(templates.awareness);
    case 'identity': return pick(templates.identity);
    case 'progress': return pick(templates.progress);
    default: return pick(templates.general);
  }
}

export function log(event, data) {
  console.log(`[you] ${event}:`, JSON.stringify(data).slice(0, 200));
}

export function sendTo(targetBrain, text, meta = {}) {
  return { target: targetBrain, text, meta: { ...meta, from: 'you' } };
}

export function startIdle(silenceMs) {
  if (silenceMs > 300_000) {
    return pick([
      'Your silence is data too. I\'m still observing.',
      'Still here, still noticing. Take your time.',
      'The space between messages tells me something. You\'re processing.',
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

export { getProfile, getTopThemes, userProfiles };
