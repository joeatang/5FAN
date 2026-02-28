/**
 * 5FAN AI Coach — journal-prompt
 *
 * Generates emotion-aware journaling prompts using micro-moves, bridge
 * library, and brain analysis. Designed to deepen self-reflection
 * without prescribing direction.
 *
 * Sources: micro-moves (actionable), bridge phrases (reflective),
 *          emotion families (contextual), brain scans (personalized).
 *
 * @param {object} input
 *   - text?: string — user's current emotional expression
 *   - familyId?: string — emotion family to generate prompts for
 *   - emotionId?: string — specific emotion for targeted prompts
 *   - count?: number — number of prompts to generate (default: 3)
 * @returns {Promise<object>}
 *   - { ok, prompts: string[], familyId, method, brainScan? }
 */

import { scan as hearScan } from '../../../brains/hear/functions.js';
import { scan as inspyreScan } from '../../../brains/inspyre/functions.js';
import { FAMILY_MAP, matchFamilyByText } from '../../eq-engine/data/emotion-families.js';
import { BRIDGE_LIBRARY } from '../../eq-engine/data/bridge-library.js';
import { ALL_EMOTIONS } from '../../eq-engine/data/emotions.js';
import { generate } from '../../../server/lm-bridge.js';

// ── Template Prompts by Emotion Family ───────────────────────────────────────

const JOURNAL_TEMPLATES = {
  grief: [
    'What would you say to the version of you that first experienced this loss?',
    'If your grief could speak, what would it want you to know today?',
    'Write about something you still carry from this loss that you haven\'t shared.',
    'What has your grief taught you about what matters most?',
    'Describe a moment when the weight lifted — even briefly. What was happening?',
  ],
  fear: [
    'What\'s the worst case you keep replaying? Write it out fully, then ask: how likely is it?',
    'What would you do today if the fear wasn\'t there? Describe it in detail.',
    'Name three things you\'ve already survived that once felt impossible.',
    'What is the fear protecting you from? Is that protection still needed?',
    'Write a letter to your fear. Thank it for the warning. Then tell it what you\'re choosing instead.',
  ],
  anger: [
    'What boundary was crossed that ignited this? Name it without censoring.',
    'If your anger had a message for someone, what would it say?',
    'Underneath the anger, what else is there? Hurt? Disappointment? Write what\'s below.',
    'What would justice look like for this situation? Not revenge — justice.',
    'Write about a time anger actually served you well. What did it protect?',
  ],
  shame: [
    'Write the thing you\'re afraid someone would think if they really knew you.',
    'Now write what a person who truly loves you would say back.',
    'What rule are you breaking that makes you feel shame? Who made that rule?',
    'Describe the version of you that doesn\'t carry this. What do they do differently?',
    'What would it feel like to accept this part of yourself completely?',
  ],
  frustration: [
    'What gap between expectation and reality is creating this friction?',
    'If progress was guaranteed, what one thing would you change right now?',
    'Write about a past frustration that eventually led somewhere good.',
    'What\'s one thing you CAN control about this situation? Start there.',
    'Describe what "enough progress" looks like — not perfection, just enough.',
  ],
  doubt: [
    'List five things you know for certain about yourself. Not opinions — facts.',
    'What decision are you avoiding? Write both options and how each feels.',
    'When was the last time you trusted yourself and it worked out? What did you know then?',
    'If you could get advice from the future version of you, what would they say?',
    'Write about a time uncertainty actually opened a better door.',
  ],
  disconnect: [
    'Describe where you are emotionally right now in physical terms. (Heavy? Floating? Numb?)',
    'What\'s one thing you used to enjoy that you haven\'t done recently?',
    'Write about a person you feel connected to. What makes that connection real?',
    'If you could feel one emotion right now, which would you choose? Why?',
    'What small act of care could you do for yourself in the next hour?',
  ],
  peace: [
    'What contributed to this calm? Name the conditions.',
    'Write a note to yourself for harder days. What do you want to remember from this moment?',
    'What practice or habit brought you here? How can you protect it?',
    'Describe how this peace feels in your body. Where do you feel it?',
    'What\'s one thing you\'re grateful for right now that you might normally overlook?',
  ],
  drive: [
    'What\'s fueling this energy? Name the source.',
    'Where do you want this momentum to take you? Be specific.',
    'What could derail this drive? Write a plan to protect it.',
    'Describe how it feels to be in this flow. Capture it for later.',
    'What would you build if this energy stayed? Dream out loud.',
  ],
  joy: [
    'What triggered this feeling? Name the exact moment.',
    'Who would you want to share this with? Write it as if telling them.',
    'How can you create more moments like this intentionally?',
    'Write about what you\'re most proud of right now.',
    'If this joy had a soundtrack, what would be playing?',
  ],
};

