/**
 * 5FAN Skill Protocol — Intercom-Native Skill Invocation Standard
 *
 * Defines the message types, validation, and channel naming conventions
 * for invoking 5FAN brains as skills over Intercom sidechannels.
 *
 * This is a P2P skill protocol — no REST, no API keys, no cloud functions.
 * Any peer on Intercom can invoke a skill by joining a channel and sending
 * a skill:call message. 5FAN responds on the same channel with skill:result.
 *
 * ┌──────────────────────────────────────────────────────────┐
 * │  Built for developers making consumer-facing products.   │
 * │                                                          │
 * │  5FAN skills add emotional intelligence to any app —     │
 * │  five brains that make users feel seen, validated,        │
 * │  and understood.                                         │
 * │                                                          │
 * │  Your app does the job.                                  │
 * │  5FAN makes the experience feel human.                   │
 * └──────────────────────────────────────────────────────────┘
 *
 * FORK GUIDE:
 *   If you fork 5FAN and add your own brains, register them in
 *   SKILL_REGISTRY below and create a skill.json in their brain folder.
 *   The protocol, channel naming, and message format stay the same.
 */

import { BRAINS } from './brains/5fan.js';

// ─── Channel Naming ───────────────────────────────────────────

/** Channel for skill discovery — 5FAN broadcasts its manifest here */
export const SKILL_DISCOVERY_CHANNEL = '5fan-skills';

/** Prefix for individual brain skill channels */
export const SKILL_CHANNEL_PREFIX = '5fan-skill-';

/** Channel for swarm (all-brain consensus) invocations */
export const SWARM_SKILL_CHANNEL = '5fan-skill-swarm';

/**
 * Get the skill invocation channel for a specific brain.
 * @param {string} brainName - hear | inspyre | flow | you | view
 * @returns {string}
 */
export function skillChannel(brainName) {
  return `${SKILL_CHANNEL_PREFIX}${brainName}`;
}

// ─── Message Types ────────────────────────────────────────────

export const MSG = {
  /** Caller → 5FAN: invoke a skill */
  CALL: 'skill:call',
  /** 5FAN → Caller: skill result */
  RESULT: 'skill:result',
  /** 5FAN → Caller: skill invocation error */
  ERROR: 'skill:error',
  /** 5FAN → Discovery channel: available skills manifest */
  MANIFEST: 'skill:manifest',
  /** Caller → 5FAN: request manifest on a skill channel */
  DESCRIBE: 'skill:describe',
  /** Caller → 5FAN: chain multiple skills in sequence */
  CHAIN: 'skill:chain',
  /** 5FAN → Caller: chained skill results */
  CHAIN_RESULT: 'skill:chain-result',
};

// ─── Skill Registry ───────────────────────────────────────────

/**
 * Built-in skill registry.
 * Each entry defines what the skill encodes, its channel, and invocation metadata.
 * Third-party brains are registered here when added to the brains/ directory.
 */
