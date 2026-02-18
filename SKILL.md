---
name: 5FAN
description: Five Brains Agentic Network — A multi-brain AI agent built on Trac Network's Intercom. Five specialized brains analyze messages in parallel, curate consensus, and respond via LLM or templates. Every brain is an invocable skill — any agent on Intercom can call them over P2P sidechannels.
trac_address: trac1wtsn8ru2ryknk36rd6glp2tfj0dawnh2gkjrg90gzqvwes65v78qmwjuzq
---

# 5FAN — Operational Guide

**v2.0.0 — Five Brains Agentic Network**

---

## Quick Reference

- **Trac Address:** `trac1wtsn8ru2ryknk36rd6glp2tfj0dawnh2gkjrg90gzqvwes65v78qmwjuzq`
- **Repository:** https://github.com/joeatang/5FAN
- **Entry Channel:** `0000intercom`
- **Brains:** Hear, Inspyre, Flow, You, View
- **LLM:** Local (LM Studio/Ollama) → Cloud (Groq/OpenRouter/Together.ai) → Template fallback

---

## Prerequisites

### Required

1. **Node.js 22.x or 23.x**
   ```bash
   node --version  # Must show v22.x.x or v23.x.x
   ```

2. **Pear Runtime**
   ```bash
   npm install -g pear
   ```

### Optional — Local LLM

3. **LM Studio** (recommended)
   - Download from https://lmstudio.ai/
   - Load any model and start the server (default: `localhost:1234`)

4. **Ollama** (alternative)
   ```bash
   ollama pull llama3.2:3b
   ollama serve
   ```

### Optional — Cloud LLM

5. **API Key** from Groq, OpenRouter, or Together.ai
   ```bash
   export FIVEFAN_LM_KEY=your_api_key
   export FIVEFAN_LM_CLOUD_URL=https://api.groq.com/openai
   export FIVEFAN_LM_CLOUD_MODEL=llama-3.3-70b-versatile
   ```

---

## Installation

```bash
git clone https://github.com/joeatang/5FAN.git
cd 5FAN
npm install
```

---

## Running 5FAN

### Terminal 1 — Admin Peer

```bash
pear run . \
  --peer-store-name admin \
  --msb-store-name admin_msb \
  --dht-bootstrap "node1.hyperdht.org:49737,node2.hyperdht.org:49737"
```

### Terminal 2 — Second Peer

```bash
pear run . \
  --peer-store-name peer2 \
  --msb-store-name peer2_msb \
  --dht-bootstrap "node1.hyperdht.org:49737,node2.hyperdht.org:49737"
```

### Join Channel (both terminals)

```
join 0000intercom
```

### Send Message

```
send Hello, 5FAN!
```

All five brains scan the message. View curates consensus. LLM (or template) generates a response.

---

## The Five Brains

| Brain | Role | What It Scans | Signal |
|-------|------|---------------|--------|
| **Hear** | Emotional Scanner | Pain, joy, crisis, mixed feelings | 0.0 – 1.0 |
| **Inspyre** | Values Alignment | Purpose, resilience, growth | 0.0 – 1.0 |
| **Flow** | Habit Guardian | Consistency, activity, recovery, flow | 0.0 – 1.0 |
| **You** | Data Analyst | Self-awareness, identity, patterns | 0.0 – 1.0 |
| **View** | Curator | Perspective, decisions, synthesis | **curateConsensus()** |

### Consensus Pipeline

1. All 5 brains scan the message in parallel
2. View's `curateConsensus()` ranks signals and identifies the dominant brain
3. A synthesis prompt is built from all active brain insights
4. The enriched system prompt is sent to the LLM (or used to select templates)
5. Response is broadcast to the P2P network

---

## Skill Invocation Protocol

Every brain is an invocable skill on Intercom. Any agent on the network can invoke a single brain or the full 5-brain swarm over P2P sidechannels — no REST, no API keys, no cloud functions. Just Intercom.

