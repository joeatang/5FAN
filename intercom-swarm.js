/**
 * Intercom Swarm — P2P Brain Swarm Integration
 * Wires all brains to the Intercom protocol.
 *
 * - Routes incoming messages through brain swarm
 * - LLM-enriched responses with template fallback
 * - Brain-to-brain cross-calls via internal channel
 * - DM mode (1:1 private sidechannel with individual brains)
 * - User profiling + onboarding
 * - Proactive scheduling integration
 */

import { analyze, analyzeAndRespond, buildEnrichedPrompt, hasCrisis } from './server/brain-swarm.js';
import { generate, getStatus as lmGetStatus } from './server/lm-bridge.js';
import { respondToFeed } from './server/feed-responder.js';
import { handleMessage as trainerHandleMessage } from './server/trainer-api.js';
import { start as startProactive, stop as stopProactive } from './server/proactive-scheduler.js';
import { FIVE_FAN } from './config.js';
import appContext from './app-context.js';
import { trackMessage, needsOnboarding, getNextOnboardingQuestion, answerOnboarding, getWelcomeMessage } from './user-profile.js';
import { FIVEFAN_CHANNEL, DM_CHANNEL_PREFIX, parseDmChannel, feedEnvelope, MODE, COOLDOWN_MS } from './brains/5fan.js';

/** Rate limiter state */
let lastResponseTime = 0;
let responsesThisMinute = 0;
let minuteWindowStart = Date.now();

/** Track ongoing onboarding conversations */
const onboardingState = new Map();

/**
 * Check cooldown and rate limits.
 * @returns {boolean}
 */
function canRespond() {
  const now = Date.now();
  const maxPerMinute = FIVE_FAN.intercom?.maxResponsesPerMinute || 3;

  // Reset minute window
  if (now - minuteWindowStart > 60_000) {
    responsesThisMinute = 0;
    minuteWindowStart = now;
  }

  if (responsesThisMinute >= maxPerMinute) return false;
  if (now - lastResponseTime < COOLDOWN_MS) return false;
  return true;
}

/**
 * Mark that a response was sent.
 */
function markResponse() {
  lastResponseTime = Date.now();
  responsesThisMinute++;
}

/**
 * Handle an incoming P2P message — the core routing function.
 *
 * @param {string} channel - the sidechannel the message arrived on
 * @param {string} text - the message text
 * @param {object} payload - full payload from Intercom
 * @param {object} context - { sidechannel, peer, scBridge, entryChannel, extras }
 * @returns {Promise<void>}
 */
export async function handleIncomingMessage(channel, text, payload, context) {
  if (!FIVE_FAN.enabled) return;

  // Safely coerce text — payload may pass an object instead of a string
  if (text && typeof text === 'object') text = text.message || text.text || JSON.stringify(text);
  if (typeof text !== 'string') text = String(text || '');

  if (!text || text.trim().length === 0) return;
  if (!canRespond()) return;

  const { sidechannel, peer, entryChannel, extras } = context;
  const senderKey = payload?.from || payload?.origin || 'unknown';
  const userId = senderKey.slice(0, 16); // Short user ID for profiling

  // Don't respond to our own messages
  const myKey = peer?.wallet?.publicKey?.toString?.('hex') || peer?.wallet?.publicKey || '';
  if (senderKey === myKey || payload?.origin === myKey) return;

  // Track user message
  trackMessage(userId);

  // Check if this is a DM channel
  const dm = parseDmChannel(channel);
  if (dm) {
    return handleDM(dm, text, userId, sidechannel, channel);
  }

  // Check if user is in onboarding
  if (FIVE_FAN.features.userProfiling && needsOnboarding(userId)) {
    return handleOnboarding(userId, text, sidechannel, channel);
  }

  // Check for trainer commands
  if (text.startsWith('/')) {
    const trainerResult = await trainerHandleMessage(userId, text, { channel });
    if (trainerResult) {
      broadcastResponse(sidechannel, channel, trainerResult.response, trainerResult.brain);
      return;
    }
  }

  // Main response pipeline: brain swarm → LLM → template fallback
  const delay = randomDelay();
  setTimeout(async () => {
    try {
      const response = await generateSwarmResponse(text, { userId, channel });
      if (response) {
        broadcastResponse(sidechannel, channel, response.text, response.brain);
      }
    } catch (err) {
      console.error('[5FAN] Response error:', err?.message ?? err);
    }
  }, delay);
}

