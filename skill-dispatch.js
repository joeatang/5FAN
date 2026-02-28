/**
 * 5FAN Skill Dispatcher — Central handler registry + routing
 * =============================================================================
 *
 * Imports all 35 callable skill handlers and exposes a single `dispatch()`
 * function. Used by:
 *   - SC-Bridge `skill-call` message type (Pear peer, on-network)
 *   - skill-http.js (HTTP fallback)
 *
 * Pure ESM, no Node.js-specific APIs — safe for both Node and Bare runtime.
 *
 * =============================================================================
 */

// ─── EQ Engine (9) ──────────────────────────────────────────────────────────
import { handle as emotionScan } from './skills/eq-engine/emotion-scan/handler.js';
import { handle as emotionFamily } from './skills/eq-engine/emotion-family/handler.js';
import { handle as desireBridge } from './skills/eq-engine/desire-bridge/handler.js';
import { handle as microMove } from './skills/eq-engine/micro-move/handler.js';
import { handle as reframe } from './skills/eq-engine/reframe/handler.js';
import { handle as aliasMatch } from './skills/eq-engine/alias-match/handler.js';
import { handle as emotionBlend } from './skills/eq-engine/emotion-blend/handler.js';
import { handle as emotionTimeline } from './skills/eq-engine/emotion-timeline/handler.js';
import { handle as crisisDetect } from './skills/eq-engine/crisis-detect/handler.js';

// ─── Compass (5) ────────────────────────────────────────────────────────────
import { handle as compassLocate } from './skills/compass/compass-locate/handler.js';
import { handle as compassInterpret } from './skills/compass/compass-interpret/handler.js';
import { handle as compassPoint } from './skills/compass/compass-point/handler.js';
import { handle as compassPractice } from './skills/compass/compass-practice/handler.js';
import { handle as shiftNavigator } from './skills/compass/shift-navigator/handler.js';

// ─── Community (5) ──────────────────────────────────────────────────────────
import { handle as feedReply } from './skills/community/feed-reply/handler.js';
import { handle as proactivePost } from './skills/community/proactive-post/handler.js';
import { handle as communityPulse } from './skills/community/community-pulse/handler.js';
import { handle as hiNoteCompose } from './skills/community/hi-note-compose/handler.js';
import { handle as socialCaption } from './skills/community/social-caption/handler.js';

// ─── AI Coach (10) ──────────────────────────────────────────────────────────
import { handle as toneMatch } from './skills/coach/tone-match/handler.js';
import { handle as contentElevate } from './skills/coach/content-elevate/handler.js';
import { handle as gymFacilitator } from './skills/coach/gym-facilitator/handler.js';
import { handle as coachChat } from './skills/coach/coach-chat/handler.js';
import { handle as nudgeEngine } from './skills/coach/nudge-engine/handler.js';
import { handle as milestoneDetect } from './skills/coach/milestone-detect/handler.js';
import { handle as memoryContext } from './skills/coach/memory-context/handler.js';
import { handle as journalPrompt } from './skills/coach/journal-prompt/handler.js';
import { handle as sessionSummary } from './skills/coach/session-summary/handler.js';
import { handle as wellnessScore } from './skills/coach/wellness-score/handler.js';

// ─── Internal (6) ───────────────────────────────────────────────────────────
import { handle as earnCalculator } from './skills/internal/earn-calculator/handler.js';
import { handle as tierGate } from './skills/internal/tier-gate/handler.js';
import { handle as hi5ClaimCheck } from './skills/internal/hi5-claim-check/handler.js';
import { handle as qualityScore } from './skills/internal/quality-score/handler.js';
import { handle as antiBot } from './skills/internal/anti-bot/handler.js';
import { handle as vaultQuery } from './skills/internal/vault-query/handler.js';

// ─── Handler Map ────────────────────────────────────────────────────────────

const HANDLERS = {
  // EQ Engine
  'emotion-scan': emotionScan,
  'emotion-family': emotionFamily,
  'desire-bridge': desireBridge,
  'micro-move': microMove,
  'reframe': reframe,
  'alias-match': aliasMatch,
  'emotion-blend': emotionBlend,
  'emotion-timeline': emotionTimeline,
  'crisis-detect': crisisDetect,
  // Compass
  'compass-locate': compassLocate,
  'compass-interpret': compassInterpret,
  'compass-point': compassPoint,
  'compass-practice': compassPractice,
  'shift-navigator': shiftNavigator,
  // Community
  'feed-reply': feedReply,
  'proactive-post': proactivePost,
  'community-pulse': communityPulse,
  'hi-note-compose': hiNoteCompose,
  'social-caption': socialCaption,
  // Coach
  'tone-match': toneMatch,
  'content-elevate': contentElevate,
  'gym-facilitator': gymFacilitator,
  'coach-chat': coachChat,
  'nudge-engine': nudgeEngine,
  'milestone-detect': milestoneDetect,
  'memory-context': memoryContext,
  'journal-prompt': journalPrompt,
  'session-summary': sessionSummary,
  'wellness-score': wellnessScore,
  // Internal
  'earn-calculator': earnCalculator,
  'tier-gate': tierGate,
  'hi5-claim-check': hi5ClaimCheck,
  'quality-score': qualityScore,
  'anti-bot': antiBot,
  'vault-query': vaultQuery,
};

/** All registered skill names */
export const SKILL_NAMES = Object.keys(HANDLERS);

/** Number of loaded skills */
export const SKILL_COUNT = SKILL_NAMES.length;

/**
 * Dispatch a skill call by name.
 *
 * @param {string} skillName - e.g. 'emotion-scan', 'coach-chat'
 * @param {object} input - skill-specific input payload
 * @returns {Promise<object>} - handler result (always has `ok` field)
 */
export async function dispatch(skillName, input = {}) {
  const handler = HANDLERS[skillName];
  if (!handler) {
    return { ok: false, error: `Unknown skill: ${skillName}` };
  }
  // Handlers may be sync or async — normalise to promise
  return Promise.resolve(handler(input));
}

/**
 * Check if a skill name is registered.
 * @param {string} name
 * @returns {boolean}
 */
export function hasSkill(name) {
  return name in HANDLERS;
}

export default { dispatch, hasSkill, SKILL_NAMES, SKILL_COUNT };