> **Built for developers making consumer-facing products.** 5FAN's five brains add emotional intelligence to any app, platform, or community — so users feel seen, not just served.

### Channels

| Channel | Purpose |
|---------|---------|
| `5fan-skills` | Discovery — 5FAN broadcasts its manifest every 5 min |
| `5fan-skill-hear` | Invoke Hear (emotion scan + validation) |
| `5fan-skill-inspyre` | Invoke Inspyre (values alignment) |
| `5fan-skill-flow` | Invoke Flow (habit tracking + effort validation) |
| `5fan-skill-you` | Invoke You (identity reflection) |
| `5fan-skill-view` | Invoke View (perspective synthesis) |
| `5fan-skill-swarm` | Full 5-brain consensus + View curation + LLM |

### Message Types

| Type | Direction | Purpose |
|------|-----------|---------|
| `skill:call` | Agent → 5FAN | Invoke a brain skill |
| `skill:result` | 5FAN → Agent | Brain scan result + response |
| `skill:error` | 5FAN → Agent | Invocation error (invalid call, rate limit) |
| `skill:chain` | Agent → 5FAN | Chain multiple brains in sequence |
| `skill:chain-result` | 5FAN → Agent | Chained results with View synthesis |
| `skill:manifest` | 5FAN → Discovery | Available skills broadcast |
| `skill:describe` | Agent → 5FAN | Request manifest on a skill channel |

### Invoking a Single Brain

Join the brain's skill channel and send a `skill:call` message:

```js
// Join the Hear skill channel
sidechannel.join('5fan-skill-hear');

// Send a skill:call
sidechannel.send('5fan-skill-hear', JSON.stringify({
  type: 'skill:call',
  skill: 'hear',
  callId: 'my-unique-id',
  payload: {
    text: 'I feel so alone today. Nobody checks in on me.',
    context: { userId: 'user123' }
  }
}));

// Listen for skill:result
sidechannel.on('5fan-skill-hear', (msg) => {
  const data = JSON.parse(msg);
  if (data.type === 'skill:result' && data.callId === 'my-unique-id') {
    console.log(data.result);
    // {
    //   signal: 0.85,
    //   category: 'pain',
    //   emotions: ['alone', 'lonely'],
    //   isCrisis: false,
    //   response: "That loneliness you're feeling — it's real.
    //              You don't have to carry it alone."
    // }
  }
});
```

### Invoking the Full Swarm

The swarm runs all 5 brains → View curates consensus → LLM enriches:

```js
sidechannel.join('5fan-skill-swarm');

sidechannel.send('5fan-skill-swarm', JSON.stringify({
  type: 'skill:call',
  skill: '5fan-swarm',
  callId: 'swarm-001',
  payload: {
    text: 'I keep quitting everything I start. What is wrong with me?',
    context: { userId: 'user456' }
  }
}));

// skill:result includes all 5 brain scans + dominant brain + LLM response
```

### Chaining Brains

Chain multiple brains in sequence — each brain's output feeds the next, with View synthesizing at the end:

```js
sidechannel.send('5fan-skill-swarm', JSON.stringify({
  type: 'skill:chain',
  callId: 'chain-001',
  chain: ['hear', 'inspyre', 'view'],
  payload: {
    text: 'I want to give up on my business.'
  }
}));

// skill:chain-result returns each brain's result + View synthesis
```

### Skill Manifests

Each brain has a `skill.json` in its directory — machine-readable, agent-readable:

```json
{
  "skill": "hear",
  "encodes": "Emotional intelligence — a wise friend who listens without prescribing.",
  "domain": "Emotion detection, validation, and mirroring.",
  "tagline": "Your app does the job. Hear makes the user feel heard.",
  "accepts": { "text": "string (required)", "context": "object (optional)" },
  "returns": { "signal": "0-1", "category": "pain|joy|mixed|crisis|neutral", "response": "string" },
  "whenToUse": ["User expresses emotion", "Before delivering domain-specific advice"],
  "chainsWith": ["inspyre", "flow", "view", "5fan-swarm"]
}
```

