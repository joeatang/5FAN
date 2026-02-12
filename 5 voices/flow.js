/**
 * flow - reminds users of the constant flow of positive energy
 * @param {string} input - user input
 * @returns {object} response object
 */
function flow(input) {
  // Stream and river metaphors
  const streamMetaphors = [
    "The stream of life is always moving, even when we pause",
    "Like water around a stone, life flows around obstacles",
    "You're a river, not a pond - built for movement",
    "Every river finds its way to the ocean, and so will you",
    "The current knows where it's going, even when you don't",
    "Let yourself flow like water - adaptable and unstoppable",
    "Rivers don't rush, they simply flow. You can too",
    "The stream carries you even when you're not swimming",
    "Like a river carving through rock, gentle persistence wins",
    "You're flowing toward something beautiful, always"
  ];

  // Universal energy and connection
  const universalEnergy = [
    "You're part of something flowing, and it carries you forward",
    "The universe breathes, and you breathe with it",
    "Positive energy moves through you like wind through trees",
    "You're connected to an infinite source of renewal",
    "Life force flows through every cell of your being",
    "You're plugged into something greater than yourself",
    "The same energy that moves galaxies moves through you",
    "You're a channel for the universe's endless creativity",
    "Divine flow runs through your veins",
    "You're wrapped in the eternal current of existence"
  ];

  // Natural cycles and rhythms
  const naturalRhythms = [
    "Like seasons changing, you're always in transition",
    "The moon waxes and wanes, and so do you - both are perfect",
    "Nature doesn't hurry, yet everything is accomplished",
    "You're part of the great inhale and exhale of existence",
    "Tides come in, tides go out - trust your natural rhythm",
    "Day follows night follows day - the cycle continues through you",
    "Like clouds drifting, you're moving even in stillness",
    "The earth rotates, the planets orbit - you're in motion always",
    "Your heartbeat is the drum of the universe's song",
    "Seasons teach us that change is the only constant"
  ];

  // Release and letting go
  const releaseMessages = [
    "Release your grip and let the current guide you",
    "What you let go of flows downstream, away from you",
    "Surrender to the flow and feel the ease that comes",
    "You don't have to control the river to ride it",
    "Let go, and watch how perfectly things arrange themselves",
    "The tide takes what needs to leave and brings what needs to arrive",
    "Release resistance and feel yourself glide effortlessly",
    "Like leaves on water, let your worries drift away",
    "You're safe to let go - the flow will catch you",
    "Loosening your grip is the beginning of freedom"
  ];

  // Trust and support
  const trustMessages = [
    "Trust that the current knows the way home",
    "You're being carried by something benevolent",
    "The flow supports you even when you can't feel it",
    "Life is conspiring for your highest good",
    "You're held by invisible hands of grace",
    "The universe has your back, always",
    "Trust the timing of your unfolding",
    "You're exactly where the flow wants you to be",
    "Everything is working out in your favor",
    "The current never takes you where you don't belong"
  ];

  // Movement and momentum
  const movementMessages = [
    "Even small ripples create lasting effects",
    "You're in motion, even when progress feels invisible",
    "Momentum builds quietly before it becomes obvious",
    "Every breath is forward movement",
    "You're making waves just by being here",
    "Movement is change, and change is always happening",
    "You're dancing with life, even in slow motion",
    "The spiral moves forward while appearing to circle",
    "Your journey continues, step by liquid step",
    "Progress flows like honey - slow and steady and sweet"
  ];

  // Water and fluidity wisdom
  const waterWisdom = [
    "Be like water - soft enough to flow, strong enough to reshape mountains",
    "Fluidity is strength, not weakness",
    "Water doesn't fight obstacles, it embraces them and moves on",
    "You're liquid light, flowing through form",
    "Like morning dew, you're renewed each day",
    "Water finds a way, and so do you",
    "You're as vast as the ocean and as gentle as rain",
    "Waves return to the sea, and you return to peace",
    "Flow doesn't mean weak - the ocean is made of flow",
    "You're fluid like water, shaped by nothing, shaping everything"
  ];

  // Continuity and endless renewal
  const continuityMessages = [
    "The flow is endless, and so is your capacity to begin again",
    "Each moment is a fresh current of possibility",
    "You're renewed with every passing second",
    "The fountain of life never runs dry",
    "Every ending is just the flow turning a corner",
    "You're part of an eternal dance",
    "The stream doesn't stop, neither does your potential",
    "Life keeps flowing new chances your way",
    "You're forever beginning, forever continuing",
    "The circle is unbroken, and you're part of it"
  ];

  // Combine all response patterns
  const allPatterns = [
    ...streamMetaphors,
    ...universalEnergy,
    ...naturalRhythms,
    ...releaseMessages,
    ...trustMessages,
    ...movementMessages,
    ...waterWisdom,
    ...continuityMessages
  ];

  // Select a random pattern
  const randomIndex = Math.floor(Math.random() * allPatterns.length);
  const selectedResponse = allPatterns[randomIndex];

  return {
    status: 'success',
    message: selectedResponse,
    data: input,
    responseType: getFlowType(selectedResponse),
    timestamp: new Date().toISOString(),
    totalPatterns: allPatterns.length
  };
}

/**
 * Helper function to categorize flow type
 * @param {string} response - the selected response
 * @returns {string} flow category
 */
function getFlowType(response) {
  if (response.includes('stream') || response.includes('river') || response.includes('current')) {
    return 'stream-metaphor';
  }
  if (response.includes('universe') || response.includes('energy') || response.includes('source')) {
    return 'universal-energy';
  }
  if (response.includes('season') || response.includes('cycle') || response.includes('rhythm') || response.includes('tide')) {
    return 'natural-rhythm';
  }
  if (response.includes('release') || response.includes('let go') || response.includes('surrender')) {
    return 'release';
  }
  if (response.includes('trust') || response.includes('support') || response.includes('held') || response.includes('conspir')) {
    return 'trust';
  }
  if (response.includes('movement') || response.includes('momentum') || response.includes('progress')) {
    return 'movement';
  }
  if (response.includes('water') || response.includes('ocean') || response.includes('wave') || response.includes('dew')) {
    return 'water-wisdom';
  }
  if (response.includes('endless') || response.includes('eternal') || response.includes('forever') || response.includes('renewed')) {
    return 'continuity';
  }
  return 'flow';
}

export default flow;
