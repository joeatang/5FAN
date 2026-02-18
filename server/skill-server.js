/**
 * 5FAN Skill Server — Intercom-Native Brain Invocation Layer
 *
 * Listens on Intercom sidechannels for skill:call messages and returns
 * brain judgment via skill:result. This is the front door that turns
 * 5FAN's five brains into invocable skills for any agent on the network.
 *
 * Architecture:
 *   Any agent → joins channel "5fan-skill-hear" → sends skill:call
 *   skill-server.js → runs Hear brain scan + fulfill → sends skill:result
 *
 *   Any agent → joins channel "5fan-skill-swarm" → sends skill:call
 *   skill-server.js → runs all 5 brains → View curates → sends skill:result
 *
 * No REST. No API keys. No cloud functions.
 * Just Intercom sidechannels. P2P. Peer-to-peer brain invocation.
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │  Built for developers making consumer-facing products.      │
 * │  5FAN skills add emotional intelligence to any app —        │
 * │  five brains that make users feel seen, validated,          │
 * │  and understood.                                            │
 * │                                                             │
 * │  Your app does the job. 5FAN makes the experience human.    │
 * └──────────────────────────────────────────────────────────────┘
 */

import { scan as hearScan, fulfill as hearFulfill } from '../brains/hear/functions.js';
import { scan as inspyreScan, fulfill as inspyreFulfill } from '../brains/inspyre/functions.js';
import { scan as flowScan, fulfill as flowFulfill } from '../brains/flow/functions.js';
import { scan as youScan, fulfill as youFulfill } from '../brains/you/functions.js';
import { scan as viewScan, fulfill as viewFulfill, curateConsensus } from '../brains/view/functions.js';
import { analyze, analyzeAndRespond, buildEnrichedPrompt } from './brain-swarm.js';
import { generate } from './lm-bridge.js';
import { FIVE_FAN } from '../config.js';
import appContext from '../app-context.js';
import {
  MSG,
  SKILL_DISCOVERY_CHANNEL,
  SKILL_CHANNEL_PREFIX,
  SWARM_SKILL_CHANNEL,
  SKILL_REGISTRY,
  skillChannel,
  buildResult,
  buildError,
  buildChainResult,
  buildManifest,
  validateCall,
  isSkillMessage,
} from '../skill-protocol.js';

// ─── Brain Dispatch Maps ──────────────────────────────────────

const scanMap = {
  hear: hearScan,
  inspyre: inspyreScan,
  flow: flowScan,
  you: youScan,
  view: viewScan,
};

const fulfillMap = {
  hear: hearFulfill,
  inspyre: inspyreFulfill,
  flow: flowFulfill,
  you: youFulfill,
  view: viewFulfill,
};

// ─── Rate Limiting ────────────────────────────────────────────

/** Per-caller rate limiter: max invocations per minute per caller */
const callerWindows = new Map();
const MAX_CALLS_PER_MINUTE = 30;
const WINDOW_MS = 60_000;

/**
 * Check if a caller is within rate limits.
 * @param {string} callerId
 * @returns {boolean}
 */
function checkRateLimit(callerId) {
  const now = Date.now();
  let window = callerWindows.get(callerId);
  if (!window || now - window.start > WINDOW_MS) {
    window = { start: now, count: 0 };
    callerWindows.set(callerId, window);
  }
  window.count++;
  return window.count <= MAX_CALLS_PER_MINUTE;
}

/** Periodic cleanup of stale rate limit windows */
function cleanupRateLimits() {
  const now = Date.now();
  for (const [id, window] of callerWindows) {
    if (now - window.start > WINDOW_MS * 2) {
      callerWindows.delete(id);
    }
  }
}

// ─── Metrics ──────────────────────────────────────────────────

const metrics = {
  totalCalls: 0,
  totalChains: 0,
  totalErrors: 0,
  callsBySkill: {},
  startedAt: Date.now(),
};

function trackCall(skill) {
  metrics.totalCalls++;
  metrics.callsBySkill[skill] = (metrics.callsBySkill[skill] || 0) + 1;
}

/**
 * Get skill server metrics.
 * @returns {object}
 */
export function getMetrics() {
  return {
    ...metrics,
    uptimeMs: Date.now() - metrics.startedAt,
    activeCallers: callerWindows.size,
  };
}

// ─── Core Handlers ────────────────────────────────────────────

/**
 * Handle a single brain skill:call — scan + fulfill for one brain.
 *
 * @param {string} brainName - hear | inspyre | flow | you | view
 * @param {string} text - the human message
 * @param {object} [context] - optional metadata
 * @returns {object} - brain judgment output
 */
