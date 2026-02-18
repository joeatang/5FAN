/**
 * LM Bridge — Multi-Provider LLM Integration
 * Auto-fallback chain: local LLM → cloud LLM → null (caller uses template fallback)
 *
 * Local: LM Studio or Ollama (OpenAI-compatible, localhost)
 * Cloud: Groq, OpenRouter, Together.ai (OpenAI-compatible, needs API key)
 */

import { FIVE_FAN } from '../config.js';

let _localAvailable = null;
let _localCheckedAt = 0;
const LOCAL_CHECK_INTERVAL = 60_000; // re-check every 60s

/**
 * HTTP fetch helper (works in Node 18+ with native fetch, or falls back to http).
 */
async function request(url, options = {}) {
  if (typeof globalThis.fetch === 'function') {
    const res = await globalThis.fetch(url, {
      method: options.method || 'POST',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  }

  // Fallback for environments without fetch
  const { default: http } = await import('http');
  const { default: https } = await import('https');
  const parsed = new URL(url);
  const lib = parsed.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const postData = options.body ? JSON.stringify(options.body) : '';
    const req = lib.request({
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
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
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    if (postData) req.write(postData);
    req.end();
  });
}

// ─── Local LLM (LM Studio / Ollama, OpenAI-compatible) ───

/**
 * Check if a local LLM is running.
 * @returns {Promise<boolean>}
 */
export async function localAvailable() {
  if (_localAvailable !== null && Date.now() - _localCheckedAt < LOCAL_CHECK_INTERVAL) {
    return _localAvailable;
  }
  try {
    const cfg = FIVE_FAN.lm;
    const url = `http://${cfg.host}:${cfg.port}/v1/models`;
    const res = await request(url, { method: 'GET', timeout: 5000 });
    _localAvailable = res.ok;
  } catch {
    _localAvailable = false;
  }
  _localCheckedAt = Date.now();
  return _localAvailable;
}

/**
 * Generate text using local LLM (OpenAI-compatible endpoint).
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @param {object} [options]
 * @returns {Promise<string|null>}
 */
export async function localGenerate(systemPrompt, userMessage, options = {}) {
  try {
    const cfg = FIVE_FAN.lm;
    const url = `http://${cfg.host}:${cfg.port}/v1/chat/completions`;

    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });

    // Include conversation history if provided
    if (options.history && Array.isArray(options.history)) {
      for (const msg of options.history.slice(-6)) {
        messages.push({ role: msg.role || 'user', content: msg.content || msg.text });
      }
    }

    messages.push({ role: 'user', content: userMessage });

    const res = await request(url, {
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
    console.error('[lm-bridge] local error:', err.message);
    return null;
  }
}

// ─── Cloud LLM (Groq / OpenRouter / Together.ai) ───

/**
 * Check if cloud LLM is configured (has API key).
 * @returns {boolean}
 */
export function cloudAvailable() {
  const cfg = FIVE_FAN.lm;
  return Boolean(cfg.cloudUrl && cfg.cloudApiKey);
}

/**
 * Generate text using cloud LLM (OpenAI-compatible endpoint).
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @param {object} [options]
 * @returns {Promise<string|null>}
 */
export async function cloudGenerate(systemPrompt, userMessage, options = {}) {
  try {
    const cfg = FIVE_FAN.lm;
    const url = `${cfg.cloudUrl}/v1/chat/completions`;

    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });

    if (options.history && Array.isArray(options.history)) {
      for (const msg of options.history.slice(-6)) {
        messages.push({ role: msg.role || 'user', content: msg.content || msg.text });
      }
    }

    messages.push({ role: 'user', content: userMessage });

    const res = await request(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfg.cloudApiKey}`,
      },
      body: {
        model: options.model || cfg.cloudModel,
        messages,
        max_tokens: options.maxTokens || cfg.maxTokens,
        temperature: options.temperature ?? cfg.temperature,
        stream: false,
      },
      timeout: options.timeout || 15000,
    });

    if (!res.ok || !res.data) return null;
    return res.data.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error('[lm-bridge] cloud error:', err.message);
    return null;
  }
}

// ─── Unified Generate (auto-fallback) ───

/**
 * Generate text using the best available provider.
 * Falls through: local → cloud → null (caller uses template fallback).
 *
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @param {object} [options] - { history, model, maxTokens, temperature, timeout }
 * @returns {Promise<string|null>}
 */
export async function generate(systemPrompt, userMessage, options = {}) {
  const cfg = FIVE_FAN.lm;
  const provider = cfg.provider || 'auto';

  // Explicit provider selection
  if (provider === 'local') {
    return localGenerate(systemPrompt, userMessage, options);
  }
  if (provider === 'cloud') {
    return cloudGenerate(systemPrompt, userMessage, options);
  }

  // Auto mode: try local first, then cloud
  if (await localAvailable()) {
    const result = await localGenerate(systemPrompt, userMessage, options);
    if (result) return result;
  }

  if (cloudAvailable()) {
    const result = await cloudGenerate(systemPrompt, userMessage, options);
    if (result) return result;
  }

  // No LLM available — return null so caller uses template fallback
  return null;
}

/**
 * Get the current provider status.
 * @returns {Promise<{ local: boolean, cloud: boolean, active: string }>}
 */
export async function getStatus() {
  const local = await localAvailable();
  const cloud = cloudAvailable();
  const active = local ? 'local' : cloud ? 'cloud' : 'template';
  return { local, cloud, active };
}

export default { generate, localAvailable, localGenerate, cloudAvailable, cloudGenerate, getStatus };
