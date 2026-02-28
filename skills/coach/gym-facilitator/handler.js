/**
 * 5FAN AI Coach — gym-facilitator
 *
 * Facilitates the 8-step Hi Gym session conversationally.
 * Stateful: tracks gymStep (1-8) per session. Each call advances one step.
 *
 * Uses brain swarm analysis per step to personalize facilitation,
 * LLM for contextual prompts, template fallback when LLM unavailable.
 *
 * References:
 *   - hi-gym-method.js (GYM_STEPS, GYM_FACILITATION_PROMPT, HI_SCALE)
 *   - trainer-api.js (gym mode logic, brain-per-step analysis)
 *   - nudge-engine.js (Hi-speak patterns)
 *
 * @param {object} input
 *   - text: string — user's response to current step
 *   - gymStep: number — current step (1-8), 0 = start new session
 *   - sessionHistory?: string[] — prior user messages in this session
 *   - brainContext?: object — external brain analysis to incorporate
 * @returns {Promise<object>}
 *   - { ok, gymStep, stepTitle, prompt, facilitation, method, sessionComplete }
 */

import { scan as hearScan } from '../../../brains/hear/functions.js';
import { scan as inspyreScan } from '../../../brains/inspyre/functions.js';
import { scan as flowScan } from '../../../brains/flow/functions.js';
import { generate } from '../../../server/lm-bridge.js';
import { BRIDGE_LIBRARY } from '../../eq-engine/data/bridge-library.js';

// ── Hi Scale Reference (inline for standalone skill) ─────────────────────────

const HI_SCALE = {
  opportunity: {
    range: '1–2',
    label: 'Hi Opportunity',
    emotions: [
      'Fear', 'Grief', 'Powerlessness', 'Insecurity', 'Guilt',
      'Unworthiness', 'Jealousy', 'Hatred', 'Rage', 'Anger',
      'Revenge', 'Blame', 'Worry', 'Doubt', 'Discouragement',
      'Overwhelm', 'Frustration', 'Irritation', 'Impatience', 'Pessimism',
    ],
  },
  neutral: {
    range: '3',
    label: 'Neutral',
    emotions: ['Boredom', 'Contentment', 'Acceptance', 'Stability', 'Neutral'],
  },
  hiEnergy: {
    range: '4–5',
    label: 'Hi Energy',
    emotions: [
      'Hopefulness', 'Optimism', 'Positive Expectation', 'Belief',
      'Enthusiasm', 'Eagerness', 'Happiness', 'Passion', 'Love',
      'Appreciation', 'Empowerment', 'Freedom', 'Joy', 'Clarity',
      'Confidence', 'Calm',
    ],
  },
};

// ── 8-Step Gym Definition ────────────────────────────────────────────────────

const GYM_STEPS = [
  null, // Step 0: not started

  { id: 'subject', title: 'Step Into the Hi Gym',
    core: 'What am I thinking about right now?',
    instruction: 'Pause. No fixing. Just name the subject or situation that\'s on your mind.',
    facilitation: 'Don\'t over-explain. Let them name it. Short and raw is perfect.',
  },
  { id: 'writeout', title: 'Write It Out',
    core: 'Write 5–6 honest sentences about what\'s going on.',
    instruction: 'Writing forces your thoughts to slow down. Stream of consciousness — don\'t filter.',
    facilitation: 'If they write less than 3 sentences, gently nudge: "Keep going — what else is there?"',
  },
  { id: 'diagnosis', title: 'Diagnosis — Finding Your Set Point',
    core: 'Read each sentence you wrote. What emotion does it carry?',
    instruction: 'Label emotions — turns the subjective into the objective. No wrong answers.',
    facilitation: 'If the brain detected emotions, reflect those back: "I\'m picking up on some frustration. What do you see?"',
  },
  { id: 'setpoint', title: 'Current Emotional Set Point',
    core: 'Name your current emotional set point — one summarized feeling.',
    instruction: 'A set point is where your thoughts keep returning to. Name it to guide it.',
    facilitation: 'Help them synthesize, not pick "the right answer."',
  },
  { id: 'target', title: 'Setting Your Hi Target',
    core: 'Choose the next relieving emotion — one step Hi\'r on the scale.',
    instruction: 'The goal is relief, not perfection. One notch that feels reachable.',
    facilitation: 'If they try to jump from 1 to 5, ground them: "What about one step closer?"',
  },
  { id: 'bridge', title: 'The Bridge',
    core: 'Write sentences that help your mind logically accept this new emotional position.',
    instruction: 'This is how emotional momentum shifts. Talk to your future self.',
    facilitation: 'This is the sacred moment. Honor their words. Weave in detected patterns.',
  },
  { id: 'newsetpoint', title: 'New Emotional Set Point',
    core: 'Read your bridge. Where do you feel now on the Hi Scale? Has it shifted?',
    instruction: 'Even a small shift is real movement.',
    facilitation: 'Celebrate ANY shift. Even "slightly less angry" is data.',
  },
  { id: 'own', title: 'Own Your New Set Point',
    core: 'Circle the emotion. Say it out loud. Give yourself a Hi5.',
    instruction: 'You just did real emotional work. Own that.',
    facilitation: 'Celebration + closure. Offer to share as a Hi Moment.',
  },
];

