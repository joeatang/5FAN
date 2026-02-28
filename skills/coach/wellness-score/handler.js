/**
 * 5FAN AI Coach — wellness-score
 *
 * Computes a composite 0-100 wellness score from multiple dimensions:
 * consistency (streak), emotional range (Hi Scale), engagement (actions),
 * growth (gym/shift sessions), and community (shares/reactions).
 *
 * Pure data skill — no LLM, deterministic scoring.
 *
 * @param {object} input
 *   - stats: object — user stats
 *     - streak: number — current streak days
 *     - hiIndex: number — Hi Index (1-5)
 *     - totalCheckins: number — lifetime check-ins
 *     - gymSessions: number — lifetime gym sessions
 *     - shiftSessions: number — lifetime shift sessions
 *     - totalShares: number — lifetime shares
 *     - totalReactions: number — lifetime reactions received
 *     - tier: string — current tier
 *     - daysActive: number — total days on platform
 * @returns {object}
 *   - { ok, score, grade, dimensions, breakdown, insights }
 */

// ── Dimension Weights ────────────────────────────────────────────────────────

const WEIGHTS = {
  consistency: 0.30,  // Streak + check-in regularity
  emotional:   0.25,  // Hi Index + emotional range
  engagement:  0.20,  // Total actions + activity level
  growth:      0.15,  // Gym + Shift sessions (deeper work)
  community:   0.10,  // Shares + reactions (social health)
};

// ── Scoring Functions (each returns 0-100) ───────────────────────────────────

function scoreConsistency(stats) {
  const streak = stats?.streak || 0;
  const totalCheckins = stats?.totalCheckins || 0;
  const daysActive = stats?.daysActive || 1;

  // Streak score: 0-60 points (30-day cap = full marks)
  const streakScore = Math.min(streak / 30, 1) * 60;

  // Check-in regularity: checkins / daysActive (0-40 points)
  const regularity = Math.min(totalCheckins / Math.max(daysActive, 1), 1);
  const regularityScore = regularity * 40;

  return Math.round(streakScore + regularityScore);
}

function scoreEmotional(stats) {
  const hiIndex = stats?.hiIndex ?? 3;

  // HiIndex normalized to 0-100 (1-5 scale → 0-100)
  // Optimal is 3-4 (balanced), extreme high or low gets partial credit
  // Distribution: 1→20, 2→40, 3→75, 4→90, 5→80 (not perfect — too-high may indicate avoidance)
  const indexMap = { 1: 20, 2: 40, 3: 75, 4: 90, 5: 80 };
  const rounded = Math.round(Math.max(1, Math.min(5, hiIndex)));
  return indexMap[rounded] || 50;
}

function scoreEngagement(stats) {
  const totalCheckins = stats?.totalCheckins || 0;
  const daysActive = stats?.daysActive || 1;

  // Activity density: actions per active day
  const density = totalCheckins / Math.max(daysActive, 1);
  // 1+ actions/day = full marks, caps at 100
  return Math.round(Math.min(density, 1) * 100);
}

function scoreGrowth(stats) {
  const gymSessions = stats?.gymSessions || 0;
  const shiftSessions = stats?.shiftSessions || 0;
  const total = gymSessions + shiftSessions;

  // Growth work: 10+ sessions = full marks
  // 1 session = 10pts, 5 = 50pts, 10+ = 100pts
  return Math.round(Math.min(total / 10, 1) * 100);
}

function scoreCommunity(stats) {
  const totalShares = stats?.totalShares || 0;
  const totalReactions = stats?.totalReactions || 0;

  // Shares: 10+ = half marks
  const shareScore = Math.min(totalShares / 10, 1) * 50;

  // Reactions received: 20+ = half marks
  const reactionScore = Math.min(totalReactions / 20, 1) * 50;

  return Math.round(shareScore + reactionScore);
}

// ── Grade Assignment ─────────────────────────────────────────────────────────

