/**
 * Phase 3 Test — All 14 New Skills (Coach Advanced + Internal)
 * Run: node tests/test-phase3.js
 *
 * Brain-enhanced skills that use LLM will fall back to templates
 * when no LLM is available. Tests verify the template-fallback path.
 */

async function test() {
  let passed = 0;
  let failed = 0;

  function check(name, result) {
    if (result.ok) {
      console.log(`  ✅ ${name}`);
      passed++;
    } else {
      console.log(`  ❌ ${name}: ${result.error || JSON.stringify(result)}`);
      failed++;
    }
  }

  console.log('\n=== Phase 3: Testing 14 New Skills ===\n');

  // ─── Coach Skills (8) ─────────────────────────────────────────

  console.log('── AI Coach (Advanced) ──\n');

  // 1. gym-facilitator
  const gf = await import('../skills/coach/gym-facilitator/handler.js');

  // Start a new session (step 0 → step 1)
  const gf1 = await gf.handle({ gymStep: 0 });
  check('gym-facilitator (start session)', gf1);
  if (gf1.ok) console.log(`    step: ${gf1.gymStep}, title: "${gf1.stepTitle}", method: ${gf1.method}`);

  // Step 1 → Step 2 (user names their subject)
  const gf2 = await gf.handle({ text: 'I keep thinking about the argument with my partner', gymStep: 1 });
  check('gym-facilitator (step 1 → 2)', gf2);
  if (gf2.ok) console.log(`    step: ${gf2.gymStep}, title: "${gf2.stepTitle}", emotions: [${gf2.brainScan?.emotions?.join(', ')}]`);

  // Step 5 → Step 6 (target → bridge)
  const gf3 = await gf.handle({
    text: 'I want to move from frustration to relief',
    gymStep: 5,
    sessionHistory: ['argument with partner', 'I feel angry and hurt', 'anger and frustration', 'frustration', 'relief'],
  });
  check('gym-facilitator (step 5, with history)', gf3);
  if (gf3.ok) console.log(`    step: ${gf3.gymStep}, method: ${gf3.method}`);

  // Step 8 → completion
  const gf4 = await gf.handle({
    text: 'I feel calmer now. Relief.',
    gymStep: 8,
    sessionHistory: ['argument', 'angry and hurt', 'frustration', 'frustration', 'relief', 'two things can be true', 'relief'],
  });
  check('gym-facilitator (step 8, completion)', gf4);
  if (gf4.ok) console.log(`    complete: ${gf4.sessionComplete}, hasSummary: ${!!gf4.sessionSummary}`);

  // Invalid step
  const gf5 = await gf.handle({ text: 'hello', gymStep: 99 });
  check('gym-facilitator (invalid step → error)', { ok: !gf5.ok });
  console.log(`    correctly rejected: ${!gf5.ok}`);

  // 2. coach-chat
  const cc = await import('../skills/coach/coach-chat/handler.js');

  // Meta intent
  const cc1 = await cc.handle({ text: 'what can you do?' });
  check('coach-chat (meta intent)', cc1);
  if (cc1.ok) console.log(`    intent: ${cc1.detectedIntent}, method: ${cc1.method}`);

  // Gym intent
  const cc2 = await cc.handle({ text: 'I want to do a gym session' });
  check('coach-chat (gym intent)', cc2);
  if (cc2.ok) console.log(`    intent: ${cc2.detectedIntent}`);

  // Stats intent
  const cc3 = await cc.handle({ text: 'how am i doing?', userStats: { streak: 14, tier: 'bronze', hiIndex: 3.5, balance: 450 } });
  check('coach-chat (stats intent)', cc3);
  if (cc3.ok) console.log(`    intent: ${cc3.detectedIntent}, reply contains streak: ${cc3.reply?.includes('14')}`);

  // Open mode (emotional)
  const cc4 = await cc.handle({ text: 'I feel lost and disconnected from everything lately' });
  check('coach-chat (open mode, emotional)', cc4);
  if (cc4.ok) console.log(`    intent: ${cc4.detectedIntent}, brain: ${cc4.brainScan?.dominant}, signal: ${cc4.brainScan?.signal?.toFixed(2)}, emotions: [${cc4.brainScan?.emotions?.join(', ')}]`);

  // Empty text
  const cc5 = await cc.handle({ text: '' });
  check('coach-chat (empty text → error)', { ok: !cc5.ok });

  // 3. nudge-engine
  const ne = await import('../skills/coach/nudge-engine/handler.js');

  // Streak about to break (P1)
  const ne1 = await ne.handle({ stats: { streak: 12, today: { checkin: false }, hiIndex: 3.5 }, address: 'test-nudge-1' });
  check('nudge-engine (streak break)', ne1);
  if (ne1.ok && ne1.nudge) console.log(`    type: ${ne1.nudge.type}, brain: ${ne1.nudge.brain}, priority: ${ne1.nudge.priority}`);

  // Celebration milestone (P2)
  const ne2 = await ne.handle({ stats: { streak: 30, today: { checkin: true }, hiIndex: 4.0 }, address: 'test-nudge-2' });
  check('nudge-engine (celebration)', ne2);
  if (ne2.ok && ne2.nudge) console.log(`    type: ${ne2.nudge.type}, brain: ${ne2.nudge.brain}`);

  // Low Hi Index (P3)
  const ne3 = await ne.handle({ stats: { streak: 5, today: { checkin: true }, hiIndex: 1.5 }, address: 'test-nudge-3' });
  check('nudge-engine (low hi index)', ne3);
  if (ne3.ok && ne3.nudge) console.log(`    type: ${ne3.nudge.type}, brain: ${ne3.nudge.brain}`);

  // All clear → encouragement or greeting
  const ne4 = await ne.handle({ stats: { streak: 3, today: { checkin: true }, hiIndex: 3.5 }, address: 'test-nudge-4' });
  check('nudge-engine (fallback nudge)', ne4);
  if (ne4.ok && ne4.nudge) console.log(`    type: ${ne4.nudge.type}`);

  // 4. milestone-detect
  const md = await import('../skills/coach/milestone-detect/handler.js');

  // Streak milestone
  const md1 = await md.handle({
    op: 'checkin',
    stats: { username: 'TestUser', currentStreak: 30, balance: 400, tier: 'bronze' },
    address: 'test-ms-1',
  });
  check('milestone-detect (30-day streak)', md1);
  if (md1.ok) console.log(`    celebrations: ${md1.celebrationCount}, type: ${md1.celebrations[0]?.type}`);

  // Balance milestone
  const md2 = await md.handle({
    op: 'checkin',
    stats: { username: 'TestUser', currentStreak: 5, balance: 510, tier: 'bronze' },
    txResult: { points: 15 },
    address: 'test-ms-2',
  });
  check('milestone-detect (crossed 500 pts)', md2);
  if (md2.ok) console.log(`    celebrations: ${md2.celebrationCount}, type: ${md2.celebrations[0]?.type}`);

  // No milestone
  const md3 = await md.handle({
    op: 'checkin',
    stats: { username: 'TestUser', currentStreak: 5, balance: 100, tier: 'bronze' },
    txResult: { points: 5 },
    address: 'test-ms-3',
  });
  check('milestone-detect (no milestone)', md3);
  if (md3.ok) console.log(`    celebrations: ${md3.celebrationCount}`);

  // 5. memory-context
  const mc = await import('../skills/coach/memory-context/handler.js');

  // Stats
  const mc1 = mc.handle({ op: 'stats' });
  check('memory-context (stats)', mc1);
  if (mc1.ok) console.log(`    conversations: ${mc1.stats.conversations}`);

  // Save
  const mc2 = mc.handle({
    op: 'save',
    address: 'test-addr-1',
    conversation: {
      messages: [{ role: 'user', content: 'hello' }, { role: 'assistant', content: 'Hi there' }],
      mode: 'open',
    },
  });
  check('memory-context (save)', mc2);

  // Load
  const mc3 = mc.handle({ op: 'load', address: 'test-addr-1' });
  check('memory-context (load)', mc3);
  if (mc3.ok) console.log(`    found: ${mc3.found}, messages: ${mc3.data?.messages?.length}`);

  // Save gym summary
  const mc4 = mc.handle({
    op: 'saveGym',
    address: 'test-addr-1',
    gymSummary: { startEmotion: 'frustration', endEmotion: 'relief', bridgeExcerpt: 'Two things can be true' },
  });
  check('memory-context (saveGym)', mc4);

  // Load gym summaries
  const mc5 = mc.handle({ op: 'loadGym', address: 'test-addr-1' });
  check('memory-context (loadGym)', mc5);
  if (mc5.ok) console.log(`    gymSummaries: ${mc5.count}`);

  // Delete
  const mc6 = mc.handle({ op: 'delete', address: 'test-addr-1' });
  check('memory-context (delete)', mc6);

  // Verify deletion
  const mc7 = mc.handle({ op: 'load', address: 'test-addr-1' });
  check('memory-context (verify deleted)', { ok: mc7.ok && !mc7.found });

  // Invalid op
  const mc8 = mc.handle({ op: 'invalid' });
  check('memory-context (invalid op → error)', { ok: !mc8.ok });

  // 6. journal-prompt
  const jp = await import('../skills/coach/journal-prompt/handler.js');

  // By family
  const jp1 = await jp.handle({ familyId: 'grief', count: 3 });
  check('journal-prompt (grief family)', jp1);
  if (jp1.ok) console.log(`    prompts: ${jp1.promptCount}, family: ${jp1.familyId}, method: ${jp1.method}`);

  // By text
  const jp2 = await jp.handle({ text: 'I feel anxious about the future and scared of failing' });
  check('journal-prompt (by text)', jp2);
  if (jp2.ok) console.log(`    prompts: ${jp2.promptCount}, family: ${jp2.familyId}`);

  // Default (no context)
  const jp3 = await jp.handle({});
  check('journal-prompt (default)', jp3);
  if (jp3.ok) console.log(`    prompts: ${jp3.promptCount}, family: ${jp3.familyId}`);

  // 7. session-summary
  const ss = await import('../skills/coach/session-summary/handler.js');

  const ss1 = await ss.handle({
    messages: [
      { role: 'user', content: 'I feel overwhelmed with work and life' },
      { role: 'assistant', content: 'I hear you. That\'s a lot to carry.' },
      { role: 'user', content: 'Yeah, I just need to breathe and take it one step at a time' },
      { role: 'assistant', content: 'That\'s the move. One step. Stay Hi ✋' },
    ],
    sessionType: 'chat',
  });
  check('session-summary (chat session)', ss1);
  if (ss1.ok) console.log(`    shift: ${ss1.emotionalArc?.shift?.direction || 'none'}, themes: [${ss1.themes?.join(', ')}], method: ${ss1.method}`);

  // Gym summary
  const ss2 = await ss.handle({
    messages: [
      { role: 'user', content: 'The argument with my boss' },
      { role: 'user', content: 'I feel disrespected and angry. He treats me like I\'m invisible.' },
      { role: 'user', content: 'Anger and frustration' },
      { role: 'user', content: 'Frustration' },
      { role: 'user', content: 'Relief' },
      { role: 'user', content: 'Two things can be true. He was wrong and I can still be okay.' },
      { role: 'user', content: 'Relief. I feel calmer.' },
      { role: 'user', content: 'I own this. Relief. Hi5.' },
    ],
    sessionType: 'gym',
  });
  check('session-summary (gym session)', ss2);
  if (ss2.ok) console.log(`    arc points: ${ss2.emotionalArc?.pointCount}, method: ${ss2.method}`);

  // Empty messages
  const ss3 = await ss.handle({ messages: [] });
  check('session-summary (empty → error)', { ok: !ss3.ok });

  // 8. wellness-score
  const ws = await import('../skills/coach/wellness-score/handler.js');

  // Active user
  const ws1 = ws.handle({
    stats: {
      streak: 21,
      hiIndex: 3.8,
      totalCheckins: 45,
      gymSessions: 8,
      shiftSessions: 3,
      totalShares: 12,
      totalReactions: 15,
      daysActive: 30,
    },
  });
  check('wellness-score (active user)', ws1);
  if (ws1.ok) console.log(`    score: ${ws1.score}, grade: ${ws1.grade} (${ws1.gradeLabel}), insights: ${ws1.insights.length}`);

  // New user
  const ws2 = ws.handle({
    stats: { streak: 1, hiIndex: 3.0, totalCheckins: 1, gymSessions: 0, shiftSessions: 0, totalShares: 0, totalReactions: 0, daysActive: 1 },
  });
  check('wellness-score (new user)', ws2);
  if (ws2.ok) console.log(`    score: ${ws2.score}, grade: ${ws2.grade}`);

  // Power user
  const ws3 = ws.handle({
    stats: { streak: 90, hiIndex: 4.2, totalCheckins: 200, gymSessions: 25, shiftSessions: 15, totalShares: 50, totalReactions: 100, daysActive: 100 },
  });
  check('wellness-score (power user)', ws3);
  if (ws3.ok) console.log(`    score: ${ws3.score}, grade: ${ws3.grade} ${ws3.gradeEmoji}`);


  // ─── Internal Skills (6) ──────────────────────────────────────

  console.log('\n── Internal Skills (LOCKED) ──\n');

  // 9. earn-calculator
  const ec = await import('../skills/internal/earn-calculator/handler.js');

  // Bronze checkin moment 0
  const ec1 = ec.handle({ action: 'checkin', tier: 'bronze', streak: 10, todayActionCount: 1, momentNumber: 0 });
  check('earn-calculator (bronze checkin m0)', ec1);
  if (ec1.ok) console.log(`    base: ${ec1.basePoints}, tier: ${ec1.tierMultiplier}, streak: ${ec1.streakBonus}, final: ${ec1.finalPoints}`);

  // Gold share with quality
  const ec2 = ec.handle({ action: 'share', tier: 'gold', streak: 30, todayActionCount: 2, qualityScore: 0.8 });
  check('earn-calculator (gold share q=0.8)', ec2);
  if (ec2.ok) console.log(`    final: ${ec2.finalPoints}, breakdown: ${ec2.breakdown}`);

  // Free tier with diminishing returns
  const ec3 = ec.handle({ action: 'reaction', tier: 'free', streak: 0, todayActionCount: 8 });
  check('earn-calculator (free reaction t=8)', ec3);
  if (ec3.ok) console.log(`    diminishing: ${ec3.diminishingMult}, final: ${ec3.finalPoints}`);

  // Invalid action
  const ec4 = ec.handle({ action: 'invalid_action' });
  check('earn-calculator (invalid → error)', { ok: !ec4.ok });

  // 10. tier-gate
  const tg = await import('../skills/internal/tier-gate/handler.js');

  // Free user accessing free feature
  const tg1 = tg.handle({ tier: 'free', feature: 'checkin' });
  check('tier-gate (free → checkin)', tg1);
  if (tg1.ok) console.log(`    allowed: ${tg1.allowed}`);

  // Free user denied gym
  const tg2 = tg.handle({ tier: 'free', feature: 'gym' });
  check('tier-gate (free → gym denied)', tg2);
  if (tg2.ok) console.log(`    allowed: ${tg2.allowed}, required: ${tg2.requiredTier}`);

  // Gold user accessing silver feature
  const tg3 = tg.handle({ tier: 'gold', feature: 'journal' });
  check('tier-gate (gold → journal)', tg3);
  if (tg3.ok) console.log(`    allowed: ${tg3.allowed}`);

  // 11. hi5-claim-check
  const hc = await import('../skills/internal/hi5-claim-check/handler.js');

  // Eligible claim
  const hc1 = hc.handle({ balance: 2000, lastClaimAt: null, streak: 35 });
  check('hi5-claim-check (eligible, streak bonus)', hc1);
  if (hc1.ok) console.log(`    eligible: ${hc1.eligible}, hi5: ${hc1.claimableHi5}, bonus: ${hc1.streakBonusHi5}`);

  // Below minimum
  const hc2 = hc.handle({ balance: 200, lastClaimAt: null, streak: 5 });
  check('hi5-claim-check (below min)', hc2);
  if (hc2.ok) console.log(`    eligible: ${hc2.eligible}, reason: ${hc2.reason}`);

  // Cooldown active
  const hc3 = hc.handle({ balance: 1000, lastClaimAt: Date.now() - 3600000, streak: 10 });
  check('hi5-claim-check (cooldown)', hc3);
  if (hc3.ok) console.log(`    eligible: ${hc3.eligible}, cooldownHours: ${hc3.cooldownHours}`);

  // 12. quality-score
  const qs = await import('../skills/internal/quality-score/handler.js');

  // Good quality content
  const qs1 = qs.handle({
    text: 'Today I realized that showing up consistently is more important than being perfect. The streak is teaching me discipline.',
    previousTexts: ['Different text from yesterday'],
    emojiCount: 2,
    wavesReceived: 5,
  });
  check('quality-score (good content)', qs1);
  if (qs1.ok) console.log(`    score: ${qs1.score}, grade: ${qs1.grade}`);

  // Low quality (short, duplicate)
  const qs2 = qs.handle({
    text: 'ok',
    previousTexts: ['ok', 'ok', 'fine'],
    wavesReceived: 0,
  });
  check('quality-score (low content)', qs2);
  if (qs2.ok) console.log(`    score: ${qs2.score}, grade: ${qs2.grade}`);

  // 13. anti-bot
  const ab = await import('../skills/internal/anti-bot/handler.js');

  // Normal human behavior
  const now = Date.now();
  const ab1 = ab.handle({
    timestamps: [now, now - 30000, now - 90000, now - 200000],
    texts: ['feeling good today', 'just checked in', 'shared a moment'],
    actionTypes: ['checkin', 'share', 'reaction'],
  });
  check('anti-bot (normal behavior)', ab1);
  if (ab1.ok) console.log(`    suspicion: ${ab1.suspicionScore}, bot: ${ab1.isLikelyBot}, flags: [${ab1.flags.join(', ')}]`);

  // Bot-like behavior (rapid fire, repetitive)
  const ab2 = ab.handle({
    timestamps: [now, now - 100, now - 200, now - 300, now - 400, now - 500, now - 600, now - 700, now - 800, now - 900],
    texts: ['click', 'click', 'click', 'click', 'click', 'click', 'click', 'click'],
    actionTypes: ['reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction', 'reaction'],
  });
  check('anti-bot (bot-like behavior)', ab2);
  if (ab2.ok) console.log(`    suspicion: ${ab2.suspicionScore}, bot: ${ab2.isLikelyBot}, flags: [${ab2.flags.join(', ')}]`);

  // 14. vault-query
  const vq = await import('../skills/internal/vault-query/handler.js');

  // Query without vault function registered
  const vq1 = await vq.handle({ address: '03e752662ba9904d95ed5a2f369b4dad737422ec526e55d3203366d768494fe3' });
  check('vault-query (no vault fn)', vq1);
  if (vq1.ok) console.log(`    enriched: ${vq1._vaultEnriched}, tier: ${vq1.profile?.tier}`);

  // Missing address
  const vq2 = await vq.handle({});
  check('vault-query (no address → error)', { ok: !vq2.ok });

  // With field filter
  const vq3 = await vq.handle({ address: 'test-addr', fields: ['tier', 'balance', 'hiZone'] });
  check('vault-query (field filter)', vq3);
  if (vq3.ok) console.log(`    fields: ${Object.keys(vq3.profile).join(', ')}`);


  // ─── Registry + Server Check ──────────────────────────────────

  console.log('\n── Registry + Server ──\n');

  const { SKILL_REGISTRY } = await import('../skill-protocol.js');

  // Check all Phase 3 skills are registered
  const phase3Skills = [
    'gym-facilitator', 'coach-chat', 'nudge-engine', 'milestone-detect',
    'memory-context', 'journal-prompt', 'session-summary', 'wellness-score',
    'earn-calculator', 'tier-gate', 'hi5-claim-check', 'quality-score',
    'anti-bot', 'vault-query',
  ];

  for (const skill of phase3Skills) {
    const registered = !!SKILL_REGISTRY[skill];
    check(`registry: ${skill}`, { ok: registered });
    if (!registered) console.log(`    MISSING from SKILL_REGISTRY!`);
  }

  // Check internal flag on locked skills
  const internalSkills = ['earn-calculator', 'tier-gate', 'hi5-claim-check', 'quality-score', 'anti-bot', 'vault-query'];
  for (const skill of internalSkills) {
    const entry = SKILL_REGISTRY[skill];
    check(`internal flag: ${skill}`, { ok: entry?.internal === true });
  }

  // Total registry count
  const totalRegistered = Object.keys(SKILL_REGISTRY).length;
  console.log(`\n    Total skills registered: ${totalRegistered}`);

  // ─── Summary ──────────────────────────────────────────────────

  console.log(`\n=== Phase 3 Results: ${passed} passed, ${failed} failed ===\n`);
  if (failed > 0) process.exit(1);
}

test().catch(err => {
  console.error('Test crashed:', err);
  process.exit(1);
});