// ── Template Fallback Prompts (per step) ─────────────────────────────────────

const STEP_TEMPLATES = [
  null,
  // Step 1: Subject
  [
    'Hi. Welcome to the Hi Gym. Name the subject or situation on your mind right now — a few words, no fixing needed. Stay Hi ✋',
    'Hi. You\'re in the gym. What\'s on your mind right now? Just name it — short and raw. Hi5 ✋',
  ],
  // Step 2: Write It Out
  [
    'Got it. Now write 5-6 honest sentences about what\'s going on with that. Stream of consciousness — don\'t filter. Stay Hi ✋',
    'Good — you named it. Now write it out. 5-6 sentences, unfiltered. Let the thoughts slow down to the pace of your hand. Hi5 ✋',
  ],
  // Step 3: Diagnosis
  [
    'Now read each sentence back. What emotion does each one carry? Fear? Frustration? Relief? Label them. Stay Hi ✋',
    'Look at what you wrote. Each sentence carries an emotion. Name them — anger, doubt, sadness, hope? No wrong answers. Hi5 ✋',
  ],
  // Step 4: Set Point
  [
    'Look at those emotions together. What\'s the overall feeling? Name your current emotional set point — the one feeling your thoughts keep returning to. Stay Hi ✋',
    'What\'s the pattern? One summarized feeling that captures where you are. That\'s your set point. Name it. Hi5 ✋',
  ],
  // Step 5: Target
  [
    'Now choose one step Hi\'r on the scale. Not a giant leap — just the next relieving emotion that feels reachable. What is it? Stay Hi ✋',
    'The goal is relief, not perfection. What emotion is one step above where you are? That\'s your target. Hi5 ✋',
  ],
  // Step 6: Bridge
  [
    'Now write your bridge — sentences that help your mind accept this new position. Talk to your future self. This is the real work. Stay Hi ✋',
    'Bridge time. Write sentences that logically move your mind toward that target emotion. Not a pep talk — a conversation with yourself. Hi5 ✋',
  ],
  // Step 7: New Set Point
  [
    'Read your bridge back. Where do you feel you are NOW on the Hi Scale? Has your set point shifted? Even a small shift counts. Stay Hi ✋',
    'How do you feel after writing that bridge? Name your new set point. Any movement is real. Hi5 ✋',
  ],
  // Step 8: Own It
  [
    'You just did real emotional work. Own that new set point. Say it out loud. Give yourself a Hi5. Want to share this journey on Hi Island? Stay Hi ✋',
    'That\'s the session. From your old set point to this new one — that\'s growth. Own it. Hi5 ✋',
  ],
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Brain Analysis per Step ──────────────────────────────────────────────────

function analyzeForStep(text, step) {
  const hear = hearScan(text, {});
  const inspyre = inspyreScan(text, {});
  const flow = flowScan(text, {});

  const emotions = hear.emotions || [];
  const signal = hear.signal || 0;
  const themes = inspyre.themes || [];
  const markers = flow.markers || [];

  return { emotions, signal, themes, markers, hear, inspyre, flow };
}

// ── LLM Facilitation Prompt ─────────────────────────────────────────────────

function buildFacilitationPrompt(step, text, analysis, sessionHistory) {
  const stepDef = GYM_STEPS[step];
  if (!stepDef) return null;

  const historyContext = sessionHistory?.length
    ? `\nSession so far:\n${sessionHistory.map((m, i) => `Step ${i + 1}: "${m.slice(0, 100)}"`).join('\n')}`
    : '';

  const brainContext = analysis.emotions.length
    ? `\nBrain scan detected: emotions=[${analysis.emotions.join(', ')}], signal=${analysis.signal.toFixed(2)}, themes=[${analysis.themes.join(', ')}]`
    : '';

  return `[HI GYM FACILITATION — STEP ${step} of 8]

You are Hi5FAN facilitating an advanced Hi Gym session.
CURRENT STEP: ${stepDef.title}
Core question: "${stepDef.core}"
Facilitation note: ${stepDef.facilitation}
${historyContext}
${brainContext}

The user just wrote: "${text.slice(0, 500)}"

Respond to what they wrote. Acknowledge it. Then guide them to STEP ${step + 1 <= 8 ? step + 1 : '(completion)'}.
${step < 8 ? `Next step: "${GYM_STEPS[step + 1].core}"` : 'This is the final step — celebrate and close.'}

RULES:
- 2-4 sentences max. Guide, don't lecture.
- Start with "Hi" on Step 1 only. Other steps: acknowledge first.
- If they seem stuck, gently encourage.
- Reference specific emotions from the brain scan if detected.
- End with "Stay Hi ✋" or "Hi5 ✋".`;
}

// ── Main Handler ─────────────────────────────────────────────────────────────

export async function handle(input) {
  const text = input?.text || '';
  let step = input?.gymStep ?? 0;
  const sessionHistory = input?.sessionHistory || [];

  // Step 0 → start a new session, return Step 1 prompt
  if (step === 0 || step === undefined) {
    const stepDef = GYM_STEPS[1];
    return {
      ok: true,
      gymStep: 1,
      stepId: stepDef.id,
      stepTitle: stepDef.title,
      prompt: pickRandom(STEP_TEMPLATES[1]),
      facilitation: stepDef.instruction,
      method: 'template',
      sessionComplete: false,
      hiScale: HI_SCALE,
    };
  }

  // Validate step range
  if (step < 1 || step > 8) {
    return { ok: false, error: `Invalid gymStep: ${step}. Must be 0-8.` };
  }

  if (!text.trim()) {
    return { ok: false, error: 'text is required for gym facilitation.' };
  }

  // Analyze the user's response with brain scans
  const analysis = analyzeForStep(text, step);

  // Build session summary for context
  const fullHistory = [...sessionHistory, text];

  // Try LLM facilitation
  let facilitation = null;
  let method = 'template';

  if (step <= 8) {
    const promptText = buildFacilitationPrompt(step, text, analysis, sessionHistory);
    if (promptText) {
      try {
        const llmResponse = await generate(promptText, text, {
          maxTokens: 200,
          temperature: 0.7,
        });
        if (llmResponse && llmResponse.length > 10 && llmResponse.length < 500) {
          facilitation = llmResponse;
          method = 'llm';
        }
      } catch {
        // Fall through to template
      }
    }
  }

  // Template fallback
  if (!facilitation) {
    if (step < 8) {
      // Use next step's template
      facilitation = pickRandom(STEP_TEMPLATES[step + 1]);
    } else {
      // Final step completion
      facilitation = pickRandom(STEP_TEMPLATES[8]);
    }
  }

  const isComplete = step >= 8;
  const nextStep = isComplete ? 8 : step + 1;
  const nextStepDef = GYM_STEPS[nextStep];

  // Build gym summary on completion
  let sessionSummary = null;
  if (isComplete && fullHistory.length >= 3) {
    sessionSummary = {
      stepsCompleted: step,
      startSubject: fullHistory[0]?.slice(0, 100) || '',
      bridgeExcerpt: fullHistory[5]?.slice(0, 200) || fullHistory[fullHistory.length - 2]?.slice(0, 200) || '',
      finalResponse: text.slice(0, 200),
      emotionsDetected: analysis.emotions,
      timestamp: Date.now(),
    };
  }

  return {
    ok: true,
    gymStep: nextStep,
    stepId: nextStepDef?.id || 'own',
    stepTitle: nextStepDef?.title || 'Session Complete',
    prompt: facilitation,
    facilitation: nextStepDef?.instruction || 'Session complete. You did the work.',
    method,
    sessionComplete: isComplete,
    brainScan: {
      emotions: analysis.emotions,
      signal: analysis.signal,
      themes: analysis.themes,
    },
    ...(sessionSummary && { sessionSummary }),
  };
}
