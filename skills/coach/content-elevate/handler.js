/**
 * 5FAN AI Coach — content-elevate
 *
 * Transforms raw text into elevated, poetic prose — the "Dear friend..."
 * written voice of Hi5FAN. This is for public sharing (Hi-Notes), NOT
 * for direct replies (those use feed-reply which mirrors language).
 *
 * Key distinction:
 *   feed-reply = conversational, direct, mirrors the user → for the user
 *   content-elevate = poetic, universal, elevated → for strangers seeing a Hi-Note
 *
 * Brain-enhanced skill — uses Hear + Inspyre brains + LLM + template fallback.
 *
 * @param {object} input - { text: string, familyId?: string, tone?: string, format?: string }
 * @returns {Promise<object>} - { ok, elevated, original, method, tone, emotionalCore }
 */

import { scan as hearScan } from '../../../brains/hear/functions.js';
import { scan as inspyreScan } from '../../../brains/inspyre/functions.js';
import { FAMILY_MAP, matchFamilyByText } from '../../eq-engine/data/emotion-families.js';
import { generate } from '../../../server/lm-bridge.js';
import { pick } from '../../../brains/5fan.js';

/** Elevated prose templates — grouped by emotional territory */
const ELEVATED_TEMPLATES = {
  grief: [
    'Dear friend — the weight you carry is proof that something mattered so deeply it shaped you. That\'s not weakness. That\'s love, still alive.',
    'There are days when the absence fills the room. Today might be one. And still — you showed up. That quiet courage is everything.',
    'What you\'ve lost has become part of you. Not as a wound that stays open, but as a mark that says: I loved enough to grieve.',
  ],
  fear: [
    'Dear friend — your fear is not a wall. It\'s a doorway wearing a disguise. The bravest thing isn\'t feeling fearless. It\'s walking forward while afraid.',
    'Somewhere beneath the noise of "what if" is a quieter voice saying "but what if it works?" Today, we listen to that one.',
    'The anxiety is loud right now. But you\'re louder. You\'re still here, still choosing, still showing up despite the alarm bells.',
  ],
  anger: [
    'Dear friend — this fire inside you is information. It\'s saying: something matters here. Something deserves to be protected. Honor that.',
    'Your anger isn\'t the enemy. It\'s the part of you that refuses to accept what isn\'t right. Channel it. Let it build something.',
    'Right now, everything feels like a fight. But not every battle needs a war. Sometimes the bravest thing is choosing which hill to claim.',
  ],
  shame: [
    'Dear friend — the voice telling you that you\'re not enough has been lying. You are the evidence of your own worthiness, simply by being here.',
    'Shame says "hide." But showing up — even imperfectly — is an act of defiance. You showed up today and that is rebellion.',
    'Whatever story you\'re telling yourself right now — it\'s the old version. You\'re writing a new one. Start with: I\'m still here.',
  ],
  frustration: [
    'Dear friend — the gap between where you are and where you want to be isn\'t failure. It\'s fuel. Every step counts, even the ones that feel backward.',
    'Frustration is just ambition without movement. Today, take one step. Not the perfect step. Just the next one.',
    'The stuck feeling is temporary. Underneath it, something is building. Trust the process — even when the process feels untrustworthy.',
  ],
  doubt: [
    'Dear friend — uncertainty isn\'t the absence of knowing. It\'s the presence of possibility. What if the not-knowing is making room for something better?',
    'Doubt says "you can\'t." But your track record says otherwise. You\'ve survived every uncertain moment before this one.',
    'The questions you\'re asking are proof that you care enough to wonder. That\'s not indecision. That\'s wisdom in formation.',
  ],
  disconnect: [
    'Dear friend — feeling disconnected doesn\'t mean you\'re lost. Sometimes you have to step back to see the whole picture. You\'re finding your way.',
    'The numbness is your mind taking a breath. It\'s okay to be here. Not every moment needs to be felt at full volume.',
    'Right now, the world feels far away. But you reached out — and that bridge you just built is the beginning of connection.',
  ],
  peace: [
    'Dear friend — this calm you\'re feeling? You earned it. Not by force, but by choosing to be present. Stay here a little longer.',
    'In the stillness, you are exactly who you need to be. No proving. No performing. Just being. This is the real you.',
    'Peace isn\'t the absence of problems. It\'s the presence of perspective. And today, you have it. Hold onto this moment.',
  ],
  drive: [
    'Dear friend — this fire isn\'t burning out. It\'s burning forward. Every ounce of energy you pour into this matters. Keep moving.',
    'The motivation you\'re feeling right now is rare and real. Don\'t question it. Ride it. Let it take you somewhere you\'ve never been.',
    'You\'re in the zone where intention meets action. This is where change happens. This is where you happen.',
  ],
  joy: [
    'Dear friend — this feeling you have right now? You don\'t have to earn it. You don\'t have to justify it. Just let it be yours.',
    'Joy isn\'t a destination you arrive at. It\'s a moment you let in. And right now, you\'re letting it in. Beautiful.',
    'The gratitude in your heart is contagious. Share it freely. The world is better because you\'re feeling this way right now.',
  ],
};

