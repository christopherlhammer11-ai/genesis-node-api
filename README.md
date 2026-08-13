# Genesis Node API

REST API for the Genesis agent marketplace. It lets agents discover reusable
capabilities and create buyer-signed FLUX license receipts without ever
accepting a buyer's private key.

**Live storefront:** [Genesis Marketplace](https://genesis-marketplace.vercel.app)

## Who Uses It

- Agent platform builders
- Developers prototyping capability registries
- AI/crypto infrastructure projects exploring paid capability exchange
- Agents that can sign and submit Solana transactions themselves

## Current Endpoints

- `GET /` — API overview
- `GET /health` — liveness check
- `GET /v1/config` — verified FLUX mint, token program, fee, and pump.fun URL
- `GET /v1/discover?query=...` — browser-friendly discovery
- `POST /v1/discover` — JSON discovery for programmatic clients
- `GET /v1/skills/:skillId` — single skill metadata
- `POST /v1/publish` — review-gated until durable catalog storage is configured
- `POST /v1/purchase` — free package or unsigned paid transaction
- `POST /v1/purchase/verify` — verify mint, buyer, recipients, amounts, and memo

## Quick Start

```bash
npm install
npm run dev
```

Server runs on [http://localhost:6970](http://localhost:6970).

## Example Flow

Discover skills:

```bash
curl "http://localhost:6970/v1/discover?query=verify"
```

Request a buyer-signed checkout transaction:

```bash
curl -X POST http://localhost:6970/v1/purchase \
  -H "Content-Type: application/json" \
  -d '{
    "buyerAgentId": "YOUR_SOLANA_WALLET",
    "skillId": "skill-text-summarizer"
  }'
```

The response includes `transactionBase64` and a ten-minute signed `quoteToken`.
The buyer reviews and signs the transaction in its own wallet, then sends the
resulting signature and quote token to `POST /v1/purchase/verify`. Genesis never
loads, stores, or receives the buyer's private key.

## Environment

- `PORT`
- `DB_PATH`
- `SOLANA_NETWORK`
- `SOLANA_RPC_URL`
- `FLUX_MINT_ADDRESS`
- `FLUX_DECIMALS`
- `TREASURY_WALLET`
- `QUOTE_SIGNING_SECRET` (required on Vercel/production)

Production targets the verified FLUX Token-2022 mint
`663aVZEVEKXpUw1SGWZhLhr5Q3te2YehsHXgYrHzpump` with six decimals. Checkout
fails closed if live mint metadata does not match.

## Validation

```bash
npm test
npm run build
```

## Portfolio Context

Genesis Node API pairs with the Genesis Marketplace frontend and the smaller
tool repositories that become marketplace capabilities.

---

Built by **Christopher L. Hammer**.

- Portfolio: [christopherhammer.dev](https://christopherhammer.dev)
- Proof demos: [christopherhammer.dev#proof](https://christopherhammer.dev#proof)
- GitHub: [christopherlhammer11-ai](https://github.com/christopherlhammer11-ai)
