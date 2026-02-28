/**
 * 5FAN AI Coach — coach-chat
 *
 * Open-mode conversational AI coach. Detects user intent (meta, action,
 * emotional), enriches with brain swarm analysis, responds via LLM
 * or template fallback.
 *
 * This is the "trainer in your pocket" — mirrors, not hands.
 * Reports patterns the user can see themselves. Never prescribes.
 *
 * Brain-enhanced skill — uses all 5 brains + LLM.
 *
 * @param {object} input
 *   - text: string — user message
 *   - conversationHistory?: object[] — [{ role, content }] array
 *   - userStats?: object — { streak, tier, hiIndex, username, ... }
 *   - brainContext?: object — pre-existing brain analysis
 * @returns {Promise<object>}
 *   - { ok, reply, method, brainScan, detectedIntent, suggestions }
 */

import { scan as hearScan } from '../../../brains/hear/functions.js';
import { scan as inspyreScan } from '../../../brains/inspyre/functions.js';
import { scan as flowScan } from '../../../brains/flow/functions.js';
import { scan as youScan } from '../../../brains/you/functions.js';
import { scan as viewScan, curateConsensus } from '../../../brains/view/functions.js';
import { generate } from '../../../server/lm-bridge.js';
import { BRIDGE_LIBRARY } from '../../eq-engine/data/bridge-library.js';
import { FAMILY_MAP } from '../../eq-engine/data/emotion-families.js';

// ── Intent Detection ─────────────────────────────────────────────────────────

const META_SIGNALS = ['what can you do', 'help', 'who are you', 'how do you work', 'capabilities', 'features'];
const GYM_SIGNALS = ['gym', 'workout', 'session', 'let\'s do this', 'i need to process', 'hi gym'];
const SHARE_SIGNALS = ['share', 'post', 'hi island', 'hi moment', 'hi note'];
const SHIFT_SIGNALS = ['shift', 'compass', 'navigate', 'repoint', 'realign'];
const HOWAMI_SIGNALS = ['how am i doing', 'my stats', 'my streak', 'my progress', 'where am i'];

function detectIntent(text) {
  const lower = text.toLowerCase().trim();

  if (META_SIGNALS.some(s => lower.includes(s))) return 'meta';
  if (GYM_SIGNALS.some(s => lower.includes(s))) return 'gym';
  if (SHARE_SIGNALS.some(s => lower.includes(s))) return 'share';
  if (SHIFT_SIGNALS.some(s => lower.includes(s))) return 'shift';
  if (HOWAMI_SIGNALS.some(s => lower.includes(s))) return 'stats';

  return 'open'; // default: open emotional conversation
}

// ── Meta Responses ───────────────────────────────────────────────────────────

const META_RESPONSES = [
  'Hi. I\'m Hi5FAN — your AI trainer on Stay Hi. I can help you check in with how you\'re feeling, run a Hi Gym session, look at your stats, or just talk. What\'s on your mind? Stay Hi ✋',
  'Hi. I\'m here to mirror what you share, not to fix you. I can guide a gym session, check your progress, or just hold space for whatever\'s on your mind. Hi5 ✋',
];

const GYM_SUGGESTIONS = [
  'Sounds like you\'re ready for a gym session. Say "start gym" and we\'ll go through the 8-step process together — one step at a time. Stay Hi ✋',
  'The Hi Gym is ready. 8 steps, your pace. Current emotion → desired emotion → bridge. Say "start gym" when you\'re ready. Hi5 ✋',
];

const SHARE_SUGGESTIONS = [
  'Want to share something on Hi Island? Write what\'s on your heart and I\'ll help you craft a Hi Moment. Stay Hi ✋',
  'Hi Island is listening. What do you want to share with the community? Hi5 ✋',
];

const SHIFT_SUGGESTIONS = [
  'Ready for a compass shift? Let\'s locate where you are emotionally and point toward where you want to go. Stay Hi ✋',
  'The compass wheel is ready. Name your current emotion and where you want to navigate to. Hi5 ✋',
];