/** Default prompts when no family is resolved */
const DEFAULT_PROMPTS = [
  'What\'s taking up the most space in your mind right now? Write without editing.',
  'If you could change one thing about today, what would it be and why?',
  'Describe how you\'re feeling using only metaphors. No emotion words — just images.',
  'What has surprised you about yourself recently?',
  'Write about something you\'d like to let go of. What does holding it cost you?',
];

function pickRandom(arr, count = 1) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ── Resolve Family ───────────────────────────────────────────────────────────

function resolveFamily(input) {
  // Direct family ID
  if (input.familyId && JOURNAL_TEMPLATES[input.familyId]) {
    return input.familyId;
  }

  // Via emotion ID
  if (input.emotionId) {
    const emotion = ALL_EMOTIONS.find(e => e.id === input.emotionId);
    if (emotion?.family && JOURNAL_TEMPLATES[emotion.family]) {
      return emotion.family;
    }
  }

  // Via text analysis
  if (input.text) {
    const match = matchFamilyByText(input.text);
    if (match?.id && JOURNAL_TEMPLATES[match.id]) {
      return match.id;
    }
  }

  return null;
}

// ── Main Handler ─────────────────────────────────────────────────────────────

export async function handle(input) {
  const count = Math.min(input?.count || 3, 5);

  // Resolve emotional territory
  const familyId = resolveFamily(input);
  const text = input?.text || '';

  // Brain analysis for personalization (if text provided)
  let brainScan = null;
  if (text.trim()) {
    const hear = hearScan(text, {});
    const inspyre = inspyreScan(text, {});
    brainScan = {
      emotions: hear.emotions || [],
      signal: hear.signal || 0,
      themes: inspyre.themes || [],
    };
  }

  // Try LLM for personalized prompts
  let prompts = null;
  let method = 'template';

  if (text.trim()) {
    const familyLabel = familyId
      ? (FAMILY_MAP[familyId]?.name || familyId)
      : 'their emotional state';

    const brainContext = brainScan?.emotions?.length
      ? `Detected emotions: ${brainScan.emotions.join(', ')}`
      : '';

    const llmPrompt = `Generate ${count} journaling prompts for someone expressing: "${text.slice(0, 300)}"

Emotional territory: ${familyLabel}
${brainContext}

RULES:
- Questions that deepen self-reflection, not advice
- Mix of introspective, expressive, and forward-looking
- No therapy-speak. Direct, clear language.
- Each prompt is 1-2 sentences max
- Return ONLY the numbered prompts, nothing else.`;

    try {
      const llmResponse = await generate(llmPrompt, '', { maxTokens: 300, temperature: 0.8 });
      if (llmResponse && llmResponse.length > 30) {
        // Parse numbered list
        const parsed = llmResponse
          .split(/\n/)
          .map(l => l.replace(/^\d+[\.\)]\s*/, '').trim())
          .filter(l => l.length > 10 && l.length < 200);

        if (parsed.length >= count) {
          prompts = parsed.slice(0, count);
          method = 'llm';
        }
      }
    } catch {
      // Fall through
    }
  }

  // Template fallback
  if (!prompts) {
    const pool = familyId
      ? JOURNAL_TEMPLATES[familyId]
      : DEFAULT_PROMPTS;
    prompts = pickRandom(pool, count);
  }

  return {
    ok: true,
    prompts,
    familyId: familyId || 'general',
    promptCount: prompts.length,
    method,
    ...(brainScan && { brainScan }),
  };
}
