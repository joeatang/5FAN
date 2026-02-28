/**
 * 5FAN AI Coach — milestone-detect
 *
 * Detects user milestones (streaks, balance, tier upgrades, first claims)
 * and generates public celebration posts for Hi Island.
 *
 * Privacy wall: public celebrations reference ONLY username, streak count,
 * tier name, balance, Hi Index level. NEVER private chat/gym/scale content.
 *
 * Migrated from stay-hi-trac milestone-detector.js — same thresholds + templates.
 *
 * @param {object} input
 *   - op: string — the operation that just succeeded ('checkin', 'gym', 'share', 'claim_hi5', 'redeem_access_code')
 *   - stats: object — { username, currentStreak, balance, tier, previousTier, ... }
 *   - txResult?: object — { points, tier, previousTier, ... }
 * @returns {Promise<object>}
 *   - { ok, celebrations: [{ type, text, milestone }], method }
 */

import { generate } from '../../../server/lm-bridge.js';

// ── Milestone Thresholds ─────────────────────────────────────────────────────

const STREAK_MILESTONES = [7, 14, 30, 60, 90, 180, 365];
const BALANCE_MILESTONES = [100, 250, 500, 1000, 2500, 5000];
const TIER_ORDER = ['free', 'bronze', 'silver', 'gold', 'premium', 'collective'];

// ── Dedup: track recently celebrated milestones (in-memory) ──────────────────

const celebrated = new Map();
const DEDUP_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

function wasRecentlyCelebrated(key) {
  const ts = celebrated.get(key);
  if (!ts) return false;
  if (Date.now() - ts > DEDUP_WINDOW) {
    celebrated.delete(key);
    return false;
  }
  return true;
}

function markCelebrated(key) {
  celebrated.set(key, Date.now());
  if (celebrated.size > 200) {
    const cutoff = Date.now() - DEDUP_WINDOW;
    for (const [k, v] of celebrated) {
      if (v < cutoff) celebrated.delete(k);
    }
  }
}

// ── Template Celebrations ────────────────────────────────────────────────────

const TEMPLATES = {
  streak: [
    (name, days) => `${name} just hit a ${days}-day streak. ${days} days of showing up. That's not luck — that's a decision made ${days} times. Hi5 ✋`,
    (name, days) => `${days} days. ${name} keeps showing up. The streak is the proof, but the habit is the prize. Stay Hi ✋`,
    (name, days) => `${name} — ${days}-day streak. Every single day, a choice to check in. That's what momentum looks like. Hi5 ✋`,
  ],
  balance: [
    (name, bal) => `${name} just crossed ${bal} points. That's not just earning — that's building. Keep stacking. Hi5 ✋`,
    (name, bal) => `${bal} points. ${name} has been putting in the work. The balance is just the scoreboard — the real win is the consistency. Stay Hi ✋`,
  ],
  tier: [
    (name, tier) => `${name} just leveled up to ${tier}. New tier, new capabilities, same commitment. Hi5 ✋`,
    (name, tier) => `Tier upgrade: ${name} is now ${tier}. That's earned, not given. Stay Hi ✋`,
  ],
  claim: [
    (name) => `${name} just claimed their first $Hi5. Points converted to real value. That's what showing up builds. Hi5 ✋`,
    (name) => `${name} just claimed $Hi5. The medallion taps, the gym sessions, the streaks — it all adds up. Stay Hi ✋`,
  ],
};

function pickTemplate(category, ...args) {
  const arr = TEMPLATES[category];
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)](...args);
}

// ── LLM Celebration Generator ────────────────────────────────────────────────

