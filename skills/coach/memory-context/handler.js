/**
 * 5FAN AI Coach — memory-context
 *
 * Manages conversation memory for the AI coach. Stores conversation
 * snapshots, gym summaries, and compass sessions per user.
 *
 * INTERNAL: Manages state for other coach skills.
 * EXTERNAL: Stateless — returns stored context on demand.
 *
 * Operations: load, save, delete, loadGymSummaries, saveGymSummary, stats
 *
 * @param {object} input
 *   - op: string — 'load' | 'save' | 'delete' | 'loadGym' | 'saveGym' | 'stats'
 *   - address: string — user address
 *   - conversation?: object — { messages, mode, gymStep } (for save op)
 *   - gymSummary?: object — { startEmotion, endEmotion, bridgeExcerpt } (for saveGym)
 * @returns {object}
 *   - { ok, data?, stats? }
 */

const MAX_MESSAGES = 20;
const RETENTION_MS = 7 * 86400000; // 7 days
const MAX_GYM_SUMMARIES = 5;

// In-memory store — per-user conversation state
const store = {};

// ── Load Conversation ────────────────────────────────────────────────────────

function loadConversation(address) {
  const conv = store[address];
  if (!conv) return null;

  // Check retention
  if (conv.lastMessageAt && (Date.now() - conv.lastMessageAt) > RETENTION_MS) {
    delete store[address];
    return null;
  }

  return {
    messages: conv.messages || [],
    mode: conv.mode || 'open',
    gymStep: conv.gymStep || 0,
    startedAt: conv.startedAt,
    lastMessageAt: conv.lastMessageAt,
  };
}

// ── Save Conversation ────────────────────────────────────────────────────────

function saveConversation(address, conv) {
  store[address] = {
    messages: (conv.messages || []).slice(-MAX_MESSAGES).map(m => ({
      role: m.role,
      content: m.content,
    })),
    mode: conv.mode || 'open',
    gymStep: conv.gymStep || 0,
    startedAt: conv.startedAt || Date.now(),
    lastMessageAt: Date.now(),
  };
}

// ── Delete Conversation ──────────────────────────────────────────────────────

function deleteConversation(address) {
  delete store[address];
  delete store[`gym:${address}`];
}

// ── Gym Summaries ────────────────────────────────────────────────────────────

function saveGymSummary(address, summary) {
  const key = `gym:${address}`;
  if (!store[key]) store[key] = [];
  store[key].push({
    ...summary,
    timestamp: summary.timestamp || Date.now(),
  });
  if (store[key].length > MAX_GYM_SUMMARIES) {
    store[key] = store[key].slice(-MAX_GYM_SUMMARIES);
  }
}

function loadGymSummaries(address) {
  return store[`gym:${address}`] || [];
}

// ── Stats ────────────────────────────────────────────────────────────────────

function getMemoryStats() {
  const allKeys = Object.keys(store);
  const gymKeys = allKeys.filter(k => k.startsWith('gym:'));
  const convKeys = allKeys.filter(k => !k.startsWith('gym:'));

  return {
    conversations: convKeys.length,
    gymSessions: gymKeys.reduce((sum, k) => sum + (store[k]?.length || 0), 0),
    totalKeys: allKeys.length,
  };
}

// ── Main Handler ─────────────────────────────────────────────────────────────

export function handle(input) {
  const op = input?.op;
  const address = input?.address;

  if (!op || typeof op !== 'string') {
    return { ok: false, error: 'op is required: load, save, delete, loadGym, saveGym, stats' };
  }

  if (op === 'stats') {
    return { ok: true, stats: getMemoryStats() };
  }

  if (!address || typeof address !== 'string') {
    return { ok: false, error: 'address is required.' };
  }

  switch (op) {
    case 'load': {
      const data = loadConversation(address);
      return { ok: true, data, found: data !== null };
    }

    case 'save': {
      const conv = input?.conversation;
      if (!conv || typeof conv !== 'object') {
        return { ok: false, error: 'conversation object is required for save.' };
      }
      saveConversation(address, conv);
      return { ok: true, saved: true };
    }

    case 'delete': {
      deleteConversation(address);
      return { ok: true, deleted: true };
    }

    case 'loadGym': {
      const summaries = loadGymSummaries(address);
      return { ok: true, data: summaries, count: summaries.length };
    }

    case 'saveGym': {
      const summary = input?.gymSummary;
      if (!summary || typeof summary !== 'object') {
        return { ok: false, error: 'gymSummary object is required for saveGym.' };
      }
      saveGymSummary(address, summary);
      return { ok: true, saved: true };
    }

    default:
      return { ok: false, error: `Unknown op: ${op}. Valid: load, save, delete, loadGym, saveGym, stats` };
  }
}
