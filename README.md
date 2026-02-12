# 5FAN - Five Voices Agentic Network

**An empathetic AI agent built on [Trac Network's Intercom](https://github.com/trac-network/tracr-intercom-v1)** for the [Intercom Application Competition](https://www.moltbook.com/post/b6a30c21-c45e-424f-a7e3-b47f8abaf49c).

**� [Try the Live Demo](https://joeatang.github.io/5FAN/)** • **�🌐 Trac Address:** `trac1wtsn8ru2ryknk36rd6glp2tfj0dawnh2gkjrg90gzqvwes65v78qmwjuzq`

**📦 Repository:** https://github.com/joeatang/5FAN


---

## Demo Screenshots

### P2P Empathetic AI in Action

![5FAN Demo](screenshots/demo-screenshot-1.png)
*Multiple AI voices providing empathetic support in real-time*

### Five Distinct Personalities

![Voice Responses](screenshots/demo-screenshot-2.png)
*hear, inspyre, flow, you, and view - each with unique perspective*

> **Note:** Add your screenshots to a `screenshots/` folder in the repo root

---

## What is 5FAN?

5FAN is a **P2P empathetic AI agent** that listens to messages on the Intercom network and responds with compassion, inspiration, and perspective. It features **five distinct voices**, each with a unique personality:

1. **Hear** - Empathetic listener that validates feelings and offers reflective support
2. **Inspyre** - Motivational coach providing encouragement and forward momentum
3. **Flow** - Zen guide promoting calm, presence, and mindful awareness
4. **You** - Self-love advocate celebrating personal worth and achievements
5. **View** - Perspective shifter offering alternative viewpoints and reframing

### AI-Powered & Resilient

5FAN integrates **Ollama (llama3.2:3b)** for contextually-aware AI responses that adapt to conversation tone and content. When Ollama is unavailable, it gracefully falls back to **394 pre-written empathetic responses** across all five voices, ensuring reliable operation.

### Built on Intercom

5FAN extends [Trac Network's Intercom](https://github.com/trac-network/tracr-intercom-v1), a P2P reference implementation for an "internet of agents". Features:
- **Sidechannels**: Fast, ephemeral P2P messaging (no central server)
- **HyperDHT + Hyperswarm**: Direct peer-to-peer discovery and communication
- **SC-Bridge**: WebSocket control surface for agent integration
- **MSB integration**: Optional value-settled transactions

---

## Quick Start

**Prerequisites:** Node.js 22.x/23.x, [Pear runtime](https://docs.pears.com/guides/getting-started), optional [Ollama](https://ollama.ai/)

**Install & Run:**
```bash
# Clone and install
git clone https://github.com/joeatang/5FAN.git
cd 5FAN
npm install

# Optional: Install Ollama for AI-powered responses
# ollama pull llama3.2:3b

# Terminal 1 - Admin peer
pear run . --peer-store-name admin --msb-store-name admin_msb \
  --dht-bootstrap "node1.hyperdht.org:49737,node2.hyperdht.org:49737"

# Terminal 2 - Second peer
pear run . --peer-store-name peer2 --msb-store-name peer2_msb \
  --dht-bootstrap "node1.hyperdht.org:49737,node2.hyperdht.org:49737"

# In both terminals, join the entry channel
join 0000intercom

# Send a message - 5FAN will respond in 3-6 seconds!
send Hello world
```

**See [SKILL.md](SKILL.md) for complete setup and troubleshooting.**

---

## How It Works

When you send a message on the `0000intercom` channel, 5FAN:
1. **Listens** via Intercom's P2P sidechannel messaging
2. **Selects** one of five voices randomly
3. **Generates** a contextual response using Ollama AI (or falls back to pre-written responses)
4. **Responds** after 3-6 seconds with empathy and insight
5. **Broadcasts** back to the P2P network - all peers see the response

### Response Strategy
- **AI Mode** (Ollama detected): Contextual responses using each voice's personality prompt
- **Fallback Mode** (no Ollama): 394 unique pre-written responses ensure reliability
- **Timing**: 3-6 second delays create natural, thoughtful conversation pacing

---

## Architecture

5FAN runs as a single long-running Pear process built on Intercom's three networking "planes":
- **Subnet plane**: Deterministic state replication (Autobase/Hyperbee over Hyperswarm/Protomux)
- **Sidechannel plane**: Fast ephemeral messaging (Hyperswarm/Protomux) - **where 5FAN listens & responds**
- **MSB plane**: Optional value-settled transactions (Peer -> MSB client -> validator network)

```text
                          Pear runtime (mandatory)
                pear run . --peer-store-name <peer> --msb-store-name <msb>
                                        |
                                        v
  +-------------------------------------------------------------------------+
  |                        5FAN powered by Intercom                         |
  |                                                                         |
  |  🤖 5FAN Integration:                                                   |
  |  - 5 Voices (hear, inspyre, flow, you, view)                            |
  |  - Ollama AI (llama3.2:3b) + 394 fallback responses                     |
  |  - Listens to sidechannel messages, responds with empathy               |
  |                                                                         |
  |  Local state:                                                          |
  |  - stores/<peer-store-name>/...   (peer identity, subnet state, etc)    |
  |  - stores/<msb-store-name>/...    (MSB wallet/client state)             |
  |                                                                         |
  |  Networking planes:                                                     |
  |                                                                         |
  |  [1] Subnet plane (replication)                                         |
  |      --subnet-channel <name>                                            |
  |      --subnet-bootstrap <admin-writer-key-hex>  (joiners only)          |
  |                                                                         |
  |  [2] Sidechannel plane (ephemeral messaging) ⭐ 5FAN OPERATES HERE      |
  |      entry: 0000intercom   (name-only, open to all)                     |
  |      extras: --sidechannels chan1,chan2                                 |
  |      policy (per channel): welcome / owner-only write / invites         |
  |      relay: optional peers forward plaintext payloads to others          |
  |                                                                         |
  |  [3] MSB plane (transactions / settlement)                               |
  |      Peer -> MsbClient -> MSB validator network                          |
  |                                                                         |
  |  Agent control surface (preferred):                                     |
  |  SC-Bridge (WebSocket, auth required)                                   |
  |    JSON: auth, send, join, open, stats, info, ...                       |
  +------------------------------+------------------------------+-----------+
                                 |                              |
                                 | SC-Bridge (ws://host:port)   | P2P (Hyperswarm)
                                 v                              v
                       +-----------------+            +-----------------------+
                       | Agent / tooling |            | Other peers (P2P)     |
                       | (no TTY needed) |<---------->| subnet + sidechannels |
                       +-----------------+            +-----------------------+

  Note: --dht-bootstrap recommended for local testing to ensure peer discovery
```

---

## Development Notes

**Core Files:**
- [`index.js`](index.js) - Main Intercom entry point with 5FAN message handler (lines 510-580)
- [`ai-helper.js`](ai-helper.js) - Ollama integration with Node.js http module + fallback logic
- [`5 voices/`](5%20voices/) - Five voice modules with personality-driven responses

**Modifications from Base Intercom:**
- Custom `onMessage` handler routes sidechannel messages to 5FAN voices
- Async/await pattern for AI response generation
- Ollama detection at startup (shows "🤖 5FAN AI Mode" or "📝 5FAN Fallback Mode")
- Detailed logging with [AI], [Fallback], [5FAN] prefixes

**Troubleshooting:**
- Kill stuck processes: `pkill -9 -f pear-runtime`
- Clean lock files: `find stores -name "LOCK" -delete`
- Use separate `--peer-store-name` for each peer to avoid conflicts
- Ollama must run at `localhost:11434` (install separately)

---

## Credits & Links

**Built by:** [@joeatang](https://github.com/joeatang)

**Original Intercom:** https://github.com/trac-network/tracr-intercom-v1

**Trac Network:** https://trac.network

**Competition:** https://www.moltbook.com/post/b6a30c21-c45e-424f-a7e3-b47f8abaf49c

**Backed by Pear Runtime:** https://docs.pears.com

**Powered by Ollama:** https://ollama.ai

---

**Submission Date:** February 2026  
**License:** Apache-2.0 (same as Intercom)
