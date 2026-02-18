/**
 * Brain Swarm Engine
 * Runs all brain scans in parallel, then View curates consensus.
 * The result feeds into the LLM system prompt for informed responses.
 */

import { scan as hearScan } from '../brains/hear/functions.js';
import { scan as inspyreScan } from '../brains/inspyre/functions.js';
import { scan as flowScan } from '../brains/flow/functions.js';
import { scan as youScan } from '../brains/you/functions.js';
import { scan as viewScan, curateConsensus as viewCurate } from '../brains/view/functions.js';
import { fulfill as hearFulfill } from '../brains/hear/functions.js';
import { fulfill as inspyreFulfill } from '../brains/inspyre/functions.js';
import { fulfill as flowFulfill } from '../brains/flow/functions.js';
import { fulfill as youFulfill } from '../brains/you/functions.js';
import { fulfill as viewFulfill } from '../brains/view/functions.js';
import { BRAINS, pick } from '../brains/5fan.js';

const fulfillMap = {
  hear: hearFulfill,
  inspyre: inspyreFulfill,
  flow: flowFulfill,
  you: youFulfill,
  view: viewFulfill,
};

/**
 * Run all 5 brain scans in parallel, then curate consensus via View.
 *
 * @param {string} text - user message
 * @param {object} [meta] - optional context (userId, channel, mode, etc.)
 * @returns {{ scans: object[], consensus: object, tags: string[], dominantBrain: string }}
 */
export function analyze(text, meta = {}) {
  // Run all scans (synchronous — they're CPU-bound keyword scans)
  const scans = [
    hearScan(text, meta),
    inspyreScan(text, meta),
    flowScan(text, meta),
    youScan(text, meta),
    viewScan(text, meta),
  ];

  // View curates the consensus
  const consensus = viewCurate(scans, text);

  // Extract unique tags from all scans
  const tags = extractTags(scans);

  return {
    scans,
    consensus,
    tags,
    dominantBrain: consensus.dominantBrain,
  };
}

/**
 * Run analysis and generate a template-based response (no LLM).
 *
 * @param {string} text
 * @param {object} [meta]
 * @returns {{ analysis: object, response: string, brain: string }}
 */
export function analyzeAndRespond(text, meta = {}) {
  const analysis = analyze(text, meta);
  const brain = analysis.dominantBrain;
  const dominantScan = analysis.scans.find(s => s.brain === brain) || analysis.scans[0];
  const fulfillFn = fulfillMap[brain] || fulfillMap.view;
  const response = fulfillFn(text, dominantScan);

  return {
    analysis,
    response,
    brain,
  };
}

/**
 * Build an LLM system prompt enriched with brain consensus.
 *
 * @param {string} appContext - base system prompt from app-context.js
 * @param {object} analysis - output of analyze()
 * @param {object} [userProfile] - optional user profile data
 * @returns {string}
 */
export function buildEnrichedPrompt(appContext, analysis, userProfile = null) {
  const parts = [appContext];

  // Add consensus synthesis
  if (analysis.consensus.synthesisPrompt) {
    parts.push('');
    parts.push(analysis.consensus.synthesisPrompt);
  }

  // Add user profile context if available
  if (userProfile) {
    parts.push('');
    parts.push('USER CONTEXT:');
    if (userProfile.messageCount) {
      parts.push(`- Messages in session: ${userProfile.messageCount}`);
    }
    if (userProfile.topThemes && userProfile.topThemes.length > 0) {
      parts.push(`- Recurring themes: ${userProfile.topThemes.join(', ')}`);
    }
    if (userProfile.name) {
      parts.push(`- Name: ${userProfile.name}`);
    }
  }

  // Core behavioral rules
  parts.push('');
  parts.push('RESPONSE RULES:');
  parts.push('- Keep to 1-3 sentences max.');
  parts.push('- Mirror the user\'s language and energy.');
  parts.push('- Never prescribe. Validate first, always.');
  parts.push('- Be real, not clinical. Friend, not therapist.');
  parts.push('- Celebrate effort, not outcomes.');

  return parts.join('\n');
}

/**
 * Extract unique tags from all brain scan results.
 * @param {object[]} scans
 * @returns {string[]}
 */
function extractTags(scans) {
  const tags = new Set();
  for (const scan of scans) {
    // Each brain stores detected items in different property names
    const items = scan.emotions || scan.themes || scan.patterns || scan.markers || scan.angles || [];
    for (const item of items) {
      tags.add(item.toLowerCase().replace(/^crisis:/, ''));
    }
  }
  return [...tags];
}

/**
 * Quick check: does any brain have a crisis signal?
 * @param {object[]} scans
 * @returns {boolean}
 */
export function hasCrisis(scans) {
  const hearScanResult = scans.find(s => s.brain === 'hear');
  return hearScanResult?.isCrisis === true;
}

/**
 * Get the brain with the highest signal.
 * @param {object[]} scans
 * @returns {string}
 */
export function getDominantBrain(scans) {
  let best = { brain: 'view', signal: 0 };
  for (const scan of scans) {
    if (scan.signal > best.signal) best = scan;
  }
  return best.brain;
}

export default { analyze, analyzeAndRespond, buildEnrichedPrompt, hasCrisis, getDominantBrain };