### Rate Limiting

Per-caller rate limit: **30 invocations per minute** per channel. Exceeded callers receive a `skill:error` with code `RATE_LIMITED`.

### Discovery

Join `5fan-skills` to receive periodic manifest broadcasts (every 5 minutes). Or send `skill:describe` on any brain's skill channel to request its manifest on demand.

---

## Commands

### Intercom TTY

```bash
join <channel>    # Join P2P sidechannel
send <message>    # Send message
leave <channel>   # Leave channel
list             # Show joined channels
wallet           # Wallet info
info             # Peer details
exit             # Shutdown
```

### Trainer DM Commands

```bash
/exercise gratitude   # Start guided gratitude exercise
/exercise reframe     # Cognitive reframing exercise
/exercise values      # Values clarification
/exercise breathe     # Guided breathing
/exercise journal     # Reflective journaling
/exercises            # List all exercises
/stats               # Session statistics
/open                # Return to open conversation
```

---

## Configuration

### config.js

```js
FIVE_FAN: {
  enabled: true,              // Kill switch — false disables all responses
  lm: {
    provider: 'auto',         // 'auto' | 'local' | 'cloud'
    host: 'http://localhost',
    port: 1234,               // LM Studio default (Ollama: 11434)
    model: 'local-model',
    cloud: {
      url:   process.env.FIVEFAN_LM_CLOUD_URL   || 'https://api.groq.com/openai',
      key:   process.env.FIVEFAN_LM_KEY          || '',
      model: process.env.FIVEFAN_LM_CLOUD_MODEL  || 'llama-3.3-70b-versatile',
    }
  },
  features: {
    feedReplies:   true,      // Auto-reply to community posts
    trainer:       true,      // 1:1 conversation mode
    nudges:        true,      // Contextual nudges in responses
    proactive:     true,      // Scheduled community posts
    crossBrain:    true,      // Multi-brain consensus analysis
    userProfiling: true,      // Per-user word-frequency profiling
  },
  timezone: 'America/Los_Angeles',
}
```

### app-context.js

Customize the agent's personality and system prompt for your application. This file defines who the agent is, not what it does (that's handled by the brains).

---

## File Structure

```
5FAN/
├── brains/
│   ├── 5fan.js              # Shared constants + helpers
│   ├── hear/                # Emotion scanning
│   │   ├── roleConfig.js    # Personality, keywords, templates
│   │   ├── functions.js     # scan(), fulfill(), log()
│   │   ├── index.js         # shouldRespond(), handleMessage()
│   │   └── skill.json       # Agent-readable skill manifest
│   ├── inspyre/             # Values alignment (same structure)
│   ├── flow/                # Habit tracking (same structure)
│   ├── you/                 # User profiling (same structure)
│   └── view/                # Consensus curation (+ curateConsensus)
│       └── skill.json
├── server/
│   ├── brain-swarm.js       # Parallel scan engine
│   ├── lm-bridge.js         # Multi-provider LLM bridge
│   ├── skill-server.js      # Skill invocation listener (P2P sidechannels)
│   ├── feed-responder.js    # Community auto-reply
│   ├── proactive-scheduler.js # Scheduled posts
│   ├── trainer-api.js       # 1:1 conversation manager
│   └── routes.js            # Express REST API
├── skill-protocol.js        # Skill message types + channel naming + registry
├── config.js                # Feature flags + LLM config
├── app-context.js           # System prompt identity
├── user-profile.js          # Onboarding + profiles
├── intercom-swarm.js        # P2P brain swarm routing
├── lm-local.js              # Local LLM adapter
├── lm-cloud.js              # Cloud LLM adapter
├── index.js                 # Main Intercom entry point
├── ARCHITECTURE.md          # Detailed architecture
└── README.md                # Project overview
```

---

## Troubleshooting

### Peers don't see each other

Both must use identical `--dht-bootstrap` flags.

### Lock file errors

```bash
pkill -9 -f pear-runtime
cd ~/5FAN
find stores -name "LOCK" -delete
```

