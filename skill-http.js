/**
 * 5FAN Skill HTTP Server — Lightweight Node.js skill API
 * =============================================================================
 *
 * Serves all 41 skill handlers over HTTP on port 5002.
 * No Express. No Pear runtime. Plain Node.js http.createServer().
 *
 * This runs as a standalone systemd service on the VPS alongside:
 *   - stayhi-peer (port 5001) — Pear peer with contract/state
 *   - stayhi-web (port 3000) — Express server with UI
 *   - 5fan-skill (port 5002) — THIS: skill handler API
 *
 * Endpoints:
 *   POST /skill/:name   — invoke a skill handler
 *   GET  /health        — service health check
 *   GET  /manifest      — skill registry manifest
 *
 * Usage:
 *   node skill-http.js              (port 5002)
 *   PORT=5003 node skill-http.js    (custom port)
 *
 * =============================================================================
 */

import { createServer } from 'node:http';
import { SKILL_REGISTRY, buildManifest } from './skill-protocol.js';

// ─── Import ALL Skill Handlers ──────────────────────────────────────────────

// EQ Engine (9)
import { handle as emotionScan } from './skills/eq-engine/emotion-scan/handler.js';
import { handle as emotionFamily } from './skills/eq-engine/emotion-family/handler.js';
import { handle as desireBridge } from './skills/eq-engine/desire-bridge/handler.js';
import { handle as microMove } from './skills/eq-engine/micro-move/handler.js';
import { handle as reframe } from './skills/eq-engine/reframe/handler.js';
import { handle as aliasMatch } from './skills/eq-engine/alias-match/handler.js';
import { handle as emotionBlend } from './skills/eq-engine/emotion-blend/handler.js';
import { handle as emotionTimeline } from './skills/eq-engine/emotion-timeline/handler.js';
import { handle as crisisDetect } from './skills/eq-engine/crisis-detect/handler.js';

// Compass (5)
import { handle as compassLocate } from './skills/compass/compass-locate/handler.js';
import { handle as compassInterpret } from './skills/compass/compass-interpret/handler.js';
import { handle as compassPoint } from './skills/compass/compass-point/handler.js';
import { handle as compassPractice } from './skills/compass/compass-practice/handler.js';
import { handle as shiftNavigator } from './skills/compass/shift-navigator/handler.js';

// Community (5)
import { handle as feedReply } from './skills/community/feed-reply/handler.js';
import { handle as proactivePost } from './skills/community/proactive-post/handler.js';
import { handle as communityPulse } from './skills/community/community-pulse/handler.js';
import { handle as hiNoteCompose } from './skills/community/hi-note-compose/handler.js';
import { handle as socialCaption } from './skills/community/social-caption/handler.js';

// AI Coach (10)
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

// Internal (6)
import { handle as earnCalculator } from './skills/internal/earn-calculator/handler.js';
import { handle as tierGate } from './skills/internal/tier-gate/handler.js';
import { handle as hi5ClaimCheck } from './skills/internal/hi5-claim-check/handler.js';
import { handle as qualityScore } from './skills/internal/quality-score/handler.js';
import { handle as antiBot } from './skills/internal/anti-bot/handler.js';
import { handle as vaultQuery } from './skills/internal/vault-query/handler.js';

// ─── Handler Dispatch Map ───────────────────────────────────────────────────

const handlerMap = {
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

// ─── Metrics ────────────────────────────────────────────────────────────────

const metrics = {
  totalCalls: 0,
  totalErrors: 0,
  callsBySkill: {},
  startedAt: Date.now(),
};

// ─── HTTP Request Handler ───────────────────────────────────────────────────

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString();
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    });
    return res.end();
  }

  // GET /health
  if (req.method === 'GET' && pathname === '/health') {
    return sendJson(res, 200, {
      ok: true,
      service: '5fan-skill',
      skills: Object.keys(handlerMap).length,
      uptime: Date.now() - metrics.startedAt,
      totalCalls: metrics.totalCalls,
      totalErrors: metrics.totalErrors,
    });
  }

  // GET /manifest
  if (req.method === 'GET' && pathname === '/manifest') {
    return sendJson(res, 200, { ok: true, ...buildManifest() });
  }

  // POST /skill/:name
  const skillMatch = pathname.match(/^\/skill\/([a-z0-9-]+)$/);
  if (req.method === 'POST' && skillMatch) {
    const skillName = skillMatch[1];
    const handler = handlerMap[skillName];

    if (!handler) {
      return sendJson(res, 404, { ok: false, error: `Unknown skill: ${skillName}` });
    }

    // Check internal access
    const reg = SKILL_REGISTRY[skillName];
    if (reg?.internal) {
      // Only allow local callers (same machine)
      const remoteIp = req.socket?.remoteAddress || '';
      const isLocal = remoteIp === '127.0.0.1' || remoteIp === '::1' || remoteIp === '::ffff:127.0.0.1';
      if (!isLocal) {
        return sendJson(res, 403, { ok: false, error: 'INTERNAL_ONLY' });
      }
    }

    try {
      const body = await parseBody(req);
      metrics.totalCalls++;
      metrics.callsBySkill[skillName] = (metrics.callsBySkill[skillName] || 0) + 1;

      const result = await handler(body);
      return sendJson(res, 200, result);
    } catch (err) {
      metrics.totalErrors++;
      console.error(`[5fan-skill] ${skillName} error:`, err.message);
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  }

  // 404 fallback
  sendJson(res, 404, { ok: false, error: 'Not found' });
}

// ─── Server Start ───────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '5002', 10);

const server = createServer(handleRequest);

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[5fan-skill] HTTP skill server listening on 127.0.0.1:${PORT}`);
  console.log(`[5fan-skill] ${Object.keys(handlerMap).length} skills loaded`);
  console.log(`[5fan-skill] Health: http://127.0.0.1:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[5fan-skill] SIGTERM received, shutting down');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('[5fan-skill] SIGINT received, shutting down');
  server.close(() => process.exit(0));
});