export const SKILL_REGISTRY = {
  hear: {
    skill: 'hear',
    version: '2.0.0',
    channel: skillChannel('hear'),
    title: 'Hear',
    emoji: '👂',
    encodes: 'Emotional intelligence — a wise friend who listens without prescribing.',
    domain: 'Emotion detection, validation, and mirroring.',
    accepts: {
      text: { type: 'string', required: true, description: 'The human message to scan for emotional content.' },
      context: { type: 'object', required: false, description: 'Optional metadata: userId, channel, prior emotions.' },
    },
    returns: {
      signal: '0-1 float — emotional signal strength',
      category: 'pain | joy | mixed | crisis | neutral',
      emotions: 'string[] — detected emotional markers',
      isCrisis: 'boolean — true if crisis keywords detected',
      response: 'string — a warm, validating response (1-2 sentences)',
      summary: 'string — brief scan summary for chaining',
    },
    whenToUse: [
      'User expresses any emotion (pain, joy, grief, celebration, anxiety, relief)',
      'User shares vulnerable or personal content',
      'You need to emotionally tag a journal entry, message, or post',
      'You want to validate before responding with domain-specific advice',
      'First step in any human-facing pipeline (scan emotions before acting)',
    ],
    whenNotToUse: [
      'Purely factual or data queries with no emotional content',
      'System-to-system communication with no human in the loop',
    ],
    chainsWith: ['inspyre', 'flow', 'view', '5fan-swarm'],
  },

  inspyre: {
    skill: 'inspyre',
    version: '2.0.0',
    channel: skillChannel('inspyre'),
    title: 'Inspyre',
    emoji: '🔥',
    encodes: 'Values alignment — finds what someone cares about and reconnects them to it.',
    domain: 'Purpose, resilience, inner strength, motivation without the fluff.',
    accepts: {
      text: { type: 'string', required: true, description: 'The human message to scan for purpose/values signals.' },
      context: { type: 'object', required: false, description: 'Optional metadata: userId, prior themes.' },
    },
    returns: {
      signal: '0-1 float — values/purpose signal strength',
      themes: 'string[] — detected purpose/resilience themes',
      category: 'purpose | resilience | growth | neutral',
      response: 'string — authentic, earned-credibility response (1-2 sentences)',
      summary: 'string — brief scan summary for chaining',
    },
    whenToUse: [
      'User is questioning their purpose or feeling stuck',
      'User wants to give up, quit, or is losing motivation',
      'User shows resilience or celebrates a win (reflect it back)',
      'After Hear detects pain — Inspyre reconnects to purpose',
      'Coaching, mentoring, or personal development contexts',
    ],
    whenNotToUse: [
      'User is in crisis (Hear handles with 988 resources first)',
      'Habit/routine tracking without emotional or purpose context',
    ],
    chainsWith: ['hear', 'flow', 'view', '5fan-swarm'],
  },

  flow: {
    skill: 'flow',
    version: '2.0.0',
    channel: skillChannel('flow'),
    title: 'Flow',
    emoji: '🌊',
    encodes: 'Habit intelligence — notices consistency, celebrates streaks, handles restarts gracefully.',
    domain: 'Habits, routines, streaks, activity tracking, flow states, daily effort.',
    accepts: {
      text: { type: 'string', required: true, description: 'The human message to scan for habit/consistency signals.' },
      context: { type: 'object', required: false, description: 'Optional metadata: userId, streak data, activity log.' },
    },
    returns: {
      signal: '0-1 float — habit/consistency signal strength',
      markers: 'string[] — detected habit and activity markers',
      category: 'consistency | activity | recovery | flowState | neutral',
      response: 'string — calm, nature-metaphor response (1-2 sentences)',
      summary: 'string — brief scan summary for chaining',
    },
    whenToUse: [
      'User logs an activity (workout, journal, meditation, walk)',
      'User reports a streak (day 5, week 2, etc.)',
      'User missed a day or broke a streak',
      'User is restarting after falling off',
      'Fitness, journaling, habit-tracking, or wellness apps',
    ],
    whenNotToUse: [
      'Purely emotional content with no behavior/activity signals',
      'One-time events that aren\'t habit-related',
    ],
    chainsWith: ['hear', 'you', 'view', '5fan-swarm'],
  },

  you: {
    skill: 'you',
    version: '2.0.0',
    channel: skillChannel('you'),
    title: 'You',
    emoji: '🪞',
    encodes: 'Self-awareness engine — notices patterns across time, reflects identity back.',
    domain: 'Personal patterns, self-expression, identity, progress tracking, authenticity.',
    accepts: {
      text: { type: 'string', required: true, description: 'The human message to scan for self-awareness/identity signals.' },
      context: { type: 'object', required: false, description: 'Optional metadata: userId, message history, engagement stats.' },
    },
    returns: {
      signal: '0-1 float — self-awareness signal strength',
      patterns: 'string[] — detected identity and pattern markers',
      category: 'awareness | identity | progress | neutral',
      response: 'string — observant, affirming response (1-2 sentences)',
      summary: 'string — brief scan summary for chaining',
    },
    whenToUse: [
      'User shows self-awareness or recognizes their own patterns',
      'User asks about their progress, stats, or history',
      'User expresses identity, authenticity, or self-doubt',
      'You want to reflect back who someone IS based on their data',
      'Longitudinal analysis of user behavior over time',
    ],
    whenNotToUse: [
      'Single data point with no pattern context',
      'User is in acute emotional distress (Hear first)',
    ],
    chainsWith: ['hear', 'flow', 'view', '5fan-swarm'],
  },

  view: {
    skill: 'view',
    version: '2.0.0',
    channel: skillChannel('view'),
    title: 'View',
    emoji: '🔭',
    encodes: 'Perspective synthesis — zooms out, reframes, and curates multi-signal consensus.',
    domain: 'Big-picture thinking, perspective shifts, temporal reframing, decision support.',
    accepts: {
      text: { type: 'string', required: true, description: 'The human message to scan for perspective/synthesis signals.' },
      context: { type: 'object', required: false, description: 'Optional metadata: userId, prior scan results for synthesis.' },
    },
    returns: {
      signal: '0-1 float — perspective/synthesis signal strength',
      angles: 'string[] — detected perspective markers',
      category: 'perspective | temporal | decision | synthesis | neutral',
      response: 'string — wise, grounded response (1-2 sentences)',
      summary: 'string — brief scan summary for chaining',
    },
    whenToUse: [
      'User is confused, at a crossroads, or seeking clarity',
      'User needs a perspective shift or temporal reframe',
      'After chaining Hear + Inspyre — View synthesizes into one voice',
      'User asks "what do you think?" or wants a summary',
      'Any time multiple signals are present and need to be unified',
    ],
    whenNotToUse: [
      'User needs immediate emotional validation (Hear first)',
      'User is tracking specific habit data (Flow is more relevant)',
    ],
    chainsWith: ['hear', 'inspyre', 'flow', 'you', '5fan-swarm'],
  },

  '5fan-swarm': {
    skill: '5fan-swarm',
    version: '2.0.0',
    channel: SWARM_SKILL_CHANNEL,
    title: '5FAN Swarm',
    emoji: '🧠',
    encodes: 'Five-brain consensus — full emotional intelligence stack in a single invocation.',
    domain: 'Comprehensive human understanding: emotion + purpose + habits + identity + perspective.',
    accepts: {
      text: { type: 'string', required: true, description: 'The human message to analyze across all 5 brains.' },
      context: { type: 'object', required: false, description: 'Optional metadata: userId, channel, conversation history.' },
    },
    returns: {
      dominant: 'string — the brain with strongest signal (hear|inspyre|flow|you|view)',
      consensus: 'string — synthesized multi-brain response (1-3 sentences)',
      response: 'string — the best single response (from dominant brain or LLM-enriched)',
      method: 'llm | template — how the response was generated',
      brainSignals: 'object — signal strength and category from each brain',
      tags: 'string[] — all unique tags across all brain scans',
      isCrisis: 'boolean — true if crisis detected (response will be crisis-protocol)',
    },
    whenToUse: [
      'You want comprehensive emotional intelligence in one call',
      'Complex messages that span multiple brain domains',
      'You don\'t know which brain to call — let the swarm figure it out',
      'Building a response that should draw from all perspectives',
      'Production use case where you want the most informed response',
    ],
    whenNotToUse: [
      'You only need one specific signal (call that brain directly — faster)',
      'High-volume pipeline where per-brain calls are more efficient',
    ],
    chainsWith: [],
    note: 'Swarm is the meta-skill — it runs all 5 brains internally. Chaining it with individual brains is redundant.',
  },
};

