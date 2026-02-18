/**
 * Hear — Main Brain Module
 * Emotional scanner. Detects feelings, validates them, reflects back.
 */

import roleConfig from './roleConfig.js';
import { scan, fulfill, log, sendTo, startIdle, isReady, markResponded } from './functions.js';

/**
 * Determine whether Hear should respond to this message.
 * @param {string} text
 * @param {object} [meta]
 * @returns {boolean}
 */
export function shouldRespond(text, meta = {}) {
  if (!isReady()) return false;
  const result = scan(text, meta);
  // Hear always wants to respond if there are emotional signals,
  // and has low-priority interest in everything (it listens to all).
  return result.signal > 0.1 || result.isCrisis;
}

/**
 * Handle an incoming message — scan + fulfill.
 * @param {string} text
 * @param {object} [meta]
 * @returns {{ scan: object, response: string, brain: string }}
 */
export function handleMessage(text, meta = {}) {
  const scanResult = scan(text, meta);
  const response = fulfill(text, scanResult);
  markResponded();
  log('respond', { signal: scanResult.signal, category: scanResult.category });
  return { scan: scanResult, response, brain: 'hear' };
}

export { roleConfig, scan, fulfill, log, sendTo, startIdle };
export default { shouldRespond, handleMessage, roleConfig, scan, fulfill, log, sendTo, startIdle };