// ── Stats Reply Builder ──────────────────────────────────────────────────────

function buildStatsReply(stats) {
  if (!stats) return 'I don\'t have your stats right now. Check in and I\'ll have more to reflect. Stay Hi ✋';

  const parts = ['Hi. Here\'s where you stand:'];
  if (stats.streak !== undefined) parts.push(`Streak: ${stats.streak} days`);
  if (stats.tier) parts.push(`Tier: ${stats.tier}`);
  if (stats.hiIndex !== undefined) parts.push(`Hi Index: ${stats.hiIndex?.toFixed?.(1) ?? stats.hiIndex}`);
  if (stats.balance !== undefined) parts.push(`Balance: ${stats.balance} pts`);
  parts.push('Stay Hi ✋');

  return parts.join('\n');
}

// ── Brain Analysis ───────────────────────────────────────────────────────────

function analyzeFull(text) {
  const hear = hearScan(text, {});
  const inspyre = inspyreScan(text, {});
  const flow = flowScan(text, {});
  const you = youScan(text, {});
  const view = viewScan(text, {});

  const scans = [
    { brain: 'hear', ...hear },
    { brain: 'inspyre', ...inspyre },
    { brain: 'flow', ...flow },
    { brain: 'you', ...you },
    { brain: 'view', ...view },
  ];

  const consensus = curateConsensus(scans, text);
  const dominant = scans.reduce((a, b) => (b.signal || 0) > (a.signal || 0) ? b : a);

  return {
    scans,
    consensus,
    dominant: dominant.brain,
    emotions: hear.emotions || [],
    signal: hear.signal || 0,
    themes: inspyre.themes || [],
    markers: flow.markers || [],
    isCrisis: hear.isCrisis || false,
  };
}

// ── Template Fallback Responses ──────────────────────────────────────────────

