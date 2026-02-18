---
name: 5FAN
description: Five Brains Agentic Network — A multi-brain AI agent built on Trac Network's Intercom. Five specialized brains analyze messages in parallel, curate consensus, and respond via LLM or templates.
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
│   │   └── index.js         # shouldRespond(), handleMessage()
│   ├── inspyre/             # Values alignment (same structure)
│   ├── flow/                # Habit tracking (same structure)
│   ├── you/                 # User profiling (same structure)
│   └── view/                # Consensus curation (+ curateConsensus)
├── server/
│   ├── brain-swarm.js       # Parallel scan engine
│   ├── lm-bridge.js         # Multi-provider LLM bridge
│   ├── feed-responder.js    # Community auto-reply
│   ├── proactive-scheduler.js # Scheduled posts
│   ├── trainer-api.js       # 1:1 conversation manager
│   └── routes.js            # Express REST API
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

## Adding a New Brain

1. Create `brains/mybrain/` with three files:
   - `roleConfig.js` — title, keywords, templates
   - `functions.js` — `scan()`, `fulfill()`, `log()`, `sendTo()`
   - `index.js` — `shouldRespond()`, `handleMessage()`
2. Register in `brains/5fan.js` → `BRAINS` constant
3. Import in `server/brain-swarm.js` → add to scan array

---

## Support

**Issues:** https://github.com/joeatang/5FAN/issues

**Architecture:** See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed system diagrams.

---

**Version:** 2.0.0  
**License:** Apache-2.0
