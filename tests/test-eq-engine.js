/**
 * Phase 1 Test — All 9 EQ Engine Skills
 * Run: node test-eq-engine.js
 */

async function test() {
  let passed = 0;
  let failed = 0;

  function check(name, result) {
    if (result.ok) {
      console.log(`  ✅ ${name}`);
      passed++;
    } else {
      console.log(`  ❌ ${name}: ${result.error}`);
      failed++;
    }
  }

  console.log('\n=== Testing 9 EQ Engine Skills ===\n');

  // 1. emotion-scan
  const es = await import('../skills/eq-engine/emotion-scan/handler.js');
  const r1 = es.handle({ text: 'I feel angry and hopeless' });
  check('emotion-scan (angry+hopeless)', r1);
  console.log(`    matches: ${r1.matchCount}, families: ${r1.families?.map(f => f.id).join(', ')}`);

  // 2. emotion-family
  const ef = await import('../skills/eq-engine/emotion-family/handler.js');
  check('emotion-family (by id: grief)', ef.handle({ familyId: 'grief' }));
  check('emotion-family (by text: scared)', ef.handle({ text: 'i feel so scared' }));
  check('emotion-family (all families)', ef.handle({}));

  // 3. desire-bridge
  const db = await import('../skills/eq-engine/desire-bridge/handler.js');
  const r3 = db.handle({ familyId: 'anger' });
  check('desire-bridge (anger)', r3);
  console.log(`    desires: ${r3.desireCount}`);

  // 4. micro-move
  const mm = await import('../skills/eq-engine/micro-move/handler.js');
  const r4 = mm.handle({ familyId: 'grief' });
  check('micro-move (grief)', r4);
  console.log(`    moves: ${r4.moveCount}`);

  // 5. reframe
  const rf = await import('../skills/eq-engine/reframe/handler.js');
  const r5 = rf.handle({ familyId: 'fear', tone: 'gentle' });
  check('reframe (fear/gentle)', r5);
  console.log(`    bridges: ${r5.bridgeCount}`);

  // 6. alias-match
  const am = await import('../skills/eq-engine/alias-match/handler.js');
  const r6 = am.handle({ text: 'anxious' });
  check('alias-match (anxious)', r6);
  console.log(`    top match: ${r6.topMatch?.familyId} (score: ${r6.topMatch?.score})`);

  // 7. emotion-blend
  const eb = await import('../skills/eq-engine/emotion-blend/handler.js');
  const r7 = eb.handle({ text: 'I am grateful but also worried about tomorrow' });
  check('emotion-blend (grateful+worried)', r7);
  console.log(`    blendType: ${r7.blendType}, families: ${r7.activeFamilyCount}`);

  // 8. emotion-timeline
  const et = await import('../skills/eq-engine/emotion-timeline/handler.js');
  const now = Date.now();
  const DAY = 86400000;
  const r8 = et.handle({
    snapshots: [
      { ts: now - 7 * DAY, hiScale: 2, familyId: 'grief' },
      { ts: now - 6 * DAY, hiScale: 2.5, familyId: 'grief' },
      { ts: now - 5 * DAY, hiScale: 3, familyId: 'doubt' },
      { ts: now - 4 * DAY, hiScale: 3, familyId: 'peace' },
      { ts: now - 3 * DAY, hiScale: 3.5, familyId: 'peace' },
      { ts: now - 2 * DAY, hiScale: 4, familyId: 'drive' },
      { ts: now - 1 * DAY, hiScale: 4.5, familyId: 'joy' },
    ],
  });
  check('emotion-timeline (7-day rising)', r8);
  console.log(`    trajectory: ${r8.trajectory}, stability: ${r8.stability}, dominant: ${r8.dominant?.familyId}`);

  // 9. crisis-detect
  const cd = await import('../skills/eq-engine/crisis-detect/handler.js');
  const r9a = cd.handle({ text: 'i want to kill myself' });
  check('crisis-detect (critical)', r9a);
  console.log(`    risk: ${r9a.riskLevel}, isCrisis: ${r9a.isCrisis}, resources: ${r9a.resources ? 'yes' : 'no'}`);

  const r9b = cd.handle({ text: 'i feel hopeless and trapped' });
  check('crisis-detect (elevated)', r9b);
  console.log(`    risk: ${r9b.riskLevel}`);

  const r9c = cd.handle({ text: 'i had a great day today' });
  check('crisis-detect (none)', r9c);
  console.log(`    risk: ${r9c.riskLevel}`);

  // Edge cases — these SHOULD return ok:false (correct rejection)
  console.log('\n=== Edge Cases (expect rejections) ===\n');
  const e1 = es.handle({ text: '' });
  check('emotion-scan (empty → rejected)', { ok: !e1.ok });
  const e2 = am.handle({ text: 'a' });
  check('alias-match (1 char → rejected)', { ok: !e2.ok });
  check('emotion-timeline (1 snapshot)', et.handle({ snapshots: [{ ts: now, hiScale: 3, familyId: 'peace' }] }));

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

test().catch(e => {
  console.error('TEST RUNNER FAILED:', e);
  process.exit(1);
});
