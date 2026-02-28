/**
 * 5FAN AI Coach — nudge-engine
 *
 * Evaluates user data and returns the SINGLE most relevant nudge.
 * Priority cascade: streak_break > celebration > low_hi_index >
 * gym_reminder > shift_reminder > encouragement > daily_greeting.
 *
 * Each nudge is brain-attributed (specific brain voice) and deduped
 * (same pattern won't fire within 4hr cooldown).
 *
 * Migrated from stay-hi-trac nudge-engine.js — same logic, skill interface.
 *
 * @param {object} input
 *   - stats: object — user stats { streak, hiIndex, today: { checkin }, lastGymAt, lastShiftAt, tier, username }
 *   - address?: string — user address for dedup
 * @returns {Promise<object>}
 *   - { ok, nudge: { type, text, brain, brainLabel, priority } | null, method, candidateCount }
 */

import { generate } from '../../../server/lm-bridge.js';

// ── Brain Voice Mapping ──────────────────────────────────────────────────────

const BRAIN_NUDGES = {
  streak_break: {
    brain: 'HiFlow',
    brainLabel: 'Consistency Coach',
    priority: 1,
    fallbacks: [
      'Hi. Your {streak}-day streak is one check-in away from staying alive. The medallion is ready when you are. Stay Hi ✋',
      'Hi. {streak} days of showing up — today\'s the only one that matters right now. Hi5 ✋',
      'Hi. Streak on the line. Not a judgment — just a pattern worth protecting. Stay Hi ✋',
    ],
    prompt: (stats) => `You are HiFlow (consistency coach brain). Generate ONE nudge for ${stats.username || 'this user'}.
Their streak: ${stats.streak || 0} days. They haven't checked in today yet.
Voice: Direct, no guilt. Report the streak status. Reference the medallion.
Start with "Hi". End with "Stay Hi" or "Hi5". One emoji max. 1-2 sentences.`,
  },

  low_hi_index: {
    brain: 'HiHear',
    brainLabel: 'Emotional Scanner',
    priority: 3,
    fallbacks: [
      'Hi. Your Hi Index has been sitting in the Opportunity Zone lately. Not a problem to fix — just data to hold. Stay Hi ✋',
      'Hi. The numbers shifted. Noticed your Hi Index dipped. Only you know what that means. Hi5 ✋',
    ],
    prompt: (stats) => `You are HiHear (emotional scanner brain). Generate ONE nudge for ${stats.username || 'this user'}.
Their Hi Index: ${stats.hiIndex?.toFixed?.(1) || '?'}. It's below 2.0 (Opportunity Zone).
Voice: Warm, not worried. Acknowledge without interpreting. Mirror the data.
Start with "Hi". End with "Stay Hi" or "Hi5". One emoji max. 1-2 sentences.`,
  },

  gym_reminder: {
    brain: 'HiInspyre',
    brainLabel: 'Self-Belief Activator',
    priority: 4,
    fallbacks: [
      'Hi. It\'s been over a week since your last gym session. The door\'s open — 3 minutes, your pace, your call. Stay Hi ✋',
      'Hi. The gym misses you. Current emotion → desired emotion → bridge. That\'s it. No prep needed. Hi5 ✋',
    ],
    prompt: (stats) => `You are HiInspyre (self-belief activator brain). Generate ONE nudge for ${stats.username || 'this user'}.
They haven't done a Hi Gym session in over 7 days.
Voice: Inviting, not pushy. Reference the 3-step gym format.
Start with "Hi". End with "Stay Hi" or "Hi5". One emoji max. 1-2 sentences.`,
  },

  shift_reminder: {
    brain: 'HiFlow',
    brainLabel: 'Consistency Coach',
    priority: 4.5,
    fallbacks: [
      'Hi. The compass has been quiet for a while. Locate where you are, point where you want to go — that\'s the whole shift. Stay Hi ✋',
      'Hi. It\'s been over a week since your last shift. The compass wheel is ready when you are. Hi5 ✋',
    ],
    prompt: (stats) => `You are HiFlow (consistency coach brain). Generate ONE nudge for ${stats.username || 'this user'}.
They haven't done a Hi Shift session in over 7 days.
Voice: Grounding, not pushy. Reference the compass wheel.
Start with "Hi". End with "Stay Hi" or "Hi5". One emoji max. 1-2 sentences.`,
  },

  celebration: {
    brain: 'HiYou',
    brainLabel: 'Data Analyst',
    priority: 2,
    fallbacks: [
      'Hi. {streak} days. That\'s not a number — that\'s a decision you made {streak} times. Your data backs that up. Hi5 ✋',
      'Hi. Milestone: {streak}-day streak. HiYou ran the numbers — you\'re building something real here. Stay Hi ✋',
    ],
    prompt: (stats) => `You are HiYou (data analyst brain). Generate ONE celebration nudge for ${stats.username || 'this user'}.
They just hit a ${stats.streak || 0}-day streak milestone.
Voice: Data-grounded celebration. Reference the specific number. Earned, not fluffy.
Start with "Hi". End with "Stay Hi" or "Hi5". One emoji max. 1-2 sentences.`,
  },

  encouragement: {
    brain: 'HiInspyre',
    brainLabel: 'Self-Belief Activator',
    priority: 5,
    fallbacks: [
      'Hi. You\'re here. That counts more than you think. Hi5 ✋',
      'Hi. The fact that you keep showing up — that\'s the data point that matters most. Stay Hi ✋',
      'Hi. No performance needed today. Just presence. Stay Hi ✋',
    ],
    prompt: (stats) => `You are HiInspyre (self-belief activator brain). Generate ONE short encouragement for ${stats.username || 'this user'}.
Their streak: ${stats.streak || 0} days, tier: ${stats.tier || 'explorer'}.
Voice: Genuine warmth. Acknowledge showing up.
Start with "Hi". End with "Stay Hi" or "Hi5". One emoji max. 1-2 sentences.`,
  },

  daily_greeting: {
    brain: 'HiView',
    brainLabel: 'Big Picture',
    priority: 6,
    fallbacks: [
      'Hi. New day. The medallion\'s waiting — not for a breakthrough, for a check-in. Stay Hi ✋',
      'Hi. Another day to check in with yourself. Your data\'s here when you\'re ready. Hi5 ✋',
      'Hi. Checking in costs nothing but a moment of honesty. The Island is listening. Stay Hi ✋',
    ],
    prompt: (stats) => `You are HiView (big picture synthesizer brain). Generate ONE daily greeting for ${stats.username || 'this user'}.
Their streak: ${stats.streak || 0} days, tier: ${stats.tier || 'explorer'}, Hi Index: ${stats.hiIndex?.toFixed?.(1) || '?'}.
Voice: Grounding, wide-lens perspective.
Start with "Hi". End with "Stay Hi" or "Hi5". One emoji max. 1-2 sentences.`,
  },
};

