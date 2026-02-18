/**
 * Trainer API — 1:1 Conversation Manager
 * Per-user conversation state with open mode (freeform) and guided mode (structured exercises).
 * Brain swarm enrichment on every message. Conversation history. User stats injection.
 */

import { analyze, buildEnrichedPrompt } from './brain-swarm.js';
import { generate } from './lm-bridge.js';
import { FIVE_FAN } from '../config.js';
import appContext from '../app-context.js';
import { feedEnvelope } from '../brains/5fan.js';
import { getProfile } from '../brains/you/functions.js';

/** Conversation states: per-user in-memory storage */
const conversations = new Map();

const MODES = {
  OPEN: 'open',
  GUIDED: 'guided',
};

const MAX_HISTORY_DEPTH = 20;

/** Guided exercise definitions (generic — app developers customize these) */
const GUIDED_EXERCISES = {
  gratitude: {
    name: 'Gratitude Check',
    steps: [
      'Name three things you\'re grateful for right now — big or small.',
      'Pick one of those three. Why does it matter to you?',
      'How would you feel if you didn\'t have that thing?',
      'Gratitude is a muscle. You just flexed it. Well done.',
    ],
  },
  reframe: {
    name: 'Perspective Reframe',
    steps: [
      'What\'s something that\'s bothering you right now? Write it out.',
      'Now imagine your best friend told you this. What would you say to them?',
      'What\'s one thing you can control about this situation?',
      'You just reframed a challenge into an action. That\'s growth.',
    ],
  },
  values: {
    name: 'Values Alignment',
    steps: [
      'Name one thing that matters most to you in life right now.',
      'On a scale of 1-10, how aligned are your daily actions with that value?',
      'What\'s one small thing you could do tomorrow to move that number up by 1?',
      'Living by your values isn\'t big swings — it\'s small, daily alignment. You\'re on it.',
    ],
  },
  breathe: {
    name: 'Box Breathing',
    steps: [
      'Find a comfortable position. We\'re going to do box breathing.',
      'Breathe IN for 4 counts... 1... 2... 3... 4...',
      'HOLD for 4 counts... 1... 2... 3... 4...',
      'Breathe OUT for 4 counts... 1... 2... 3... 4...',
      'HOLD for 4 counts... 1... 2... 3... 4... Repeat 3 more times.',
      'How do you feel now compared to when we started?',
    ],
  },
  journal: {
    name: 'Quick Journal',
    steps: [
      'In one sentence, how are you feeling right now?',
      'What happened today that brought you to that feeling?',
      'What\'s one thing you want to carry forward from today?',
      'You just processed your day in 30 seconds. That\'s self-awareness in action.',
    ],
  },
};

/**
 * Get or create a conversation for a user.
 * @param {string} userId
 * @returns {object}
 */
function getConversation(userId) {
  if (!conversations.has(userId)) {
    conversations.set(userId, {
      userId,
      mode: MODES.OPEN,
      history: [],
      exercise: null,
      exerciseStep: 0,
      startedAt: Date.now(),
      lastMessageAt: Date.now(),
    });
  }
  const conv = conversations.get(userId);
  conv.lastMessageAt = Date.now();
  return conv;
}

/**
 * Add a message to conversation history.
 * @param {object} conv
 * @param {string} role - 'user' | 'assistant'
 * @param {string} content
 */
function addToHistory(conv, role, content) {
  conv.history.push({ role, content, ts: Date.now() });
  if (conv.history.length > MAX_HISTORY_DEPTH) {
    conv.history = conv.history.slice(-MAX_HISTORY_DEPTH);
  }
}

/**
 * Handle a trainer message (1:1 conversation).
 *
 * @param {string} userId
 * @param {string} text
 * @param {object} [meta]
 * @returns {Promise<{ response: string, brain: string, mode: string, method: string }>}
 */
export async function handleMessage(userId, text, meta = {}) {
  if (!FIVE_FAN.features.trainer) {
    return { response: 'Trainer mode is currently disabled.', brain: 'view', mode: 'disabled', method: 'template' };
  }

  const conv = getConversation(userId);
  addToHistory(conv, 'user', text);

  // Check for mode switch commands
  const lower = text.toLowerCase().trim();
  if (lower === '/open' || lower === 'open mode') {
    conv.mode = MODES.OPEN;
    conv.exercise = null;
    conv.exerciseStep = 0;
    const response = 'Open mode. Talk freely — I\'m listening.';
    addToHistory(conv, 'assistant', response);
    return { response, brain: 'hear', mode: MODES.OPEN, method: 'command' };
  }

  if (lower.startsWith('/exercise') || lower === 'guided mode') {
    const parts = lower.split(' ');
    const exerciseName = parts[1] || null;
    return startExercise(conv, exerciseName);
  }

  if (lower === '/exercises' || lower === 'list exercises') {
    const list = Object.entries(GUIDED_EXERCISES)
      .map(([key, ex]) => `• ${key} — ${ex.name} (${ex.steps.length} steps)`)
      .join('\n');
    const response = `Available exercises:\n${list}\n\nType "/exercise [name]" to start one.`;
    addToHistory(conv, 'assistant', response);
    return { response, brain: 'view', mode: conv.mode, method: 'command' };
  }

  if (lower === '/stats') {
    const profile = getProfile(userId);
    const response = `Your session: ${profile?.messageCount || 0} messages, ` +
      `top themes: ${profile?.topThemes?.join(', ') || 'none yet'}, ` +
      `session: ${Math.round((Date.now() - conv.startedAt) / 60000)} minutes.`;
    addToHistory(conv, 'assistant', response);
    return { response, brain: 'you', mode: conv.mode, method: 'command' };
  }

  // Guided mode: advance exercise step
  if (conv.mode === MODES.GUIDED && conv.exercise) {
    return advanceExercise(conv, text);
  }

  // Open mode: brain swarm + LLM
  return openModeResponse(conv, text, meta);
}

