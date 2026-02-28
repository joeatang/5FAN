/**
 * 5FAN Internal — anti-bot
 *
 * Behavioral heuristics for detecting automated/bot-like patterns.
 * Scores user behavior on a 0-1 suspicion scale.
 *
 * Checks: request velocity, content repetition, timing regularity,
 * action diversity, and fingerprint signals.
 *
 * INTERNAL SKILL — locked to local peers only.
 *
 * @param {object} input
 *   - timestamps: number[] — recent action timestamps (newest first)
 *   - texts?: string[] — recent submitted texts
 *   - actionTypes?: string[] — recent action types
 *   - sessionDuration?: number — ms since session start
 * @returns {object}
 *   - { ok, suspicionScore, flags, isLikelyBot, breakdown }
 */

// ── Thresholds ───────────────────────────────────────────────────────────────

const BOT_THRESHOLD = 0.7;           // Score >= this = likely bot
const MIN_INTERVAL_MS = 1000;         // Actions < 1 second apart = suspicious
const MAX_VELOCITY_PER_MIN = 20;      // More than 20 actions/minute = suspicious
const REGULARITY_TOLERANCE_MS = 500;  // Timing variance < 500ms = mechanical

// ── Velocity Check ───────────────────────────────────────────────────────────

function checkVelocity(timestamps) {
  if (!timestamps || timestamps.length < 3) return 0;

  // Count actions in the last 60 seconds
  const now = timestamps[0] || Date.now();
  const recentCount = timestamps.filter(t => (now - t) < 60000).length;

  if (recentCount >= MAX_VELOCITY_PER_MIN) return 1.0;
  if (recentCount >= MAX_VELOCITY_PER_MIN * 0.7) return 0.6;
  if (recentCount >= MAX_VELOCITY_PER_MIN * 0.5) return 0.3;
  return 0;
}

// ── Interval Regularity Check ────────────────────────────────────────────────

function checkRegularity(timestamps) {
  if (!timestamps || timestamps.length < 4) return 0;

  // Calculate intervals between consecutive actions
  const intervals = [];
  for (let i = 0; i < timestamps.length - 1 && i < 10; i++) {
    intervals.push(Math.abs(timestamps[i] - timestamps[i + 1]));
  }

  if (intervals.length < 3) return 0;

  // Check if intervals are suspiciously regular (low variance)
  const mean = intervals.reduce((s, v) => s + v, 0) / intervals.length;
  const variance = intervals.reduce((s, v) => s + (v - mean) ** 2, 0) / intervals.length;
  const stdDev = Math.sqrt(variance);

  // Very regular timing + fast = mechanical
  if (stdDev < REGULARITY_TOLERANCE_MS && mean < 5000) return 0.9;
  if (stdDev < REGULARITY_TOLERANCE_MS * 2 && mean < 10000) return 0.5;
  return 0;
}

// ── Rapid-Fire Check ─────────────────────────────────────────────────────────

function checkRapidFire(timestamps) {
  if (!timestamps || timestamps.length < 2) return 0;

  let rapidCount = 0;
  for (let i = 0; i < timestamps.length - 1 && i < 10; i++) {
    if (Math.abs(timestamps[i] - timestamps[i + 1]) < MIN_INTERVAL_MS) {
      rapidCount++;
    }
  }

  if (rapidCount >= 5) return 1.0;
  if (rapidCount >= 3) return 0.7;
  if (rapidCount >= 1) return 0.3;
  return 0;
}

// ── Content Repetition Check ─────────────────────────────────────────────────

function checkRepetition(texts) {
  if (!texts || texts.length < 3) return 0;

  const normalized = texts.map(t => (t || '').toLowerCase().trim()).filter(t => t.length > 0);
  if (normalized.length < 3) return 0;

  const unique = new Set(normalized);
  const repetitionRate = 1 - (unique.size / normalized.length);

  if (repetitionRate >= 0.8) return 1.0;
  if (repetitionRate >= 0.5) return 0.6;
  if (repetitionRate >= 0.3) return 0.3;
  return 0;
}

// ── Action Diversity Check ───────────────────────────────────────────────────

function checkActionDiversity(actionTypes) {
  if (!actionTypes || actionTypes.length < 5) return 0;

  const unique = new Set(actionTypes);
  // Bots tend to repeat one action type
  if (unique.size === 1 && actionTypes.length >= 10) return 0.8;
  if (unique.size === 1 && actionTypes.length >= 5) return 0.5;
  return 0;
}

// ── Main Handler ─────────────────────────────────────────────────────────────

export function handle(input) {
  const timestamps = input?.timestamps || [];
  const texts = input?.texts || [];
  const actionTypes = input?.actionTypes || [];

  const checks = {
    velocity: { score: checkVelocity(timestamps), weight: 0.25 },
    regularity: { score: checkRegularity(timestamps), weight: 0.25 },
    rapidFire: { score: checkRapidFire(timestamps), weight: 0.20 },
    repetition: { score: checkRepetition(texts), weight: 0.15 },
    actionDiversity: { score: checkActionDiversity(actionTypes), weight: 0.15 },
  };

  // Weighted suspicion score
  let suspicionScore = 0;
  for (const check of Object.values(checks)) {
    suspicionScore += check.score * check.weight;
  }
  suspicionScore = Math.round(suspicionScore * 100) / 100;

  // Build flags
  const flags = [];
  if (checks.velocity.score >= 0.6) flags.push('high-velocity');
  if (checks.regularity.score >= 0.5) flags.push('mechanical-timing');
  if (checks.rapidFire.score >= 0.7) flags.push('rapid-fire');
  if (checks.repetition.score >= 0.6) flags.push('repetitive-content');
  if (checks.actionDiversity.score >= 0.5) flags.push('single-action-type');

  return {
    ok: true,
    suspicionScore,
    isLikelyBot: suspicionScore >= BOT_THRESHOLD,
    flags,
    breakdown: checks,
    dataPoints: {
      timestampCount: timestamps.length,
      textCount: texts.length,
      actionTypeCount: actionTypes.length,
    },
  };
}