function getGrade(score) {
  if (score >= 90) return { grade: 'A+', label: 'Thriving', emoji: '🌟' };
  if (score >= 80) return { grade: 'A', label: 'Flourishing', emoji: '✨' };
  if (score >= 70) return { grade: 'B+', label: 'Growing', emoji: '🌱' };
  if (score >= 60) return { grade: 'B', label: 'Steady', emoji: '📊' };
  if (score >= 50) return { grade: 'C+', label: 'Building', emoji: '🔨' };
  if (score >= 40) return { grade: 'C', label: 'Warming Up', emoji: '🌤️' };
  if (score >= 30) return { grade: 'D', label: 'Getting Started', emoji: '🏃' };
  return { grade: 'F', label: 'Just Beginning', emoji: '🌅' };
}

// ── Insight Generator ────────────────────────────────────────────────────────

function generateInsights(dimensions) {
  const insights = [];
  const sorted = Object.entries(dimensions)
    .sort((a, b) => b[1].score - a[1].score);

  // Strength
  const strongest = sorted[0];
  if (strongest[1].score >= 60) {
    insights.push(`Your strongest area is ${strongest[0]} (${strongest[1].score}/100). Keep building on that.`);
  }

  // Opportunity
  const weakest = sorted[sorted.length - 1];
  if (weakest[1].score < 50) {
    const tips = {
      consistency: 'Try checking in daily — even a quick medallion tap counts.',
      emotional: 'Your Hi Index reflects how you show up. Use the gym to explore emotional range.',
      engagement: 'Small actions add up. A check-in, a share, a gym session.',
      growth: 'The gym and compass shift are where deeper work happens. Try one this week.',
      community: 'Share a moment on Hi Island. Connection starts with showing up.',
    };
    insights.push(`Your opportunity area is ${weakest[0]} (${weakest[1].score}/100). ${tips[weakest[0]] || ''}`);
  }

  // Balance
  const range = sorted[0][1].score - sorted[sorted.length - 1][1].score;
  if (range < 20) {
    insights.push('Your wellness profile is well-balanced across all dimensions.');
  } else if (range > 50) {
    insights.push('There\'s a gap between your strongest and weakest areas. Focus on the fundamentals.');
  }

  return insights;
}

// ── Main Handler ─────────────────────────────────────────────────────────────

export function handle(input) {
  const stats = input?.stats;
  if (!stats || typeof stats !== 'object') {
    return { ok: false, error: 'stats object is required.' };
  }

  // Score each dimension
  const dimensions = {
    consistency: {
      score: scoreConsistency(stats),
      weight: WEIGHTS.consistency,
      label: 'Consistency',
      description: 'Streak length + check-in regularity',
    },
    emotional: {
      score: scoreEmotional(stats),
      weight: WEIGHTS.emotional,
      label: 'Emotional Health',
      description: 'Hi Index balance + emotional range',
    },
    engagement: {
      score: scoreEngagement(stats),
      weight: WEIGHTS.engagement,
      label: 'Engagement',
      description: 'Activity density + action frequency',
    },
    growth: {
      score: scoreGrowth(stats),
      weight: WEIGHTS.growth,
      label: 'Growth Work',
      description: 'Gym + Shift sessions (deeper processing)',
    },
    community: {
      score: scoreCommunity(stats),
      weight: WEIGHTS.community,
      label: 'Community',
      description: 'Shares + reactions (social connection)',
    },
  };

  // Compute weighted composite score
  let compositeScore = 0;
  for (const [key, dim] of Object.entries(dimensions)) {
    compositeScore += dim.score * dim.weight;
  }
  compositeScore = Math.round(compositeScore);

  // Grade
  const gradeInfo = getGrade(compositeScore);

  // Insights
  const insights = generateInsights(dimensions);

  return {
    ok: true,
    score: compositeScore,
    grade: gradeInfo.grade,
    gradeLabel: gradeInfo.label,
    gradeEmoji: gradeInfo.emoji,
    dimensions,
    insights,
    computedAt: Date.now(),
  };
}
