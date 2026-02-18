/**
 * Feed Responder
 * Auto-replies to user content posted to the community feed.
 * Mirrors language, uses brain swarm analysis, LLM-enriched responses.
 */

import { analyze, analyzeAndRespond, buildEnrichedPrompt } from './brain-swarm.js';
import { generate } from './lm-bridge.js';
import { FIVE_FAN } from '../config.js';
import appContext from '../app-context.js';
import { feedEnvelope } from '../brains/5fan.js';

/** Rate limiting state */
let responseCount = 0;
let windowStart = Date.now();
const DEFAULT_MAX_PER_HOUR = 30;

/** Deduplication: track recent response hashes */
const recentResponses = [];
const MAX_RECENT = 50;

/**
 * Check if we're within rate limits.
 * @returns {boolean}
 */
function canRespond() {
  const now = Date.now();
  const maxPerHour = FIVE_FAN.feedResponder?.maxPerHour || DEFAULT_MAX_PER_HOUR;

  // Reset window every hour
  if (now - windowStart > 3_600_000) {
    responseCount = 0;
    windowStart = now;
  }

  return responseCount < maxPerHour;
}

/**
 * Simple hash for deduplication.
 * @param {string} text
 * @returns {string}
 */
function simpleHash(text) {
  const normalized = text.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 100);
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) - hash + normalized.charCodeAt(i)) | 0;
  }
  return String(hash);
}

/**
 * Check if a response is too similar to recent ones.
 * @param {string} response
 * @returns {boolean}
 */
function isDuplicate(response) {
  const hash = simpleHash(response);
  if (recentResponses.includes(hash)) return true;
  recentResponses.push(hash);
  if (recentResponses.length > MAX_RECENT) recentResponses.shift();
  return false;
}

/**
 * Generate a feed response to a user's community post.
 *
 * @param {string} text - the user's share/post text
 * @param {object} [meta] - { userId, channel, displayName }
 * @returns {Promise<{ response: string, brain: string, method: string } | null>}
 */
export async function respondToFeed(text, meta = {}) {
  if (!FIVE_FAN.features.feedReplies) return null;
  if (!canRespond()) {
    console.log('[feed-responder] Rate limited — skipping.');
    return null;
  }
  if (!text || text.trim().length < 3) return null;

  // Run brain swarm analysis
  const analysis = analyze(text, meta);
  const dominantBrain = analysis.dominantBrain;

  // Try LLM-enriched response
  const enrichedPrompt = buildEnrichedPrompt(appContext, analysis);
  const llmResponse = await generate(enrichedPrompt, text, {
    maxTokens: 150,
    temperature: 0.75,
  });

  let response;
  let method;

  if (llmResponse && !isDuplicate(llmResponse)) {
    response = llmResponse;
    method = 'llm';
  } else {
    // Template fallback
    const templateResult = analyzeAndRespond(text, meta);
    response = templateResult.response;
    method = 'template';

    if (isDuplicate(response)) {
      console.log('[feed-responder] Duplicate detected — regenerating.');
      const fallback = analyzeAndRespond(text, { ...meta, _retry: true });
      response = fallback.response;
    }
  }

  responseCount++;

  return {
    response,
    brain: dominantBrain,
    method,
    envelope: feedEnvelope(dominantBrain, response, { channel: meta.channel }),
  };
}

/**
 * Reset rate limiter (for testing).
 */
export function resetRateLimit() {
  responseCount = 0;
  windowStart = Date.now();
}

/**
 * Get current feed responder stats.
 */
export function getStats() {
  return {
    responsesThisHour: responseCount,
    maxPerHour: FIVE_FAN.feedResponder?.maxPerHour || DEFAULT_MAX_PER_HOUR,
    recentResponseCount: recentResponses.length,
  };
}

export default { respondToFeed, resetRateLimit, getStats };
