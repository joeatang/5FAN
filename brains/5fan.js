/**
 * 5FAN Shared Configuration
 * Constants, channels, routing modes, and helpers shared across all brains.
 */

export const FIVEFAN_CHANNEL = '5fan-internal';
export const STATE_TOPIC = '5fan-state';
export const USER_CHANNEL_PREFIX = '5fan-user-';
export const DM_CHANNEL_PREFIX = '5fan-dm-';
export const BRAINS = ['hear', 'inspyre', 'flow', 'you', 'view'];
export const COOLDOWN_MS = 4000;

export const MODE = {
  FEED: 'feed',
  DM: 'dm',
  TRAINER: 'trainer',
};

export const DEFAULT_POLICY = {
  maxResponsesPerMinute: 3,
  requireAuth: false,
  relayEnabled: true,
  powDifficulty: 0,
};

/**
 * Build a per-user sidechannel name.
 * @param {string} userId
 * @returns {string}
 */
export function userChannel(userId) {
  return `${USER_CHANNEL_PREFIX}${userId}`;
}

/**
 * Build a DM sidechannel name for a specific brain.
 * @param {string} brainName
 * @param {string} userId
 * @returns {string}
 */
export function dmChannel(brainName, userId) {
  return `${DM_CHANNEL_PREFIX}${brainName}-${userId}`;
}

/**
 * Parse a DM channel string back into brain + userId.
 * @param {string} channel
 * @returns {{ brain: string, userId: string } | null}
 */
export function parseDmChannel(channel) {
  if (!channel.startsWith(DM_CHANNEL_PREFIX)) return null;
  const rest = channel.slice(DM_CHANNEL_PREFIX.length);
  const idx = rest.indexOf('-');
  if (idx <= 0) return null;
  return { brain: rest.slice(0, idx), userId: rest.slice(idx + 1) };
}

/**
 * Wrap a response in a standard feed envelope.
 * @param {string} brain  - originating brain name
 * @param {string} text   - response text
 * @param {object} [meta] - optional metadata
 * @returns {object}
 */
export function feedEnvelope(brain, text, meta = {}) {
  return {
    from: '5fan',
    brain,
    message: text,
    ts: Date.now(),
    ...meta,
  };
}

/**
 * Compute a simple signal strength (0-1) from keyword hits.
 * @param {string} text
 * @param {string[]} keywords
 * @returns {number}
 */
export function signalStrength(text, keywords) {
  if (!text || !keywords.length) return 0;
  const lower = text.toLowerCase();
  let hits = 0;
  for (const kw of keywords) {
    if (lower.includes(kw.toLowerCase())) hits++;
  }
  return Math.min(hits / Math.max(keywords.length * 0.3, 1), 1);
}

/**
 * Pick a random element from an array.
 * @template T
 * @param {T[]} arr
 * @returns {T}
 */
export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