// ─── Message Builders ─────────────────────────────────────────

/**
 * Build a skill:call message.
 * @param {string} skill - brain name or '5fan-swarm'
 * @param {string} text - human message to analyze
 * @param {object} [context] - optional metadata
 * @param {string} [callId] - optional correlation ID (auto-generated if omitted)
 * @returns {object}
 */
export function buildCall(skill, text, context = {}, callId = null) {
  return {
    type: MSG.CALL,
    skill,
    callId: callId || generateCallId(),
    input: { text, ...context },
    ts: Date.now(),
  };
}

/**
 * Build a skill:result message.
 * @param {string} skill - brain name or '5fan-swarm'
 * @param {string} callId - correlation ID from the original call
 * @param {object} output - the skill's judgment output
 * @returns {object}
 */
export function buildResult(skill, callId, output) {
  return {
    type: MSG.RESULT,
    skill,
    callId,
    output,
    ts: Date.now(),
    provider: '5fan',
    version: '2.0.0',
  };
}

/**
 * Build a skill:error message.
 * @param {string} skill
 * @param {string} callId
 * @param {string} error - human-readable error description
 * @param {string} [code] - machine-readable error code
 * @returns {object}
 */
export function buildError(skill, callId, error, code = 'SKILL_ERROR') {
  return {
    type: MSG.ERROR,
    skill,
    callId,
    error,
    code,
    ts: Date.now(),
    provider: '5fan',
  };
}

/**
 * Build a skill:chain message (invoke multiple skills in sequence).
 * @param {string[]} skills - ordered list of brains to chain
 * @param {string} text - human message
 * @param {object} [context] - optional metadata
 * @param {string} [callId] - optional correlation ID
 * @returns {object}
 */