function handleBrainCall(brainName, text, context = {}) {
  const scanFn = scanMap[brainName];
  const fulfillFn = fulfillMap[brainName];

  if (!scanFn || !fulfillFn) {
    throw new Error(`Unknown brain: ${brainName}`);
  }

  const scanResult = scanFn(text, context);
  const response = fulfillFn(text, scanResult);

  return {
    brain: brainName,
    signal: scanResult.signal,
    category: scanResult.category,
    // Each brain has different property names for detected items
    ...(scanResult.emotions && { emotions: scanResult.emotions }),
    ...(scanResult.themes && { themes: scanResult.themes }),
    ...(scanResult.markers && { markers: scanResult.markers }),
    ...(scanResult.patterns && { patterns: scanResult.patterns }),
    ...(scanResult.angles && { angles: scanResult.angles }),
    ...(scanResult.isCrisis !== undefined && { isCrisis: scanResult.isCrisis }),
    response,
    summary: scanResult.summary,
  };
}

/**
 * Handle a swarm skill:call — all 5 brains → View curates consensus.
 * Tries LLM-enriched response first, falls back to template.
 *
 * @param {string} text - the human message
 * @param {object} [context] - optional metadata
 * @returns {Promise<object>} - swarm judgment output
 */
async function handleSwarmCall(text, context = {}) {
  const analysis = analyze(text, context);

  // Try LLM-enriched response
  let response;
  let method = 'template';

  const enrichedPrompt = buildEnrichedPrompt(appContext, analysis);
  const llmResponse = await generate(enrichedPrompt, text, {
    maxTokens: 200,
    temperature: 0.7,
  });

  if (llmResponse) {
    response = llmResponse;
    method = 'llm';
  } else {
    const templateResult = analyzeAndRespond(text, context);
    response = templateResult.response;
  }

  // Build per-brain signal summary
  const brainSignals = {};
  for (const scan of analysis.scans) {
    brainSignals[scan.brain] = {
      signal: scan.signal,
      category: scan.category,
      summary: scan.summary,
    };
  }

  return {
    dominant: analysis.dominantBrain,
    consensus: analysis.consensus.consensus,
    response,
    method,
    brainSignals,
    tags: analysis.tags,
    isCrisis: analysis.scans.some(s => s.isCrisis),
    activeBrainCount: analysis.consensus.activeBrainCount || 0,
  };
}

/**
 * Handle a skill:chain call — run multiple brains in sequence,
 * each brain's output available as context to the next.
 *
 * @param {string[]} skills - ordered list of brains to invoke
 * @param {string} text - the human message
 * @param {object} [context] - optional metadata
 * @returns {object} - chained results with optional View synthesis
 */
function handleChainCall(skills, text, context = {}) {
  const results = [];
  let enrichedContext = { ...context };

  for (const brainName of skills) {
    if (brainName === '5fan-swarm') {
      // Swarm in a chain is unusual but supported — just runs analysis
      const analysis = analyze(text, enrichedContext);
      results.push({
        brain: '5fan-swarm',
        dominant: analysis.dominantBrain,
        consensus: analysis.consensus.consensus,
        tags: analysis.tags,
      });
      enrichedContext.swarmAnalysis = analysis;
    } else {
      const result = handleBrainCall(brainName, text, enrichedContext);
      results.push(result);
      // Feed this brain's output into the next brain's context
      enrichedContext[`${brainName}Result`] = result;
    }
  }

  // If View was the last brain in the chain, its response is the synthesis.
  // If View wasn't in the chain, run a synthesis pass.
  let synthesized = null;
  const lastResult = results[results.length - 1];
  if (lastResult?.brain === 'view') {
    synthesized = lastResult.response;
  } else if (results.length > 1) {
    // Auto-synthesize via View if chain has 2+ brains and View wasn't included
    const scanResults = results.map(r => ({
      brain: r.brain,
      signal: r.signal || 0,
      summary: r.summary || '',
      ...r,
    }));
    const consensus = curateConsensus(scanResults, text);
    synthesized = consensus.consensus;
  }

  return { results, synthesized };
}

// ─── Intercom Integration ─────────────────────────────────────

/** Track active sidechannel subscriptions */
const activeChannels = new Set();

/**
 * Initialize the skill server on an Intercom sidechannel instance.
 * Sets up listeners on all brain skill channels + discovery channel.
 *
 * @param {object} sidechannel - Intercom sidechannel instance
 * @param {object} [options] - { broadcastFn, peer }
 */
