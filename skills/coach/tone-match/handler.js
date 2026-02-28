/**
 * 5FAN AI Coach — tone-match
 *
 * Detects the current tone of a text and optionally rewrites it
 * to match a target tone. Uses Hear brain for tone detection +
 * bridge-library tone vocabulary + LLM for rewriting.
 *
 * Brain-enhanced skill — uses Hear brain + LLM.
 *
 * @param {object} input - { text: string, targetTone?: string, detectOnly?: boolean }
 * @returns {Promise<object>} - { ok, detectedTone, rewritten?, method }
 */

import { scan as hearScan } from '../../../brains/hear/functions.js';
import { BRIDGE_LIBRARY } from '../../eq-engine/data/bridge-library.js';
import { generate } from '../../../server/lm-bridge.js';

/** Valid tones — derived from bridge-library tone tags + community needs */
const VALID_TONES = ['gentle', 'direct', 'reflective', 'celebratory'];

/** Keywords for detecting tones from text */
const TONE_SIGNALS = {
  gentle: [
    'it\'s okay', 'take your time', 'no rush', 'permission', 'allowed',
    'safe', 'slowly', 'kindly', 'softly', 'gently', 'whenever you\'re ready',
    'be easy', 'breathe', 'you\'re not alone',
  ],
  direct: [
    'do it', 'now', 'stop', 'start', 'enough', 'commit', 'act',
    'choose', 'decide', 'let\'s go', 'no excuses', 'truth is',
    'real talk', 'show up', 'you got this',
  ],
  reflective: [
    'what if', 'consider', 'notice', 'perhaps', 'wonder', 'imagine',
    'look deeper', 'underneath', 'what does', 'how does', 'think about',
    'reflect', 'journal', 'sit with', 'explore',
  ],
  celebratory: [
    'amazing', 'incredible', 'well done', 'yes', 'proud', 'celebrate',
    'earned', 'achieved', 'congrats', 'wow', 'beautiful', 'keep going',
    'fire', 'crushing it', 'winning', 'level up',
  ],
};

/**
 * Detect the dominant tone of a text.
 */
function detectTone(text) {
  const lower = text.toLowerCase();
  const scores = {};

  for (const [tone, signals] of Object.entries(TONE_SIGNALS)) {
    let score = 0;
    for (const signal of signals) {
      if (lower.includes(signal)) score++;
    }
    scores[tone] = score;
  }

  // Also check bridge-library tone distribution for vocabulary
  for (const bridges of Object.values(BRIDGE_LIBRARY)) {
    for (const bridge of bridges) {
      // Check if any bridge text words appear in the input
      const bridgeWords = bridge.text.toLowerCase().split(/\s+/);
      const inputWords = lower.split(/\s+/);
      const overlap = bridgeWords.filter(w => w.length > 4 && inputWords.includes(w)).length;
      if (overlap > 0 && bridge.tone) {
        scores[bridge.tone] = (scores[bridge.tone] || 0) + overlap * 0.5;
      }
    }
  }

  // Find dominant
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0]?.[1] > 0 ? sorted[0][0] : 'neutral';
  const confidence = sorted[0]?.[1] > 0
    ? Math.min(sorted[0][1] / (sorted.reduce((sum, [, v]) => sum + v, 0) || 1), 1)
    : 0;

  return {
    tone: dominant,
    confidence: Math.round(confidence * 100) / 100,
    scores,
  };
}

/** System prompt for tone rewriting */
const TONE_REWRITE_PROMPT = {
  gentle: [
    'Rewrite the following text in a GENTLE tone.',
    'Make it warm, permissive, and soft. Use "it\'s okay", "whenever you\'re ready".',
    'The reader should feel held, not pushed. 1-2 sentences max.',
  ].join('\n'),
  direct: [
    'Rewrite the following text in a DIRECT tone.',
    'Make it clear, confident, and actionable. No hedging, no "maybe".',
    'The reader should feel motivated to act NOW. 1-2 sentences max.',
  ].join('\n'),
  reflective: [
    'Rewrite the following text in a REFLECTIVE tone.',
    'Make it thoughtful, question-based, and introspective. Use "what if", "notice", "consider".',
    'The reader should feel invited to look deeper. 1-2 sentences max.',
  ].join('\n'),
  celebratory: [
    'Rewrite the following text in a CELEBRATORY tone.',
    'Make it energetic, affirming, and uplifting. Amplify the win.',
    'The reader should feel seen and celebrated. 1-2 sentences max.',
  ].join('\n'),
};

export async function handle(input) {
  const { text, targetTone, detectOnly = false } = input || {};

  if (!text) {
    return { ok: false, error: 'text is required.' };
  }

  // Detect current tone
  const detection = detectTone(text);

  // Run Hear scan for emotional context
  const hear = hearScan(text);

  if (detectOnly || !targetTone) {
    return {
      ok: true,
      detectedTone: detection.tone,
      confidence: detection.confidence,
      scores: detection.scores,
      hearScan: {
        signal: hear.signal,
        category: hear.category,
        emotions: hear.emotions,
      },
    };
  }

  // Validate target tone
  if (!VALID_TONES.includes(targetTone)) {
    return {
      ok: false,
      error: `Invalid targetTone: ${targetTone}. Valid: ${VALID_TONES.join(', ')}`,
      detectedTone: detection.tone,
    };
  }

  // If already in the target tone with high confidence, return as-is
  if (detection.tone === targetTone && detection.confidence > 0.6) {
    return {
      ok: true,
      detectedTone: detection.tone,
      targetTone,
      rewritten: text,
      method: 'already-matched',
      confidence: detection.confidence,
    };
  }

  // Try LLM rewrite
  const systemPrompt = TONE_REWRITE_PROMPT[targetTone];
  const llmResult = await generate(systemPrompt, text, {
    maxTokens: 120,
    temperature: 0.7,
  });

  if (llmResult) {
    // Verify the rewrite shifted tone
    const rewriteDetection = detectTone(llmResult);
    return {
      ok: true,
      detectedTone: detection.tone,
      targetTone,
      rewritten: llmResult,
      method: 'llm',
      rewrittenTone: rewriteDetection.tone,
      confidence: rewriteDetection.confidence,
    };
  }

  // Template fallback: pick a bridge thought in the target tone
  // and blend it with the original message
  let fallbackBridge = null;
  for (const bridges of Object.values(BRIDGE_LIBRARY)) {
    const match = bridges.find(b => b.tone === targetTone);
    if (match) { fallbackBridge = match; break; }
  }

  return {
    ok: true,
    detectedTone: detection.tone,
    targetTone,
    rewritten: fallbackBridge ? fallbackBridge.text : text,
    method: 'template',
    note: fallbackBridge
      ? 'Used a bridge thought in the target tone as fallback.'
      : 'No LLM available and no matching bridge. Returned original text.',
  };
}
