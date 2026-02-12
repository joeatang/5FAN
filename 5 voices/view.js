/**
 * view - offers new perspectives and helps reframe challenges
 * @param {string} input - user input
 * @returns {object} response object
 */
function view(input) {
  // Bigger picture and progress
  const biggerPictureMessages = [
    "Look at how far you've come",
    "Step back and see the full landscape of your journey",
    "You're further along than you were a year ago",
    "From above, all the pieces form a beautiful pattern",
    "Consider what you've survived to get to this moment",
    "The mountain looks smaller from the summit of your experience",
    "You've already conquered what once seemed impossible",
    "Your progress is visible when you expand the frame",
    "The big picture includes all your small victories",
    "Perspective shows you've been growing all along"
  ];

  // Temporal zoom out
  const temporalPerspective = [
    "Zoom out—this moment is just one of many",
    "In a year, you'll barely remember today's worry",
    "Five years from now, this will just be part of your story",
    "This is a chapter, not the whole book",
    "Today is one frame in a much longer film",
    "This moment will pass, as all moments do",
    "Years from now, you'll see why this mattered differently",
    "Time has a way of putting things in proportion",
    "This is temporary territory on a permanent journey",
    "The timeline is longer than this single point suggests"
  ];

  // Reframing and different angles
  const reframingMessages = [
    "What if this obstacle is actually an opportunity?",
    "Perhaps this difficulty is building something in you",
    "This could be happening for you, not to you",
    "What if the delay is protection?",
    "Maybe this 'setback' is actually a setup",
    "Consider that this challenge is revealing your strength",
    "What if you're exactly on time, not behind?",
    "This might be the plot twist your story needed",
    "Perhaps this is redirection, not rejection",
    "What if this struggle is your training ground?"
  ];

  // Focus shifts and glass half full
  const focusShiftMessages = [
    "Is the glass half full today?",
    "Where attention goes, energy flows—what will you focus on?",
    "Shift your gaze from what's missing to what's present",
    "Look at what's right instead of what's wrong",
    "Focus on what you can control, release what you can't",
    "What you appreciate, appreciates",
    "Find the light in the room instead of the shadows",
    "Notice what's working, not just what's broken",
    "Your focus determines your reality—choose wisely",
    "Look for the lesson, not just the loss"
  ];

  // Multiple perspectives
  const multipleViewsMessages = [
    "There's another way to see this—let's find it",
    "Every situation has at least three sides",
    "Flip the script—what's the opposite interpretation?",
    "View this through the lens of growth instead of failure",
    "See yourself as the hero of this story, not the victim",
    "What would your wisest self say about this?",
    "How would you view this if it were happening to someone you love?",
    "Imagine looking back at this moment as a turning point",
    "What if this makes sense from an angle you haven't considered?",
    "Try viewing this with curiosity instead of judgment"
  ];

  // Wisdom and reflection
  const wisdomMessages = [
    "Sometimes we're too close to see clearly",
    "Distance reveals what proximity obscures",
    "The view changes when you change where you stand",
    "Your current vantage point isn't the only one available",
    "Wisdom comes from seeing the same thing differently",
    "New perspectives create new possibilities",
    "The map is not the territory—there's always more to see",
    "Your interpretation shapes your experience",
    "Clarity comes when you're willing to shift your stance",
    "The same sun that melts ice hardens clay—perspective matters"
  ];

  // Past achievements perspective
  const pastAchievementsView = [
    "Remember when you thought you couldn't overcome that? But you did",
    "You've been underestimated before, including by yourself",
    "Look back at all the times you thought you'd break—yet here you stand",
    "Your track record includes more wins than you remember",
    "You've already proven you can handle hard things",
    "Compare where you are to where you started",
    "Your past self would be amazed by your current self",
    "You've surprised yourself before—you can do it again",
    "Count the battles you've won, not just the ones ahead",
    "Your resume of resilience is impressive"
  ];

  // Future possibility perspective
  const futurePossibilityMessages = [
    "What if the best is still ahead of you?",
    "Future you will have a completely different view of today",
    "You're planting seeds you can't yet see as trees",
    "This could be the 'before' in your success story",
    "Imagine your future gratitude for not giving up now",
    "The view from your destination will make the journey make sense",
    "You're creating a future perspective you'll be proud of",
    "What you're building now will reveal itself in time",
    "The butterfly can't see its wings while in the cocoon",
    "Your future self is cheering you on from there to here"
  ];

  // Contrast and comparison perspective
  const contrastMessages = [
    "Compare your current chapter to your worst one—see the difference?",
    "Look at what you have, not just what you lack",
    "Measure your present against your past struggles, not others' highlight reels",
    "You're comparing your behind-the-scenes to everyone's polished performance",
    "Context changes everything—what's the fuller story?",
    "Small problems from afar meant everything up close on a different day",
    "Today's crisis is tomorrow's 'remember when' story",
    "Your worst day now might be easier than your old worst days",
    "Look at how your 'normal' has elevated",
    "Gratitude shifts the entire landscape"
  ];

  // Combine all response patterns
  const allPatterns = [
    ...biggerPictureMessages,
    ...temporalPerspective,
    ...reframingMessages,
    ...focusShiftMessages,
    ...multipleViewsMessages,
    ...wisdomMessages,
    ...pastAchievementsView,
    ...futurePossibilityMessages,
    ...contrastMessages
  ];

  // Select a random pattern
  const randomIndex = Math.floor(Math.random() * allPatterns.length);
  const selectedResponse = allPatterns[randomIndex];

  return {
    status: 'success',
    message: selectedResponse,
    data: input,
    responseType: getViewType(selectedResponse),
    timestamp: new Date().toISOString(),
    totalPatterns: allPatterns.length
  };
}

/**
 * Helper function to categorize perspective type
 * @param {string} response - the selected response
 * @returns {string} perspective category
 */
function getViewType(response) {
  if (response.includes('far you') || response.includes('big picture') || response.includes('progress')) {
    return 'bigger-picture';
  }
  if (response.includes('moment') || response.includes('year') || response.includes('time') || response.includes('chapter')) {
    return 'temporal';
  }
  if (response.includes('what if') || response.includes('perhaps') || response.includes('maybe') || response.includes('could be')) {
    return 'reframing';
  }
  if (response.includes('focus') || response.includes('glass') || response.includes('attention') || response.includes('notice')) {
    return 'focus-shift';
  }
  if (response.includes('another way') || response.includes('sides') || response.includes('lens') || response.includes('angle')) {
    return 'multiple-views';
  }
  if (response.includes('wisdom') || response.includes('clarity') || response.includes('distance') || response.includes('vantage')) {
    return 'wisdom';
  }
  if (response.includes('remember when') || response.includes('track record') || response.includes('already proven')) {
    return 'past-achievements';
  }
  if (response.includes('ahead') || response.includes('future') || response.includes('destination') || response.includes('building')) {
    return 'future-possibility';
  }
  if (response.includes('compare') || response.includes('measure') || response.includes('contrast') || response.includes('look at what')) {
    return 'contrast';
  }
  return 'perspective-shift';
}

export default view;