export function initSkillServer(sidechannel, options = {}) {
  if (!FIVE_FAN.enabled) {
    console.log('[5FAN-skills] Disabled — FIVE_FAN.enabled is false.');
    return;
  }

  const { peer } = options;
  const myKey = peer?.wallet?.publicKey?.toString?.('hex') || '';

  console.log('[5FAN-skills] Initializing skill server...');

  // Subscribe to individual brain skill channels
  for (const brainName of Object.keys(scanMap)) {
    const channel = skillChannel(brainName);
    listenOnChannel(sidechannel, channel, myKey);
    console.log(`[5FAN-skills] Listening on ${channel}`);
  }

  // Subscribe to swarm skill channel
  listenOnChannel(sidechannel, SWARM_SKILL_CHANNEL, myKey);
  console.log(`[5FAN-skills] Listening on ${SWARM_SKILL_CHANNEL}`);

  // Subscribe to discovery channel — broadcast manifest on join
  listenOnChannel(sidechannel, SKILL_DISCOVERY_CHANNEL, myKey, true);
  console.log(`[5FAN-skills] Broadcasting manifest on ${SKILL_DISCOVERY_CHANNEL}`);

  // Broadcast manifest immediately
  broadcastManifest(sidechannel);

  // Re-broadcast manifest every 5 minutes
  setInterval(() => broadcastManifest(sidechannel), 5 * 60_000);

  // Cleanup stale rate limits every 2 minutes
  setInterval(cleanupRateLimits, 2 * 60_000);

  console.log('[5FAN-skills] Skill server ready. 5 brains + swarm available for invocation.');
}

/**
 * Set up a listener on a specific Intercom sidechannel.
 *
 * @param {object} sidechannel - Intercom sidechannel instance
 * @param {string} channel - channel name to listen on
 * @param {string} myKey - our own public key (to ignore own messages)
 * @param {boolean} [isDiscovery] - if true, this is the discovery channel
 */
function listenOnChannel(sidechannel, channel, myKey, isDiscovery = false) {
  if (activeChannels.has(channel)) return; // Already listening
  activeChannels.add(channel);

  sidechannel.on(channel, async (payload) => {
    try {
      // Parse the message
      const msg = typeof payload === 'string' ? JSON.parse(payload) : payload;

      // Ignore our own messages
      const senderKey = msg?.from || msg?.origin || '';
      if (senderKey && senderKey === myKey) return;

      // Only handle skill protocol messages
      if (!isSkillMessage(msg)) return;

      // Route by message type
      if (msg.type === MSG.DESCRIBE) {
        // Someone requesting our manifest on a specific channel
        const info = SKILL_REGISTRY[msg.skill] || null;
        if (info) {
          sidechannel.broadcast(channel, JSON.stringify({
            type: MSG.MANIFEST,
            provider: '5fan',
            skill: info,
            ts: Date.now(),
          }));
        }
        return;
      }

      if (msg.type === MSG.CALL) {
        await handleSkillCallMessage(sidechannel, channel, msg, senderKey);
        return;
      }

      if (msg.type === MSG.CHAIN) {
        await handleChainCallMessage(sidechannel, channel, msg, senderKey);
        return;
      }
    } catch (err) {
      console.error(`[5FAN-skills] Error on ${channel}:`, err?.message ?? err);
      metrics.totalErrors++;
    }
  });
}

/**
 * Handle an incoming skill:call message on a specific channel.
 *
 * @param {object} sidechannel
 * @param {string} channel
 * @param {object} msg - the skill:call message
 * @param {string} callerId - sender's public key
 */
async function handleSkillCallMessage(sidechannel, channel, msg, callerId) {
  // Validate
  const validation = validateCall(msg);
  if (!validation.valid) {
    const error = buildError(msg.skill || 'unknown', msg.callId, validation.error, 'INVALID_CALL');
    sidechannel.broadcast(channel, JSON.stringify(error));
    metrics.totalErrors++;
    return;
  }

  // Rate limit
  if (!checkRateLimit(callerId)) {
    const error = buildError(msg.skill, msg.callId,
      `Rate limited: max ${MAX_CALLS_PER_MINUTE} calls/minute.`, 'RATE_LIMITED');
    sidechannel.broadcast(channel, JSON.stringify(error));
    metrics.totalErrors++;
    return;
  }

  const { skill, callId, input } = msg;
  const { text, ...context } = input;

  console.log(`[5FAN-skills] ${skill} call from ${callerId.slice(0, 8)}... — "${text.slice(0, 60)}"`);
  trackCall(skill);

  let output;

  if (skill === '5fan-swarm') {
    // Swarm call — all 5 brains + LLM
    output = await handleSwarmCall(text, context);
  } else {
    // Individual brain call — scan + fulfill
    output = handleBrainCall(skill, text, context);
  }

  // Build and broadcast result
  const result = buildResult(skill, callId, output);
  sidechannel.broadcast(channel, JSON.stringify(result));
}

