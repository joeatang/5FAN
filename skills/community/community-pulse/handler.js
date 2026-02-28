/**
 * 5FAN Community — community-pulse
 *
 * Computes a community-level emotional summary from aggregate user stats.
 * Returns the Community Hi Index, dominant trends, deltas from previous period.
 *
 * Pure data skill — no LLM, no brains.
 *
 * @param {object} input - { stats: { activeUsers, totalShares, avgHiScale, topFamilies, ... }, previous?: object }
 * @returns {object} - { ok, hiIndex, summary, trends, deltas }
 */

const FAMILY_LABELS = {
  grief: 'Grief & Loss', fear: 'Fear & Anxiety', anger: 'Anger & Rage',
  shame: 'Shame & Guilt', frustration: 'Frustration', doubt: 'Doubt & Uncertainty',
  disconnect: 'Disconnect', peace: 'Peace & Calm', drive: 'Drive & Motivation',
  joy: 'Joy & Gratitude',
};

/**
 * Compute community Hi Index (0-100) from stats.
 * Weighted: avgHiScale (40%), engagement (30%), emotional diversity (30%).
 */
function computeHiIndex(stats) {
  // Average Hi Scale contribution (1-5 → 0-100)
  const scaleScore = Math.min(((stats.avgHiScale || 3) - 1) / 4 * 100, 100);

  // Engagement: shares per active user (capped at 10 → 100)
  const sharesPerUser = stats.activeUsers > 0
    ? (stats.totalShares || 0) / stats.activeUsers
    : 0;
  const engagementScore = Math.min(sharesPerUser / 10 * 100, 100);

  // Emotional diversity: how many families represented (out of 10)
  const familyCount = stats.topFamilies ? Object.keys(stats.topFamilies).length : 0;
  const diversityScore = Math.min(familyCount / 10 * 100, 100);

  return Math.round(scaleScore * 0.4 + engagementScore * 0.3 + diversityScore * 0.3);
}

/**
 * Determine community mood label from Hi Index.
 */
function moodLabel(hiIndex) {
  if (hiIndex >= 80) return 'Thriving';
  if (hiIndex >= 65) return 'Growing';
  if (hiIndex >= 50) return 'Steady';
  if (hiIndex >= 35) return 'Processing';
  return 'Seeking';
}

/**
 * Pick the trending direction based on top families.
 */
function trendDirection(topFamilies) {
  if (!topFamilies) return 'neutral';
  const families = Object.entries(topFamilies).sort((a, b) => b[1] - a[1]);
  if (families.length === 0) return 'neutral';

  const top = families[0][0];
  const hiInspoFamilies = ['peace', 'drive', 'joy'];
  const opportunityFamilies = ['grief', 'fear', 'anger', 'shame'];

  if (hiInspoFamilies.includes(top)) return 'rising';
  if (opportunityFamilies.includes(top)) return 'navigating';
  return 'processing';
}

export function handle(input) {
  const { stats, previous } = input || {};

  if (!stats) {
    return { ok: false, error: 'stats object is required. Include: activeUsers, totalShares, avgHiScale, topFamilies.' };
  }

  const hiIndex = computeHiIndex(stats);
  const mood = moodLabel(hiIndex);
  const trend = trendDirection(stats.topFamilies);

  // Format top families for display
  const topFamilies = stats.topFamilies
    ? Object.entries(stats.topFamilies)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([fid, count]) => ({
          familyId: fid,
          label: FAMILY_LABELS[fid] || fid,
          count,
        }))
    : [];

  // Compute deltas if previous stats provided
  let deltas = null;
  if (previous) {
    const prevIndex = computeHiIndex(previous);
    deltas = {
      hiIndex: hiIndex - prevIndex,
      activeUsers: (stats.activeUsers || 0) - (previous.activeUsers || 0),
      totalShares: (stats.totalShares || 0) - (previous.totalShares || 0),
      avgHiScale: Math.round(((stats.avgHiScale || 3) - (previous.avgHiScale || 3)) * 10) / 10,
    };
  }

  // Generate summary sentence
  const summaryParts = [`Community mood: ${mood} (Hi Index: ${hiIndex}/100).`];
  if (stats.activeUsers) summaryParts.push(`${stats.activeUsers} active users.`);
  if (topFamilies.length > 0) {
    summaryParts.push(`Most shared: ${topFamilies.slice(0, 3).map(f => f.label).join(', ')}.`);
  }
  if (deltas) {
    const arrow = deltas.hiIndex > 0 ? '↑' : deltas.hiIndex < 0 ? '↓' : '→';
    summaryParts.push(`Trend: ${arrow} ${Math.abs(deltas.hiIndex)} from previous period.`);
  }

  return {
    ok: true,
    hiIndex,
    mood,
    trend,
    summary: summaryParts.join(' '),
    topFamilies,
    stats: {
      activeUsers: stats.activeUsers || 0,
      totalShares: stats.totalShares || 0,
      avgHiScale: stats.avgHiScale || 3,
    },
    deltas,
  };
}