/**
 * Start a guided exercise.
 */
function startExercise(conv, exerciseName) {
  const name = exerciseName || Object.keys(GUIDED_EXERCISES)[0];
  const exercise = GUIDED_EXERCISES[name];

  if (!exercise) {
    const response = `Unknown exercise "${name}". Type "/exercises" to see available ones.`;
    addToHistory(conv, 'assistant', response);
    return { response, brain: 'view', mode: conv.mode, method: 'command' };
  }

  conv.mode = MODES.GUIDED;
  conv.exercise = name;
  conv.exerciseStep = 0;

  const response = `Starting: ${exercise.name}\n\n${exercise.steps[0]}`;
  addToHistory(conv, 'assistant', response);
  return { response, brain: 'flow', mode: MODES.GUIDED, method: 'exercise' };
}

/**
 * Advance to the next step of a guided exercise.
 */
function advanceExercise(conv, text) {
  const exercise = GUIDED_EXERCISES[conv.exercise];
  if (!exercise) {
    conv.mode = MODES.OPEN;
    conv.exercise = null;
    return { response: 'Exercise not found. Switching to open mode.', brain: 'view', mode: MODES.OPEN, method: 'error' };
  }

  conv.exerciseStep++;

  if (conv.exerciseStep >= exercise.steps.length) {
    // Exercise complete
    conv.mode = MODES.OPEN;
    const finishMsg = exercise.steps[exercise.steps.length - 1];
    conv.exercise = null;
    conv.exerciseStep = 0;
    const response = `${finishMsg}\n\n✓ Exercise complete. You're back in open mode.`;
    addToHistory(conv, 'assistant', response);
    return { response, brain: 'flow', mode: MODES.OPEN, method: 'exercise' };
  }

  const response = exercise.steps[conv.exerciseStep];
  addToHistory(conv, 'assistant', response);
  return { response, brain: 'flow', mode: MODES.GUIDED, method: 'exercise' };
}

/**
 * Generate an open-mode response using brain swarm + LLM.
 */
async function openModeResponse(conv, text, meta = {}) {
  // Run brain swarm analysis
  const analysis = analyze(text, { ...meta, userId: conv.userId });
  const dominantBrain = analysis.dominantBrain;

  // Get user profile for context
  const profile = getProfile(conv.userId);

  // Build enriched prompt with conversation history
  const enrichedPrompt = buildEnrichedPrompt(appContext, analysis, profile ? {
    messageCount: profile.messageCount,
    topThemes: profile.topThemes || [],
  } : null);

  // Try LLM with conversation history
  const llmResponse = await generate(enrichedPrompt, text, {
    history: conv.history.slice(-6),
    maxTokens: 200,
    temperature: 0.7,
  });

  let response;
  let method;

  if (llmResponse) {
    response = llmResponse;
    method = 'llm';
  } else {
    // Template fallback using dominant brain
    const { analyzeAndRespond } = await import('./brain-swarm.js');
    const templateResult = analyzeAndRespond(text, meta);
    response = templateResult.response;
    method = 'template';
  }

  addToHistory(conv, 'assistant', response);
  return { response, brain: dominantBrain, mode: conv.mode, method };
}

/**
 * Get conversation info for a user.
 */
export function getConversationInfo(userId) {
  const conv = conversations.get(userId);
  if (!conv) return null;
  return {
    mode: conv.mode,
    messageCount: conv.history.length,
    exercise: conv.exercise,
    exerciseStep: conv.exerciseStep,
    duration: Date.now() - conv.startedAt,
  };
}

/**
 * Clear conversation for a user.
 */
export function clearConversation(userId) {
  conversations.delete(userId);
}

/**
 * Get all active conversations count.
 */
export function getActiveCount() {
  return conversations.size;
}

/** Export exercise definitions for extensibility */
export { GUIDED_EXERCISES, MODES };

export default { handleMessage, getConversationInfo, clearConversation, getActiveCount };