/**
 * Handle an incoming skill:chain message.
 *
 * @param {object} sidechannel
 * @param {string} channel
 * @param {object} msg - the skill:chain message
 * @param {string} callerId - sender's public key
 */
async function handleChainCallMessage(sidechannel, channel, msg, callerId) {
  // Validate
  const validation = validateCall(msg);
  if (!validation.valid) {
    const error = buildError('chain', msg.callId, validation.error, 'INVALID_CHAIN');
    sidechannel.broadcast(channel, JSON.stringify(error));
    metrics.totalErrors++;
    return;
  }

  // Rate limit (chains count as N calls where N = number of brains)
  for (let i = 0; i < msg.skills.length; i++) {
    if (!checkRateLimit(callerId)) {
      const error = buildError('chain', msg.callId,
        `Rate limited during chain at brain ${i + 1}.`, 'RATE_LIMITED');
      sidechannel.broadcast(channel, JSON.stringify(error));
      metrics.totalErrors++;
      return;
    }
  }

  const { skills, callId, input } = msg;
  const { text, ...context } = input;

  console.log(`[5FAN-skills] Chain call: ${skills.join(' → ')} from ${callerId.slice(0, 8)}...`);
  metrics.totalChains++;
  skills.forEach(s => trackCall(s));

  const { results, synthesized } = handleChainCall(skills, text, context);
  const chainResult = buildChainResult(callId, results, synthesized);
  sidechannel.broadcast(channel, JSON.stringify(chainResult));
}

/**
 * Broadcast the 5FAN skill manifest on the discovery channel.
 * @param {object} sidechannel
 */
function broadcastManifest(sidechannel) {
  const manifest = buildManifest();
  try {
    sidechannel.broadcast(SKILL_DISCOVERY_CHANNEL, JSON.stringify(manifest));
    console.log('[5FAN-skills] Manifest broadcast — 5 brains + swarm advertised.');
  } catch (err) {
    console.error('[5FAN-skills] Manifest broadcast error:', err?.message ?? err);
  }
}

// ─── Express Routes (optional hybrid HTTP access) ─────────────

/**
 * Mount skill endpoints onto an Express app.
 * This is optional — the primary interface is Intercom P2P.
 * Useful for local testing, admin dashboards, or hybrid architectures.
 *
 * @param {import('express').Application} app
 */
export function mountSkillRoutes(app) {
  // Invoke a single brain
  app.post('/v1/5fan/skill/:brain', async (req, res) => {
    try {
      const { brain } = req.params;
      const { text, context } = req.body;

      if (!text) return res.status(400).json({ ok: false, error: 'text required' });
      if (!SKILL_REGISTRY[brain]) {
        return res.status(404).json({ ok: false, error: `Unknown brain: ${brain}` });
      }

      trackCall(brain);
      let output;

      if (brain === '5fan-swarm') {
        output = await handleSwarmCall(text, context || {});
      } else {
        output = handleBrainCall(brain, text, context || {});
      }

      res.json({ ok: true, ...output });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // Chain multiple brains
  app.post('/v1/5fan/skill/chain', async (req, res) => {
    try {
      const { skills, text, context } = req.body;

      if (!text) return res.status(400).json({ ok: false, error: 'text required' });
      if (!Array.isArray(skills) || skills.length === 0) {
        return res.status(400).json({ ok: false, error: 'skills array required' });
      }

      for (const s of skills) {
        if (!SKILL_REGISTRY[s]) {
          return res.status(404).json({ ok: false, error: `Unknown brain in chain: ${s}` });
        }
      }

      metrics.totalChains++;
      skills.forEach(s => trackCall(s));

      const { results, synthesized } = handleChainCall(skills, text, context || {});
      res.json({ ok: true, results, synthesized });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // Get available skills (manifest)
  app.get('/v1/5fan/skills', (req, res) => {
    const manifest = buildManifest();
    res.json({ ok: true, ...manifest });
  });

  // Get skill server metrics
  app.get('/v1/5fan/skills/metrics', (req, res) => {
    res.json({ ok: true, ...getMetrics() });
  });

  // Describe a specific skill
  app.get('/v1/5fan/skill/:brain/describe', (req, res) => {
    const info = SKILL_REGISTRY[req.params.brain];
    if (!info) return res.status(404).json({ ok: false, error: 'Unknown brain' });
    res.json({ ok: true, ...info });
  });
}

export default { initSkillServer, mountSkillRoutes, getMetrics };
