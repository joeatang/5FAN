/**
 * 5FAN Internal — vault-query
 *
 * Queries user data from the vault (contract state) and returns
 * structured user profile with computed fields.
 *
 * In the Intercom skill context, this wraps vault access into a
 * standardized skill interface for other skills to consume.
 *
 * INTERNAL SKILL — locked to local peers only.
 *
 * @param {object} input
 *   - address: string — user's public key / address
 *   - fields?: string[] — specific fields to return (default: all)
 * @returns {object}
 *   - { ok, profile, _vaultEnriched }
 */

// ── Default Profile (when vault is inaccessible) ─────────────────────────────

const DEFAULT_PROFILE = {
  username: null,
  tier: 'free',
  balance: 0,
  currentStreak: 0,
  hiIndex: 3.0,
  totalCheckins: 0,
  gymSessions: 0,
  shiftSessions: 0,
  totalShares: 0,
  totalReactions: 0,
  joinedAt: null,
  lastCheckinAt: null,
  lastGymAt: null,
  lastShiftAt: null,
  lastClaimAt: null,
  daysActive: 0,
};

// ── Vault Store (populated by external registration) ─────────────────────────

let _vaultQueryFn = null;

/**
 * Register an external vault query function.
 * This is called during skill-server initialization to wire up
 * actual contract state access.
 *
 * @param {Function} queryFn - async function(address) → profile object
 */
export function registerVaultQuery(queryFn) {
  _vaultQueryFn = queryFn;
}

// ── Field Filtering ──────────────────────────────────────────────────────────

function filterFields(profile, fields) {
  if (!fields || !Array.isArray(fields) || fields.length === 0) return profile;
  const filtered = {};
  for (const field of fields) {
    if (field in profile) {
      filtered[field] = profile[field];
    }
  }
  return filtered;
}

// ── Computed Fields ──────────────────────────────────────────────────────────

function enrichProfile(raw) {
  const profile = { ...DEFAULT_PROFILE, ...raw };

  // Compute days active
  if (profile.joinedAt) {
    profile.daysActive = Math.floor((Date.now() - profile.joinedAt) / 86400000);
  }

  // Compute Hi Scale zone
  if (profile.hiIndex <= 2) {
    profile.hiZone = 'opportunity';
  } else if (profile.hiIndex <= 3) {
    profile.hiZone = 'neutral';
  } else {
    profile.hiZone = 'hi-energy';
  }

  // Compute tier label
  profile.tierLabel = (profile.tier || 'free').charAt(0).toUpperCase() + (profile.tier || 'free').slice(1);

  return profile;
}

// ── Main Handler ─────────────────────────────────────────────────────────────

export async function handle(input) {
  const address = input?.address;
  if (!address || typeof address !== 'string') {
    return { ok: false, error: 'address is required.' };
  }

  const fields = input?.fields || null;

  let rawProfile = null;
  let vaultEnriched = false;

  // Try vault query if registered
  if (_vaultQueryFn) {
    try {
      rawProfile = await _vaultQueryFn(address);
      if (rawProfile && typeof rawProfile === 'object') {
        vaultEnriched = true;
      }
    } catch {
      // Fall through to default
    }
  }

  // Use default profile if vault unavailable
  if (!rawProfile) {
    rawProfile = { ...DEFAULT_PROFILE };
  }

  // Enrich with computed fields
  const profile = enrichProfile(rawProfile);

  // Filter fields if requested
  const output = filterFields(profile, fields);

  return {
    ok: true,
    profile: output,
    _vaultEnriched: vaultEnriched,
  };
}
