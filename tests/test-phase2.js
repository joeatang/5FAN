/**
 * Phase 2 Test — All 12 New Skills (Compass + Community + Coach + Hi-Note)
 * Run: node tests/test-phase2.js
 *
 * Note: Brain-enhanced skills that use LLM will fall back to templates
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

  console.log('\n=== Phase 2: Testing 12 New Skills ===\n');

  // ─── Compass Skills (5) ───────────────────────────────────────

  console.log('── Compass ──\n');

  // 1. compass-locate
  const cl = await import('../skills/compass/compass-locate/handler.js');
  const r1a = await cl.handle({ text: 'I feel anxious and nervous about tomorrow' });
  check('compass-locate (text: anxious)', r1a);
  if (r1a.ok) console.log(`    emotion: ${r1a.emotion?.name}, family: ${r1a.family?.id}, hiScale: ${r1a.hiScale}, match: ${r1a.matchType}`);

  const r1b = await cl.handle({ emotionId: 'gratitude' });
  check('compass-locate (emotionId: gratitude)', r1b);
  if (r1b.ok) console.log(`    emotion: ${r1b.emotion?.name}, family: ${r1b.family?.id}`);

  const r1c = await cl.handle({ text: 'devastated and crushed' });
  check('compass-locate (text: devastated)', r1c);
  if (r1c.ok) console.log(`    family: ${r1c.family?.id}, matchType: ${r1c.matchType}`);

  // 2. compass-interpret
  const ci = await import('../skills/compass/compass-interpret/handler.js');
  const r2 = await ci.handle({ familyId: 'grief', tone: 'gentle' });
  check('compass-interpret (grief/gentle)', r2);
  if (r2.ok) console.log(`    bridge: "${r2.bridge?.text?.slice(0, 60)}...", method: ${r2.method}`);

  const r2b = await ci.handle({ familyId: 'anger', context: { text: 'my boss yelled at me' } });
  check('compass-interpret (anger + context)', r2b);
  if (r2b.ok) console.log(`    tone: ${r2b.bridge?.tone}, inspyre signal: ${r2b.inspyreScan?.signal}`);

  // 3. compass-point
  const cp = await import('../skills/compass/compass-point/handler.js');
  const r3a = cp.handle({ familyId: 'fear' });
  check('compass-point (fear)', r3a);
  if (r3a.ok) console.log(`    desires: ${r3a.desireCount}, direction: ${r3a.direction}`);

  const r3b = cp.handle({});
  check('compass-point (overview)', r3b);
  if (r3b.ok) console.log(`    families: ${r3b.totalFamilies}`);

  // 4. compass-practice
  const cprac = await import('../skills/compass/compass-practice/handler.js');
  const r4 = await cprac.handle({ familyId: 'grief', type: 'breath' });
  check('compass-practice (grief/breath)', r4);
  if (r4.ok) console.log(`    move: ${r4.move?.label}, type: ${r4.move?.type}, dur: ${r4.move?.durationMinutes}min, method: ${r4.method}`);

  const r4b = await cprac.handle({ familyId: 'anger', desireId: 'anger_channel' });
  check('compass-practice (anger + desireId)', r4b);
  if (r4b.ok) console.log(`    move: ${r4b.move?.label}, bridge: ${r4b.bridge ? 'yes' : 'no'}`);

  // 5. shift-navigator
  const sn = await import('../skills/compass/shift-navigator/handler.js');
  const r5 = await sn.handle({ text: 'I feel frustrated and stuck at work' });
  check('shift-navigator (frustrated+stuck)', r5);
  if (r5.ok) {
    console.log(`    journey: ${r5.journey?.family?.id} → ${r5.journey?.direction}`);
    console.log(`    locate: ${r5.locate?.emotion?.name || 'alias'}, interpret: ${r5.interpret?.method}, practice: ${r5.practice?.move?.label}`);
    console.log(`    desires: ${r5.point?.desireCount}`);
  }

  // ─── Community Skills (4) ─────────────────────────────────────

  console.log('\n── Community ──\n');

  // 6. feed-reply
  const fr = await import('../skills/community/feed-reply/handler.js');
  const r6 = await fr.handle({ text: 'Just had the worst day. Everything fell apart.' });
  check('feed-reply (bad day)', r6);
  if (r6.ok) console.log(`    response: "${r6.response?.slice(0, 60)}...", brain: ${r6.brain}, method: ${r6.method}`);

  const r6b = await fr.handle({ text: 'I finally did it! Got my 30-day streak!' });
  check('feed-reply (celebration)', r6b);
  if (r6b.ok) console.log(`    response: "${r6b.response?.slice(0, 60)}...", brain: ${r6b.brain}`);

  // 7. proactive-post
  const pp = await import('../skills/community/proactive-post/handler.js');
  const r7a = await pp.handle({ type: 'morning' });
  check('proactive-post (morning)', r7a);
  if (r7a.ok) console.log(`    text: "${r7a.text?.slice(0, 60)}...", method: ${r7a.method}`);

  const r7b = await pp.handle({ type: 'evening' });
  check('proactive-post (evening)', r7b);
  if (r7b.ok) console.log(`    text: "${r7b.text?.slice(0, 60)}..."`);

  // 8. community-pulse
  const cpulse = await import('../skills/community/community-pulse/handler.js');
  const r8 = cpulse.handle({
    stats: {
      activeUsers: 45,
      totalShares: 312,
      avgHiScale: 3.4,
      topFamilies: { joy: 12, peace: 8, frustration: 6, fear: 4, drive: 3 },
    },
    previous: {
      activeUsers: 38,
      totalShares: 260,
      avgHiScale: 3.1,
      topFamilies: { frustration: 10, fear: 8, joy: 5, peace: 4 },
    },
  });
  check('community-pulse (with deltas)', r8);
  if (r8.ok) console.log(`    hiIndex: ${r8.hiIndex}, mood: ${r8.mood}, trend: ${r8.trend}, delta: ${r8.deltas?.hiIndex}`);

  // ─── AI Coach Skills (2) ──────────────────────────────────────

  console.log('\n── AI Coach ──\n');

  // 9. tone-match
  const tm = await import('../skills/coach/tone-match/handler.js');
  const r9a = await tm.handle({ text: 'Stop making excuses and get it done already.', detectOnly: true });
  check('tone-match (detect direct)', r9a);
  if (r9a.ok) console.log(`    detected: ${r9a.detectedTone}, confidence: ${r9a.confidence}`);

  const r9b = await tm.handle({ text: 'You need to push harder.', targetTone: 'gentle' });
  check('tone-match (rewrite to gentle)', r9b);
  if (r9b.ok) console.log(`    original tone: ${r9b.detectedTone}, rewritten: "${r9b.rewritten?.slice(0, 60)}...", method: ${r9b.method}`);

  // 10. content-elevate
  const ce = await import('../skills/coach/content-elevate/handler.js');
  const r10 = await ce.handle({ text: 'Today was really hard. I almost gave up but kept going.' });
  check('content-elevate (hard day)', r10);
  if (r10.ok) console.log(`    elevated: "${r10.elevated?.slice(0, 80)}...", method: ${r10.method}, family: ${r10.emotionalCore?.family}`);

  const r10b = await ce.handle({ text: 'Feeling grateful for my dog today.', familyId: 'joy' });
  check('content-elevate (joy + familyId)', r10b);
  if (r10b.ok) console.log(`    elevated: "${r10b.elevated?.slice(0, 80)}..."`);

  // ─── Hi-Note Skills (2) ───────────────────────────────────────

  console.log('\n── Hi-Note ──\n');

  // 11. hi-note-compose
  const hn = await import('../skills/community/hi-note-compose/handler.js');
  const r11 = await hn.handle({
    text: 'I just realized I haven\'t had a panic attack in two weeks.',
    userName: 'Jordan',
  });
  check('hi-note-compose (milestone)', r11);
  if (r11.ok) {
    console.log(`    elevated: "${r11.note?.elevated?.slice(0, 60)}..."`);
    console.log(`    pose: ${r11.note?.pose?.label}, zone: ${r11.note?.zone}`);
    console.log(`    palette: ${r11.note?.palette?.name}, doodles: ${r11.note?.doodles?.join(', ')}`);
    console.log(`    title: ${r11.note?.titleBubble?.emoji} ${r11.note?.titleBubble?.text}`);
  }

  // 12. social-caption
  const sc = await import('../skills/community/social-caption/handler.js');
  const r12a = await sc.handle({
    text: 'Two weeks no panic attacks. I\'m growing.',
    platform: 'instagram',
    userName: 'Jordan',
  });
  check('social-caption (instagram)', r12a);
  if (r12a.ok) console.log(`    caption: "${r12a.caption?.slice(0, 60)}...", hashtags: ${r12a.hashtags?.join(' ')}`);

  const r12b = await sc.handle({
    text: 'Bad day but I showed up anyway.',
    platform: 'x',
  });
  check('social-caption (x/twitter)', r12b);
  if (r12b.ok) console.log(`    caption: "${r12b.caption?.slice(0, 60)}...", chars: ${r12b.charCount}/${r12b.maxChars}`);

  // ─── Edge Cases ───────────────────────────────────────────────

  console.log('\n── Edge Cases ──\n');

  // Empty/missing inputs should fail gracefully
  const e1 = await cl.handle({});
  check('compass-locate (empty → rejected)', { ok: !e1.ok });

  const e2 = await ci.handle({});
  check('compass-interpret (no familyId → rejected)', { ok: !e2.ok });

  const e3 = await fr.handle({ text: '' });
  check('feed-reply (empty text → rejected)', { ok: !e3.ok });

  const e4 = await pp.handle({ type: 'midnight' });
  check('proactive-post (invalid type → rejected)', { ok: !e4.ok });

  const e5 = cpulse.handle({});
  check('community-pulse (no stats → rejected)', { ok: !e5.ok });

  const e6 = await tm.handle({});
  check('tone-match (no text → rejected)', { ok: !e6.ok });

  const e7 = await ce.handle({});
  check('content-elevate (no text → rejected)', { ok: !e7.ok });

  const e8 = await hn.handle({});
  check('hi-note-compose (no text → rejected)', { ok: !e8.ok });

  const e9 = await sc.handle({});
  check('social-caption (no text → rejected)', { ok: !e9.ok });

  // ─── Summary ──────────────────────────────────────────────────

  console.log(`\n=== Phase 2 Results: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

test().catch(e => {
  console.error('TEST RUNNER FAILED:', e);
  process.exit(1);
});
