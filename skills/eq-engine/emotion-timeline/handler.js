/**
 * 5FAN EQ Engine — emotion-timeline (NEW)
 *
 * Accepts timestamped emotion snapshots and produces trend analysis:
 *   - Hi Scale trajectory (rising/falling/stable)
 *   - Inflection points (where significant shifts occurred)
 *   - Week-over-week delta
 *   - Stability score (how volatile the emotional state is)
 *   - Dominant family across the window
 *
 * Pure data skill — no LLM. Designed for longitudinal emotional tracking.
 *
 * @param {object} input - { snapshots: Array<{ ts: number, hiScale: number, familyId: string, blendType?: string }> }
 * @returns {object} - { ok, trajectory, inflections, stability, dominant, delta }
 */

export function handle(input) {
  const { snapshots } = input || {};

  if (!Array.isArray(snapshots) || snapshots.length === 0) {
    return { ok: false, error: 'snapshots (non-empty array) is required. Each: { ts: number, hiScale: number, familyId: string }' };
  }

  if (snapshots.length < 2) {
    const s = snapshots[0];
    return {
      ok: true,
      trajectory: 'insufficient',
      message: 'Need at least 2 snapshots for trend analysis.',
      current: { hiScale: s.hiScale, familyId: s.familyId, ts: s.ts },
    };
  }

  // Sort by timestamp ascending
  const sorted = [...snapshots].sort((a, b) => a.ts - b.ts);

  // --- Trajectory ---
  const firstHalf = sorted.slice(0, Math.ceil(sorted.length / 2));
  const secondHalf = sorted.slice(Math.ceil(sorted.length / 2));
  const avgFirst = firstHalf.reduce((s, x) => s + x.hiScale, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((s, x) => s + x.hiScale, 0) / secondHalf.length;
  const delta = Math.round((avgSecond - avgFirst) * 100) / 100;

  let trajectory;
  if (delta > 0.3) trajectory = 'rising';
  else if (delta < -0.3) trajectory = 'falling';
  else trajectory = 'stable';

  // --- Inflection Points ---
  // An inflection is when the Hi Scale shifts by >= 1.0 between consecutive snapshots
  const inflections = [];
  for (let i = 1; i < sorted.length; i++) {
    const shift = sorted[i].hiScale - sorted[i - 1].hiScale;
    if (Math.abs(shift) >= 1.0) {
      inflections.push({
        ts: sorted[i].ts,
        from: sorted[i - 1].hiScale,
        to: sorted[i].hiScale,
        shift: Math.round(shift * 10) / 10,
        direction: shift > 0 ? 'up' : 'down',
        fromFamily: sorted[i - 1].familyId,
        toFamily: sorted[i].familyId,
      });
    }
  }

  // --- Stability Score (0-100, higher = more stable) ---
  const hiScales = sorted.map(s => s.hiScale);
  const mean = hiScales.reduce((s, x) => s + x, 0) / hiScales.length;
  const variance = hiScales.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / hiScales.length;
  const stdDev = Math.sqrt(variance);
  // Max possible stdDev on 1-5 scale is ~2, normalize to 0-100
  const stability = Math.round(Math.max(0, 100 - (stdDev / 2) * 100));

  // --- Dominant Family ---
  const familyCounts = {};
  for (const s of sorted) {
    familyCounts[s.familyId] = (familyCounts[s.familyId] || 0) + 1;
  }
  const dominant = Object.entries(familyCounts)
    .sort((a, b) => b[1] - a[1])[0];

  // --- Week-over-Week ---
  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
  const now = sorted[sorted.length - 1].ts;
  const thisWeek = sorted.filter(s => now - s.ts < ONE_WEEK);
  const lastWeek = sorted.filter(s => now - s.ts >= ONE_WEEK && now - s.ts < ONE_WEEK * 2);

  let weekDelta = null;
  if (thisWeek.length > 0 && lastWeek.length > 0) {
    const thisAvg = thisWeek.reduce((s, x) => s + x.hiScale, 0) / thisWeek.length;
    const lastAvg = lastWeek.reduce((s, x) => s + x.hiScale, 0) / lastWeek.length;
    weekDelta = Math.round((thisAvg - lastAvg) * 100) / 100;
  }

  return {
    ok: true,
    snapshotCount: sorted.length,
    trajectory,
    delta,
    stability,
    inflections,
    inflectionCount: inflections.length,
    dominant: dominant ? { familyId: dominant[0], count: dominant[1] } : null,
    weekOverWeek: weekDelta,
    current: {
      hiScale: sorted[sorted.length - 1].hiScale,
      familyId: sorted[sorted.length - 1].familyId,
      ts: sorted[sorted.length - 1].ts,
    },
    window: {
      from: sorted[0].ts,
      to: sorted[sorted.length - 1].ts,
      durationMs: sorted[sorted.length - 1].ts - sorted[0].ts,
    },
    averageHiScale: Math.round(mean * 10) / 10,
  };
}