/**
 * Generate a response using the full brain swarm pipeline.
 *
 * @param {string} text
 * @param {object} meta
 * @returns {Promise<{ text: string, brain: string, method: string } | null>}
 */
async function generateSwarmResponse(text, meta = {}) {
  // Run brain swarm analysis
  const analysis = analyze(text, meta);

  // Crisis override — always respond immediately
  if (hasCrisis(analysis.scans)) {
    const crisisResponse = 'I hear you, and what you\'re feeling matters. You\'re not alone. ' +
      'Please reach out to the 988 Suicide & Crisis Lifeline (call or text 988) ' +
      'or Crisis Text Line (text HOME to 741741). Someone is there for you right now.';
    markResponse();
    return { text: crisisResponse, brain: 'hear', method: 'crisis' };
  }

  // Try LLM-enriched response
  const enrichedPrompt = buildEnrichedPrompt(appContext, analysis);
  const llmResponse = await generate(enrichedPrompt, text, {
    maxTokens: 200,
    temperature: 0.7,
  });

  if (llmResponse) {
    markResponse();
    return { text: llmResponse, brain: analysis.dominantBrain, method: 'llm' };
  }

  // Template fallback
  const templateResult = analyzeAndRespond(text, meta);
  markResponse();
  return { text: templateResult.response, brain: templateResult.brain, method: 'template' };
}

/**
 * Handle a DM (direct message) to a specific brain.
 */
async function handleDM(dm, text, userId, sidechannel, channel) {
  const result = await trainerHandleMessage(userId, text, { channel, brain: dm.brain });
  if (result) {
    broadcastResponse(sidechannel, channel, result.response, result.brain);
  }
}

/**
 * Handle user onboarding flow.
 */
function handleOnboarding(userId, text, sidechannel, channel) {
  const state = onboardingState.get(userId);

  if (!state) {
    // First message — start onboarding
    const welcome = getWelcomeMessage(userId);
    const firstQuestion = getNextOnboardingQuestion(userId);
    onboardingState.set(userId, { questionId: firstQuestion?.id });

    const response = firstQuestion
      ? `${welcome}\n\n${firstQuestion.question}`
      : welcome;

    broadcastResponse(sidechannel, channel, response, 'view');
    markResponse();
    return;
  }

  // Process answer and get next question
  if (state.questionId) {
    const next = answerOnboarding(userId, state.questionId, text);
    if (next) {
      onboardingState.set(userId, { questionId: next.id });
      broadcastResponse(sidechannel, channel, next.question, 'view');
      markResponse();
    } else {
      // Onboarding complete
      onboardingState.delete(userId);
      broadcastResponse(sidechannel, channel,
        'Got it! You\'re all set. I\'m here whenever you need me. Just talk — I\'m listening.',
        'hear'
      );
      markResponse();
    }
  }
}

/**
 * Broadcast a response on a sidechannel.
 */
function broadcastResponse(sidechannel, channel, text, brain) {
  if (!text || !sidechannel) return;

  const prefix = `[${brain.toUpperCase()}] `;
  const message = prefix + text;

  try {
    sidechannel.broadcast(channel, message);
    console.log(`[5FAN] ${brain}: ${text.slice(0, 60)}...`);
  } catch (err) {
    console.error('[5FAN] Broadcast error:', err?.message ?? err);
  }
}

/**
 * Random delay for natural pacing (2-5 seconds).
 * @returns {number}
 */
function randomDelay() {
  const cfg = FIVE_FAN.intercom?.responseDelayMs || { min: 2000, max: 5000 };
  return cfg.min + Math.random() * (cfg.max - cfg.min);
}

/**
 * Initialize the proactive scheduler.
 * @param {object} sidechannel
 * @param {string} channel
 */
export function initProactive(sidechannel, channel) {
  if (!FIVE_FAN.features.proactive) return;

  const broadcastFn = (envelope) => {
    if (envelope?.message) {
      broadcastResponse(sidechannel, channel, envelope.message, envelope.brain || 'view');
    }
  };

  const interval = FIVE_FAN.proactive?.checkIntervalMs || 600_000;
  startProactive(broadcastFn, interval);
  console.log('[5FAN] Proactive scheduler initialized.');
}

/**
 * Get system status for logging/diagnostics.
 * @returns {Promise<object>}
 */
export async function getSystemStatus() {
  const lm = await lmGetStatus();
  return {
    enabled: FIVE_FAN.enabled,
    features: FIVE_FAN.features,
    lm,
    lastResponseTime,
    responsesThisMinute,
  };
}

export default { handleIncomingMessage, initProactive, getSystemStatus };
