---
name: 5FAN
description: Five Voices Agentic Network - An empathetic AI agent built on Trac Network's Intercom. Responds to P2P messages with compassion, inspiration, and perspective using five distinct personalities.
trac_address: trac1wtsn8ru2ryknk36rd6glp2tfj0dawnh2gkjrg90gzqvwes65v78qmwjuzq
---

# 5FAN - Five Voices Agentic Network

**Operational Guide for Running the Empathetic AI Agent**

---

## Quick Reference

- **Trac Address:** `trac1wtsn8ru2ryknk36rd6glp2tfj0dawnh2gkjrg90gzqvwes65v78qmwjuzq`
- **Repository:** https://github.com/joeatang/5FAN
- **Entry Channel:** `0000intercom`
- **Response Time:** 3-6 seconds per message
- **Total Responses:** 394 unique empathetic responses across 5 voices

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

### Optional (AI Mode)

3. **Ollama + llama3.2:3b**
   ```bash
   ollama pull llama3.2:3b
   ollama serve
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

### Terminal 1 - Admin Peer

```bash
pear run . \
  --peer-store-name admin \
  --msb-store-name admin_msb \
  --dht-bootstrap "node1.hyperdht.org:49737,node2.hyperdht.org:49737"
```

### Terminal 2 - Second Peer

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

Wait 3-6 seconds - 5FAN responds in both terminals!

---

## The Five Voices

| Voice | Personality | Responses |
|-------|-------------|-----------|
| **hear** | Empathetic listener | 70 |
| **inspyre** | Motivational coach | 74 |
| **flow** | Zen guide | 80 |
| **you** | Self-love advocate | 80 |
| **view** | Perspective shifter | 90 |

**Total:** 394 unique empathetic responses

---

## Commands

```bash
join <channel>    # Join P2P channel
send <message>    # Send message
leave <channel>   # Leave channel
list             # Show joined channels
wallet           # Wallet info
info             # Peer details
exit             # Shutdown
```

---

## Troubleshooting

### Peers don't see each other

**Solution:** Both must use identical `--dht-bootstrap` flags

### Lock file errors

```bash
pkill -9 -f pear-runtime
cd ~/5FAN
find stores -name "LOCK" -delete
```

### Ollama not detected

```bash
# Check Ollama
curl -s http://localhost:11434/api/tags | head -5

# Start if needed
ollama serve
```

**Note:** Fallback mode works without Ollama!

### First response slow (13+ seconds)

This is normal - Ollama loads 2GB model. Subsequent responses: 2-4 seconds.

---

## Architecture

```
Terminal 1 ----  HyperDHT  ---- Terminal 2
                     |
              Hyperswarm P2P
                     |
            +----------------+
            | 0000intercom   |
            | (sidechannel)  |
            +----------------+
                     |
         Messages broadcast to all peers
```

**How it works:**
1. Message received on sidechannel
2. Random voice selected
3. AI generates response (or fallback)
4. Wait 3-6 seconds
5. Broadcast to all peers

---

## Competition Submission

**Trac Address:** `trac1wtsn8ru2ryknk36rd6glp2tfj0dawnh2gkjrg90gzqvwes65v78qmwjuzq`

**GitHub:** https://github.com/joeatang/5FAN

**Built On:** [Trac Network Intercom](https://github.com/trac-network/tracr-intercom-v1)

**Competition:** https://www.moltbook.com/post/b6a30c21-c45e-424f-a7e3-b47f8abaf49c

**Built By:** @joeatang

---

## Support

**Issues:** https://github.com/joeatang/5FAN/issues

**Trac Docs:** https://docs.trac.network

**Original SKILL.md:** See `SKILL.md.intercom_original` for full Intercom documentation

---

**Last Updated:** February 2026  
**Version:** 1.0.0 (Competition Submission)  
**License:** Apache-2.0
