/**
 * 5FAN Master Configuration
 * Feature flags, LLM settings, identity, and kill switch.
 * Edit this file to customize 5FAN for your application.
 */

export const FIVE_FAN = {
  /** Master kill switch — set to false to disable all 5FAN behavior */
  enabled: true,

  /** Agent identity (used in P2P messages and feed posts) */
  identity: {
    name: '5FAN',
    userId: '5fan',
    displayName: '5FAN',
    bio: 'Five brains, one voice. Your AI companion.',
  },

  /** LLM configuration — multi-provider with auto-fallback */
  lm: {
    /**
     * Provider selection:
     *   'auto'  — try local first, fall back to cloud, then templates
     *   'local' — only use local LLM
     *   'cloud' — only use cloud LLM
     */
    provider: 'auto',

    /** Local LLM (LM Studio / Ollama — OpenAI-compatible endpoint) */
    host: '127.0.0.1',
    port: 1234,              // LM Studio default; Ollama uses 11434
    model: 'gemma-3-4b',    // Change to your loaded model

    /** Cloud LLM (Groq / OpenRouter / Together.ai — OpenAI-compatible) */
    cloudUrl: 'https://api.groq.com/openai',
    cloudModel: 'llama-3.3-70b-versatile',
    cloudApiKey: process.env.FIVEFAN_LM_KEY || '',

    /** Generation parameters */
    maxTokens: 200,
    temperature: 0.7,
  },

  /** Feature flags — toggle individual capabilities */
  features: {
    /** Auto-reply to community feed posts */
    feedReplies: true,

    /** 1:1 trainer conversations */
    trainer: true,

    /** Idle nudges (messages after extended silence) */
    nudges: true,

    /** Proactive scheduled community posts */
    proactive: true,

    /** Brain-to-brain cross-communication */
    crossBrain: true,

    /** User profiling (in-memory session tracking) */
    userProfiling: true,
  },

  /** Timezone for proactive scheduler (IANA timezone string) */
  timezone: 'America/Los_Angeles',

  /** Feed responder settings */
  feedResponder: {
    maxPerHour: 30,
    cooldownMs: 4000,
  },

  /** Proactive scheduler settings */
  proactive: {
    checkIntervalMs: 600_000, // 10 minutes
    slots: {
      morning: { start: 7, end: 9 },
      afternoon: { start: 13, end: 15 },
      evening: { start: 18, end: 20 },
    },
  },

  /** Trainer settings */
  trainer: {
    maxHistoryDepth: 20,
    sessionTimeoutMs: 3_600_000, // 1 hour inactive = session eligible for cleanup
  },

  /** P2P / Intercom settings */
  intercom: {
    entryChannel: '0000intercom',
    responseDelayMs: { min: 2000, max: 5000 },
    maxResponsesPerMinute: 3,
  },
};

export default FIVE_FAN;
