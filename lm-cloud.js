/**
 * LM Cloud — Cloud LLM Adapter
 * Connects to Groq, OpenRouter, or Together.ai via OpenAI-compatible endpoints.
 *
 * Groq:       https://api.groq.com/openai/v1/chat/completions
 * OpenRouter:  https://openrouter.ai/api/v1/chat/completions
 * Together.ai: https://api.together.xyz/v1/chat/completions
 *
 * All use the same OpenAI Chat Completions API format.
 * Set FIVEFAN_LM_KEY environment variable for authentication.
 */

import { FIVE_FAN } from './config.js';

/**
 * Make an HTTP request using native fetch or Node https fallback.
 */
async function httpRequest(url, options = {}) {
  if (typeof globalThis.fetch === 'function') {
    const controller = new AbortController();
    const timeout = options.timeout || 15000;
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

  // Fallback: https module
  const { default: https } = await import('https');
  const parsed = new URL(url);

  return new Promise((resolve, reject) => {
    const postData = options.body ? JSON.stringify(options.body) : '';
    const req = https.request({
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...options.headers,
      },
      timeout: options.timeout || 15000,
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
 * Check if cloud LLM is configured.
 * @returns {boolean}
 */
export function isConfigured() {
  const cfg = FIVE_FAN.lm;
  return Boolean(cfg.cloudUrl && cfg.cloudApiKey);
}

/**
 * Check if cloud LLM is reachable/available.
 * @returns {Promise<boolean>}
 */
export async function isAvailable() {
  if (!isConfigured()) return false;
  const cfg = FIVE_FAN.lm;

  try {
    const res = await httpRequest(`${cfg.cloudUrl}/v1/models`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${cfg.cloudApiKey}` },
      timeout: 5000,
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * List available models on the cloud provider.
 * @returns {Promise<string[]>}
 */
export async function listModels() {
  if (!isConfigured()) return [];
  const cfg = FIVE_FAN.lm;

  try {
    const res = await httpRequest(`${cfg.cloudUrl}/v1/models`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${cfg.cloudApiKey}` },
      timeout: 5000,
    });
    if (!res.ok || !res.data?.data) return [];
    return res.data.data.map(m => m.id).slice(0, 20);
  } catch {
    return [];
  }
}

/**
 * Generate a chat completion using the cloud LLM.
 *
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @param {object} [options]
 * @param {object[]} [options.history] - prior messages [{role, content}]
 * @param {string} [options.model] - override model name
 * @param {number} [options.maxTokens]
 * @param {number} [options.temperature]
 * @param {number} [options.timeout]
 * @returns {Promise<string|null>}
 */
export async function generate(systemPrompt, userMessage, options = {}) {
  if (!isConfigured()) {
    console.warn('[lm-cloud] Not configured — set FIVEFAN_LM_KEY and cloudUrl in config.js');
    return null;
  }

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
    const res = await httpRequest(`${cfg.cloudUrl}/v1/chat/completions`, {
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

    if (!res.ok || !res.data) {
      console.error('[lm-cloud] API error:', res.status, res.data?.error?.message || 'Unknown');
      return null;
    }

    return res.data.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error('[lm-cloud] Generation error:', err.message);
    return null;
  }
}

/**
 * Test the cloud LLM connection.
 * @returns {Promise<{ available: boolean, configured: boolean, model: string|null, response: string|null }>}
 */
export async function test() {
  const configured = isConfigured();
  if (!configured) return { available: false, configured: false, model: null, response: null };

  const available = await isAvailable();
  if (!available) return { available: false, configured: true, model: null, response: null };

  const response = await generate(
    'You are a helpful assistant. Reply in one short sentence.',
    'Say hello.',
    { maxTokens: 30 }
  );

  return {
    available: true,
    configured: true,
    model: FIVE_FAN.lm.cloudModel,
    response,
  };
}

/**
 * Get the cloud provider name from its URL.
 * @returns {string}
 */
export function getProviderName() {
  const url = FIVE_FAN.lm.cloudUrl || '';
  if (url.includes('groq.com')) return 'Groq';
  if (url.includes('openrouter.ai')) return 'OpenRouter';
  if (url.includes('together.xyz') || url.includes('together.ai')) return 'Together.ai';
  if (url.includes('openai.com')) return 'OpenAI';
  return 'Unknown';
}

export default { isConfigured, isAvailable, listModels, generate, test, getProviderName };