/** Default templates when no family is resolved */
const DEFAULT_TEMPLATES = [
  'Dear friend — whatever you\'re carrying right now, know this: showing up is enough. Being here is enough. You are enough.',
  'In a world that asks you to be everything, you chose to be honest. That takes more courage than most people ever show.',
  'This moment — right here — is yours. Not perfect. Not polished. Just real. And that\'s the most beautiful thing.',
  'Dear friend — the fact that you felt something deeply enough to share it means you\'re more alive than you think. Keep feeling.',
  'You don\'t have to have it all figured out. You just have to keep showing up. And today, you did.',
];

/** System prompt for LLM elevation */
const ELEVATE_SYSTEM_PROMPT = [
  'You are the written voice of Hi5FAN — creating beautiful, shareable prose.',
  '',
  'VOICE:',
  '- Warm, poetic, universal — like a letter from a wise friend.',
  '- Start with "Dear friend —" or similar intimate opening.',
  '- Speak to the FEELING, not the situation (strangers will read this).',
  '- Make the reader feel seen, without knowing the details.',
  '',
  'RULES:',
  '- 2-3 sentences max. Every word matters.',
  '- NO hashtags, NO emojis, NO promotional language.',
  '- NO therapy-speak ("boundaries", "trauma response", "holding space").',
  '- Use concrete images over abstract concepts.',
  '- The tone should feel like something you\'d write in a handwritten letter.',
  '- This is for a Hi-Note (shareable branded graphic) — make it timeless.',
].join('\n');

export async function handle(input) {
  const { text, familyId, tone, format } = input || {};

  if (!text) {
    return { ok: false, error: 'text is required.' };
  }

  // Detect emotional territory
  const hear = hearScan(text);
  const inspyre = inspyreScan(text);

  // Resolve family (explicit or detected)
  let resolvedFamily = familyId;
  if (!resolvedFamily) {
    const familyMatch = matchFamilyByText(text);
    if (familyMatch) resolvedFamily = familyMatch.id;
  }

  const family = resolvedFamily ? FAMILY_MAP[resolvedFamily] : null;
  const emotionalCore = {
    family: resolvedFamily || 'unknown',
    label: family?.label || 'General',
    hearSignal: hear.signal,
    hearCategory: hear.category,
    inspyreSignal: inspyre.signal,
    isCrisis: hear.isCrisis || false,
  };

  // Build LLM prompt with emotional context
  const emotionContext = resolvedFamily
    ? `\nEmotional territory: ${family?.label || resolvedFamily}`
    : '';
  const toneContext = tone ? `\nTone preference: ${tone}` : '';

  const prompt = [
    'ORIGINAL TEXT (from user\'s share):',
    `"${text}"`,
    emotionContext,
    toneContext,
    '',
    'Transform this into elevated, shareable prose for a Hi-Note.',
  ].filter(Boolean).join('\n');

  // Try LLM elevation
  const llmResult = await generate(ELEVATE_SYSTEM_PROMPT, prompt, {
    maxTokens: 200,
    temperature: 0.8,
  });

  if (llmResult) {
    return {
      ok: true,
      elevated: llmResult,
      original: text,
      method: 'llm',
      emotionalCore,
    };
  }

  // Template fallback — pick from family-specific or default templates
  const templates = resolvedFamily && ELEVATED_TEMPLATES[resolvedFamily]
    ? ELEVATED_TEMPLATES[resolvedFamily]
    : DEFAULT_TEMPLATES;

  return {
    ok: true,
    elevated: pick(templates),
    original: text,
    method: 'template',
    emotionalCore,
  };
}
