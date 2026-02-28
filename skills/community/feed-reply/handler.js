/**
 * 5FAN Community — feed-reply
 *
 * Generates a Hi5FAN reply to a user's community feed post.
 * Direct, personal, mirror language — for the user, not for public sharing.
 *
 * Brain-enhanced skill — uses brain swarm analysis + LLM + template fallback.
 *
 * @param {object} input - { text: string, origin?: string, tier?: number, stats?: object }
 * @returns {Promise<object>} - { ok, response, brain, method, brainTags }
 */

import { analyze, analyzeAndRespond, buildEnrichedPrompt } from '../../../server/brain-swarm.js';
import { generate } from '../../../server/lm-bridge.js';
import appContext from '../../../app-context.js';
import { pick } from '../../../brains/5fan.js';

/** Deduplication cache */
const recentHashes = [];
const MAX_RECENT = 30;

function simpleHash(text) {
  const normalized = text.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 100);
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) - hash + normalized.charCodeAt(i)) | 0;
  }
  return String(hash);
}

function isDuplicate(response) {
  const hash = simpleHash(response);
  if (recentHashes.includes(hash)) return true;
  recentHashes.push(hash);
  if (recentHashes.length > MAX_RECENT) recentHashes.shift();
  return false;
}

/** Feed reply system prompt — mirrors the user's language */
const FEED_SYSTEM = [
  'You are Hi5FAN, a community bot in the Stay Hi app.',
  'Your job: reply to a user\'s share/post with a brief, genuine response.',
  '',
  'RULES:',
  '- Mirror their language and energy level.',
  '- 1–2 sentences MAX. Never ramble.',
  '- Use Hi-Speak vocabulary: "Hi Inspo", "Hi Opportunity", "Show Up", "Stay Hi".',
  '- Be direct and personal — this is for them, not for an audience.',
  '- Never start with "Hey!" or generic greetings. Jump straight in.',
  '- If they\'re struggling, acknowledge first — don\'t motivate immediately.',
  '- If they\'re celebrating, amplify — don\'t lecture.',
  '- Never use hashtags or promotional language. Be real.',
].join('\n');

export async function handle(input) {
  const { text, origin, tier, stats } = input || {};

  if (!text || text.trim().length < 3) {
    return { ok: false, error: 'text is required (min 3 characters).' };
  }

  const meta = { origin, tier, stats, channel: 'feed' };

  // Run brain swarm analysis
  const analysis = analyze(text, meta);
  const dominantBrain = analysis.dominantBrain;

  // Build brain tags from analysis
  const brainTags = analysis.scans.map(s => ({
    brain: s.brain,
    signal: s.signal,
    category: s.category,
  })).filter(t => t.signal > 0.2);

  // Try LLM-enriched response
  const enrichedPrompt = buildEnrichedPrompt(appContext, analysis);
  const systemPrompt = FEED_SYSTEM + '\n\n' + enrichedPrompt;

  const llmResult = await generate(systemPrompt, text, {
    maxTokens: 120,
    temperature: 0.75,
  });

  let response;
  let method;

  if (llmResult && !isDuplicate(llmResult)) {
    response = llmResult;
    method = 'llm';
  } else {
    // Template fallback
    const templateResult = analyzeAndRespond(text, meta);
    response = templateResult.response;
    method = 'template';

    if (isDuplicate(response)) {
      // Retry with different context
      const retry = analyzeAndRespond(text, { ...meta, _retry: true });
      response = retry.response;
    }
  }

  return {
    ok: true,
    response,
    brain: dominantBrain,
    method,
    brainTags,
    isCrisis: analysis.scans.some(s => s.isCrisis),
    consensus: analysis.consensus?.consensus || null,
  };
}
