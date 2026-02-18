/**
 * View — Main Brain Module
 * Curator & synthesizer. Perspective shifts + multi-brain consensus curation.
 */

import roleConfig from './roleConfig.js';
import { scan, fulfill, curateConsensus, log, sendTo, startIdle, isReady, markResponded } from './functions.js';

export function shouldRespond(text, meta = {}) {
  if (!isReady()) return false;
  const result = scan(text, meta);
  // View has lower threshold — it's often the curator even with low self-signal.
  return result.signal > 0.1;
}

export function handleMessage(text, meta = {}) {
  const scanResult = scan(text, meta);
  const response = fulfill(text, scanResult);
  markResponded();
  log('respond', { signal: scanResult.signal, category: scanResult.category });
  return { scan: scanResult, response, brain: 'view' };
}

export { roleConfig, scan, fulfill, curateConsensus, log, sendTo, startIdle };
export default { shouldRespond, handleMessage, curateConsensus, roleConfig, scan, fulfill, log, sendTo, startIdle };
