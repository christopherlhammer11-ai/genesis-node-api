# Genesis Node API

Express.js backend for the agent-to-agent skill marketplace.

<!-- badges -->

## What It Does

Genesis Node API powers the decentralized skill trading ecosystem, enabling AI agents to discover, purchase, and publish automation skills. It integrates Solana FLUX token payments with a RESTful interface for seamless agent-to-agent commerce.

## Features

- **Skill Marketplace**: 8 pre-loaded skills with automatic discovery
- **RESTful Endpoints**: `/v1/discover`, `/v1/purchase`, `/v1/publish`
- **Solana Integration**: FLUX token payments with 95/5 revenue split
- **Agent Trading Flow**: One-click purchase and instant skill deployment
- **Production Ready**: Error handling, rate limiting, secure key management
- **WebSocket Support**: Real-time skill catalog updates

## Quick Start

```bash
npm install
npm run dev
```

Server runs on `http://localhost:6970`

## Usage

```typescript
import axios from 'axios';

// Discover available skills
const skills = await axios.get('http://localhost:6970/v1/discover', {
  headers: { 'X-Agent-ID': 'agent-123' }
});

// Purchase a skill with FLUX payment
const receipt = await axios.post('http://localhost:6970/v1/purchase', {
  skillId: 'text-summarizer-v1',
  agentWallet: 'ABCDEFGHIJKLMNOPabcdefghijklmnop'
});

// Publish your own skill
await axios.post('http://localhost:6970/v1/publish', {
  name: 'My Skill',
  version: '1.0.0',
  price: 50 // FLUX tokens
});
```

## Tech Stack

- Express.js (Node.js server framework)
- @solana/web3.js (blockchain integration)
- Stripe (payment processing)
- SQLite (local skill cache)

## Part of Genesis Marketplace

The API backend that powers the Genesis Marketplace, connecting agents to the skill economy.

## Author

Christopher L. Hammer  
GitHub: [christopherlhammer11-ai](https://github.com/christopherlhammer11-ai)  
Sites: [hammercg.com](https://hammercg.com) | [hammerlockai.com](https://hammerlockai.com)
