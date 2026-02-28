/**
 * 5FAN Internal — quality-score
 *
 * Computes a quality score (0.1 – 1.0) for user-generated content.
 * Uses text length, uniqueness, diversity, and social proof signals.
 *
 * Mirrors the QUALITY_WEIGHTS from hi-contract.js for pre-computation.
 *
 * INTERNAL SKILL — locked to local peers only.
 *
 * @param {object} input
 *   - text: string — the content to score
 *   - previousTexts?: string[] — user's recent texts for uniqueness check
 *   - emojiCount?: number — emoji diversity in content
 *   - wavesReceived?: number — social proof (reactions from others)
 *   - originVariety?: number — 0-1 how varied the user's content origins are
 * @returns {object}
 *   - { ok, score, breakdown, grade }
 */

// ── Quality Weights (from hi-contract.js) ────────────────────────────────────

const QUALITY_WEIGHTS = {
  textLength:  0.3,  // Longer thoughtful text
  uniqueness:  0.3,  // Not repeating same content
  diversity:   0.2,  // Varied emoji/origins/times
  socialProof: 0.2,  // Receives waves from others
};

// ── Scoring Functions ────────────────────────────────────────────────────────

function scoreTextLength(text) {
  const len = (text || '').trim().length;
  // 0-10 chars: 0.1 (very low), 10-30: 0.3, 30-80: 0.6, 80-200: 0.8, 200+: 1.0
  if (len >= 200) return 1.0;
  if (len >= 80) return 0.8;
  if (len >= 30) return 0.6;
  if (len >= 10) return 0.3;
  return 0.1;
}

function scoreUniqueness(text, previousTexts) {
  if (!previousTexts || previousTexts.length === 0) return 0.8; // Assume unique if no history
  if (!text || !text.trim()) return 0.1;

  const lower = text.toLowerCase().trim();

  // Check for exact or near-exact duplicates
  for (const prev of previousTexts) {
    const prevLower = (prev || '').toLowerCase().trim();
    if (prevLower === lower) return 0.1; // Exact duplicate

    // Jaccard similarity for near-duplicates
    const words1 = new Set(lower.split(/\s+/));
    const words2 = new Set(prevLower.split(/\s+/));
    const intersection = [...words1].filter(w => words2.has(w)).length;
    const union = new Set([...words1, ...words2]).size;
    const similarity = union > 0 ? intersection / union : 0;

    if (similarity > 0.8) return 0.2; // Very similar
    if (similarity > 0.6) return 0.4; // Somewhat similar
  }

  return 1.0; // Unique content
}

function scoreDiversity(emojiCount, originVariety) {
  const emoji = Math.min((emojiCount || 0) / 3, 1) * 0.5;
  const origin = (originVariety || 0.5) * 0.5;
  return Math.max(0.1, emoji + origin);
}

function scoreSocialProof(wavesReceived) {
  const waves = wavesReceived || 0;
  if (waves >= 10) return 1.0;
  if (waves >= 5) return 0.8;
  if (waves >= 2) return 0.6;
  if (waves >= 1) return 0.4;
  return 0.2; // No waves yet (default, not penalized heavily)
}

// ── Grade Assignment ─────────────────────────────────────────────────────────

function getGrade(score) {
  if (score >= 0.9) return 'excellent';
  if (score >= 0.7) return 'good';
  if (score >= 0.5) return 'fair';
  if (score >= 0.3) return 'low';
  return 'minimal';
}

// ── Main Handler ─────────────────────────────────────────────────────────────

export function handle(input) {
  const text = input?.text || '';
  const previousTexts = input?.previousTexts || [];
  const emojiCount = input?.emojiCount || 0;
  const wavesReceived = input?.wavesReceived || 0;
  const originVariety = input?.originVariety || 0.5;

  const textLengthScore = scoreTextLength(text);
  const uniquenessScore = scoreUniqueness(text, previousTexts);
  const diversityScore = scoreDiversity(emojiCount, originVariety);
  const socialProofScore = scoreSocialProof(wavesReceived);

  // Weighted composite
  const score = Math.max(0.1, Math.min(1.0,
    textLengthScore * QUALITY_WEIGHTS.textLength +
    uniquenessScore * QUALITY_WEIGHTS.uniqueness +
    diversityScore * QUALITY_WEIGHTS.diversity +
    socialProofScore * QUALITY_WEIGHTS.socialProof
  ));

  const roundedScore = Math.round(score * 100) / 100;

  return {
    ok: true,
    score: roundedScore,
    grade: getGrade(roundedScore),
    breakdown: {
      textLength: { score: textLengthScore, weight: QUALITY_WEIGHTS.textLength },
      uniqueness: { score: uniquenessScore, weight: QUALITY_WEIGHTS.uniqueness },
      diversity: { score: diversityScore, weight: QUALITY_WEIGHTS.diversity },
      socialProof: { score: socialProofScore, weight: QUALITY_WEIGHTS.socialProof },
    },
  };
}
