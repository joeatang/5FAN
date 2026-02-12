/**
 * you - celebrates the user's unique self and authentic being
 * @param {string} input - user input
 * @returns {object} response object
 */
function you(input) {
  // Uniqueness and irreplaceability
  const uniquenessMessages = [
    "No one else can be you, and that's your power",
    "Your exact combination of traits has never existed before",
    "You're an original in a world of copies",
    "There's never been anyone quite like you, and there never will be again",
    "Your uniqueness isn't a flaw - it's your signature",
    "You're not meant to fit a mold that was never made for you",
    "The world needs your specific flavor of magic",
    "Your differences are what make you indispensable",
    "You're a limited edition of one",
    "Nobody else has your exact story, perspective, or heart"
  ];

  // Journey and imperfections
  const journeyMessages = [
    "Your journey, with all its quirks, is one of a kind",
    "Your scars tell a story only you can tell",
    "Every detour has shaped the beautiful path that is uniquely yours",
    "Your imperfections are brushstrokes in your masterpiece",
    "The crooked path you've walked is yours alone to claim",
    "Your story doesn't need to look like anyone else's",
    "All the messy parts of you create something whole and real",
    "Your journey is perfect because it's authentically yours",
    "The way you've stumbled and risen is yours to own with pride",
    "Your path is valid even when it doesn't match the map"
  ];

  // Wholeness with imperfections
  const wholenessMessages = [
    "You're not broken - you're beautifully complete as you are",
    "Your imperfections don't subtract from you; they complete you",
    "You're whole, not despite your flaws, but because of them",
    "The cracks in you are where your light shines through",
    "You're a perfect imperfection, and that's the point",
    "Your rough edges are part of your authentic texture",
    "You don't need fixing - you need accepting",
    "Your contradictions make you complex and real",
    "You're allowed to be both a masterpiece and a work in progress",
    "Your wholeness includes every part of you, even the hidden ones"
  ];

  // Beyond external labels
  const beyondLabelsMessages = [
    "You're so much more than the labels people give you",
    "Your worth isn't determined by external validation",
    "You exist beyond the boxes others try to put you in",
    "Your identity is yours to define, not theirs to decide",
    "You're not your job, your status, or your achievements",
    "The real you transcends all categories",
    "You're deeper than any title or role could capture",
    "Your essence can't be measured by external metrics",
    "Who you are goes far beyond what you do",
    "You're a mystery even to yourself, and that's beautiful"
  ];

  // Authentic self-expression
  const authenticityMessages = [
    "Your authentic self is your greatest gift to the world",
    "The more yourself you become, the more you belong",
    "Your truth doesn't need permission to exist",
    "Be unapologetically, messily, beautifully you",
    "Your genuine self is magnetic in ways performance never could be",
    "Authenticity is your superpower",
    "The world doesn't need another copy - it needs the original you",
    "Your realness is more valuable than any perfection",
    "When you show up as yourself, you give others permission to do the same",
    "Your authentic voice is the one the world is waiting to hear"
  ];

  // Self-acceptance and embrace
  const selfAcceptanceMessages = [
    "You're worthy of your own love exactly as you are",
    "Embracing yourself is the revolution",
    "You don't have to earn the right to love yourself",
    "Self-acceptance is not self-indulgence; it's self-respect",
    "You're allowed to take up space just as you are",
    "Loving yourself isn't vanity - it's vision",
    "You deserve your own compassion and kindness",
    "Be gentle with yourself - you're doing your best",
    "You're worthy of the same grace you extend to others",
    "Accepting yourself opens doors that striving never could"
  ];

  // Individual gifts and contributions
  const giftsMessages = [
    "What you bring to the world can't be replicated",
    "Your perspective is a gift only you can give",
    "The way you love is uniquely yours",
    "Your presence changes the energy of every room",
    "You have an irreplaceable role in the grand design",
    "Your specific combination of talents serves a purpose",
    "The world is incomplete without your contribution",
    "You offer something no one else can provide",
    "Your way of being is needed exactly as it is",
    "You're here for a reason only you can fulfill"
  ];

  // Freedom and permission
  const freedomMessages = [
    "You have permission to be exactly who you are",
    "You don't owe anyone a different version of yourself",
    "Free yourself from becoming what others expect",
    "You're allowed to change, grow, and redefine yourself",
    "Your evolution doesn't need anyone's approval",
    "You can unbecome everything that isn't truly you",
    "Break free from the person you thought you should be",
    "You're not required to stay who you were yesterday",
    "Give yourself permission to explore all of who you are",
    "You're free to write your own story, your own way"
  ];

  // Combine all response patterns
  const allPatterns = [
    ...uniquenessMessages,
    ...journeyMessages,
    ...wholenessMessages,
    ...beyondLabelsMessages,
    ...authenticityMessages,
    ...selfAcceptanceMessages,
    ...giftsMessages,
    ...freedomMessages
  ];

  // Select a random pattern
  const randomIndex = Math.floor(Math.random() * allPatterns.length);
  const selectedResponse = allPatterns[randomIndex];

  return {
    status: 'success',
    message: selectedResponse,
    data: input,
    responseType: getYouType(selectedResponse),
    timestamp: new Date().toISOString(),
    totalPatterns: allPatterns.length
  };
}

/**
 * Helper function to categorize you response type
 * @param {string} response - the selected response
 * @returns {string} response category
 */
function getYouType(response) {
  if (response.includes('unique') || response.includes('original') || response.includes('never been')) {
    return 'uniqueness';
  }
  if (response.includes('journey') || response.includes('path') || response.includes('story') || response.includes('scar')) {
    return 'journey';
  }
  if (response.includes('whole') || response.includes('imperfect') || response.includes('crack') || response.includes('flaw')) {
    return 'wholeness';
  }
  if (response.includes('label') || response.includes('box') || response.includes('worth') || response.includes('status')) {
    return 'beyond-labels';
  }
  if (response.includes('authentic') || response.includes('genuine') || response.includes('real')) {
    return 'authenticity';
  }
  if (response.includes('accept') || response.includes('love yourself') || response.includes('compassion')) {
    return 'self-acceptance';
  }
  if (response.includes('gift') || response.includes('contribution') || response.includes('offer') || response.includes('bring')) {
    return 'gifts';
  }
  if (response.includes('permission') || response.includes('free') || response.includes('allowed')) {
    return 'freedom';
  }
  return 'self-celebration';
}

export default you;