// ── Per-User Dedupe ──────────────────────────────────────────────────────────

const _nudgeHistory = new Map();
const NUDGE_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours

function wasRecentlyShown(address, patternId) {
  const history = _nudgeHistory.get(address);
  if (!history) return false;
  const lastShown = history.get(patternId);
  if (!lastShown) return false;
  return (Date.now() - lastShown) < NUDGE_COOLDOWN_MS;
}

function markShown(address, patternId) {
  if (!_nudgeHistory.has(address)) _nudgeHistory.set(address, new Map());
  _nudgeHistory.get(address).set(patternId, Date.now());
  if (_nudgeHistory.size > 500) {
    const oldest = _nudgeHistory.keys().next().value;
    _nudgeHistory.delete(oldest);
  }
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fillPlaceholders(text, stats) {
  return text.replace(/\{streak\}/g, String(stats?.streak || 0));
}

// ── Candidate Evaluation ─────────────────────────────────────────────────────

function buildCandidates(stats) {
  const candidates = [];
  const today = stats?.today || {};
  const streak = stats?.streak ?? 0;
  const hiIndex = stats?.hiIndex ?? null;
  const now = Date.now();

  // P1: Streak about to break
  if (!today.checkin && streak > 0) candidates.push('streak_break');

  // P2: Celebration milestone
  if ([7, 14, 21, 30, 50, 100].includes(streak)) candidates.push('celebration');

  // P3: Low Hi Index
  if (hiIndex !== null && hiIndex < 2.0) candidates.push('low_hi_index');

  // P4: No gym in 7+ days
  if (stats?.lastGymAt) {
    const daysSinceGym = (now - stats.lastGymAt) / 86400000;
    if (daysSinceGym >= 7) candidates.push('gym_reminder');
  }

  // P4.5: No shift in 7+ days
  if (stats?.lastShiftAt) {
    const daysSinceShift = (now - stats.lastShiftAt) / 86400000;
    if (daysSinceShift >= 7) candidates.push('shift_reminder');
  }

  // P5: General encouragement (always eligible)
  candidates.push('encouragement');

  // P6: Daily greeting (always eligible)
  candidates.push('daily_greeting');

  return candidates;
}

// ── Main Handler ─────────────────────────────────────────────────────────────

export async function handle(input) {
  const stats = input?.stats;
  if (!stats || typeof stats !== 'object') {
    return { ok: false, error: 'stats object is required.' };
  }

  const address = input?.address || 'unknown';

  // Build priority-ordered candidate list
  const candidates = buildCandidates(stats);
  if (candidates.length === 0) {
    return { ok: true, nudge: null, method: 'none', candidateCount: 0 };
  }

  // Pick the highest-priority candidate not recently shown
  let selectedId = null;
  for (const id of candidates) {
    if (!wasRecentlyShown(address, id)) {
      selectedId = id;
      break;
    }
  }

  if (!selectedId) {
    return { ok: true, nudge: null, method: 'deduped', candidateCount: candidates.length };
  }

  const nudgeDef = BRAIN_NUDGES[selectedId];
  if (!nudgeDef) {
    return { ok: true, nudge: null, method: 'none', candidateCount: candidates.length };
  }

  // Try LLM generation
  let text = null;
  let method = 'template';

  try {
    const prompt = nudgeDef.prompt(stats);
    const llmText = await generate(prompt, '', { maxTokens: 100, temperature: 0.8 });
    if (llmText && llmText.length > 10 && llmText.length < 300) {
      text = llmText;
      method = 'llm';
    }
  } catch {
    // Fall through to template
  }

  // Template fallback
  if (!text) {
    text = fillPlaceholders(pickRandom(nudgeDef.fallbacks), stats);
  }

  // Mark as shown
  markShown(address, selectedId);

  return {
    ok: true,
    nudge: {
      type: selectedId,
      text,
      brain: nudgeDef.brain,
      brainLabel: nudgeDef.brainLabel,
      priority: nudgeDef.priority,
    },
    method,
    candidateCount: candidates.length,
  };
}
