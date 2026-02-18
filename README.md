# 5FAN — Five Brains Agentic Network

**A multi-brain AI agent built on [Trac Network's Intercom](https://github.com/Trac-Systems/intercom).**

Five specialized brains analyze every message in parallel. A consensus pipeline synthesizes their insights into a single, informed response — powered by local or cloud LLMs with graceful template fallback.

**[Live Demo](https://joeatang.github.io/5FAN/)** · **[Architecture](ARCHITECTURE.md)** · **[Setup Guide](SKILL.md)** · **[Fork Guide](#fork-this-for-your-brand)**

**Trac Address:** `trac1wtsn8ru2ryknk36rd6glp2tfj0dawnh2gkjrg90gzqvwes65v78qmwjuzq`

---

## Why This Exists (and Why You Should Fork It)

5FAN is not just an agent — it's **infrastructure for AI-powered community engagement on P2P networks.**

The brain swarm architecture is domain-agnostic. The 5 brains (Hear, Inspyre, Flow, You, View) are a *template* — swap the keywords, templates, and personality and you have a completely different agent for a completely different community. The consensus pipeline, LLM bridge, trainer, scheduler, and feed responder all work regardless of what the brains are scanning for.

**Built for any community, brand, or platform that wants:**
- An AI companion that actually *understands* what people say (not just responds)
- Multi-perspective analysis (not one-dimensional chatbot replies)
- P2P infrastructure (no servers at scale, users own their data)
- Works offline (template fallback — no LLM required)
- Settlement on Bitcoin (via Trac Network + TAP Protocol)

---

## What Changed in v2

| | v1 | v2 |
|---|---|---|
| **Analysis** | Random voice selection | 5 brains scan in parallel |
| **Synthesis** | Single voice template | View brain curates consensus |
| **LLM** | Ollama-only | Local → Cloud → Template auto-fallback |
| **Conversation** | Broadcast only | 1:1 Trainer (open + guided exercises) |
| **Community** | Passive | Proactive scheduled posts + feed auto-reply |
| **Profiling** | None | Per-user word-frequency + onboarding |
| **Config** | Hardcoded | Feature flags + kill switch |

---

## The Five Brains

| Brain | Domain | Scans For | Signal |
|-------|--------|-----------|--------|
| **Hear** | Emotion | Pain, joy, crisis, mixed feelings | 0.0 – 1.0 |
| **Inspyre** | Values | Purpose, resilience, growth themes | 0.0 – 1.0 |
| **Flow** | Habits | Consistency, activity, recovery, flow state | 0.0 – 1.0 |
| **You** | Identity | Self-awareness, patterns, personal data | 0.0 – 1.0 |
| **View** | Synthesis | Perspective, decisions, temporal context | **+ curateConsensus()** |

Every message flows through all five brains simultaneously. View's `curateConsensus()` ranks signals, identifies the dominant brain, and builds a synthesis prompt that enriches the LLM system message.

**Crisis detection:** Hear scans for suicide/self-harm keywords and immediately provides hotline resources — no LLM delay.

---

## Consensus Pipeline

```
User message
    │
    ├─→ Hear.scan()    ─→ { signal: 0.7, emotions: ['frustration'], category: 'pain' }
    ├─→ Inspyre.scan() ─→ { signal: 0.4, themes: ['growth'] }
    ├─→ Flow.scan()    ─→ { signal: 0.2, category: 'recovery' }
    ├─→ You.scan()     ─→ { signal: 0.3, markers: ['self-reflection'] }
    └─→ View.scan()    ─→ { signal: 0.5, category: 'perspective' }
                               │
                  View.curateConsensus()
                               │
                               ▼
               { dominantBrain: 'hear',
                 synthesisPrompt: '...',
                 activeBrainCount: 4 }
                               │
                    ┌──────────┴──────────┐
                    │  LLM Bridge         │
                    │  local → cloud →    │
                    │  template fallback  │
                    └──────────┬──────────┘
                               │
                               ▼
                        Final response
```

---

## Quick Start

### Prerequisites

- **Node.js** 22.x or 23.x
- **[Pear Runtime](https://docs.pears.com/guides/getting-started)**
- **LLM** (optional): [LM Studio](https://lmstudio.ai/) or [Ollama](https://ollama.ai/) for local; Groq/OpenRouter/Together.ai for cloud

### Install

```bash
git clone https://github.com/joeatang/5FAN.git
cd 5FAN
npm install
```

### Run

```bash
# Terminal 1 — Admin peer
pear run . --peer-store-name admin --msb-store-name admin_msb \
  --dht-bootstrap "node1.hyperdht.org:49737,node2.hyperdht.org:49737"

# Terminal 2 — Second peer
pear run . --peer-store-name peer2 --msb-store-name peer2_msb \
  --dht-bootstrap "node1.hyperdht.org:49737,node2.hyperdht.org:49737"

# In both terminals
join 0000intercom
send Hello world
```

5FAN scans the message across all five brains, builds consensus, enriches via LLM (if available), and broadcasts a response.

---

## LLM Configuration

### Local LLM (recommended for development)

Start LM Studio or Ollama — 5FAN auto-detects at `localhost:1234` (LM Studio) or `localhost:11434` (Ollama).

```bash
# LM Studio: just start the application and load a model
# Ollama:
ollama pull llama3.2:3b && ollama serve
```

### Cloud LLM

Set environment variables in your shell or `.env`:

```bash
export FIVEFAN_LM_KEY=gsk_your_groq_key_here
export FIVEFAN_LM_CLOUD_URL=https://api.groq.com/openai
export FIVEFAN_LM_CLOUD_MODEL=llama-3.3-70b-versatile
```

Supported providers (all OpenAI-compatible):
- **Groq** — `https://api.groq.com/openai`
- **OpenRouter** — `https://openrouter.ai/api`
- **Together.ai** — `https://api.together.xyz`

### No LLM

Works fine without any LLM — falls back to curated templates (40+ per brain, ~200 total).

---

## Feature Flags

Edit `config.js` to toggle capabilities:

```js
features: {
  feedReplies:   true,   // Auto-reply to community posts
  trainer:       true,   // 1:1 conversation mode
  nudges:        true,   // Contextual nudges in responses
  proactive:     true,   // Scheduled community posts
  crossBrain:    true,   // Multi-brain consensus
  userProfiling: true,   // Per-user word-frequency tracking
}
```

**Kill switch:** Set `FIVE_FAN.enabled = false` to disable all brain responses instantly.

---

## Trainer Mode

DM the agent to start a 1:1 session:

| Command | Action |
|---------|--------|
| *(any message)* | Open conversation with brain swarm enrichment |
| `/exercise gratitude` | Guided gratitude exercise (5 prompts) |
| `/exercise reframe` | Cognitive reframing exercise |
| `/exercise values` | Values clarification |
| `/exercise breathe` | Guided breathing |
| `/exercise journal` | Reflective journaling |
| `/exercises` | List all available exercises |
| `/stats` | Session statistics |
| `/open` | Switch back to open conversation |

---

## Proactive Scheduler

Timezone-aware scheduled posts to the community channel:

| Slot | Window | Theme |
|------|--------|-------|
| Morning | 7:00–9:00 | Energy, gratitude, intention |
| Afternoon | 13:00–15:00 | Momentum, flow, connection |
| Evening | 18:00–20:00 | Reflection, rest, celebration |

10 templates per slot, LLM-enriched when available. Configurable timezone in `config.js`.

---

## REST API

When using Express routes (`server/routes.js`):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/5fan/status` | GET | System status + LLM availability |
| `/v1/5fan/analyze` | POST | Run brain swarm analysis on text |
| `/v1/5fan/respond` | POST | Analyze + generate response |
| `/v1/5fan/feed` | POST | Feed auto-reply |
| `/v1/5fan/trainer` | POST | Trainer conversation turn |
| `/v1/5fan/proactive` | GET | Generate proactive post |
| `/v1/5fan/lm/status` | GET | LLM provider status |

---

## File Structure

```
5FAN/
├── brains/
│   ├── 5fan.js              # Shared config, constants, helpers
│   ├── hear/                # Emotional scanner
│   ├── inspyre/             # Values alignment
│   ├── flow/                # Habit guardian
│   ├── you/                 # Data analyst / profiler
│   └── view/                # Curator + curateConsensus()
├── server/
│   ├── brain-swarm.js       # Parallel scan + consensus engine
│   ├── lm-bridge.js         # Multi-provider LLM (auto-fallback)
│   ├── feed-responder.js    # Community feed auto-reply
│   ├── proactive-scheduler.js
│   ├── trainer-api.js       # 1:1 conversation manager
│   └── routes.js            # Express REST API
├── config.js                # Master config + feature flags
├── app-context.js           # System prompt identity
├── user-profile.js          # Onboarding + profile persistence
├── intercom-swarm.js        # P2P brain swarm routing
├── lm-local.js              # Local LLM adapter
├── lm-cloud.js              # Cloud LLM adapter
├── index.js                 # Main Intercom entry point
└── ARCHITECTURE.md          # Detailed architecture docs
```

Each brain directory contains three files:
- `roleConfig.js` — Title, personality description, trigger keywords, template responses
- `functions.js` — `scan()`, `fulfill()`, `log()`, `sendTo()`
- `index.js` — `shouldRespond()`, `handleMessage()` (threshold-based)

---

## Fork This for Your Brand

5FAN is designed to be forked. The architecture separates *what the brains do* from *how the system works* — so you change the personality without touching the engine.

### What It Looks Like for Real Brands

| If You're... | Your 5-Brain Agent Becomes | Brain Specializations |
|---|---|---|
| **VeeFriends / GaryVee** | VeeFAN — character-trait companion | Hear→Empathy, Inspyre→Hustle, Flow→Patience, You→Self-Awareness, View→Gratitude |
| **Peloton / Fitness brand** | FitFAN — workout accountability | Hear→Recovery, Inspyre→PRs, Flow→Consistency, You→Body data, View→Progress |
| **Calm / Mental health** | MindFAN — emotional wellness | Hear→Mood, Inspyre→Coping, Flow→Mindfulness streaks, You→Patterns, View→Holistic |
| **Nike Running Club** | RunFAN — runner's companion | Hear→Runner's wall, Inspyre→Goals, Flow→Mileage, You→Splits data, View→Season plan |
| **Recovery community** | SoberFAN — sobriety support | Hear→Crisis/cravings, Inspyre→Why I quit, Flow→Clean days, You→Triggers, View→Long game |
| **Corporate wellness** | TeamFAN — employee engagement | Hear→Burnout, Inspyre→Purpose, Flow→Work-life, You→Team pulse, View→Culture |
| **Education / EdTech** | StudyFAN — student support | Hear→Stress, Inspyre→Goals, Flow→Study habits, You→Grades, View→Semester plan |
| **Sports franchise** | FanFAN — fan engagement | Hear→Game emotions, Inspyre→Loyalty, Flow→Watch streaks, You→Fan stats, View→Season |
| **Creator economy** | CreatorFAN — audience companion | Hear→Sentiment, Inspyre→Vision, Flow→Posting cadence, You→Audience data, View→Strategy |

### What You Change vs What You Keep

| You Change (30 min) | You Keep (entire engine) |
|---|---|
| `app-context.js` — AI personality & voice | Consensus pipeline (parallel scan → curate → respond) |
| `brains/*/roleConfig.js` — keywords & templates | LLM bridge (local → cloud → template fallback) |
| `config.js` — feature flags & timezone | Trainer system (open + guided exercises) |
| Brain names (Hear→Recovery, etc.) | Proactive scheduler (timezone-aware) |
| Template response text | Feed auto-responder (rate-limited) |
| | User profiling (word-frequency + onboarding) |
| | REST API (`/v1/5fan/*`) |
| | P2P routing (Intercom sidechannels) |
| | Crisis detection + hotline referral |

### Step-by-Step Fork

```bash
# 1. Clone
git clone https://github.com/joeatang/5FAN.git my-brand-agent
cd my-brand-agent
npm install

# 2. Edit app-context.js — change the personality
#    "You are VeeFAN, a character-trait companion for the VeeFriends community..."

# 3. Edit brains/*/roleConfig.js — change keywords + templates
#    Hear: swap emotion words for your domain
#    Inspyre: swap motivational triggers
#    Flow: swap habit/consistency keywords
#    You: swap identity/data markers
#    View: swap synthesis templates

# 4. Edit config.js — your timezone, LLM provider, feature flags

# 5. Run it
pear run . --peer-store-name admin --msb-store-name admin_msb \
  --dht-bootstrap "node1.hyperdht.org:49737,node2.hyperdht.org:49737"
```

You now have a 5-brain AI agent on a P2P network with multi-provider LLM, 1:1 coaching, proactive community engagement, and crisis detection — customized for your brand.

### Add a 6th Brain

Need a brain that doesn't exist? Add one:

1. `mkdir brains/mybrain` — create the directory
2. Copy `roleConfig.js`, `functions.js`, `index.js` from any existing brain
3. Change the scan keywords, templates, and personality
4. Register in `brains/5fan.js` → add to `BRAINS` array
5. Import in `server/brain-swarm.js` → add to scan array

View's `curateConsensus()` automatically incorporates the new brain's signals — no other changes needed.

---

## Credits

**Built by:** [@joeatang](https://github.com/joeatang)

**Built on:** [Trac Network Intercom](https://github.com/Trac-Systems/intercom) · [Pear Runtime](https://docs.pears.com) · [Trac Network](https://trac.network)

**LLM providers:** [LM Studio](https://lmstudio.ai/) · [Ollama](https://ollama.ai/) · [Groq](https://groq.com/) · [OpenRouter](https://openrouter.ai/) · [Together.ai](https://together.ai/)

---

**Version:** 2.0.0  
**License:** Apache-2.0
