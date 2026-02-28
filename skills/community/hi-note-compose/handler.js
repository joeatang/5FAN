/**
 * 5FAN Community — hi-note-compose
 *
 * Orchestrator skill: assembles a complete Hi-Note payload from a user's
 * share text. Chains emotion-scan → content-elevate internally, then
 * assembles pose, doodles, title bubble, palette, and footer.
 *
 * Returns a render-ready payload for the frontend Hi-Note canvas renderer.
 * No LLM itself — delegates text elevation to content-elevate.
 *
 * @param {object} input - { text: string, replyText?: string, userName?: string, origin?: string }
 * @returns {Promise<object>} - { ok, note: { elevated, pose, doodles, palette, title, footer } }
 */

import { handle as emotionScan } from '../../eq-engine/emotion-scan/handler.js';
import { handle as contentElevate } from '../../coach/content-elevate/handler.js';
import { FAMILY_MAP } from '../../eq-engine/data/emotion-families.js';

/** Hi5FAN pose options — each tied to an emotional zone */
const POSES = {
  hi: [
    { id: 'celebrating', label: 'Celebrating', asset: 'pose_celebrating.svg' },
    { id: 'reaching_up', label: 'Reaching Up', asset: 'pose_reaching_up.svg' },
    { id: 'dancing', label: 'Dancing', asset: 'pose_dancing.svg' },
  ],
  neutral: [
    { id: 'sitting', label: 'Sitting Thoughtfully', asset: 'pose_sitting.svg' },
    { id: 'walking', label: 'Walking Forward', asset: 'pose_walking.svg' },
    { id: 'reflecting', label: 'Reflecting', asset: 'pose_reflecting.svg' },
  ],
  opportunity: [
    { id: 'holding', label: 'Holding Gently', asset: 'pose_holding.svg' },
    { id: 'breathing', label: 'Breathing', asset: 'pose_breathing.svg' },
    { id: 'grounding', label: 'Grounding', asset: 'pose_grounding.svg' },
  ],
};

/** Doodle elements per emotional zone */
const DOODLES = {
  hi: ['stars', 'sparkles', 'confetti', 'sunburst', 'hearts'],
  neutral: ['waves', 'clouds', 'leaves', 'dots', 'lines'],
  opportunity: ['rain', 'roots', 'stones', 'cocoon', 'seeds'],
};

/** Color palettes per emotional zone */
const PALETTES = {
  hi: {
    background: '#FEF3E2',
    text: '#1A1A1A',
    accent: '#F59E0B',
    secondary: '#FCD34D',
    name: 'Golden Warmth',
  },
  neutral: {
    background: '#F0F4F8',
    text: '#1A1A1A',
    accent: '#6B7280',
    secondary: '#9CA3AF',
    name: 'Soft Slate',
  },
  opportunity: {
    background: '#EDE9FE',
    text: '#1A1A1A',
    accent: '#7C3AED',
    secondary: '#A78BFA',
    name: 'Deep Violet',
  },
};

/** Pick a random element from an array */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Pick N unique random elements */
function pickN(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

/**
 * Determine emotional zone from emotion scan results.
 */
function resolveZone(scanResult) {
  if (!scanResult.ok || scanResult.matchCount === 0) return 'neutral';
  return scanResult.dominantCategory || 'neutral';
}

export async function handle(input) {
  const { text, replyText, userName, origin } = input || {};

  if (!text) {
    return { ok: false, error: 'text is required.' };
  }

  // ── Step 1: Emotion Scan ────────────────────────────────────────
  const scan = emotionScan({ text });
  const zone = resolveZone(scan);
  const familyId = scan.ok && scan.families?.length > 0
    ? scan.families[0].id
    : null;

  // ── Step 2: Content Elevation ───────────────────────────────────
  const elevation = await contentElevate({
    text: replyText || text, // Elevate the reply if available, otherwise the original
    familyId,
  });

  // ── Step 3: Assemble Hi-Note Payload ────────────────────────────
  const pose = pick(POSES[zone] || POSES.neutral);
  const doodles = pickN(DOODLES[zone] || DOODLES.neutral, 3);
  const palette = PALETTES[zone] || PALETTES.neutral;

  // Title bubble — the family label or a default
  const family = familyId ? FAMILY_MAP[familyId] : null;
  const titleBubble = family
    ? { text: family.label, emoji: family.emoji }
    : { text: 'Moment', emoji: '✨' };

  // Footer — attribution
  const footer = {
    app: 'Stay Hi',
    tagline: 'Your emotional compass',
    userName: userName || null,
    origin: origin || 'share',
    timestamp: new Date().toISOString(),
  };

  return {
    ok: true,
    note: {
      elevated: elevation.ok ? elevation.elevated : text,
      original: text,
      method: elevation.method || 'fallback',
      pose,
      doodles,
      palette,
      titleBubble,
      footer,
      zone,
    },
    emotionScan: scan.ok ? {
      matchCount: scan.matchCount,
      families: scan.families,
      hiScale: scan.hiScale,
      dominantCategory: scan.dominantCategory,
    } : null,
    emotionalCore: elevation.ok ? elevation.emotionalCore : null,
  };
}