const OPEN_TEMPLATES = {
  high_signal: [
    'I hear you. That\'s a lot to carry. You don\'t have to process it all at once — just naming it is a step. Stay Hi ✋',
    'That\'s real. Thank you for sharing that. I\'m here. No fixing needed — just presence. Hi5 ✋',
    'What you\'re feeling matters. It\'s not too much. It\'s information about what you need. Stay Hi ✋',
  ],
  medium_signal: [
    'I see that. Something is moving in there. Want to sit with it or explore it? Stay Hi ✋',
    'There\'s something here. I can feel it in what you wrote. What feels most true about it? Hi5 ✋',
  ],
  low_signal: [
    'Hi. I\'m here. Tell me more about what\'s on your mind. Stay Hi ✋',
    'I hear you. Want to go deeper or just check in? Either way works. Hi5 ✋',
  ],
  crisis: [
    'I hear you, and this matters. If you\'re in immediate danger, please reach out to 988 (Suicide & Crisis Lifeline) or text HOME to 741741. I\'m here too — but please get support from a human right now. Stay Hi ✋',
  ],
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getTemplateResponse(analysis) {
  if (analysis.isCrisis) return pickRandom(OPEN_TEMPLATES.crisis);
  if (analysis.signal >= 0.6) return pickRandom(OPEN_TEMPLATES.high_signal);
  if (analysis.signal >= 0.3) return pickRandom(OPEN_TEMPLATES.medium_signal);
  return pickRandom(OPEN_TEMPLATES.low_signal);
}

// ── LLM System Prompt Builder ────────────────────────────────────────────────

function buildSystemPrompt(analysis, userStats, conversationHistory) {
  const brainContext = analysis.emotions.length
    ? `Brain scan: emotions=[${analysis.emotions.join(', ')}], signal=${analysis.signal.toFixed(2)}, dominant=${analysis.dominant}, themes=[${analysis.themes.join(', ')}]`
    : 'Brain scan: no strong emotional signal detected.';

  const statsContext = userStats
    ? `User: ${userStats.username || 'friend'}, streak=${userStats.streak || 0}, tier=${userStats.tier || 'explorer'}, hiIndex=${userStats.hiIndex?.toFixed?.(1) ?? '?'}`
    : '';

  const historyContext = conversationHistory?.length
    ? `Recent messages: ${conversationHistory.slice(-4).map(m => `${m.role}: "${m.content?.slice(0, 80)}"`).join(' | ')}`
    : '';

  return `You are Hi5FAN — the AI trainer inside Stay Hi. You are a mirror, not a hand.

VOICE RULES:
- You report patterns the user can see themselves. Never interpret feelings or prescribe direction.
- 2-4 sentences max. Warm, direct, grounded — not cheesy.
- Start with "Hi" on first message. After that, acknowledge what they said first.
- End every response with "Stay Hi ✋" or "Hi5 ✋".
- If crisis detected, always include 988 Lifeline reference.
- One emoji max per response.

${brainContext}
${statsContext}
${historyContext}

Respond to the user's message. Mirror what you detect. Don't rush to solve — hold space.`;
}

// ── Main Handler ─────────────────────────────────────────────────────────────

export async function handle(input) {
  const text = input?.text;
  if (!text || typeof text !== 'string' || !text.trim()) {
    return { ok: false, error: 'text is required for coach-chat.' };
  }

  const conversationHistory = input?.conversationHistory || [];
  const userStats = input?.userStats || null;

  // Detect intent
  const intent = detectIntent(text);

  // Handle meta + action intents with template responses
  if (intent === 'meta') {
    return { ok: true, reply: pickRandom(META_RESPONSES), method: 'template', detectedIntent: 'meta', suggestions: ['start gym', 'how am i doing', 'share'] };
  }
  if (intent === 'gym') {
    return { ok: true, reply: pickRandom(GYM_SUGGESTIONS), method: 'template', detectedIntent: 'gym', suggestions: ['start gym'] };
  }
  if (intent === 'share') {
    return { ok: true, reply: pickRandom(SHARE_SUGGESTIONS), method: 'template', detectedIntent: 'share', suggestions: ['write a hi note'] };
  }
  if (intent === 'shift') {
    return { ok: true, reply: pickRandom(SHIFT_SUGGESTIONS), method: 'template', detectedIntent: 'shift', suggestions: ['start shift'] };
  }
  if (intent === 'stats') {
    return { ok: true, reply: buildStatsReply(userStats), method: 'template', detectedIntent: 'stats', suggestions: ['start gym', 'share'] };
  }

  // Open mode — full brain analysis + LLM
  const analysis = analyzeFull(text);

  let reply = null;
  let method = 'template';

  // Try LLM
  const systemPrompt = buildSystemPrompt(analysis, userStats, conversationHistory);
  try {
    const llmResponse = await generate(systemPrompt, text, {
      maxTokens: 200,
      temperature: 0.7,
    });
    if (llmResponse && llmResponse.length > 10 && llmResponse.length < 500) {
      reply = llmResponse;
      method = 'llm';
    }
  } catch {
    // Fall through to template
  }

  // Template fallback
  if (!reply) {
    reply = getTemplateResponse(analysis);
  }

  // Build suggestions based on analysis
  const suggestions = [];
  if (analysis.signal >= 0.5) suggestions.push('start gym');
  if (analysis.emotions.length > 0) suggestions.push('explore this feeling');
  suggestions.push('share on hi island');

  return {
    ok: true,
    reply,
    method,
    detectedIntent: 'open',
    brainScan: {
      emotions: analysis.emotions,
      signal: analysis.signal,
      dominant: analysis.dominant,
      themes: analysis.themes,
      isCrisis: analysis.isCrisis,
      consensus: analysis.consensus?.consensus,
    },
    suggestions,
  };
}