async function generateCelebration(milestoneType, data) {
  const name = data.username || 'a Stay Hi member';
  let description = '';

  switch (milestoneType) {
    case 'streak':
      description = `${name} just hit a ${data.streakDays}-day streak.`;
      break;
    case 'balance':
      description = `${name} just crossed ${data.balanceThreshold} points (current: ${data.balance}).`;
      break;
    case 'tier':
      description = `${name} just upgraded to ${data.newTier} tier.`;
      break;
    case 'claim':
      description = `${name} just claimed their $Hi5.`;
      break;
  }

  const prompt = `You are Hi5FAN posting a PUBLIC celebration on Hi Island for a user milestone.

MILESTONE: ${description}

PRIVACY RULES (MANDATORY):
- Reference: username, streak count, tier, balance, Hi Index level
- NEVER reference: private chats, gym journal, Hi Scale ratings, emotional state, personal details
- PUBLIC post visible to the entire community

Write 1-2 sentence celebration. Warm, direct, grounded — not cheesy. Hi-speak (Hi5, Stay Hi). One emoji max. End with Hi5 ✋ or Stay Hi ✋.`;

  try {
    const reply = await generate(prompt, '', { maxTokens: 100, temperature: 0.8 });
    if (reply && reply.length > 10 && reply.length < 300) return reply;
  } catch {
    // Fall through
  }
  return null;
}

// ── Main Handler ─────────────────────────────────────────────────────────────

export async function handle(input) {
  const op = input?.op;
  const stats = input?.stats;
  const txResult = input?.txResult || {};

  if (!op || !stats) {
    return { ok: false, error: 'op and stats are required.' };
  }

  const celebrations = [];
  const name = stats.username || txResult.username || 'friend';
  let method = 'template';

  // ── Streak milestones ──
  if (['checkin', 'taps', 'gym', 'share'].includes(op) && stats.currentStreak != null) {
    for (const milestone of STREAK_MILESTONES) {
      if (stats.currentStreak === milestone) {
        const key = `${input.address || 'anon'}:streak:${milestone}`;
        if (!wasRecentlyCelebrated(key)) {
          const llmText = await generateCelebration('streak', { username: name, streakDays: milestone });
          const text = llmText || pickTemplate('streak', name, milestone);
          if (llmText) method = 'llm';
          if (text) {
            celebrations.push({ type: 'streak_milestone', text, milestone });
            markCelebrated(key);
          }
        }
        break;
      }
    }
  }

  // ── Balance milestones ──
  if (stats.balance != null && (txResult.points || 0) > 0) {
    const prevBalance = stats.balance - (txResult.points || 0);
    for (const threshold of BALANCE_MILESTONES) {
      if (prevBalance < threshold && stats.balance >= threshold) {
        const key = `${input.address || 'anon'}:balance:${threshold}`;
        if (!wasRecentlyCelebrated(key)) {
          const llmText = await generateCelebration('balance', { username: name, balanceThreshold: threshold, balance: stats.balance });
          const text = llmText || pickTemplate('balance', name, threshold);
          if (llmText) method = 'llm';
          if (text) {
            celebrations.push({ type: 'balance_milestone', text, milestone: threshold });
            markCelebrated(key);
          }
        }
        break;
      }
    }
  }

  // ── Tier upgrade ──
  if (op === 'redeem_access_code' && (txResult.tier || stats.tier)) {
    const tier = txResult.tier || stats.tier;
    const prevTier = txResult.previousTier || stats.previousTier;
    const prevIdx = prevTier ? TIER_ORDER.indexOf(prevTier) : -1;
    const newIdx = TIER_ORDER.indexOf(tier);
    if (newIdx > prevIdx && newIdx > 0) {
      const key = `${input.address || 'anon'}:tier:${tier}`;
      if (!wasRecentlyCelebrated(key)) {
        const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);
        const llmText = await generateCelebration('tier', { username: name, newTier: tierName });
        const text = llmText || pickTemplate('tier', name, tierName);
        if (llmText) method = 'llm';
        if (text) {
          celebrations.push({ type: 'tier_upgrade', text, milestone: tier });
          markCelebrated(key);
        }
      }
    }
  }

  // ── First $Hi5 claim ──
  if (op === 'claim_hi5') {
    const key = `${input.address || 'anon'}:claim:first`;
    if (!wasRecentlyCelebrated(key)) {
      const llmText = await generateCelebration('claim', { username: name });
      const text = llmText || pickTemplate('claim', name);
      if (llmText) method = 'llm';
      if (text) {
        celebrations.push({ type: 'first_claim', text, milestone: 'hi5_claim' });
        markCelebrated(key);
      }
    }
  }

  return {
    ok: true,
    celebrations,
    celebrationCount: celebrations.length,
    method: celebrations.length > 0 ? method : 'none',
  };
}
