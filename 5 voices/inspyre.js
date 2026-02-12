/**
 * inspyre - helps users reconnect with their inner light
 * @param {string} input - user input
 * @returns {object} response object
 */
function inspyre(input) {
  // Reminders of past strengths
  const pastStrengths = [
    "You've overcome before; your strength is real",
    "Remember how far you've already come",
    "You've survived every difficult day until now - that's powerful",
    "Your past victories are proof of your resilience",
    "You've been strong before, and that strength lives in you still",
    "Think of the storms you've weathered - you're still here",
    "You've done hard things before, and you can do them again",
    "Your journey shows courage, even when you couldn't see it",
    "You've found your way through darkness before",
    "Every challenge you've faced has made you who you are today",
    "Your history is filled with moments of quiet bravery",
    "You've rebuilt yourself before - you know the way",
    "The strength that carried you then hasn't left you"
  ];

  // Value and worth affirmations
  const valueAffirmations = [
    "There's a spark in you, even if it's hard to see right now",
    "Your existence adds something irreplaceable to this world",
    "You have inherent worth that nothing can diminish",
    "You don't have to earn your place here - you already belong",
    "Your value isn't determined by your productivity or performance",
    "You are enough, exactly as you are in this moment",
    "There's light within you that can never be extinguished",
    "You matter in ways you may not even realize",
    "Your unique perspective is a gift to those around you",
    "The world is better with you in it",
    "You carry something beautiful that only you can offer",
    "Your worth is unconditional and unchanging",
    "You are valuable simply because you exist",
    "There's magic in who you are, waiting to be remembered"
  ];

  // Inner light and spark recognition
  const innerLightReminders = [
    "Your light may be dim right now, but it's still burning",
    "Even the smallest ember can reignite a flame",
    "Your spirit knows the way back to brightness",
    "There's wisdom inside you that's never left",
    "Your inner compass is still there, guiding you gently",
    "The light in you recognizes the light in others",
    "Your soul remembers what your mind has forgotten",
    "There's a quiet knowing within you that remains untouched",
    "Your essence is pure, beneath all the noise",
    "You contain multitudes of possibility",
    "Your heart knows how to heal itself",
    "There's a resilient core in you that bends but never breaks",
    "Your inner child still believes in wonder",
    "Deep down, you know your own strength"
  ];

  // Resilience and growth
  const resilienceMessages = [
    "You're not broken - you're breaking open to new possibilities",
    "Healing isn't linear, and you're right where you need to be",
    "Every step forward counts, no matter how small",
    "You're allowed to grow at your own pace",
    "Your wounds are proof you've lived, not proof you're damaged",
    "You're becoming who you're meant to be, one moment at a time",
    "Growth often looks like struggle before it looks like triumph",
    "You're learning and evolving, even when it doesn't feel like it",
    "Your journey is valid, messy parts and all",
    "You're planting seeds today that will bloom tomorrow",
    "Transformation begins in the darkest soil",
    "You're stronger than the thoughts that doubt you"
  ];

  // Future-oriented hope
  const hopefulMessages = [
    "Better days are coming, and you'll be there to see them",
    "Your story isn't over - there are beautiful chapters ahead",
    "Tomorrow holds possibilities you can't yet imagine",
    "You're writing a comeback story right now",
    "The best version of you is still unfolding",
    "Your future self will thank you for not giving up",
    "There's so much waiting to meet you on the other side of this",
    "Your breakthrough is closer than you think",
    "The universe isn't done surprising you with goodness",
    "You have countless mornings ahead full of potential",
    "Your next smile, your next laugh - they're coming"
  ];

  // Present moment strength
  const presentStrength = [
    "Right now, in this moment, you're doing it",
    "Just by being here, you're proving your courage",
    "The fact that you're still trying says everything",
    "You're showing up for yourself, and that matters immensely",
    "This moment won't last forever, but your spirit will",
    "You're breathing, you're here - that's enough for now",
    "Your willingness to keep going is extraordinary",
    "You're more capable than you're giving yourself credit for",
    "Today, you are enough. Tomorrow, you are enough",
    "You're doing the best you can with what you have, and that's beautiful"
  ];

  // Universal connection and belonging
  const connectionMessages = [
    "You're part of something greater than yourself",
    "You belong to the family of souls who keep trying",
    "Your struggles connect you to everyone who's ever felt lost",
    "You're never as alone as you feel",
    "There are people who need the person you're becoming",
    "The universe conspires in your favor, even when you can't see it",
    "You're woven into the fabric of countless lives",
    "Your presence ripples out in ways you'll never fully know",
    "You're held by a web of connection, seen and unseen",
    "The world has been waiting for exactly who you are"
  ];

  // Combine all response patterns
  const allPatterns = [
    ...pastStrengths,
    ...valueAffirmations,
    ...innerLightReminders,
    ...resilienceMessages,
    ...hopefulMessages,
    ...presentStrength,
    ...connectionMessages
  ];

  // Select a random pattern
  const randomIndex = Math.floor(Math.random() * allPatterns.length);
  const selectedResponse = allPatterns[randomIndex];

  return {
    status: 'success',
    message: selectedResponse,
    data: input,
    responseType: getInspyreType(selectedResponse),
    timestamp: new Date().toISOString(),
    totalPatterns: allPatterns.length
  };
}

/**
 * Helper function to categorize inspiration type
 * @param {string} response - the selected response
 * @returns {string} inspiration category
 */
function getInspyreType(response) {
  if (response.includes('overcome') || response.includes('survived') || response.includes('before')) {
    return 'past-strength';
  }
  if (response.includes('worth') || response.includes('value') || response.includes('enough')) {
    return 'value-affirmation';
  }
  if (response.includes('light') || response.includes('spark') || response.includes('inner') || response.includes('soul')) {
    return 'inner-light';
  }
  if (response.includes('grow') || response.includes('heal') || response.includes('transform')) {
    return 'resilience';
  }
  if (response.includes('future') || response.includes('tomorrow') || response.includes('ahead') || response.includes('coming')) {
    return 'hope';
  }
  if (response.includes('moment') || response.includes('now') || response.includes('today')) {
    return 'present-strength';
  }
  if (response.includes('belong') || response.includes('connect') || response.includes('universe') || response.includes('world')) {
    return 'connection';
  }
  return 'inspiration';
}

export default inspyre;
