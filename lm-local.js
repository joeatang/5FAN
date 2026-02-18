/**
 * LM Local — Local LLM Adapter
 * Connects to LM Studio or Ollama via their OpenAI-compatible endpoints.
 *
 * LM Studio: http://localhost:1234/v1/chat/completions
 * Ollama:    http://localhost:11434/v1/chat/completions
 *
 * Both expose the OpenAI Chat Completions API format.
 */

import { FIVE_FAN } from './config.js';

let _available = null;
let _checkedAt = 0;
const CHECK_INTERVAL = 60_000;

/**
 * Make an HTTP request (native fetch or Node http fallback).
 */
async function httpRequest(url, options = {}) {
  // Native fetch (Node 18+, Pear/Bare)
  if (typeof globalThis.fetch === 'function') {
    const controller = new AbortController();
    const timeout = options.timeout || 30000;
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await globalThis.fetch(url, {
        method: options.method || 'POST',
        headers: { 'Content-Type': 'application/json', ...options.headers },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    } finally {
      clearTimeout(timer);
    }
  }

  // Fallback: http module
  const { default: http } = await import('http');
  const parsed = new URL(url);

  return new Promise((resolve, reject) => {
    const postData = options.body ? JSON.stringify(options.body) : '';
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: parsed.pathname + parsed.search,
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...options.headers,
      },
      timeout: options.timeout || 30000,
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ ok: false, status: res.statusCode, data: null });
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    if (postData) req.write(postData);
    req.end();
  });
}

/**
 * Check if a local LLM server is reachable.
 * @returns {Promise<boolean>}
 */
export async function isAvailable() {
  if (_available !== null && Date.now() - _checkedAt < CHECK_INTERVAL) {
    return _available;
  }

  const cfg = FIVE_FAN.lm;
  try {
    const res = await httpRequest(`http://${cfg.host}:${cfg.port}/v1/models`, {
      method: 'GET',
      timeout: 5000,
    });
    _available = res.ok;
  } catch {
    _available = false;
  }
  _checkedAt = Date.now();
  return _available;
}

/**
 * List available models on the local server.
 * @returns {Promise<string[]>}
 */
export async function listModels() {
  const cfg = FIVE_FAN.lm;
  try {
    const res = await httpRequest(`http://${cfg.host}:${cfg.port}/v1/models`, {
      method: 'GET',
      timeout: 5000,
    });
    if (!res.ok || !res.data?.data) return [];
    return res.data.data.map(m => m.id);
  } catch {
    return [];
  }
}

/**
 * Generate a chat completion using the local LLM.
 *
 * @param {string} systemPrompt - system message
 * @param {string} userMessage - user message
 * @param {object} [options]
 * @param {object[]} [options.history] - prior messages [{role, content}]
 * @param {string} [options.model] - override model name
 * @param {number} [options.maxTokens]
 * @param {number} [options.temperature]
 * @param {number} [options.timeout]
 * @returns {Promise<string|null>}
 */
export async function generate(systemPrompt, userMessage, options = {}) {
  const cfg = FIVE_FAN.lm;

  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  if (options.history) {
    for (const msg of options.history.slice(-6)) {
      messages.push({ role: msg.role || 'user', content: msg.content || msg.text });
    }
  }
  messages.push({ role: 'user', content: userMessage });

  try {
    const res = await httpRequest(`http://${cfg.host}:${cfg.port}/v1/chat/completions`, {
      method: 'POST',
      body: {
        model: options.model || cfg.model,
        messages,
        max_tokens: options.maxTokens || cfg.maxTokens,
        temperature: options.temperature ?? cfg.temperature,
        stream: false,
      },
      timeout: options.timeout || 30000,
    });

    if (!res.ok || !res.data) return null;
    return res.data.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error('[lm-local] Generation error:', err.message);
    return null;
  }
}

/**
 * Test the local LLM with a simple prompt.
 * @returns {Promise<{ available: boolean, model: string|null, response: string|null }>}
 */
export async function test() {
  const available = await isAvailable();
  if (!available) return { available: false, model: null, response: null };

  const models = await listModels();
  const response = await generate(
    'You are a helpful assistant. Reply in one short sentence.',
    'Say hello.',
    { maxTokens: 30 }
  );

  return {
    available: true,
    model: models[0] || FIVE_FAN.lm.model,
    response,
  };
}

export default { isAvailable, listModels, generate, test };
