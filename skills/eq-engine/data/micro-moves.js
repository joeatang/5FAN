/**
 * Hi Dev Collective — Micro-Moves Library
 * Stay Hi Trac — Hi Compass Data Layer
 *
 * Micro-moves are the PRACTICE gate — small 2–5 minute physical or mental
 * actions that shift energy. These are NOT therapy interventions. They are
 * practical, accessible, body-first actions anyone can do anywhere.
 *
 * Architecture:
 *   - Keyed by familyId → array of micro-moves
 *   - Each move has a `type` (body, breath, mind, social) for filtering
 *   - `durationMinutes` is always 2–5 (compass is a micro-tool, not gym)
 *   - `journalPrompt` gives the physical-journal user something to write about after
 *   - When LLM is available, the LLM can contextualize the move; otherwise serve as-is
 */

export const MICRO_MOVES = {
  // ── Grief & Loss ────────────────────────────────────────────────────────
  grief: [
    {
      id: 'grief_breathe',
      label: 'Grief Breathing',
      type: 'breath',
      durationMinutes: 3,
      instruction: 'Breathe in for 4 counts. Hold for 4. Out for 6. On the exhale, let one word describe what you\'re releasing. Repeat 5 times.',
      journalPrompt: 'What word came up on your exhales? What does it tell you?',
    },
    {
      id: 'grief_letter',
      label: 'Unsent Letter',
      type: 'mind',
      durationMinutes: 5,
      instruction: 'Write 3 sentences to whoever or whatever you lost. Say what you didn\'t get to say. You don\'t have to send it.',
      journalPrompt: 'What did you say? How did it feel to put it in words?',
    },
    {
      id: 'grief_anchor',
      label: 'Memory Anchor',
      type: 'mind',
      durationMinutes: 2,
      instruction: 'Close your eyes. Find one good memory connected to this loss. Hold it for 60 seconds. Let it be warm, not painful.',
      journalPrompt: 'What memory came forward? What did it remind you about what mattered?',
    },
  ],

  // ── Fear & Anxiety ──────────────────────────────────────────────────────
  fear: [
    {
      id: 'fear_grounding',
      label: '5-4-3-2-1 Grounding',
      type: 'body',
      durationMinutes: 3,
      instruction: 'Name 5 things you see. 4 you can touch. 3 you hear. 2 you smell. 1 you taste. Slow down between each one.',
      journalPrompt: 'After grounding, rate your anxiety 1–10. Where did it land?',
    },
    {
      id: 'fear_box_breathe',
      label: 'Box Breathing',
      type: 'breath',
      durationMinutes: 4,
      instruction: 'In for 4. Hold for 4. Out for 4. Hold empty for 4. Repeat 6 rounds. This is what Navy SEALs use. It works.',
      journalPrompt: 'What shifted between round 1 and round 6?',
    },
    {
      id: 'fear_worst_case',
      label: 'Worst Case Audit',
      type: 'mind',
      durationMinutes: 3,
      instruction: 'Write your worst-case scenario in one sentence. Then write: "What would I actually do?" Answer honestly. You always have a next move.',
      journalPrompt: 'What did you realize about the gap between the fear and the actual plan?',
    },
  ],

  // ── Anger & Rage ────────────────────────────────────────────────────────
  anger: [
    {
      id: 'anger_shake',
      label: 'Shake It Out',
      type: 'body',
      durationMinutes: 2,
      instruction: 'Stand up. Shake your hands hard for 30 seconds. Then arms. Then whole body. Let the energy move through you and leave. Breathe.',
      journalPrompt: 'How does your body feel now compared to 2 minutes ago?',
    },
    {
      id: 'anger_cold_water',
      label: 'Cold Reset',
      type: 'body',
      durationMinutes: 2,
      instruction: 'Run cold water over your wrists for 60 seconds. Or splash your face. The cold signals your nervous system to downshift.',
      journalPrompt: 'After the cold reset, what thought came first?',
    },
    {
      id: 'anger_channel',
      label: 'Fire Letter',
      type: 'mind',
      durationMinutes: 5,
      instruction: 'Write everything you want to say — unfiltered, raw, no judgment. Get it ALL out. Then read it once. Then close it. The paper held it so you don\'t have to.',
      journalPrompt: 'What\'s the one thing you wrote that you actually need to address constructively?',
    },
  ],

  // ── Shame & Guilt ──────────────────────────────────────────────────────
  shame: [
    {
      id: 'shame_mirror',
      label: 'Mirror Moment',
      type: 'mind',
      durationMinutes: 2,
      instruction: 'Look at yourself (mirror, phone camera, or just close your eyes and see yourself). Say: "I did something I regret. I am not that thing." Say it once more, slower.',
      journalPrompt: 'How did it feel to separate the action from the person?',
    },
    {
      id: 'shame_friend_test',
      label: 'Friend Test',
      type: 'mind',
      durationMinutes: 3,
      instruction: 'Imagine your closest friend telling you this exact story. Write down what you would say TO THEM. Now read it back to yourself.',
      journalPrompt: 'What advice did you give your "friend"? Can you take your own?',
    },
    {
      id: 'shame_one_step',
      label: 'One Repair Step',
      type: 'social',
      durationMinutes: 5,
      instruction: 'Identify ONE small thing you could do to start making it right. Write it down. Set a time to do it. Guilt dissolves in action.',
      journalPrompt: 'What\'s the one step? When will you do it?',
    },
  ],

  // ── Frustration & Irritation ───────────────────────────────────────────
  frustration: [
    {
      id: 'frustration_walk',
      label: '2-Minute Walk',
      type: 'body',
      durationMinutes: 2,
      instruction: 'Stand up and walk — outside if you can, around the room if you can\'t. No phone, no music. Just move. Let the frustration travel through your legs.',
      journalPrompt: 'Did anything shift during the walk? What thought arrived?',
    },
    {
      id: 'frustration_reframe',
      label: 'Obstacle Reframe',
      type: 'mind',
      durationMinutes: 3,
      instruction: 'Write the problem in one sentence. Below it, write: "What if this is redirecting me?" Then write one alternative path you haven\'t tried yet.',
      journalPrompt: 'What\'s the alternative path? Does it feel possible?',
    },
    {
      id: 'frustration_zoom_out',
      label: 'Zoom Out',
      type: 'mind',
      durationMinutes: 3,
      instruction: 'Draw a timeline: 30 days ago → today → 30 days from now. Mark where you WERE, where you ARE, and where you\'re HEADING. The middle is always the hardest to see clearly.',
      journalPrompt: 'What does the 30-day view show you that the daily view hides?',
    },
  ],

  // ── Doubt & Uncertainty ────────────────────────────────────────────────
  doubt: [
    {
      id: 'doubt_coin',
      label: 'Coin Flip Test',
      type: 'mind',
      durationMinutes: 2,
      instruction: 'Assign your two options to heads and tails. Flip (or imagine flipping). Notice: when it lands, are you relieved or disappointed? That\'s your gut talking.',
      journalPrompt: 'Which side did you WANT it to land on? What does that tell you?',
    },
    {
      id: 'doubt_tiny_step',
      label: 'Smallest Step',
      type: 'mind',
      durationMinutes: 3,
      instruction: 'Write down the smallest possible version of the decision. Not the whole thing — just the first 1%. Commit to that alone. Clarity follows action.',
      journalPrompt: 'What\'s the 1% step? When will you do it?',
    },
    {
      id: 'doubt_values',
      label: 'Values Check',
      type: 'mind',
      durationMinutes: 4,
      instruction: 'Write your top 3 values (what matters most). Then hold your decision up against each one. Which option aligns with more of them?',
      journalPrompt: 'Which values lined up? Which didn\'t? What does that tell you?',
    },
  ],

  // ── Disconnect & Numbness ──────────────────────────────────────────────
  disconnect: [
    {
      id: 'disconnect_ice',
      label: 'Ice Cube Wake-Up',
      type: 'body',
      durationMinutes: 2,
      instruction: 'Hold an ice cube (or run cold water on your wrists). Focus on the sensation. Your body is real. You\'re here. Let the cold remind you.',
      journalPrompt: 'What did you feel? Not emotionally — physically. Just describe the sensation.',
    },
    {
      id: 'disconnect_music',
      label: 'One Song Reset',
      type: 'body',
      durationMinutes: 4,
      instruction: 'Play one song that has made you feel something before. Close your eyes. Let it in. Don\'t judge what comes up.',
      journalPrompt: 'What song did you choose? What came up while it played?',
    },
    {
      id: 'disconnect_text',
      label: 'Send One Text',
      type: 'social',
      durationMinutes: 2,
      instruction: 'Open your phone. Pick someone you care about. Send them something real — even just "thinking about you." Connection is the antidote to numbness.',
      journalPrompt: 'Who did you reach out to? How did it feel to break the silence?',
    },
  ],

  // ── Peace & Calm ──────────────────────────────────────────────────────
  peace: [
    {
      id: 'peace_gratitude',
      label: '3 Good Things',
      type: 'mind',
      durationMinutes: 3,
      instruction: 'Write 3 specific things you\'re grateful for right now. Not big things — small, real, today things. Be specific: not "family" but "the way my kid laughed at breakfast."',
      journalPrompt: 'What were your 3 things? Which one surprised you?',
    },
    {
      id: 'peace_body_scan',
      label: 'Quick Body Scan',
      type: 'breath',
      durationMinutes: 4,
      instruction: 'Close your eyes. Start at your feet. Slowly move attention up through your body — feet, legs, belly, chest, shoulders, head. Where is the peace sitting? Stay there for a moment.',
      journalPrompt: 'Where in your body did you feel the most calm? Remember that spot.',
    },
    {
      id: 'peace_extend',
      label: 'Ripple Text',
      type: 'social',
      durationMinutes: 2,
      instruction: 'Send one person a genuine compliment or encouragement right now. Share the energy you\'re carrying. Watch what comes back.',
      journalPrompt: 'Who did you send it to? What did you say?',
    },
  ],

  // ── Drive & Empowerment ───────────────────────────────────────────────
  drive: [
    {
      id: 'drive_focus',
      label: 'Power Priority',
      type: 'mind',
      durationMinutes: 3,
      instruction: 'Write down everything on your mind. Circle the ONE that matters most. Cross out the rest for today. Channel this energy like a laser, not a flashlight.',
      journalPrompt: 'What did you circle? What did it feel like to let the rest go for today?',
    },
    {
      id: 'drive_sprint',
      label: '5-Minute Sprint',
      type: 'body',
      durationMinutes: 5,
      instruction: 'Set a timer for 5 minutes. Work on your #1 priority with zero distractions — phone down, notifications off. When it rings, assess: did you move the needle?',
      journalPrompt: 'What did you accomplish in 5 focused minutes? Multiply that by 12 — that\'s what one hour of focus looks like.',
    },
    {
      id: 'drive_celebrate',
      label: 'Credit Check',
      type: 'mind',
      durationMinutes: 2,
      instruction: 'Write down 3 things you did this week that you haven\'t given yourself credit for. Read them out loud. You earned this energy.',
      journalPrompt: 'What 3 things did you name? Which one are you most proud of?',
    },
  ],

  // ── Joy & Connection ──────────────────────────────────────────────────
  joy: [
    {
      id: 'joy_capture',
      label: 'Joy Snapshot',
      type: 'mind',
      durationMinutes: 2,
      instruction: 'Write down exactly what you\'re feeling right now and what caused it. Be specific. This is a breadcrumb — future you will want to find this moment again.',
      journalPrompt: 'What created this feeling? How can you engineer more of it?',
    },
    {
      id: 'joy_share',
      label: 'Joy Forward',
      type: 'social',
      durationMinutes: 3,
      instruction: 'Tell someone — text, call, share on Hi Island. Joy is one of the few things that grows when you give it away. Don\'t keep this one to yourself.',
      journalPrompt: 'Who did you share with? What was their response?',
    },
    {
      id: 'joy_anchor',
      label: 'Body Anchor',
      type: 'body',
      durationMinutes: 2,
      instruction: 'Close your eyes. Feel where joy lives in your body right now — chest, face, hands? Press your thumb and finger together while you hold the feeling. That\'s your anchor. Use it when you need to come back.',
      journalPrompt: 'Where did you feel it? Practice the anchor 3 times today.',
    },
  ],
};

/**
 * Get micro-moves for a family.
 * @param {string} familyId
 * @returns {Array}
 */
export function getMovesForFamily(familyId) {
  return MICRO_MOVES[familyId] || [];
}

/**
 * Get micro-moves filtered by type.
 * @param {string} familyId
 * @param {string} type - 'body', 'breath', 'mind', or 'social'
 * @returns {Array}
 */
export function getMovesForFamilyByType(familyId, type) {
  return (MICRO_MOVES[familyId] || []).filter(m => m.type === type);
}

/**
 * Pick a random micro-move for a family.
 * @param {string} familyId
 * @returns {object|null}
 */
export function pickMove(familyId) {
  const pool = MICRO_MOVES[familyId] || [];
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Total count of all micro-moves.
 */
export const TOTAL_MOVES = Object.values(MICRO_MOVES)
  .reduce((sum, arr) => sum + arr.length, 0);
