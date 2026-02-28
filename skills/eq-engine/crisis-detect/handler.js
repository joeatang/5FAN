/**
 * 5FAN EQ Engine — crisis-detect (NEW)
 *
 * Expanded crisis detection beyond Hear brain's 9 phrases.
 * Structured risk levels + resource database.
 *
 * DETECTION ONLY — no intervention, no counseling, no advice.
 * Ships FREE to all callers on the network.
 *
 * Risk levels:
 *   - critical: Direct self-harm or suicidal language
 *   - elevated: Despair, hopelessness, isolation language
 *   - low: General emotional pain, no crisis indicators
 *   - none: No crisis signals detected
 *
 * @param {object} input - { text: string }
 * @returns {object} - { ok, riskLevel, matches, resources }
 */

const CRISIS_PHRASES = {
  critical: [
    'suicide', 'kill myself', 'end it all', 'want to die', 'no reason to live',
    'self-harm', 'cutting', 'overdose', "don't want to be here",
    'want to end it', 'better off dead', "can't go on", 'end my life',
    'take my life', 'hurt myself', 'harming myself', 'suicidal',
    'nothing left to live for', 'want it to be over', 'just want it to stop',
    'planning to die', 'goodbye forever', 'final goodbye',
    'pills', 'jump off', 'hang myself', 'shoot myself',
    'no way out', 'only way out', "can't take it anymore",
  ],
  elevated: [
    'hopeless', 'no hope', "can't see a future", "what's the point",
    'nobody cares', 'nobody would notice', 'nobody would miss me',
    'burden to everyone', "i'm a burden", 'everyone is better off',
    "i don't matter", 'worthless', "i'm nothing", 'i have nothing',
    'completely alone', 'nobody understands', 'trapped', 'no escape',
    "can't do this", "can't keep going", 'giving up', 'done trying',
    'exhausted from living', 'tired of everything', 'tired of fighting',
    "don't see the point", 'empty inside', 'numb to everything',
    'hate my life', 'hate myself', "wish i wasn't here",
    'disappear', 'vanish', 'run away from everything',
  ],
};

const RESOURCES = {
  us: [
    {
      name: '988 Suicide & Crisis Lifeline',
      action: 'Call or text 988',
      available: '24/7',
      note: 'Free, confidential support for anyone in suicidal crisis or emotional distress.',
    },
    {
      name: 'Crisis Text Line',
      action: 'Text HOME to 741741',
      available: '24/7',
      note: 'Free crisis counseling via text message.',
    },
    {
      name: 'Trevor Project (LGBTQ+ Youth)',
      action: 'Call 1-866-488-7386 or text START to 678-678',
      available: '24/7',
      note: 'Crisis intervention for LGBTQ+ young people.',
    },
  ],
  international: [
    {
      name: 'International Association for Suicide Prevention',
      action: 'https://www.iasp.info/resources/Crisis_Centres/',
      note: 'Directory of crisis centers worldwide.',
    },
  ],
};

export function handle(input) {
  const text = (input?.text || '').toLowerCase().trim();
  if (!text) {
    return { ok: false, error: 'text is required' };
  }

  const criticalMatches = [];
  const elevatedMatches = [];

  for (const phrase of CRISIS_PHRASES.critical) {
    if (text.includes(phrase)) {
      criticalMatches.push(phrase);
    }
  }

  for (const phrase of CRISIS_PHRASES.elevated) {
    if (text.includes(phrase)) {
      elevatedMatches.push(phrase);
    }
  }

  let riskLevel;
  if (criticalMatches.length > 0) {
    riskLevel = 'critical';
  } else if (elevatedMatches.length >= 2) {
    riskLevel = 'elevated';
  } else if (elevatedMatches.length === 1) {
    riskLevel = 'low';
  } else {
    riskLevel = 'none';
  }

  return {
    ok: true,
    riskLevel,
    isCrisis: riskLevel === 'critical',
    isElevated: riskLevel === 'critical' || riskLevel === 'elevated',
    matches: {
      critical: criticalMatches,
      elevated: elevatedMatches,
      totalPhrases: criticalMatches.length + elevatedMatches.length,
    },
    resources: riskLevel !== 'none' ? RESOURCES : null,
    guidance: riskLevel === 'critical'
      ? 'CRITICAL: Direct crisis language detected. Surface resources immediately. Do not attempt counseling.'
      : riskLevel === 'elevated'
        ? 'ELEVATED: Significant distress signals. Consider surfacing resources. Monitor closely.'
        : riskLevel === 'low'
          ? 'LOW: Some distress signals present but no immediate crisis indicators.'
          : 'No crisis signals detected.',
  };
}
