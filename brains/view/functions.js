/**
 * View — Brain Functions
 * Perspective scanning, reframing, and CONSENSUS CURATION across all brains.
 */

import { signalStrength, pick, COOLDOWN_MS } from '../5fan.js';
import roleConfig from './roleConfig.js';

let lastResponseTime = 0;

/**
 * Scan text for perspective/reframe/wisdom signals.
 * @param {string} text
 * @param {object} [meta]
 * @returns {{ brain: string, signal: number, angles: string[], category: string, summary: string }}
 */
export function scan(text, meta = {}) {
  const lower = text.toLowerCase();
  const angles = [];
  let category = 'neutral';

  const perspectiveWords = [
    'perspective', 'point of view', 'big picture', 'bigger picture',
    'step back', 'zoom out', 'look at it', 'see it differently',
    'another way', 'other side', 'flip side', 'reframe', 'rethink',
    'confused', 'confusion', 'unclear', 'can\'t see', 'don\'t know',
    'unsure', 'uncertain', 'help me see', 'what should i',
    'make sense of', 'understand', 'figure out',
  ];

  const temporalWords = [
    'years from now', 'looking back', 'in the future', 'long run',
    'short term', 'temporary', 'permanent', 'forever', 'someday',
    'eventually', 'one day', 'down the road', 'hindsight',
  ];

  const decisionWords = [
    'decision', 'decide', 'choose', 'choice', 'crossroads',
    'fork', 'path', 'direction', 'option', 'weigh', 'consider',
    'evaluate', 'assess', 'advice', 'wise', 'wisdom',
  ];

  const synthesisWords = [
    'overall', 'summary', 'sum up', 'bottom line', 'in short',
    'what do you all think', 'consensus', 'together', 'all of you',
  ];

  let perspScore = 0, tempScore = 0, decisionScore = 0, synthScore = 0;

  for (const w of perspectiveWords) {
    if (lower.includes(w)) { perspScore++; angles.push(w); }
  }
  for (const w of temporalWords) {
    if (lower.includes(w)) { tempScore++; angles.push(w); }
  }
  for (const w of decisionWords) {
    if (lower.includes(w)) { decisionScore++; angles.push(w); }
  }
  for (const w of synthesisWords) {
    if (lower.includes(w)) { synthScore++; angles.push(w); }
  }

  const max = Math.max(perspScore, tempScore, decisionScore, synthScore);
  if (max > 0) {
    if (synthScore === max) category = 'synthesis';
    else if (perspScore === max) category = 'perspective';
    else if (tempScore === max) category = 'temporal';
    else category = 'decision';
  }

  const signal = signalStrength(text, roleConfig.triggers);

  return {
    brain: 'view',
    signal,
    angles: [...new Set(angles)],
    category,
    summary: angles.length > 0
      ? `Perspective/synthesis signals: ${category} — ${angles.slice(0, 5).join(', ')}`
      : 'No strong perspective or synthesis signals detected.',
  };
}

/**
 * Curate consensus from all brain scan results.
 * This is View's unique function — it synthesizes the outputs of Hear, Inspyre, Flow, You, and itself.
 *
 * @param {object[]} scanResults - array of scan results from all brains
 * @param {string} originalText - the original user message
 * @returns {{ consensus: string, dominantBrain: string, allSignals: object, synthesisPrompt: string }}
 */
export function curateConsensus(scanResults, originalText) {
  if (!scanResults || scanResults.length === 0) {
    return {
      consensus: 'No brain signals to synthesize.',
      dominantBrain: 'view',
      allSignals: {},
      synthesisPrompt: '',
    };
  }

  // Find the dominant brain (highest signal)
  let dominant = scanResults[0];
  const allSignals = {};
  const summaries = [];

  for (const result of scanResults) {
    allSignals[result.brain] = result.signal;
    if (result.signal > (dominant?.signal || 0)) {
      dominant = result;
    }
    if (result.summary && result.signal > 0) {
      summaries.push(`[${result.brain.toUpperCase()}] ${result.summary}`);
    }
  }

  // Build synthesis narrative
  const activeBrains = scanResults.filter(r => r.signal > 0.1);
  let consensus;

  if (activeBrains.length === 0) {
    consensus = 'Low signal across all brains. General support mode.';
  } else if (activeBrains.length === 1) {
    consensus = `Strong ${dominant.brain} signal. ${dominant.summary}`;
  } else {
    const brainNames = activeBrains.map(b => b.brain).join(', ');
    consensus = `Multiple brain activation (${brainNames}). ${dominant.brain} leads. ${summaries.join(' | ')}`;
  }

  // Build a synthesis prompt that can be injected into LLM system prompt
  const synthesisPrompt = buildSynthesisPrompt(scanResults, originalText, dominant);

  return {
    consensus,
    dominantBrain: dominant.brain,
    allSignals,
    synthesisPrompt,
    activeBrainCount: activeBrains.length,
    summaries,
  };
}

/**
 * Build a synthesis system prompt for LLM enrichment.
 * @param {object[]} scanResults
 * @param {string} originalText
 * @param {object} dominant
 * @returns {string}
 */
function buildSynthesisPrompt(scanResults, originalText, dominant) {
  const lines = [
    'BRAIN ANALYSIS (5FAN consensus):',
  ];

  for (const result of scanResults) {
    if (result.signal > 0) {
      lines.push(`- ${result.brain.toUpperCase()} (signal: ${result.signal.toFixed(2)}): ${result.summary}`);
    }
  }

  lines.push('');
  lines.push(`LEAD BRAIN: ${dominant.brain.toUpperCase()}`);
  lines.push(`Respond primarily from the ${dominant.brain} perspective, but weave in other active brain insights.`);
  lines.push('Mirror the user\'s language. Do not prescribe. Do not lecture.');

  return lines.join('\n');
}

/**
 * Generate a template-based response.
 */
export function fulfill(text, scanResult) {
  const templates = roleConfig.templates;
  switch (scanResult.category) {
    case 'perspective': return pick(templates.perspective);
    case 'temporal': return pick(templates.temporal);
    case 'synthesis': return pick(templates.synthesis) + ' ' + pick(templates.perspective);
    default: return pick(templates.general);
  }
}

export function log(event, data) {
  console.log(`[view] ${event}:`, JSON.stringify(data).slice(0, 200));
}

export function sendTo(targetBrain, text, meta = {}) {
  return { target: targetBrain, text, meta: { ...meta, from: 'view' } };
}

export function startIdle(silenceMs) {
  if (silenceMs > 300_000) {
    return pick([
      'Sometimes the best perspective comes after stepping away. Take your time.',
      'The view is always clearer from a distance. We\'ll be here.',
      'Silence has its own wisdom. Come back when you\'re ready.',
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
