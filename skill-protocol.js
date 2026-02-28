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

  // ─── EQ Engine Skills (Cluster 1) ────────────────────────────

  'emotion-scan': {
    skill: 'emotion-scan',
    version: '1.0.0',
    channel: '5fan-skill-emotion-scan',
    title: 'Emotion Scan',
    emoji: '🎭',
    encodes: 'Emotion detection from a 40-emotion vocabulary across 10 families.',
    domain: 'Match free text to emotions — returns Hi Scale placement, family, valence, arousal.',
    accepts: {
      text: { type: 'string', required: true, description: 'Free text to scan for emotional content.' },
    },
    returns: {
      matches: 'object[] — matched emotions with hiScale, family, valence',
      families: 'object[] — unique emotion families hit',
      hiScale: 'number — average Hi Scale (1-5)',
      dominantCategory: 'hi | neutral | opportunity',
    },
    chainsWith: ['emotion-family', 'desire-bridge', 'reframe', 'micro-move', 'emotion-blend'],
  },

  'emotion-family': {
    skill: 'emotion-family',
    version: '1.0.0',
    channel: '5fan-skill-emotion-family',
    title: 'Emotion Family',
    emoji: '👪',
    encodes: 'Emotion family lookup — 10 families grouping 40 emotions.',
    domain: 'Family metadata, member emotions, Hi Scale ranges, desire directions.',
    accepts: {
      familyId: { type: 'string', required: false, description: 'Direct family ID lookup.' },
      text: { type: 'string', required: false, description: 'Free text to match against family aliases.' },
    },
    returns: {
      family: 'object — family metadata with hiScaleRange, valence, desireDirection',
      emotions: 'object[] — member emotions with hiScale',
    },
    chainsWith: ['emotion-scan', 'desire-bridge', 'reframe'],
  },

  'desire-bridge': {
    skill: 'desire-bridge',
    version: '1.0.0',
    channel: '5fan-skill-desire-bridge',
    title: 'Desire Bridge',
    emoji: '🌉',
    encodes: 'Desire cards — the relieving state for each emotion family.',
    domain: 'Emotional navigation: where to move on the Hi Scale.',
    accepts: {
      familyId: { type: 'string', required: false, description: 'Emotion family ID. Omit for overview.' },
    },
    returns: {
      desires: 'object[] — desire cards with targetFamily, description, bridgePrompt',
      desireCount: 'number',
    },
    chainsWith: ['emotion-scan', 'emotion-family', 'reframe', 'micro-move'],
  },

  'micro-move': {
    skill: 'micro-move',
    version: '1.0.0',
    channel: '5fan-skill-micro-move',
    title: 'Micro Move',
    emoji: '🏃',
    encodes: 'Small actionable emotional exercises (30s-5min) per family.',
    domain: 'Embodied practices, breathing, journaling, grounding.',
    accepts: {
      familyId: { type: 'string', required: false, description: 'Emotion family ID. Omit for overview.' },
      type: { type: 'string', required: false, description: 'Filter: body, breath, mind, write.' },
    },
    returns: {
      moves: 'object[] — exercises with steps, duration, type, journalPrompt',
      moveCount: 'number',
    },
    chainsWith: ['emotion-scan', 'emotion-family', 'desire-bridge'],
  },

  'reframe': {
    skill: 'reframe',
    version: '1.0.0',
    channel: '5fan-skill-reframe',
    title: 'Reframe',
    emoji: '🔄',
    encodes: 'Bridge thoughts — reframing sentences for Hi Scale movement.',
    domain: 'Cognitive reframing, perspective shifts, emotional bridging.',
    accepts: {
      familyId: { type: 'string', required: false, description: 'Emotion family ID. Omit for overview.' },
      tone: { type: 'string', required: false, description: 'Filter: gentle, direct, reflective.' },
    },
    returns: {
      bridges: 'object[] — bridge thoughts with text, tone, forDesire',
      bridgeCount: 'number',
    },
    chainsWith: ['emotion-scan', 'emotion-family', 'desire-bridge'],
  },

  'alias-match': {
    skill: 'alias-match',
    version: '1.0.0',
    channel: '5fan-skill-alias-match',
    title: 'Alias Match',
    emoji: '🔍',
    encodes: 'Fuzzy-match text to emotion families via 130+ aliases.',
    domain: 'Keyword matching, vocabulary resolution, text-to-family.',
    accepts: {
      text: { type: 'string', required: true, description: 'Free text to match (min 2 chars).' },
    },
    returns: {
      matches: 'object[] — ranked family matches with score and matchType',
      topMatch: 'object|null — highest-scoring match',
    },
    chainsWith: ['emotion-scan', 'emotion-family'],
  },

  'emotion-blend': {
    skill: 'emotion-blend',
    version: '1.0.0',
    channel: '5fan-skill-emotion-blend',
    title: 'Emotion Blend',
    emoji: '🎨',
    encodes: 'Multi-family co-occurrence — blends, conflicts, transitions.',
    domain: 'Emotional complexity: mixed feelings, opposing states, resonance.',
    accepts: {
      text: { type: 'string', required: true, description: 'Free text to analyze for emotional blends.' },
    },
    returns: {
      blendType: 'single | transition | conflict | resonance | none',
      signature: 'string — blend signature for tracking',
      hiScale: 'number — weighted average (1-5)',
      families: 'object[] — active families with scores',
    },
    chainsWith: ['emotion-scan', 'emotion-family', 'emotion-timeline'],
  },

  'emotion-timeline': {
    skill: 'emotion-timeline',
    version: '1.0.0',
    channel: '5fan-skill-emotion-timeline',
    title: 'Emotion Timeline',
    emoji: '📈',
    encodes: 'Longitudinal emotional trend analysis from timestamped snapshots.',
    domain: 'Trajectories, inflection points, stability, week-over-week delta.',
    accepts: {
      snapshots: { type: 'object[]', required: true, description: 'Array of { ts, hiScale, familyId }. Min 2.' },
    },
    returns: {
      trajectory: 'rising | falling | stable | insufficient',
      stability: 'number 0-100',
      inflections: 'object[] — significant shift points',
      weekOverWeek: 'number|null — Hi Scale delta',
    },
    chainsWith: ['emotion-scan', 'emotion-blend'],
  },

  'crisis-detect': {
    skill: 'crisis-detect',
    version: '1.0.0',
    channel: '5fan-skill-crisis-detect',
    title: 'Crisis Detect',
    emoji: '🚨',
    free: true,
    encodes: 'Expanded crisis detection with structured risk levels.',
    domain: 'Mental health safety: suicidal ideation, self-harm, distress.',
    accepts: {
      text: { type: 'string', required: true, description: 'Text to scan for crisis indicators.' },
    },
    returns: {
      riskLevel: 'critical | elevated | low | none',
      isCrisis: 'boolean',
      resources: 'object|null — crisis hotlines and support services',
      guidance: 'string — guidance for the calling app',
    },
    chainsWith: ['hear'],
    note: 'Always FREE. Safety is not a premium feature.',
  },

  // ── Phase 2: Compass Skills ─────────────────────────────────────

  'compass-locate': {
    skill: 'compass-locate',
    version: '1.0.0',
    channel: '5fan-skill-compass-locate',
    title: 'Compass Locate',
    emoji: '📍',
    encodes: 'LOCATE gate — resolves text/emotionId into emotion + family + Hear scan.',
    domain: 'Emotional navigation: identify current position on the Hi Scale.',
    accepts: {
      text: { type: 'string', required: false, description: 'Free text describing the emotional state.' },
      emotionId: { type: 'string', required: false, description: 'Direct emotion ID lookup.' },
    },
    returns: {
      emotion: 'object — resolved emotion with hiScale, valence, arousal',
      family: 'object — family metadata',
      matchType: 'string — how the emotion was resolved',
      hearScan: 'object — Hear brain emotional signal analysis',
    },
    chainsWith: ['compass-interpret', 'compass-point', 'compass-practice', 'emotion-scan'],
  },

  'compass-interpret': {
    skill: 'compass-interpret',
    version: '1.0.0',
    channel: '5fan-skill-compass-interpret',
    title: 'Compass Interpret',
    emoji: '🧭',
    encodes: 'INTERPRET gate — bridge thought (reframing sentence) + Inspyre scan.',
    domain: 'Cognitive reframing: the thought that enables emotional movement.',
    accepts: {
      familyId: { type: 'string', required: true, description: 'Emotion family ID.' },
      context: { type: 'object', required: false, description: 'Optional context with user text.' },
      tone: { type: 'string', required: false, description: 'Preferred tone: gentle, direct, or reflective.' },
    },
    returns: {
      bridge: 'object — bridge thought with text, tone, forDesire',
      inspyreScan: 'object — Inspyre brain growth/motivation analysis',
      method: 'llm | template',
    },
    chainsWith: ['compass-locate', 'compass-point', 'compass-practice'],
  },

  'compass-point': {
    skill: 'compass-point',
    version: '1.0.0',
    channel: '5fan-skill-compass-point',
    title: 'Compass Point',
    emoji: '🎯',
    encodes: 'POINT gate — desire cards showing where to move on the Hi Scale.',
    domain: 'Emotional navigation: the equal-and-opposite destination.',
    accepts: {
      familyId: { type: 'string', required: false, description: 'Emotion family ID. Omit for overview.' },
    },
    returns: {
      desires: 'object[] — desire cards with targetFamily, description, bridgePrompt',
      direction: 'string — target family direction',
      desireCount: 'number',
    },
    chainsWith: ['compass-locate', 'compass-interpret', 'compass-practice'],
  },

  'compass-practice': {
    skill: 'compass-practice',
    version: '1.0.0',
    channel: '5fan-skill-compass-practice',
    title: 'Compass Practice',
    emoji: '🧘',
    encodes: 'PRACTICE gate — micro-move exercise + bridge thought + Flow scan.',
    domain: 'Embodied practice: actionable exercises for emotional state shift.',
    accepts: {
      familyId: { type: 'string', required: true, description: 'Emotion family ID.' },
      desireId: { type: 'string', required: false, description: 'Target desire ID for move selection.' },
      type: { type: 'string', required: false, description: 'Move type filter: body, breath, mind, social.' },
    },
    returns: {
      move: 'object — micro-move with instruction, duration, journalPrompt',
      bridge: 'object — supporting bridge thought',
      flowScan: 'object — Flow brain momentum analysis',
      method: 'llm | template',
    },
    chainsWith: ['compass-locate', 'compass-interpret', 'compass-point'],
  },

  'shift-navigator': {
    skill: 'shift-navigator',
    version: '1.0.0',
    channel: '5fan-skill-shift-navigator',
    title: 'Shift Navigator',
    emoji: '🗺️',
    encodes: 'Full 4-gate Compass journey: LOCATE → INTERPRET → POINT → PRACTICE.',
    domain: 'Complete emotional navigation in one call.',
    accepts: {
      text: { type: 'string', required: false, description: 'Free text describing the emotional state.' },
      emotionId: { type: 'string', required: false, description: 'Direct emotion ID for LOCATE gate.' },
      context: { type: 'object', required: false, description: 'Optional metadata.' },
    },
    returns: {
      journey: 'object — emotion, family, hiScale, direction',
      locate: 'object — LOCATE gate result',
      interpret: 'object — INTERPRET gate result with bridge thought',
      point: 'object — POINT gate result with desire cards',
      practice: 'object — PRACTICE gate result with micro-move',
    },
    chainsWith: ['emotion-scan', 'feed-reply'],
  },

  // ── Phase 2: Community Skills ───────────────────────────────────

  'feed-reply': {
    skill: 'feed-reply',
    version: '1.0.0',
    channel: '5fan-skill-feed-reply',
    title: 'Feed Reply',
    emoji: '💬',
    encodes: 'Community feed reply — direct, personal, mirror-language response.',
    domain: 'Feed interaction: brain-enriched reply to user shares.',
    accepts: {
      text: { type: 'string', required: true, description: 'User\'s share/post text.' },
      origin: { type: 'string', required: false, description: 'Where the share came from.' },
      tier: { type: 'number', required: false, description: 'User tier level.' },
      stats: { type: 'object', required: false, description: 'User stats context.' },
    },
    returns: {
      response: 'string — the reply text',
      brain: 'string — dominant brain attribution',
      method: 'llm | template',
      brainTags: 'object[] — per-brain signal breakdown',
    },
    chainsWith: ['emotion-scan', 'content-elevate'],
  },

  'proactive-post': {
    skill: 'proactive-post',
    version: '1.0.0',
    channel: '5fan-skill-proactive-post',
    title: 'Proactive Post',
    emoji: '📢',
    encodes: 'Scheduled community post (morning/afternoon/evening).',
    domain: 'Proactive engagement: time-of-day-aware content generation.',
    accepts: {
      type: { type: 'string', required: true, description: 'Post type: morning, afternoon, or evening.' },
      communityStats: { type: 'object', required: false, description: 'Community stats for context.' },
      recentTopics: { type: 'string', required: false, description: 'Recent community topics to avoid.' },
    },
    returns: {
      text: 'string — the post content',
      slot: 'string — the time slot',
      method: 'llm | template',
    },
    chainsWith: ['community-pulse'],
  },

  'community-pulse': {
    skill: 'community-pulse',
    version: '1.0.0',
    channel: '5fan-skill-community-pulse',
    title: 'Community Pulse',
    emoji: '📊',
    encodes: 'Community-level emotional summary with Hi Index.',
    domain: 'Aggregate analytics: trends, mood, engagement metrics.',
    accepts: {
      stats: { type: 'object', required: true, description: 'Community stats: activeUsers, totalShares, avgHiScale, topFamilies.' },
      previous: { type: 'object', required: false, description: 'Previous period stats for delta computation.' },
    },
    returns: {
      hiIndex: 'number — 0-100 Community Hi Index',
      mood: 'string — Thriving/Growing/Steady/Processing/Seeking',
      summary: 'string — human-readable pulse summary',
      deltas: 'object|null — changes from previous period',
    },
    chainsWith: ['proactive-post'],
  },

  // ── Phase 2: AI Coach Skills ────────────────────────────────────

  'tone-match': {
    skill: 'tone-match',
    version: '1.0.0',
    channel: '5fan-skill-tone-match',
    title: 'Tone Match',
    emoji: '🎵',
    encodes: 'Detect + rewrite text to match a target tone.',
    domain: 'Tone analysis and adaptation: gentle, direct, reflective, celebratory.',
    accepts: {
      text: { type: 'string', required: true, description: 'Text to analyze or rewrite.' },
      targetTone: { type: 'string', required: false, description: 'Target tone: gentle, direct, reflective, celebratory.' },
      detectOnly: { type: 'boolean', required: false, description: 'If true, only detect tone without rewriting.' },
    },
    returns: {
      detectedTone: 'string — detected dominant tone',
      rewritten: 'string — text rewritten in target tone (if requested)',
      method: 'llm | template | already-matched',
      confidence: 'number — detection confidence (0-1)',
    },
    chainsWith: ['feed-reply', 'content-elevate'],
  },

  'content-elevate': {
    skill: 'content-elevate',
    version: '1.0.0',
    channel: '5fan-skill-content-elevate',
    title: 'Content Elevate',
    emoji: '✍️',
    encodes: 'Transforms raw text into elevated poetic prose for public sharing.',
    domain: 'Content transformation: the "Dear friend..." Hi-Note voice.',
    accepts: {
      text: { type: 'string', required: true, description: 'Raw text to elevate.' },
      familyId: { type: 'string', required: false, description: 'Emotion family for tone matching.' },
      tone: { type: 'string', required: false, description: 'Tone preference.' },
      format: { type: 'string', required: false, description: 'Output format preference.' },
    },
    returns: {
      elevated: 'string — elevated poetic prose text',
      original: 'string — the original input text',
      method: 'llm | template',
      emotionalCore: 'object — detected emotional territory',
    },
    chainsWith: ['emotion-scan', 'hi-note-compose', 'social-caption'],
  },

  // ── Phase 2: Hi-Note Skills ─────────────────────────────────────

  'hi-note-compose': {
    skill: 'hi-note-compose',
    version: '1.0.0',
    channel: '5fan-skill-hi-note-compose',
    title: 'Hi-Note Compose',
    emoji: '🎨',
    encodes: 'Full Hi-Note assembly — elevated text + pose + doodles + palette.',
    domain: 'Branded moment creation: shareable emotional graphics.',
    accepts: {
      text: { type: 'string', required: true, description: 'User\'s share text.' },
      replyText: { type: 'string', required: false, description: 'Hi5FAN reply to elevate instead.' },
      userName: { type: 'string', required: false, description: 'User display name for attribution.' },
      origin: { type: 'string', required: false, description: 'Share origin context.' },
    },
    returns: {
      note: 'object — complete Hi-Note payload (elevated, pose, doodles, palette, titleBubble, footer)',
      emotionScan: 'object — detected emotions and families',
      emotionalCore: 'object — content elevation analysis',
    },
    chainsWith: ['emotion-scan', 'content-elevate', 'social-caption'],
  },

  'social-caption': {
    skill: 'social-caption',
    version: '1.0.0',
    channel: '5fan-skill-social-caption',
    title: 'Social Caption',
    emoji: '📱',
    encodes: 'Platform-optimized captions for sharing on IG/X/TikTok/Stories.',
    domain: 'Social media: captions, hashtags, CTAs for emotional content.',
    accepts: {
      text: { type: 'string', required: true, description: 'Content text to caption.' },
      platform: { type: 'string', required: false, description: 'Target: instagram, x, tiktok, stories, general.' },
      userName: { type: 'string', required: false, description: 'User name for personalization.' },
      hashtags: { type: 'boolean', required: false, description: 'Include hashtags (default: true).' },
    },
    returns: {
      caption: 'string — the platform-optimized caption',
      platform: 'string — normalized platform name',
      hashtags: 'string[] — selected hashtags',
      method: 'llm | template',
    },
    chainsWith: ['content-elevate', 'hi-note-compose'],
  },

  // ── Phase 3: AI Coach Skills (Advanced) ─────────────────────────

  'gym-facilitator': {
    skill: 'gym-facilitator',
    version: '1.0.0',
    channel: '5fan-skill-gym-facilitator',
    title: 'Gym Facilitator',
    emoji: '🏋️',
    encodes: 'Facilitates the 8-step Hi Gym session conversationally.',
    domain: 'Guided emotional processing: state-machine gym facilitation with brain analysis.',
    accepts: {
      text: { type: 'string', required: false, description: 'User response to current gym step.' },
      gymStep: { type: 'number', required: false, description: 'Current step (0=start, 1-8).' },
      sessionHistory: { type: 'array', required: false, description: 'Prior user messages in this session.' },
    },
    returns: {
      gymStep: 'number — current/next step',
      stepTitle: 'string — title of current step',
      prompt: 'string — facilitation prompt',
      sessionComplete: 'boolean — true when step 8 is done',
      brainScan: 'object — per-step emotional analysis',
    },
    chainsWith: ['session-summary', 'memory-context'],
  },

  'coach-chat': {
    skill: 'coach-chat',
    version: '1.0.0',
    channel: '5fan-skill-coach-chat',
    title: 'Coach Chat',
    emoji: '💬',
    encodes: 'Open-mode conversational AI coach — mirrors, not hands.',
    domain: 'Intent detection, brain-enriched emotional conversation, template fallback.',
    accepts: {
      text: { type: 'string', required: true, description: 'User message.' },
      conversationHistory: { type: 'array', required: false, description: 'Prior messages [{role,content}].' },
      userStats: { type: 'object', required: false, description: 'User stats for context.' },
    },
    returns: {
      reply: 'string — coach response',
      detectedIntent: 'string — meta/gym/share/shift/stats/open',
      brainScan: 'object — full 5-brain analysis',
      suggestions: 'string[] — contextual next actions',
    },
    chainsWith: ['gym-facilitator', 'session-summary'],
  },

  'nudge-engine': {
    skill: 'nudge-engine',
    version: '1.0.0',
    channel: '5fan-skill-nudge-engine',
    title: 'Nudge Engine',
    emoji: '🔔',
    encodes: 'Proactive nudge generation — one nudge per visit, brain-attributed.',
    domain: 'Pattern detection, priority cascade, per-user dedup, Hi-speak nudges.',
    accepts: {
      stats: { type: 'object', required: true, description: 'User stats: streak, hiIndex, today, lastGymAt, etc.' },
      address: { type: 'string', required: false, description: 'User address for dedup.' },
    },
    returns: {
      nudge: 'object|null — { type, text, brain, brainLabel, priority }',
      method: 'llm | template | deduped | none',
      candidateCount: 'number — patterns evaluated',
    },
    chainsWith: ['milestone-detect'],
  },

  'milestone-detect': {
    skill: 'milestone-detect',
    version: '1.0.0',
    channel: '5fan-skill-milestone-detect',
    title: 'Milestone Detector',
    emoji: '🏆',
    encodes: 'Detects + celebrates user milestones for public Hi Island posts.',
    domain: 'Streak/balance/tier/claim thresholds, LLM celebrations, 24hr dedup.',
    accepts: {
      op: { type: 'string', required: true, description: 'Operation: checkin, gym, share, claim_hi5, redeem_access_code.' },
      stats: { type: 'object', required: true, description: 'User stats: username, currentStreak, balance, tier.' },
      txResult: { type: 'object', required: false, description: 'Transaction result: points, tier, previousTier.' },
    },
    returns: {
      celebrations: 'object[] — array of { type, text, milestone }',
      celebrationCount: 'number',
      method: 'llm | template | none',
    },
    chainsWith: ['nudge-engine'],
  },

  'memory-context': {
    skill: 'memory-context',
    version: '1.0.0',
    channel: '5fan-skill-memory-context',
    title: 'Memory Context',
    emoji: '🧠',
    encodes: 'Conversation memory management — load, save, delete, gym summaries.',
    domain: 'Persistent store: 7-day TTL, 20 message cap, gym session tracking.',
    accepts: {
      op: { type: 'string', required: true, description: 'load | save | delete | loadGym | saveGym | stats.' },
      address: { type: 'string', required: false, description: 'User address.' },
      conversation: { type: 'object', required: false, description: 'Conversation state (for save).' },
      gymSummary: { type: 'object', required: false, description: 'Gym summary (for saveGym).' },
    },
    returns: {
      data: 'object|null — loaded conversation or gym summaries',
      saved: 'boolean — true on successful save/delete',
      stats: 'object — memory store statistics',
    },
    chainsWith: ['coach-chat', 'gym-facilitator'],
  },

  'journal-prompt': {
    skill: 'journal-prompt',
    version: '1.0.0',
    channel: '5fan-skill-journal-prompt',
    title: 'Journal Prompt',
    emoji: '📝',
    encodes: 'Emotion-aware journaling prompts from micro-moves + bridges.',
    domain: 'Reflective writing: family-targeted, brain-personalized prompts.',
    accepts: {
      text: { type: 'string', required: false, description: 'User\'s current emotional expression.' },
      familyId: { type: 'string', required: false, description: 'Emotion family for targeted prompts.' },
      emotionId: { type: 'string', required: false, description: 'Specific emotion ID.' },
      count: { type: 'number', required: false, description: 'Number of prompts (default: 3, max: 5).' },
    },
    returns: {
      prompts: 'string[] — generated journaling prompts',
      familyId: 'string — resolved emotion family',
      method: 'llm | template',
    },
    chainsWith: ['emotion-scan', 'compass-locate'],
  },

  'session-summary': {
    skill: 'session-summary',
    version: '1.0.0',
    channel: '5fan-skill-session-summary',
    title: 'Session Summary',
    emoji: '📋',
    encodes: 'Structured summary from conversation or gym session.',
    domain: 'Emotional arc tracking, theme extraction, LLM synthesis.',
    accepts: {
      messages: { type: 'array', required: true, description: 'Conversation messages [{role,content}].' },
      sessionType: { type: 'string', required: false, description: 'chat | gym | shift (default: chat).' },
      userStats: { type: 'object', required: false, description: 'Optional user context.' },
    },
    returns: {
      summary: 'string — session summary text',
      emotionalArc: 'object — start/end emotions, shift direction',
      themes: 'string[] — extracted themes',
    },
    chainsWith: ['coach-chat', 'gym-facilitator'],
  },

  'wellness-score': {
    skill: 'wellness-score',
    version: '1.0.0',
    channel: '5fan-skill-wellness-score',
    title: 'Wellness Score',
    emoji: '❤️',
    encodes: 'Composite 0-100 wellness score with dimension breakdown.',
    domain: 'Holistic assessment: consistency, emotional, engagement, growth, community.',
    accepts: {
      stats: { type: 'object', required: true, description: 'User stats: streak, hiIndex, totalCheckins, gymSessions, etc.' },
    },
    returns: {
      score: 'number — composite wellness score (0-100)',
      grade: 'string — letter grade (A+ to F)',
      dimensions: 'object — per-dimension scores and weights',
      insights: 'string[] — actionable improvement tips',
    },
    chainsWith: ['nudge-engine'],
  },

  // ── Phase 3: Internal Skills (LOCKED — local peers only) ────────

  'earn-calculator': {
    skill: 'earn-calculator',
    version: '1.0.0',
    channel: '5fan-skill-earn-calculator',
    title: 'Earn Calculator',
    emoji: '🧮',
    encodes: 'Pre-computes point earnings with all multipliers applied.',
    domain: 'Internal: tier, streak, diminishing returns, quality scoring.',
    internal: true,
    accepts: {
      action: { type: 'string', required: true, description: 'Action type: checkin, share, reaction, etc.' },
      tier: { type: 'string', required: false, description: 'User tier.' },
      streak: { type: 'number', required: false, description: 'Current streak days.' },
      todayActionCount: { type: 'number', required: false, description: 'Actions of this type today.' },
    },
    returns: {
      finalPoints: 'number — final computed points',
      breakdown: 'string — human-readable calculation',
    },
  },

  'tier-gate': {
    skill: 'tier-gate',
    version: '1.0.0',
    channel: '5fan-skill-tier-gate',
    title: 'Tier Gate',
    emoji: '🚪',
    encodes: 'Checks whether a user tier grants access to a feature.',
    domain: 'Internal: access control, upgrade messaging.',
    internal: true,
    accepts: {
      tier: { type: 'string', required: true, description: 'User\'s current tier.' },
      feature: { type: 'string', required: true, description: 'Feature to check access for.' },
    },
    returns: {
      allowed: 'boolean — access granted',
      requiredTier: 'string — minimum tier needed',
      message: 'string — upgrade message if denied',
    },
  },

  'hi5-claim-check': {
    skill: 'hi5-claim-check',
    version: '1.0.0',
    channel: '5fan-skill-hi5-claim-check',
    title: 'Hi5 Claim Check',
    emoji: '💰',
    encodes: 'Pre-validates $Hi5 claim eligibility.',
    domain: 'Internal: min points, cooldown, streak bonus calculation.',
    internal: true,
    accepts: {
      balance: { type: 'number', required: true, description: 'Current point balance.' },
      lastClaimAt: { type: 'number', required: false, description: 'Timestamp of last claim.' },
      streak: { type: 'number', required: false, description: 'Current streak days.' },
    },
    returns: {
      eligible: 'boolean — can claim now',
      claimableHi5: 'number — total $Hi5 claimable',
      streakBonusHi5: 'number — bonus from streak',
    },
  },

  'quality-score': {
    skill: 'quality-score',
    version: '1.0.0',
    channel: '5fan-skill-quality-score',
    title: 'Quality Score',
    emoji: '⭐',
    encodes: 'Computes content quality score (0.1-1.0) for earn multiplier.',
    domain: 'Internal: text length, uniqueness, diversity, social proof.',
    internal: true,
    accepts: {
      text: { type: 'string', required: true, description: 'Content to score.' },
      previousTexts: { type: 'array', required: false, description: 'Recent texts for uniqueness check.' },
      wavesReceived: { type: 'number', required: false, description: 'Social proof count.' },
    },
    returns: {
      score: 'number — quality score (0.1-1.0)',
      grade: 'string — excellent/good/fair/low/minimal',
      breakdown: 'object — per-dimension scores',
    },
  },

  'anti-bot': {
    skill: 'anti-bot',
    version: '1.0.0',
    channel: '5fan-skill-anti-bot',
    title: 'Anti-Bot',
    emoji: '🛡️',
    encodes: 'Behavioral bot detection heuristics.',
    domain: 'Internal: velocity, timing regularity, content repetition.',
    internal: true,
    accepts: {
      timestamps: { type: 'array', required: false, description: 'Recent action timestamps.' },
      texts: { type: 'array', required: false, description: 'Recent submitted texts.' },
      actionTypes: { type: 'array', required: false, description: 'Recent action types.' },
    },
    returns: {
      suspicionScore: 'number — 0-1 bot likelihood',
      isLikelyBot: 'boolean — above threshold',
      flags: 'string[] — triggered detection flags',
    },
  },

  'vault-query': {
    skill: 'vault-query',
    version: '1.0.0',
    channel: '5fan-skill-vault-query',
    title: 'Vault Query',
    emoji: '🔐',
    encodes: 'Queries user profile from contract vault.',
    domain: 'Internal: user data access, computed fields, profile enrichment.',
    internal: true,
    accepts: {
      address: { type: 'string', required: true, description: 'User public key.' },
      fields: { type: 'array', required: false, description: 'Specific fields to return.' },
    },
    returns: {
      profile: 'object — user profile with computed fields',
      _vaultEnriched: 'boolean — true if live vault data',
    },
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
    // Data skills may accept non-text inputs (familyId, snapshots, etc.)
    // Only require input.text for skills where text is the sole required field
    const skillDef = SKILL_REGISTRY[msg.skill];
    const hasNonTextAccepts = skillDef.accepts && Object.keys(skillDef.accepts).some(k => k !== 'text' && k !== 'context');
    if (!hasNonTextAccepts) {
      if (!msg.input?.text || typeof msg.input.text !== 'string') {
        return { valid: false, error: 'input.text (string) is required.' };
      }
      if (msg.input.text.trim().length === 0) {
        return { valid: false, error: 'input.text cannot be empty.' };
      }
    } else {
      // For data skills, just require input to be an object
      if (!msg.input || typeof msg.input !== 'object') {
        return { valid: false, error: 'input (object) is required.' };
      }
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