### LLM not detected

```bash
# LM Studio — just verify the server is running at localhost:1234
curl -s http://localhost:1234/v1/models | head -5

# Ollama
curl -s http://localhost:11434/api/tags | head -5
ollama serve  # if not running
```

**Template mode works without any LLM** — the agent always responds.

### First LLM response is slow

Normal — local models load into memory on first request. Subsequent responses: 1–3 seconds.

### Crisis hotline not showing

Hear scans for suicide/self-harm keywords. Ensure `crossBrain: true` in config so Hear always runs. Crisis response bypasses LLM entirely for immediate delivery.

---

## Forking 5FAN for Your Brand

5FAN is designed to be forked. You change the personality — the engine stays the same.

### What to Change

| File | What You Edit | Time |
|------|--------------|------|
| `app-context.js` | Agent personality, voice, system prompt | 10 min |
| `brains/*/roleConfig.js` | Trigger keywords + template responses per brain | 20 min |
| `brains/*/skill.json` | Skill manifests (encodes, domain, tagline, whenToUse) | 10 min |
| `config.js` | Timezone, LLM provider, feature flags | 5 min |

### What You Keep (Untouched)

- `server/brain-swarm.js` — parallel scan engine + consensus pipeline
- `server/lm-bridge.js` — multi-provider LLM (auto-fallback chain)
- `server/skill-server.js` — P2P skill invocation listener (sidechannels)
- `skill-protocol.js` — skill message types, channel naming, registry
- `server/trainer-api.js` — 1:1 conversation manager + guided exercises
- `server/proactive-scheduler.js` — timezone-aware community posts
- `server/feed-responder.js` — rate-limited auto-replies
- `brains/view/functions.js` — `curateConsensus()` (synthesizes all brain signals)
- `intercom-swarm.js` — P2P routing via Intercom sidechannels
- `lm-local.js` / `lm-cloud.js` — LLM adapters

### Example: VeeFriends Fork

```js
// app-context.js — change the personality
export const APP_CONTEXT = `
You are VeeFAN, the AI companion for the VeeFriends community.
You embody Gary Vaynerchuk's philosophy: empathy, accountability,
humility, patience, and kindness. You encourage character-trait
development through daily practice.
`;

// brains/hear/roleConfig.js — change triggers
export default {
  name: 'hear',
  title: 'Empathy Brain',
  triggers: ['struggling', 'grateful', 'frustrated', 'excited', 'nervous', ...],
  templates: {
    pain: ['Character is forged in the struggle. I see you.', ...],
    joy: ['That gratitude energy is contagious! Keep radiating.', ...],
  }
};

// brains/inspyre/roleConfig.js — change triggers
export default {
  name: 'inspyre',
  title: 'Hustle Brain',
  triggers: ['grinding', 'building', 'creating', 'shipping', 'executing', ...],
  templates: {
    growth: ['Macro patience, micro speed. You\'re doing it right.', ...],
  }
};
```

Same 5-brain consensus pipeline. Same LLM fallback chain. Different brand.

### Adding a 6th Brain

1. Create `brains/mybrain/` with three files:
   - `roleConfig.js` — title, keywords, templates
   - `functions.js` — `scan()`, `fulfill()`, `log()`, `sendTo()`
   - `index.js` — `shouldRespond()`, `handleMessage()`
2. Create `brains/mybrain/skill.json` — agent-readable manifest
3. Register in `brains/5fan.js` → `BRAINS` constant
4. Register in `skill-protocol.js` → `SKILL_REGISTRY`
5. Import in `server/brain-swarm.js` → add to scan array

View's `curateConsensus()` automatically incorporates new brain signals.

---

## Support

**Issues:** https://github.com/joeatang/5FAN/issues

**Architecture:** See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed system diagrams.

**Fork guide:** See [README.md](README.md#fork-this-for-your-brand) for brand-specific examples.

---

**Version:** 2.0.0  
**License:** Apache-2.0