export function buildChain(skills, text, context = {}, callId = null) {
  return {
    type: MSG.CHAIN,
    skills,
    callId: callId || generateCallId(),
    input: { text, ...context },
    ts: Date.now(),
  };
}

/**
 * Build a skill:chain-result message.
 * @param {string} callId
 * @param {object[]} results - ordered array of per-brain results
 * @param {string} [synthesized] - optional View synthesis of chained results
 * @returns {object}
 */
export function buildChainResult(callId, results, synthesized = null) {
  return {
    type: MSG.CHAIN_RESULT,
    callId,
    results,
    synthesized,
    ts: Date.now(),
    provider: '5fan',
    version: '2.0.0',
  };
}

/**
 * Build the skill:manifest message (broadcast on discovery channel).
 * @returns {object}
 */
export function buildManifest() {
  const skills = Object.values(SKILL_REGISTRY).map(s => ({
    name: s.skill,
    channel: s.channel,
    emoji: s.emoji,
    encodes: s.encodes,
    domain: s.domain,
  }));

  return {
    type: MSG.MANIFEST,
    provider: '5fan',
    version: '2.0.0',
    description: 'Five Brains Agentic Network — emotional intelligence for consumer-facing products.',
    tagline: 'Your app does the job. 5FAN makes the user feel seen.',
    skills,
    ts: Date.now(),
  };
}

// ─── Validation ───────────────────────────────────────────────

/**
 * Validate an incoming skill:call message.
 * @param {object} msg
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateCall(msg) {
  if (!msg || typeof msg !== 'object') {
    return { valid: false, error: 'Message must be an object.' };
  }
  if (msg.type !== MSG.CALL && msg.type !== MSG.CHAIN && msg.type !== MSG.DESCRIBE) {
    return { valid: false, error: `Unknown message type: ${msg.type}` };
  }
  if (msg.type === MSG.CALL) {
    if (!msg.skill || typeof msg.skill !== 'string') {
      return { valid: false, error: 'skill (string) is required.' };
    }
    if (!SKILL_REGISTRY[msg.skill]) {
      return { valid: false, error: `Unknown skill: ${msg.skill}. Available: ${Object.keys(SKILL_REGISTRY).join(', ')}` };
    }
    if (!msg.input?.text || typeof msg.input.text !== 'string') {
      return { valid: false, error: 'input.text (string) is required.' };
    }
    if (msg.input.text.trim().length === 0) {
      return { valid: false, error: 'input.text cannot be empty.' };
    }
  }
  if (msg.type === MSG.CHAIN) {
    if (!Array.isArray(msg.skills) || msg.skills.length === 0) {
      return { valid: false, error: 'skills (non-empty array) is required for chain calls.' };
    }
    for (const s of msg.skills) {
      if (!SKILL_REGISTRY[s]) {
        return { valid: false, error: `Unknown skill in chain: ${s}` };
      }
    }
    if (!msg.input?.text || typeof msg.input.text !== 'string') {
      return { valid: false, error: 'input.text (string) is required.' };
    }
  }
  return { valid: true };
}

/**
 * Check if a message is a skill protocol message.
 * @param {object} msg
 * @returns {boolean}
 */
export function isSkillMessage(msg) {
  return msg && typeof msg.type === 'string' && msg.type.startsWith('skill:');
}

// ─── Helpers ──────────────────────────────────────────────────

let _callCounter = 0;

/**
 * Generate a unique call ID for correlation.
 * @returns {string}
 */
function generateCallId() {
  _callCounter++;
  return `5fan-${Date.now().toString(36)}-${_callCounter.toString(36)}`;
}

/**
 * Get the list of all registered skills.
 * @returns {string[]}
 */
export function listSkills() {
  return Object.keys(SKILL_REGISTRY);
}

/**
 * Get registry info for a specific skill.
 * @param {string} name
 * @returns {object|null}
 */
export function getSkillInfo(name) {
  return SKILL_REGISTRY[name] || null;
}

export default {
  MSG,
  SKILL_DISCOVERY_CHANNEL,
  SKILL_CHANNEL_PREFIX,
  SWARM_SKILL_CHANNEL,
  SKILL_REGISTRY,
  skillChannel,
  buildCall,
  buildResult,
  buildError,
  buildChain,
  buildChainResult,
  buildManifest,
  validateCall,
  isSkillMessage,
  listSkills,
  getSkillInfo,
};
