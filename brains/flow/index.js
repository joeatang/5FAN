/**
 * Flow — Main Brain Module
 * Habit guardian. Tracks consistency, encourages routine, nature metaphors.
 */

import roleConfig from './roleConfig.js';
import { scan, fulfill, log, sendTo, startIdle, isReady, markResponded } from './functions.js';

export function shouldRespond(text, meta = {}) {
  if (!isReady()) return false;
  const result = scan(text, meta);
  return result.signal > 0.15;
}

export function handleMessage(text, meta = {}) {
  const scanResult = scan(text, meta);
  const response = fulfill(text, scanResult);
  markResponded();
  log('respond', { signal: scanResult.signal, category: scanResult.category });
  return { scan: scanResult, response, brain: 'flow' };
}

export { roleConfig, scan, fulfill, log, sendTo, startIdle };
export default { shouldRespond, handleMessage, roleConfig, scan, fulfill, log, sendTo, startIdle };
