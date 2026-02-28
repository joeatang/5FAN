/**
 * 5FAN Community — social-caption
 *
 * Generates platform-optimized captions for sharing Hi-Notes,
 * compass results, gym completions, milestones, etc.
 * Template-based for speed, optional LLM enrichment.
 *
 * Reusable for ALL share flows — any content type + any platform.
 *
 * @param {object} input - { text: string, platform?: string, userName?: string, hashtags?: boolean, cta?: boolean }
 * @returns {Promise<object>} - { ok, caption, platform, hashtags, method }
 */

import { generate } from '../../../server/lm-bridge.js';
import { pick } from '../../../brains/5fan.js';

/** Valid platforms */
const VALID_PLATFORMS = ['instagram', 'x', 'tiktok', 'stories', 'general'];

/** Platform-specific character limits and rules */
const PLATFORM_RULES = {
  instagram: { maxChars: 2200, hashtagLimit: 10, style: 'visual, warm, storytelling' },
  x: { maxChars: 280, hashtagLimit: 3, style: 'punchy, quotable, under 280 chars' },
  tiktok: { maxChars: 4000, hashtagLimit: 5, style: 'raw, authentic, Gen-Z energy' },
  stories: { maxChars: 200, hashtagLimit: 2, style: 'ultra-short, swipe-up energy' },
  general: { maxChars: 500, hashtagLimit: 5, style: 'versatile, warm, authentic' },
};

/** Hashtag pools */
const HASHTAG_POOL = {
  core: ['#StayHi', '#HiNote', '#EQFitness'],
  growth: ['#EmotionalGrowth', '#MentalFitness', '#InnerWork', '#SelfAwareness'],
  community: ['#ShowUp', '#BePresent', '#FeelItAll', '#RealTalk'],
  positivity: ['#GoodVibes', '#Gratitude', '#JoyRide', '#PeacefulMind'],
};

/** Caption templates by emotional energy */
const CAPTION_TEMPLATES = {
  hi: [
    'This feeling right here? Earned. Not given. Earned. ✨',
    'When the inside matches the outside. That\'s today.',
    'No filter needed when you\'re actually feeling yourself.',
    'Note to self: remember this feeling. Come back to it.',
    'The best version of me showed up today. And it was enough.',
  ],
  neutral: [
    'Not the best day. Not the worst. But I\'m here. That counts.',
    'Showing up is the whole point. Even on the messy days.',
    'Somewhere between figuring it out and letting it go.',
    'Today\'s mood: work in progress. And that\'s okay.',
    'Honest check-in with myself. That\'s the whole post.',
  ],
  opportunity: [
    'Hard day. But I\'m still here. And that\'s the win.',
    'Not everything has to be okay for me to show up.',
    'The messy parts are part of the story too.',
    'Some days the goal is just to make it through. Today is that day.',
    'Real talk: this is tough. But I\'m tougher.',
  ],
  general: [
    'Checked in with myself today. Here\'s what came up.',
    'The practice of being honest with yourself. That\'s the rep.',
    'Every emotion has something to teach you. Today I listened.',
    'This is what emotional fitness looks like. No filter.',
    'One check-in at a time. That\'s how you stay hi.',
  ],
};

/**
 * Detect the emotional zone of the text for caption matching.
 */
function detectZone(text) {
  const lower = text.toLowerCase();
  const hiWords = ['grateful', 'happy', 'excited', 'joy', 'peace', 'calm', 'love', 'amazing', 'proud', 'blessed'];
  const oppWords = ['sad', 'angry', 'scared', 'anxious', 'frustrated', 'grief', 'shame', 'lost', 'hurt', 'struggle'];

  let hiScore = 0, oppScore = 0;
  for (const w of hiWords) if (lower.includes(w)) hiScore++;
  for (const w of oppWords) if (lower.includes(w)) oppScore++;

  if (hiScore > oppScore) return 'hi';
  if (oppScore > hiScore) return 'opportunity';
  return 'neutral';
}

/**
 * Select hashtags based on zone and platform.
 */
function selectHashtags(zone, platform, customHashtags) {
  const rules = PLATFORM_RULES[platform] || PLATFORM_RULES.general;
  const limit = rules.hashtagLimit;

  const tags = [...HASHTAG_POOL.core];
  if (zone === 'hi') tags.push(...HASHTAG_POOL.positivity);
  else if (zone === 'opportunity') tags.push(...HASHTAG_POOL.growth);
  else tags.push(...HASHTAG_POOL.community);

  // Shuffle and limit
  const selected = tags.sort(() => Math.random() - 0.5).slice(0, limit);
  return selected;
}

/** System prompt for LLM caption generation */
const CAPTION_SYSTEM_PROMPT = [
  'You are a social media copywriter for the Stay Hi emotional fitness app.',
  '',
  'RULES:',
  '- Write in first person, as if the user is sharing their own moment.',
  '- Authentic, not cringey. No toxic positivity.',
  '- Match the platform style.',
  '- DO NOT include hashtags (those are added separately).',
  '- NO emojis unless the platform is Instagram or TikTok (then max 2).',
  '- The caption should make someone stop scrolling.',
].join('\n');

export async function handle(input) {
  const { text, platform = 'general', userName, hashtags: includeHashtags = true, cta = true } = input || {};

  if (!text) {
    return { ok: false, error: 'text is required.' };
  }

  const normalizedPlatform = VALID_PLATFORMS.includes(platform) ? platform : 'general';
  const rules = PLATFORM_RULES[normalizedPlatform];
  const zone = detectZone(text);

  // Try LLM first
  const prompt = [
    `PLATFORM: ${normalizedPlatform} (style: ${rules.style})`,
    `MAX CHARS: ${rules.maxChars}`,
    `CONTEXT: User shared this on Stay Hi:`,
    `"${text}"`,
    userName ? `USERNAME: ${userName}` : '',
    '',
    `Write a ${normalizedPlatform} caption for sharing this moment. Match the platform energy.`,
  ].filter(Boolean).join('\n');

  const llmResult = await generate(CAPTION_SYSTEM_PROMPT, prompt, {
    maxTokens: Math.min(rules.maxChars / 2, 200),
    temperature: 0.8,
  });

  let caption;
  let method;

  if (llmResult) {
    // Truncate to platform limit
    caption = llmResult.slice(0, rules.maxChars);
    method = 'llm';
  } else {
    // Template fallback
    const templates = CAPTION_TEMPLATES[zone] || CAPTION_TEMPLATES.general;
    caption = pick(templates);
    method = 'template';
  }

  // Add CTA if requested
  if (cta) {
    const ctaText = normalizedPlatform === 'x'
      ? ' 🔗 stayhi.app'
      : normalizedPlatform === 'stories'
      ? '\n\n⬆️ Swipe up to try Stay Hi'
      : '\n\nMade with Stay Hi — emotional fitness for real life.';

    if ((caption + ctaText).length <= rules.maxChars) {
      caption += ctaText;
    }
  }

  // Build hashtags
  const tags = includeHashtags ? selectHashtags(zone, normalizedPlatform) : [];

  return {
    ok: true,
    caption,
    platform: normalizedPlatform,
    zone,
    hashtags: tags,
    method,
    charCount: caption.length,
    maxChars: rules.maxChars,
  };
}
