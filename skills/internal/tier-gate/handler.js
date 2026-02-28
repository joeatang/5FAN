/**
 * 5FAN Internal — tier-gate
 *
 * Checks whether a user's tier grants access to a specific feature.
 * Returns access status, required tier, and upgrade message.
 *
 * INTERNAL SKILL — locked to local peers only.
 *
 * @param {object} input
 *   - tier: string — user's current tier
 *   - feature: string — feature to check access for
 * @returns {object}
 *   - { ok, allowed, currentTier, requiredTier, message? }
 */

// ── Tier Hierarchy ───────────────────────────────────────────────────────────

const TIER_ORDER = ['free', 'bronze', 'silver', 'gold', 'premium', 'collective'];

function tierIndex(tier) {
  const idx = TIER_ORDER.indexOf(tier);
  return idx >= 0 ? idx : 0;
}

// ── Feature Access Map ───────────────────────────────────────────────────────

const FEATURE_GATES = {
  // Free features
  checkin:         { minTier: 'free', label: 'Daily Check-In' },
  medallion:       { minTier: 'free', label: 'Medallion Tap' },
  shift_basic:     { minTier: 'free', label: 'Basic Compass Shift' },
  share_basic:     { minTier: 'free', label: 'Share (1/day)' },

  // Bronze+ features
  gym:             { minTier: 'bronze', label: 'Hi Gym' },
  coach_chat:      { minTier: 'bronze', label: 'AI Coach Chat' },
  share_extended:  { minTier: 'bronze', label: 'Extended Shares (5/day)' },
  reactions:       { minTier: 'bronze', label: 'Reactions (25/day)' },
  hi_note:         { minTier: 'bronze', label: 'Hi-Note Creation' },

  // Silver+ features
  shift_extended:  { minTier: 'silver', label: 'Extended Shifts (5/day)' },
  share_full:      { minTier: 'silver', label: 'Full Shares (7/day)' },
  reactions_full:  { minTier: 'silver', label: 'Full Reactions (50/day)' },
  journal:         { minTier: 'silver', label: 'Guided Journaling' },

  // Gold+ features
  share_unlimited: { minTier: 'gold', label: 'Unlimited Shares (10/day)' },
  analytics:       { minTier: 'gold', label: 'Advanced Analytics' },
  wellness:        { minTier: 'gold', label: 'Wellness Dashboard' },

  // Premium+ features
  priority_coach:  { minTier: 'premium', label: 'Priority AI Coaching' },
  custom_prompts:  { minTier: 'premium', label: 'Custom Gym Prompts' },

  // Collective
  collective_vote: { minTier: 'collective', label: 'Collective Voting' },
};

// ── Upgrade Messages ─────────────────────────────────────────────────────────

function getUpgradeMessage(feature, currentTier, requiredTier) {
  const gate = FEATURE_GATES[feature];
  const label = gate?.label || feature;
  return `${label} requires ${requiredTier} tier or above. You're currently on ${currentTier}. Upgrade to unlock this feature. Stay Hi ✋`;
}

// ── Main Handler ─────────────────────────────────────────────────────────────

export function handle(input) {
  const tier = input?.tier;
  const feature = input?.feature;

  if (!tier || typeof tier !== 'string') {
    return { ok: false, error: 'tier is required.' };
  }
  if (!feature || typeof feature !== 'string') {
    return { ok: false, error: 'feature is required.' };
  }

  const gate = FEATURE_GATES[feature];
  if (!gate) {
    return {
      ok: true,
      allowed: true, // Unknown features default to allowed
      currentTier: tier,
      requiredTier: 'free',
      note: `Unknown feature "${feature}" — defaulting to allowed.`,
    };
  }

  const currentIdx = tierIndex(tier);
  const requiredIdx = tierIndex(gate.minTier);
  const allowed = currentIdx >= requiredIdx;

  const result = {
    ok: true,
    allowed,
    currentTier: tier,
    requiredTier: gate.minTier,
    featureLabel: gate.label,
  };

  if (!allowed) {
    result.message = getUpgradeMessage(feature, tier, gate.minTier);
  }

  return result;
}
