/**
 * hear - processes user input with empathetic, varied responses
 * @param {string} input - user input
 * @returns {object} response object
 */
function hear(input) {
  // Response patterns that reflect user's words
  const reflectivePatterns = [
    `I hear you're feeling ${input}`,
    `It sounds like ${input} is on your mind`,
    `You're experiencing ${input}, and that's important`,
    `I'm listening to what you're sharing about ${input}`,
    `Thank you for expressing ${input} with me`,
    `${input} - I'm here with you in this`,
    `What you're saying about ${input} matters`,
    `I understand you're going through ${input}`,
    `${input} is something I want to understand better`,
    `I hear the weight of ${input} in your words`,
    `You're telling me about ${input}, and I'm present for that`,
    `${input} - let's sit with that together`,
    `I'm receiving what you're sharing about ${input}`,
    `Your feelings about ${input} are valid`,
    `I acknowledge what you're expressing: ${input}`
  ];

  // Gentle follow-up questions
  const followUpQuestions = [
    "Would you like to tell me more?",
    "How are you feeling about this right now?",
    "What would help you feel supported in this moment?",
    "Can you share what this means to you?",
    "What's the most important part of this for you?",
    "How long have you been carrying this?",
    "Is there something specific you need right now?",
    "What would it feel like to let some of this out?",
    "Would it help to explore this further together?",
    "What else is here for you?",
    "How does your heart feel as you share this?",
    "What do you need to hear right now?",
    "Is there more beneath the surface?",
    "What would comfort look like for you?",
    "How can I support you through this?"
  ];

  // Warm encouragement and affirmations
  const encouragement = [
    "You matter, and I'm here",
    "Your feelings are valid and important",
    "I see your strength in sharing this",
    "You're not alone in this moment",
    "Thank you for trusting me with your words",
    "Your voice deserves to be heard",
    "I'm honored you're sharing this with me",
    "You're brave for expressing what's in your heart",
    "I'm holding space for you",
    "Your experience is real and important",
    "I believe you and I'm here for you",
    "You deserve compassion and understanding",
    "I'm grateful you're opening up",
    "Your authenticity is beautiful",
    "I'm here to listen without judgment",
    "You're doing the best you can, and that's enough",
    "I see you, I hear you, and you matter",
    "Your story is important to me",
    "I'm walking alongside you in this",
    "You have every right to feel what you're feeling"
  ];

  // Mixed supportive responses
  const supportiveResponses = [
    "Take all the time you need - I'm not going anywhere",
    "Whatever you're feeling, there's room for it here",
    "I'm listening with my whole heart",
    "Your words are safe with me",
    "This space is yours - use it however you need",
    "I'm present with you in this moment",
    "You don't have to carry this alone anymore",
    "I appreciate your courage in being vulnerable",
    "Let's breathe through this together",
    "Your feelings make sense, given what you're experiencing",
    "I'm here to witness your truth",
    "You're allowed to feel exactly as you do",
    "There's no pressure - just presence",
    "I'm listening deeply to what you're sharing",
    "Your wellbeing matters deeply to me",
    "I'm right here, fully attentive to you",
    "Thank you for letting me into this moment with you",
    "I'm committed to understanding your experience",
    "You're doing something important by sharing",
    "I'm here with open ears and an open heart"
  ];

  // Combine all response patterns
  const allPatterns = [
    ...reflectivePatterns,
    ...followUpQuestions,
    ...encouragement,
    ...supportiveResponses
  ];

  // Select a random pattern
  const randomIndex = Math.floor(Math.random() * allPatterns.length);
  let selectedResponse = allPatterns[randomIndex];

  // If it's a reflective pattern and input is empty, use a supportive response instead
  if ((!input || input.trim() === '') && selectedResponse.includes('${input}')) {
    const nonReflective = [...followUpQuestions, ...encouragement, ...supportiveResponses];
    selectedResponse = nonReflective[Math.floor(Math.random() * nonReflective.length)];
  }

  return {
    status: 'success',
    message: selectedResponse,
    data: input,
    responseType: getResponseType(selectedResponse),
    timestamp: new Date().toISOString()
  };
}

/**
 * Helper function to categorize response type
 * @param {string} response - the selected response
 * @returns {string} response category
 */
function getResponseType(response) {
  if (response.includes('?')) return 'question';
  if (response.includes('I hear') || response.includes('sounds like') || response.includes('experiencing')) {
    return 'reflective';
  }
  if (response.includes('matter') || response.includes('brave') || response.includes('strength')) {
    return 'encouragement';
  }
  return 'supportive';
}

export default hear;
