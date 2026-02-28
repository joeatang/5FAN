/**
 * 5FAN Community — proactive-post
 *
 * Generates a proactive community post for a given time slot.
 * Takes the post type + optional community stats → returns post text.
 * The scheduling logic stays in the sidecar — this skill only generates content.
 *
 * Brain-enhanced skill — uses LLM + template fallback.
 *
 * @param {object} input - { type: string, communityStats?: object, recentTopics?: string }
 * @returns {Promise<object>} - { ok, text, slot, method }
 */

import { generate } from '../../../server/lm-bridge.js';
import appContext from '../../../app-context.js';
import { pick } from '../../../brains/5fan.js';

/** Valid post types (time slots) */
const VALID_TYPES = ['morning', 'afternoon', 'evening'];

/** Slot metadata */
const SLOTS = {
  morning: { label: 'Morning Kickoff', energy: 'fresh, focused, intentional' },
  afternoon: { label: 'Afternoon Pulse', energy: 'reflective, checking in, recalibrating' },
  evening: { label: 'Evening Reflection', energy: 'winding down, grateful, processing' },
};

/** Template posts for each slot (fallback when no LLM) */
const TEMPLATES = {
  morning: [
    'New day, clean slate. What\'s one thing you want to show up for today?',
    'Morning check-in: How are you feeling right now? One word is enough.',
    'The day is unwritten. What would make today feel like a win for you?',
    'Rise and show up. Not for anyone else — for future you.',
    'Good morning. Before the noise starts, take one breath. You\'re here. That counts.',
    'Day starts now. What\'s one small commitment you can keep today?',
    'Morning thought: You don\'t have to be great today. You just have to be present.',
    'Quick pulse: What\'s your energy level, 1-10? No judgment, just check in.',
    'Today\'s invitation: Do one thing that your tomorrow-self will thank you for.',
    'Mornings are reset buttons. What are you resetting today?',
  ],
  afternoon: [
    'Halfway through the day. How\'s it going? Check in with yourself.',
    'Afternoon pulse: Still tracking with your morning intention?',
    'Quick check — have you eaten, hydrated, and taken a breath today?',
    'The afternoon is for recalibrating. You still have half a day. Use it.',
    'Mid-day mirror: Are you being kind to yourself today?',
    'Afternoon reminder: Progress isn\'t always visible. Keep going.',
    'How are you right now? Not how you should be. How you actually are.',
    'Take 30 seconds. Box breathe. 4 in, 4 hold, 4 out, 4 hold. You needed that.',
    'Afternoon thought: The person you\'re becoming is built in these quiet moments.',
    'Pause. Look around. Name one thing that\'s going right. There\'s always one.',
  ],
  evening: [
    'Day\'s winding down. What went well today? Name one thing.',
    'Evening reflection: What did you learn about yourself today?',
    'Tonight, instead of scrolling, try writing one sentence about your day.',
    'End-of-day check: Did you show up today? If yes, that\'s enough.',
    'Evening thought: Tomorrow is another chance. Tonight is for rest.',
    'What would you tell your morning self about today? Any surprises?',
    'Winding down. The effort you put in today — it compounds. Trust that.',
    'Night check-in: Release whatever didn\'t go right. Keep what did.',
    'Evening reminder: You survived today. You\'ll survive tomorrow too.',
    'Before you sleep: Three things you\'re grateful for. Go.',
  ],
};

export async function handle(input) {
  const { type, communityStats, recentTopics } = input || {};

  if (!type) {
    return {
      ok: false,
      error: `type is required. Valid types: ${VALID_TYPES.join(', ')}`,
    };
  }

  if (!VALID_TYPES.includes(type)) {
    return {
      ok: false,
      error: `Unknown post type: ${type}. Valid types: ${VALID_TYPES.join(', ')}`,
    };
  }

  const slot = SLOTS[type];

  // Try LLM first
  const statsContext = communityStats
    ? `\nCommunity stats: ${JSON.stringify(communityStats)}`
    : '';
  const topicsContext = recentTopics
    ? `\nRecent community topics: ${recentTopics}`
    : '';

  const systemPrompt = [
    appContext,
    '',
    `TASK: Generate a ${slot.label.toLowerCase()} community post.`,
    `ENERGY: ${slot.energy}`,
    'RULES:',
    '- 1-2 sentences max.',
    '- Ask a question OR share a brief thought.',
    '- Be specific, not generic. Not "How are you?" but "What\'s one thing you want to show up for today?"',
    `- Match the time-of-day energy: ${slot.energy}`,
    '- Never start with "Hey everyone" or "Hello friends". Just talk.',
    '- No emojis unless they add meaning.',
    statsContext,
    topicsContext,
  ].filter(Boolean).join('\n');

  const llmResult = await generate(systemPrompt, `Write a ${type} community post.`, {
    maxTokens: 100,
    temperature: 0.85,
  });

  if (llmResult) {
    return { ok: true, text: llmResult, slot: type, method: 'llm' };
  }

  // Template fallback
  return { ok: true, text: pick(TEMPLATES[type]), slot: type, method: 'template' };
}
