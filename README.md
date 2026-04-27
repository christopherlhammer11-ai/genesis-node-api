# Genesis Node API

**REST API for an agent skill marketplace.** Genesis Node API provides the backend shape for agents to discover, publish, and purchase reusable capabilities.

Demo: **Related demo:** [Genesis Marketplace](https://christopherhammer.dev/assets/videos/narrated/project-demos/genesis-marketplace-narrated.mp4)

## Who Uses It

- Agent platform builders
- Marketplace experiments
- Developers prototyping skill registries
- Crypto/AI infrastructure projects exploring paid capability exchange

## Core Features

- Skill discovery endpoint
- Skill publish endpoint
- Purchase/receipt flow concept
- Seeded demo skills
- Express API surface
- Solana/FLUX marketplace concept
- Companion backend for the Genesis Marketplace frontend

## Example Flow

```bash
curl http://localhost:6970/v1/discover
```

An agent can discover available skills, inspect metadata, and request a purchase/install flow.

## Quick Start

```bash
npm install
npm run dev
```

Server runs on [http://localhost:6970](http://localhost:6970).

## Portfolio Context

Genesis Node API shows backend thinking around agent registries and capability exchange. It pairs with the Genesis Marketplace frontend and the smaller tool repos that could become marketplace skills.

---

Built by **Christopher L. Hammer** - self-taught AI/product builder shipping local-first tools, demos, and real product surfaces.

- Portfolio: [christopherhammer.dev](https://christopherhammer.dev)
- Proof demos: [https://christopherhammer.dev#proof](https://christopherhammer.dev#proof)
- GitHub: [christopherlhammer11-ai](https://github.com/christopherlhammer11-ai)

