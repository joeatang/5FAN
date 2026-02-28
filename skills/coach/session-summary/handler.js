/**
 * 5FAN AI Coach — session-summary
 *
 * Generates a structured summary from a conversation or gym session.
 * Extracts emotional arc, key themes, shifts, and actionable takeaways.
 *
 * Brain-enhanced: uses Hear for emotional tracking, View for synthesis.
 *
 * @param {object} input
 *   - messages: object[] — [{ role: 'user'|'assistant', content: string }]
 *   - sessionType?: string — 'chat' | 'gym' | 'shift' (default: 'chat')
 *   - userStats?: object — optional user context
 * @returns {Promise<object>}
 *   - { ok, summary, emotionalArc, themes, method }
 */

import { scan as hearScan } from '../../../brains/hear/functions.js';
import { scan as viewScan, curateConsensus } from '../../../brains/view/functions.js';
import { generate } from '../../../server/lm-bridge.js';

// ── Emotional Arc Tracker ────────────────────────────────────────────────────

function trackEmotionalArc(messages) {
  const userMessages = messages.filter(m => m.role === 'user');
  if (userMessages.length === 0) return { start: null, end: null, shift: null, arc: [] };

  const arc = userMessages.map((m, i) => {
    const scan = hearScan(m.content || '', {});
    return {
      index: i,
      emotions: scan.emotions || [],
      signal: scan.signal || 0,
      category: scan.category || 'neutral',
    };
  });

  const start = arc[0];
  const end = arc[arc.length - 1];

  // Detect shift
  let shift = null;
  if (start && end && start.signal !== end.signal) {
    const delta = end.signal - start.signal;
    shift = {
      direction: delta > 0 ? 'intensified' : 'relieved',
      magnitude: Math.abs(delta).toFixed(2),
      fromCategory: start.category,
      toCategory: end.category,
    };
  }

  return { start, end, shift, arc };
}

// ── Theme Extraction ─────────────────────────────────────────────────────────

function extractThemes(messages) {
  const allText = messages
    .filter(m => m.role === 'user')
    .map(m => m.content || '')
    .join(' ');

  if (!allText.trim()) return [];

  const scan = viewScan(allText, {});
  return scan.angles || scan.themes || [];
}

// ── Template Summary Builder ─────────────────────────────────────────────────

function buildTemplateSummary(messages, emotionalArc, themes, sessionType) {
  const userMsgCount = messages.filter(m => m.role === 'user').length;
  const parts = [];

  // Session type header
  if (sessionType === 'gym') {
    parts.push('Hi Gym Session Summary');
  } else if (sessionType === 'shift') {
    parts.push('Compass Shift Summary');
  } else {
    parts.push('Coach Chat Summary');
  }

  // Message count
  parts.push(`${userMsgCount} messages exchanged.`);

  // Emotional arc
  if (emotionalArc.start && emotionalArc.end) {
    const startEmotions = emotionalArc.start.emotions.slice(0, 3).join(', ') || 'neutral';
    const endEmotions = emotionalArc.end.emotions.slice(0, 3).join(', ') || 'neutral';
    parts.push(`Started at: ${startEmotions} (signal: ${emotionalArc.start.signal.toFixed(2)})`);
    parts.push(`Ended at: ${endEmotions} (signal: ${emotionalArc.end.signal.toFixed(2)})`);

    if (emotionalArc.shift) {
      parts.push(`Shift: ${emotionalArc.shift.direction} by ${emotionalArc.shift.magnitude}`);
    }
  }

  // Themes
  if (themes.length > 0) {
    parts.push(`Key themes: ${themes.slice(0, 5).join(', ')}`);
  }

  // First user message excerpt
  const firstUser = messages.find(m => m.role === 'user');
  if (firstUser) {
    parts.push(`Opened with: "${firstUser.content?.slice(0, 80)}..."`);
  }

  return parts.join('\n');
}

// ── Main Handler ─────────────────────────────────────────────────────────────

export async function handle(input) {
  const messages = input?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, error: 'messages array is required.' };
  }

  const sessionType = input?.sessionType || 'chat';
  const userStats = input?.userStats || null;

  // Track emotional arc
  const emotionalArc = trackEmotionalArc(messages);

  // Extract themes
  const themes = extractThemes(messages);

  // Try LLM-generated summary
  let summary = null;
  let method = 'template';

  const userMessages = messages.filter(m => m.role === 'user');
  const msgExcerpts = userMessages
    .slice(0, 8)
    .map((m, i) => `[${i + 1}] "${m.content?.slice(0, 120)}"`)
    .join('\n');

  const arcContext = emotionalArc.shift
    ? `Emotional arc: ${emotionalArc.shift.direction} from ${emotionalArc.shift.fromCategory} to ${emotionalArc.shift.toCategory}`
    : 'No significant emotional shift detected.';

  const llmPrompt = `Summarize this ${sessionType} session between Hi5FAN (AI trainer) and a user.

User messages:
${msgExcerpts}

${arcContext}
${themes.length ? `Themes: ${themes.join(', ')}` : ''}

Write a 3-5 sentence summary. Include:
1. What the user was processing
2. How the emotional tone shifted (or didn't)
3. Key insight or takeaway

Voice: Direct, warm, grounded. Hi-speak. End with "Stay Hi ✋".`;

  try {
    const llmResponse = await generate(llmPrompt, '', { maxTokens: 200, temperature: 0.6 });
    if (llmResponse && llmResponse.length > 30 && llmResponse.length < 500) {
      summary = llmResponse;
      method = 'llm';
    }
  } catch {
    // Fall through
  }

  // Template fallback
  if (!summary) {
    summary = buildTemplateSummary(messages, emotionalArc, themes, sessionType);
  }

  return {
    ok: true,
    summary,
    emotionalArc: {
      startEmotions: emotionalArc.start?.emotions || [],
      endEmotions: emotionalArc.end?.emotions || [],
      startSignal: emotionalArc.start?.signal || 0,
      endSignal: emotionalArc.end?.signal || 0,
      shift: emotionalArc.shift,
      pointCount: emotionalArc.arc.length,
    },
    themes,
    sessionType,
    messageCount: messages.length,
    method,
  };
}
