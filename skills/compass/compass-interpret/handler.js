/**
 * 5FAN Compass — compass-interpret
 *
 * INTERPRET gate: selects a bridge thought — a reframing sentence that
 * helps the mind accept movement from the current emotional state toward relief.
 * Template-based with optional LLM personalization. Inspyre brain scan validates.
 *
 * Brain-enhanced skill — uses Inspyre brain + LLM.
 *
 * @param {object} input - { familyId: string, context?: object, tone?: string }
 * @returns {Promise<object>} - { ok, bridge, inspyreScan, method }
 */

import { BRIDGE_LIBRARY } from '../../eq-engine/data/bridge-library.js';
import { FAMILY_MAP } from '../../eq-engine/data/emotion-families.js';
import { scan as inspyreScan } from '../../../brains/inspyre/functions.js';
import { generate } from '../../../server/lm-bridge.js';
import { pick } from '../../../brains/5fan.js';

/** System prompt for LLM bridge personalization */
const BRIDGE_SYSTEM_PROMPT = [
  'You are Hi5FAN\'s Compass — an emotional navigation guide.',
  'Your job: take a bridge thought (reframing sentence) and personalize it.',
  '',
  'RULES:',
  '- Keep the core truth of the bridge intact.',
  '- Make it feel personal, like talking to a friend.',
  '- 1-2 sentences max. Short and impactful.',
  '- Use "you" language, not "one" or "we".',
  '- Never be preachy or therapist-y. Be real.',
  '- Match the requested tone: gentle, direct, or reflective.',
].join('\n');

export async function handle(input) {
  const { familyId, context = {}, tone } = input || {};

  if (!familyId) {
    return {
      ok: false,
      error: 'familyId is required. Available: ' + Object.keys(BRIDGE_LIBRARY).join(', '),
    };
  }

  const bridges = BRIDGE_LIBRARY[familyId];
  if (!bridges || bridges.length === 0) {
    return {
      ok: false,
      error: `No bridges available for family: ${familyId}. Available: ${Object.keys(BRIDGE_LIBRARY).join(', ')}`,
    };
  }

  const family = FAMILY_MAP[familyId];

  // Filter by tone if specified, otherwise pick any
  let candidates = bridges;
  if (tone) {
    const toneFiltered = bridges.filter(b => b.tone === tone);
    if (toneFiltered.length > 0) candidates = toneFiltered;
  }

  // Pick a bridge
  const bridge = pick(candidates);

  // Try LLM personalization
  let personalizedText = bridge.text;
  let method = 'template';

  const contextStr = context.text
    ? `\nUser said: "${context.text}"`
    : '';
  const toneStr = tone ? `\nTone: ${tone}` : `\nTone: ${bridge.tone}`;

  const prompt = [
    `Family: ${family?.label || familyId}`,
    `Bridge thought: "${bridge.text}"`,
    toneStr,
    contextStr,
    '',
    'Personalize this bridge thought. Keep it 1-2 sentences.',
  ].join('\n');

  const llmResult = await generate(BRIDGE_SYSTEM_PROMPT, prompt, {
    maxTokens: 120,
    temperature: 0.7,
  });

  if (llmResult) {
    personalizedText = llmResult;
    method = 'llm';
  }

  // Run Inspyre scan on the bridge text for growth/motivation signals
  const inspyre = inspyreScan(personalizedText);

  return {
    ok: true,
    gate: 'INTERPRET',
    bridge: {
      text: personalizedText,
      original: bridge.text,
      tone: bridge.tone,
      forDesire: bridge.forDesire || null,
    },
    family: family ? {
      id: family.id,
      label: family.label,
      emoji: family.emoji,
      desireDirection: family.desireDirection,
    } : { id: familyId },
    method,
    inspyreScan: {
      signal: inspyre.signal,
      category: inspyre.category,
      themes: inspyre.themes || [],
      summary: inspyre.summary,
    },
  };
}
