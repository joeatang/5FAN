/**
 * User Profile — Onboarding Questionnaire & Profile Persistence
 * In-memory user profiles with optional onboarding flow.
 * App developers can extend this with their own persistence backend.
 */

import { pick } from './brains/5fan.js';

/** In-memory profile store (replace with DB for production) */
const profiles = new Map();

/**
 * Onboarding questionnaire — asked on first interaction.
 * Each question has an id, question text, and optional predefined choices.
 */
export const ONBOARDING_QUESTIONS = [
  {
    id: 'name',
    question: 'What should I call you?',
    type: 'freetext',
  },
  {
    id: 'goal',
    question: 'What brings you here? (Pick one or type your own)',
    type: 'choice',
    choices: [
      'Emotional support',
      'Building better habits',
      'Self-discovery',
      'Staying motivated',
      'Just exploring',
    ],
  },
  {
    id: 'energy',
    question: 'How are you feeling right now, 1-10?',
    type: 'scale',
    min: 1,
    max: 10,
  },
  {
    id: 'preference',
    question: 'Do you prefer direct advice or gentle reflection?',
    type: 'choice',
    choices: ['Direct', 'Gentle', 'Mix of both'],
  },
];

/**
 * Create a new user profile.
 * @param {string} userId
 * @param {object} [answers] - optional onboarding answers
 * @returns {object}
 */
export function createProfile(userId, answers = {}) {
  const profile = {
    userId,
    name: answers.name || null,
    goal: answers.goal || null,
    energy: answers.energy ? parseInt(answers.energy, 10) : null,
    preference: answers.preference || 'mix',
    onboarded: Object.keys(answers).length >= 2,
    createdAt: Date.now(),
    lastSeenAt: Date.now(),
    messageCount: 0,
    sessionCount: 1,
    tags: [],
    notes: [],
  };
  profiles.set(userId, profile);
  return profile;
}

/**
 * Get an existing profile or create a minimal one.
 * @param {string} userId
 * @returns {object}
 */
export function getOrCreateProfile(userId) {
  if (profiles.has(userId)) {
    const profile = profiles.get(userId);
    profile.lastSeenAt = Date.now();
    return profile;
  }
  return createProfile(userId);
}

/**
 * Update a profile with new data.
 * @param {string} userId
 * @param {object} updates
 * @returns {object|null}
 */
export function updateProfile(userId, updates) {
  const profile = profiles.get(userId);
  if (!profile) return null;
  Object.assign(profile, updates, { lastSeenAt: Date.now() });
  return profile;
}

/**
 * Increment message count for a user.
 * @param {string} userId
 */
export function trackMessage(userId) {
  const profile = getOrCreateProfile(userId);
  profile.messageCount++;
}

/**
 * Add a tag to a user's profile.
 * @param {string} userId
 * @param {string} tag
 */
export function addTag(userId, tag) {
  const profile = getOrCreateProfile(userId);
  if (!profile.tags.includes(tag)) {
    profile.tags.push(tag);
  }
}

/**
 * Check if a user needs onboarding.
 * @param {string} userId
 * @returns {boolean}
 */
export function needsOnboarding(userId) {
  const profile = profiles.get(userId);
  return !profile || !profile.onboarded;
}

/**
 * Get the next onboarding question for a user.
 * @param {string} userId
 * @returns {object|null}
 */
export function getNextOnboardingQuestion(userId) {
  const profile = getOrCreateProfile(userId);
  for (const q of ONBOARDING_QUESTIONS) {
    if (profile[q.id] === null || profile[q.id] === undefined) {
      return q;
    }
  }
  // All questions answered
  profile.onboarded = true;
  return null;
}

/**
 * Answer an onboarding question.
 * @param {string} userId
 * @param {string} questionId
 * @param {string} answer
 * @returns {object|null} - next question or null if done
 */
export function answerOnboarding(userId, questionId, answer) {
  const profile = getOrCreateProfile(userId);
  profile[questionId] = answer;

  const next = getNextOnboardingQuestion(userId);
  if (!next) {
    profile.onboarded = true;
    return null;
  }
  return next;
}

/**
 * Generate a welcome message based on profile data.
 * @param {string} userId
 * @returns {string}
 */
export function getWelcomeMessage(userId) {
  const profile = profiles.get(userId);
  if (!profile) {
    return 'Welcome! I\'m 5FAN — five brains working together to support you. What should I call you?';
  }

  const name = profile.name || 'friend';
  if (profile.sessionCount <= 1) {
    return `Good to meet you, ${name}. I'm ready to listen whenever you are.`;
  }

  return pick([
    `Welcome back, ${name}. How are you today?`,
    `Hey ${name}. Good to see you again. What's on your mind?`,
    `${name}! You're back. Pick up where we left off?`,
    `Welcome back, ${name}. I've been here. What do you need today?`,
  ]);
}

/**
 * Get all profiles (for admin/stats).
 */
export function getAllProfiles() {
  return [...profiles.values()];
}

/**
 * Clear all profiles (for testing).
 */
export function clearProfiles() {
  profiles.clear();
}

export default {
  createProfile,
  getOrCreateProfile,
  updateProfile,
  trackMessage,
  addTag,
  needsOnboarding,
  getNextOnboardingQuestion,
  answerOnboarding,
  getWelcomeMessage,
  getAllProfiles,
  clearProfiles,
  ONBOARDING_QUESTIONS,
};
