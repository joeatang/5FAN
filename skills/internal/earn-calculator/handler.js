/**
 * 5FAN Internal — earn-calculator
 *
 * Calculates point earnings for an action, applying tier multiplier,
 * ascending schedule, streak bonus, diminishing returns, and quality score.
 *
 * INTERNAL SKILL — locked to local peers only (isLocalCaller enforcement).
 * Mirrors the earn engine logic from hi-contract.js for pre-computation.
 *
 * @param {object} input
 *   - action: string — 'checkin' | 'share' | 'reaction' | 'tap_batch' | 'gym_session' | 'shift_session'
 *   - tier: string — user's current tier
 *   - streak: number — current streak days
 *   - todayActionCount: number — how many of this action today
 *   - momentNumber?: number — for checkin: which Hi Moment today (0-based)
 *   - qualityScore?: number — 0-1 quality multiplier
 * @returns {object}
 *   - { ok, basePoints, tierMultiplier, streakBonus, diminishingMult, qualityMult, finalPoints, breakdown }
 */

// ── Contract Constants (mirrored from hi-contract.js) ────────────────────────

const TIER_MULTIPLIERS = {
  free: 0.1,
  bronze: 1.0,
  silver: 1.25,
  gold: 1.5,
  premium: 2.0,
  collective: 2.5,
};

const BASE_POINTS = {
  checkin: 5,
  share: 10,
  reaction: 1,
  tap_batch: 1,
  gym_session: 5,
  shift_session: 8,
};

const HI_MOMENT_ASCENDING = [3, 4, 5, 6, 7, 8];

const DIMINISHING_TIERS = [
  { upTo: 3, mult: 1.0 },
  { upTo: 6, mult: 0.5 },
  { upTo: 10, mult: 0.25 },
  { upTo: Infinity, mult: 0.05 },
];

const STREAK_EARN_BONUS = [
  { minDays: 30, mult: 1.5 },
  { minDays: 15, mult: 1.3 },
  { minDays: 7, mult: 1.15 },
  { minDays: 3, mult: 1.05 },
  { minDays: 0, mult: 1.0 },
];

// ── Calculation Functions ────────────────────────────────────────────────────

function getBasePoints(action, momentNumber) {
  if (action === 'checkin' && momentNumber !== undefined) {
    const idx = Math.min(momentNumber, HI_MOMENT_ASCENDING.length - 1);
    return HI_MOMENT_ASCENDING[idx];
  }
  return BASE_POINTS[action] || 0;
}

function getTierMultiplier(tier) {
  return TIER_MULTIPLIERS[tier] || TIER_MULTIPLIERS.free;
}

function getStreakBonus(streak) {
  for (const { minDays, mult } of STREAK_EARN_BONUS) {
    if (streak >= minDays) return mult;
  }
  return 1.0;
}

function getDiminishingMult(todayActionCount) {
  for (const { upTo, mult } of DIMINISHING_TIERS) {
    if (todayActionCount <= upTo) return mult;
  }
  return 0.05;
}

// ── Main Handler ─────────────────────────────────────────────────────────────

export function handle(input) {
  const action = input?.action;
  if (!action || !BASE_POINTS[action]) {
    return {
      ok: false,
      error: `Invalid action: ${action}. Valid: ${Object.keys(BASE_POINTS).join(', ')}`,
    };
  }

  const tier = input?.tier || 'free';
  const streak = input?.streak || 0;
  const todayActionCount = input?.todayActionCount || 1;
  const momentNumber = input?.momentNumber;
  const qualityScore = Math.max(0.1, Math.min(1.0, input?.qualityScore ?? 1.0));

  const basePoints = getBasePoints(action, momentNumber);
  const tierMultiplier = getTierMultiplier(tier);
  const streakBonus = getStreakBonus(streak);
  const diminishingMult = getDiminishingMult(todayActionCount);

  const finalPoints = Math.round(
    basePoints * tierMultiplier * streakBonus * diminishingMult * qualityScore
  );

  return {
    ok: true,
    basePoints,
    tierMultiplier,
    streakBonus,
    diminishingMult,
    qualityMult: qualityScore,
    finalPoints,
    breakdown: `${basePoints} base × ${tierMultiplier} tier × ${streakBonus} streak × ${diminishingMult} diminishing × ${qualityScore} quality = ${finalPoints}`,
  };
}
