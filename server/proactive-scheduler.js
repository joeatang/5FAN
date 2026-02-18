/**
 * Proactive Scheduler
 * Posts to the community feed on a configurable schedule.
 * Morning kickoff, afternoon pulse, evening reflection.
 * Uses brain swarm + LLM for contextual posts, template fallback for zero-LLM.
 */

import { analyze, buildEnrichedPrompt } from './brain-swarm.js';
import { generate } from './lm-bridge.js';
import { FIVE_FAN } from '../config.js';
import appContext from '../app-context.js';
import { pick, feedEnvelope } from '../brains/5fan.js';

/** Track what's been posted to avoid duplicates */
const postedToday = new Set();
let schedulerInterval = null;

/** Schedule slots (hour ranges in local time) */
const SLOTS = {
  morning: { start: 7, end: 9, label: 'Morning Kickoff' },
  afternoon: { start: 13, end: 15, label: 'Afternoon Pulse' },
  evening: { start: 18, end: 20, label: 'Evening Reflection' },
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

/**
 * Get current local time info based on configured timezone.
 * @returns {{ hour: number, dateKey: string, slotName: string | null }}
 */
function getTimeInfo() {
  const tz = FIVE_FAN.timezone || 'America/Los_Angeles';
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    hour12: false,
  });
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const hour = parseInt(formatter.format(now), 10);
  const dateKey = dateFormatter.format(now).replace(/\//g, '-');

  let slotName = null;
  for (const [name, slot] of Object.entries(SLOTS)) {
    if (hour >= slot.start && hour < slot.end) {
      slotName = name;
      break;
    }
  }

  return { hour, dateKey, slotName };
}

/**
 * Generate a proactive post for a specific slot.
 * @param {string} slotName - 'morning' | 'afternoon' | 'evening'
 * @param {object} [context] - optional community context
 * @returns {Promise<{ text: string, slot: string, method: string }>}
 */
export async function generatePost(slotName, context = {}) {
  const slot = SLOTS[slotName];
  if (!slot) throw new Error(`Unknown slot: ${slotName}`);

  // Try LLM first
  const systemPrompt = [
    appContext,
    '',
    `TASK: Generate a ${slot.label.toLowerCase()} community post.`,
    `TIME: ${slotName} (${slot.start}:00-${slot.end}:00 local time)`,
    'RULES:',
    '- 1-2 sentences max.',
    '- Ask a question OR share a brief thought.',
    '- Be specific, not generic. Not "How are you?" but "What\'s one thing you want to show up for today?"',
    '- Match the time of day energy (morning = fresh, afternoon = pulse check, evening = reflection).',
    '- Never start with "Hey everyone" or "Hello friends". Just talk.',
    '- No emojis unless they add meaning.',
    context.recentTopics ? `- Recent community topics: ${context.recentTopics}` : '',
  ].filter(Boolean).join('\n');

  const llmResponse = await generate(systemPrompt, `Write a ${slotName} community post.`, {
    maxTokens: 100,
    temperature: 0.85,
  });

  if (llmResponse) {
    return { text: llmResponse, slot: slotName, method: 'llm' };
  }

  // Template fallback
  return { text: pick(TEMPLATES[slotName]), slot: slotName, method: 'template' };
}

/**
 * Check if a proactive post should be sent and generate it.
 * Called periodically by the scheduler.
 *
 * @param {function} broadcastFn - function to call with (envelope) to broadcast
 * @returns {Promise<object|null>}
 */
export async function tick(broadcastFn) {
  if (!FIVE_FAN.features.proactive) return null;

  const { dateKey, slotName } = getTimeInfo();
  if (!slotName) return null;

  const postKey = `${dateKey}-${slotName}`;
  if (postedToday.has(postKey)) return null;

  try {
    const post = await generatePost(slotName);
    postedToday.add(postKey);

    const envelope = feedEnvelope('view', post.text, {
      proactive: true,
      slot: slotName,
    });

    if (broadcastFn) {
      await broadcastFn(envelope);
    }

    console.log(`[proactive] ${slotName} post sent (${post.method}): ${post.text.slice(0, 60)}...`);
    return { ...post, envelope };
  } catch (err) {
    console.error('[proactive] Error generating post:', err.message);
    return null;
  }
}

/**
 * Start the proactive scheduler.
 * Checks every 10 minutes if it's time to post.
 *
 * @param {function} broadcastFn
 * @param {number} [intervalMs=600000] - check interval (default: 10 min)
 */
export function start(broadcastFn, intervalMs = 600_000) {
  if (schedulerInterval) stop();

  console.log('[proactive] Scheduler started. Checking every', intervalMs / 60000, 'minutes.');

  // Check immediately
  tick(broadcastFn).catch(err => console.error('[proactive] tick error:', err.message));

  // Then on interval
  schedulerInterval = setInterval(() => {
    tick(broadcastFn).catch(err => console.error('[proactive] tick error:', err.message));
  }, intervalMs);
}

/**
 * Stop the proactive scheduler.
 */
export function stop() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[proactive] Scheduler stopped.');
  }
}

/**
 * Clear the posted-today history (for new day or testing).
 */
export function reset() {
  postedToday.clear();
}

export default { generatePost, tick, start, stop, reset };
