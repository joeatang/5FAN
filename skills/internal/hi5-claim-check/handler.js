/**
 * 5FAN Internal — hi5-claim-check
 *
 * Pre-validates whether a user is eligible to claim $Hi5.
 * Checks: min points, cooldown, streak bonus eligibility.
 *
 * INTERNAL SKILL — locked to local peers only.
 *
 * @param {object} input
 *   - balance: number — current point balance
 *   - lastClaimAt: number|null — timestamp of last claim
 *   - streak: number — current streak days
 *   - requestedPoints?: number — points to claim (default: max eligible)
 * @returns {object}
 *   - { ok, eligible, claimableHi5, pointsCost, streakBonus, cooldownRemaining, reason? }
 */

// ── Claim Config (mirrored from hi-contract.js) ─────────────────────────────

const CLAIM_CONFIG = {
  rate: 555,              // 555 points = 1 $Hi5
  min_points: 555,        // Minimum points to claim
  max_points: 5550,       // Maximum points per claim (10 $Hi5)
  cooldown_ms: 7 * 24 * 60 * 60 * 1000, // 7 days
  streak_bonus_threshold: 30,
  streak_bonus_pct: 10,   // 10% bonus $Hi5
};

// ── Main Handler ─────────────────────────────────────────────────────────────

export function handle(input) {
  const balance = input?.balance;
  const lastClaimAt = input?.lastClaimAt || null;
  const streak = input?.streak || 0;
  const requestedPoints = input?.requestedPoints || null;

  if (balance === undefined || balance === null || typeof balance !== 'number') {
    return { ok: false, error: 'balance (number) is required.' };
  }

  const now = Date.now();

  // Check cooldown
  let cooldownRemaining = 0;
  if (lastClaimAt) {
    const elapsed = now - lastClaimAt;
    if (elapsed < CLAIM_CONFIG.cooldown_ms) {
      cooldownRemaining = CLAIM_CONFIG.cooldown_ms - elapsed;
      const hoursRemaining = Math.ceil(cooldownRemaining / 3600000);
      return {
        ok: true,
        eligible: false,
        reason: `Cooldown active. ${hoursRemaining} hours remaining before next claim.`,
        cooldownRemaining,
        cooldownHours: hoursRemaining,
      };
    }
  }

  // Check minimum balance
  if (balance < CLAIM_CONFIG.min_points) {
    return {
      ok: true,
      eligible: false,
      reason: `Need ${CLAIM_CONFIG.min_points} points to claim. Current balance: ${balance}.`,
      pointsNeeded: CLAIM_CONFIG.min_points - balance,
    };
  }

  // Calculate claimable amount
  const claimPoints = requestedPoints
    ? Math.min(requestedPoints, CLAIM_CONFIG.max_points, balance)
    : Math.min(CLAIM_CONFIG.max_points, balance);

  // Must meet minimum
  if (claimPoints < CLAIM_CONFIG.min_points) {
    return {
      ok: true,
      eligible: false,
      reason: `Requested ${claimPoints} points but minimum is ${CLAIM_CONFIG.min_points}.`,
    };
  }

  const baseHi5 = Math.floor(claimPoints / CLAIM_CONFIG.rate);

  // Streak bonus
  const hasStreakBonus = streak >= CLAIM_CONFIG.streak_bonus_threshold;
  const streakBonusHi5 = hasStreakBonus
    ? Math.floor(baseHi5 * CLAIM_CONFIG.streak_bonus_pct / 100)
    : 0;

  const totalHi5 = baseHi5 + streakBonusHi5;

  return {
    ok: true,
    eligible: true,
    claimableHi5: totalHi5,
    baseHi5,
    streakBonusHi5,
    hasStreakBonus,
    pointsCost: baseHi5 * CLAIM_CONFIG.rate,
    remainingBalance: balance - (baseHi5 * CLAIM_CONFIG.rate),
    cooldownRemaining: 0,
    streakDays: streak,
  };
}
