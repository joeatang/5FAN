/**
 * 5FAN Compass — compass-practice
 *
 * PRACTICE gate: selects a micro-move exercise, pairs it with a bridge
 * thought, and runs Flow brain scan for momentum/consistency signals.
 * Optional LLM personalization of the instruction.
 *
 * Brain-enhanced skill — uses Flow brain + LLM.
 *
 * @param {object} input - { familyId: string, desireId?: string, type?: string }
 * @returns {Promise<object>} - { ok, move, bridge, flowScan, method }
 */

import { MICRO_MOVES } from '../../eq-engine/data/micro-moves.js';
import { BRIDGE_LIBRARY } from '../../eq-engine/data/bridge-library.js';
import { FAMILY_MAP } from '../../eq-engine/data/emotion-families.js';
import { scan as flowScan } from '../../../brains/flow/functions.js';
import { generate } from '../../../server/lm-bridge.js';
import { pick } from '../../../brains/5fan.js';

/** System prompt for LLM move personalization */
const PRACTICE_SYSTEM_PROMPT = [
  'You are Hi5FAN\'s Compass — guiding a micro-practice.',
  'Take the exercise instruction and make it feel personal and immediate.',
  '',
  'RULES:',
  '- Keep the exercise structure (timing, steps) intact.',
  '- Make the language warmer and more encouraging.',
  '- 2-3 sentences max.',
  '- Speak directly: "Here\'s what you\'re going to do..."',
  '- Never add disclaimers or "if you want to" hedging. Be confident.',
].join('\n');

export async function handle(input) {
  const { familyId, desireId, type } = input || {};

  if (!familyId) {
    return {
      ok: false,
      error: 'familyId is required. Available: ' + Object.keys(MICRO_MOVES).join(', '),
    };
  }

  const moves = MICRO_MOVES[familyId];
  if (!moves || moves.length === 0) {
    return {
      ok: false,
      error: `No micro-moves for family: ${familyId}. Available: ${Object.keys(MICRO_MOVES).join(', ')}`,
    };
  }

  const family = FAMILY_MAP[familyId];

  // Filter by type if specified
  let candidates = moves;
  if (type) {
    const typeFiltered = moves.filter(m => m.type === type);
    if (typeFiltered.length > 0) candidates = typeFiltered;
  }

  // Pick a move
  const move = pick(candidates);

  // Pick a supporting bridge thought
  const bridges = BRIDGE_LIBRARY[familyId] || [];
  let bridge = null;
  if (bridges.length > 0) {
    // If desireId specified, try to match a bridge for that desire
    if (desireId) {
      bridge = bridges.find(b => b.forDesire === desireId) || pick(bridges);
    } else {
      bridge = pick(bridges);
    }
  }

  // Try LLM personalization of the move instruction
  let personalizedInstruction = move.instruction;
  let method = 'template';

  const prompt = [
    `Family: ${family?.label || familyId}`,
    `Exercise: ${move.label}`,
    `Type: ${move.type}`,
    `Duration: ${move.durationMinutes} minutes`,
    `Instruction: "${move.instruction}"`,
    bridge ? `\nBridge thought: "${bridge.text}"` : '',
    '',
    'Personalize this exercise instruction. Keep timing and steps. Make it warm.',
  ].filter(Boolean).join('\n');

  const llmResult = await generate(PRACTICE_SYSTEM_PROMPT, prompt, {
    maxTokens: 150,
    temperature: 0.7,
  });

  if (llmResult) {
    personalizedInstruction = llmResult;
    method = 'llm';
  }

  // Run Flow scan on the instruction for momentum/consistency signals
  const flow = flowScan(personalizedInstruction);

  return {
    ok: true,
    gate: 'PRACTICE',
    move: {
      id: move.id,
      label: move.label,
      type: move.type,
      durationMinutes: move.durationMinutes,
      instruction: personalizedInstruction,
      originalInstruction: move.instruction,
      journalPrompt: move.journalPrompt,
    },
    bridge: bridge ? {
      text: bridge.text,
      tone: bridge.tone,
      forDesire: bridge.forDesire,
    } : null,
    family: family ? {
      id: family.id,
      label: family.label,
      emoji: family.emoji,
    } : { id: familyId },
    method,
    flowScan: {
      signal: flow.signal,
      category: flow.category,
      markers: flow.markers || [],
      summary: flow.summary,
    },
  };
}
