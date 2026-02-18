/**
 * Express Routes — 5FAN REST API
 * Optional companion server for brain swarm, trainer, feed responder, and proactive scheduler.
 * Run alongside the Intercom P2P layer for hybrid architectures.
 *
 * Usage:
 *   import express from 'express';
 *   import { mountRoutes } from './server/routes.js';
 *   const app = express();
 *   app.use(express.json());
 *   mountRoutes(app);
 *   app.listen(5055);
 */

import { analyze, analyzeAndRespond, buildEnrichedPrompt, hasCrisis } from './brain-swarm.js';
import { generate, getStatus as lmStatus } from './lm-bridge.js';
import { respondToFeed, getStats as feedStats } from './feed-responder.js';
import { handleMessage as trainerMessage, getConversationInfo, clearConversation, getActiveCount } from './trainer-api.js';
import { generatePost, tick as proactiveTick } from './proactive-scheduler.js';
import { FIVE_FAN } from '../config.js';
import appContext from '../app-context.js';

/**
 * Mount all 5FAN API routes onto an Express app.
 * @param {import('express').Application} app
 * @param {object} [options] - { broadcastFn }
 */
export function mountRoutes(app, options = {}) {
  const broadcastFn = options.broadcastFn || null;

  // ─── Health & Status ───

  app.get('/v1/5fan/status', async (req, res) => {
    try {
      const lm = await lmStatus();
      res.json({
        ok: true,
        enabled: FIVE_FAN.enabled,
        features: FIVE_FAN.features,
        lm,
        trainer: { activeSessions: getActiveCount() },
        feed: feedStats(),
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // ─── Brain Swarm Analysis ───

  app.post('/v1/5fan/analyze', (req, res) => {
    try {
      const { text, meta } = req.body;
      if (!text) return res.status(400).json({ ok: false, error: 'text required' });
      const result = analyze(text, meta || {});
      res.json({ ok: true, ...result });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.post('/v1/5fan/respond', async (req, res) => {
    try {
      const { text, meta } = req.body;
      if (!text) return res.status(400).json({ ok: false, error: 'text required' });

      const analysis = analyze(text, meta || {});
      const enrichedPrompt = buildEnrichedPrompt(appContext, analysis);
      const llmResponse = await generate(enrichedPrompt, text, { maxTokens: 200 });

      if (llmResponse) {
        res.json({ ok: true, response: llmResponse, brain: analysis.dominantBrain, method: 'llm' });
      } else {
        const template = analyzeAndRespond(text, meta || {});
        res.json({ ok: true, response: template.response, brain: template.brain, method: 'template' });
      }
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // ─── Feed Responder ───

  app.post('/v1/5fan/feed/respond', async (req, res) => {
    try {
      const { text, meta } = req.body;
      if (!text) return res.status(400).json({ ok: false, error: 'text required' });
      const result = await respondToFeed(text, meta || {});
      if (!result) return res.json({ ok: true, response: null, reason: 'rate-limited or disabled' });
      res.json({ ok: true, ...result });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.get('/v1/5fan/feed/stats', (req, res) => {
    res.json({ ok: true, ...feedStats() });
  });

  // ─── Trainer (1:1) ───

  app.post('/v1/5fan/trainer/message', async (req, res) => {
    try {
      const { userId, text, meta } = req.body;
      if (!userId || !text) return res.status(400).json({ ok: false, error: 'userId and text required' });
      const result = await trainerMessage(userId, text, meta || {});
      res.json({ ok: true, ...result });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.get('/v1/5fan/trainer/:userId', (req, res) => {
    const info = getConversationInfo(req.params.userId);
    if (!info) return res.json({ ok: true, conversation: null });
    res.json({ ok: true, conversation: info });
  });

  app.delete('/v1/5fan/trainer/:userId', (req, res) => {
    clearConversation(req.params.userId);
    res.json({ ok: true, cleared: true });
  });

  // ─── Proactive Scheduler ───

  app.post('/v1/5fan/proactive/generate', async (req, res) => {
    try {
      const { slot, context } = req.body;
      if (!slot) return res.status(400).json({ ok: false, error: 'slot required (morning|afternoon|evening)' });
      const post = await generatePost(slot, context || {});
      res.json({ ok: true, ...post });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.post('/v1/5fan/proactive/tick', async (req, res) => {
    try {
      const result = await proactiveTick(broadcastFn);
      res.json({ ok: true, posted: !!result, result });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // ─── LLM Status ───

  app.get('/v1/5fan/lm/status', async (req, res) => {
    try {
      const status = await lmStatus();
      res.json({ ok: true, ...status });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.post('/v1/5fan/lm/generate', async (req, res) => {
    try {
      const { systemPrompt, userMessage, options } = req.body;
      if (!userMessage) return res.status(400).json({ ok: false, error: 'userMessage required' });
      const result = await generate(systemPrompt || appContext, userMessage, options || {});
      res.json({ ok: true, response: result, method: result ? 'llm' : 'none' });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  console.log('[5fan-api] Routes mounted at /v1/5fan/*');
}

export default { mountRoutes };
