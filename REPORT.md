# genesis-node-api — Analysis Report

**Date:** 2026-04-22  
**Project:** Express.js backend for decentralized AI agent skill marketplace  
**Stack:** Express.js, TypeScript 5.3.3, Solana Web3.js, Stripe, local JSON storage

---

## What This Project Is

The backend API powering the Genesis Marketplace. Enables AI agents to discover, publish, and purchase automation skills using Solana FLUX token payments with a 95/5 revenue split between sellers and the protocol. Also integrates Stripe for fiat checkout. Uses local JSON file storage for skill data.

---

## TODOs / FIXMEs Found

None — no explicit TODO or FIXME markers in the codebase.

---

## Issues Identified

| # | Issue | File | Severity |
|---|-------|------|----------|
| 1 | Unhandled `JSON.parse()` and file I/O in `getKeypair()` | `src/services/marketplace.service.ts` | High |
| 2 | Missing `STRIPE_SECRET_KEY` env var validation | `src/services/stripe.service.ts` | High |
| 3 | Discover endpoint swallows error messages | `src/routes/marketplace.routes.ts` | Medium |
| 4 | Hardcoded FLUX mint address fallback | `src/services/marketplace.service.ts` | Medium |
| 5 | Unsafe error logging (no type narrowing on `error`) | `src/services/marketplace.service.ts` | Low |
| 6 | No PublicKey format validation before construction | `src/services/marketplace.service.ts` | Low |
| 7 | Unused Stripe import in `server.ts` | `src/server.ts` | Low |

---

## What Was Fixed

### Fix 1: Error handling for keypair loading
- **File:** `src/services/marketplace.service.ts` (lines 214–221)
- **Change:** Wrapped file reading and JSON parsing in try-catch with descriptive error messages
- **Impact:** Prevents unhandled rejections during purchase flow; provides clear error context for debugging

### Fix 2: Environment variable validation for Stripe
- **File:** `src/services/stripe.service.ts` (lines 4–7)
- **Change:** Added explicit check that `STRIPE_SECRET_KEY` is set before initializing Stripe. Throws with clear message if missing.
- **Impact:** Fails fast with actionable error on startup instead of silently initializing with an invalid key

### Fix 3: Improved error propagation in discover endpoint
- **File:** `src/routes/marketplace.routes.ts` (line 26)
- **Change:** Changed error response to include actual error message: `err.message || 'Failed to discover skills'`
- **Impact:** API clients receive actionable error details instead of generic failure messages

---

## What Was NOT Fixed (and Why)

- **Hardcoded FLUX mint address:** Intentional testing fallback. Fixing requires network-aware configuration management (devnet vs mainnet).
- **Unused Stripe import:** May be planned for future integration. Low impact.
- **No PublicKey format validation:** Solana SDK validates format during `new PublicKey()` construction and throws descriptively. Adding a pre-check is redundant.

---

## Suggested Next Steps

1. Add environment-based configuration for Solana network (devnet/mainnet) and token addresses
2. Remove unused imports (Stripe in server.ts) after confirming they're not planned
3. Add request body validation middleware (e.g., Joi or Zod schemas)
4. Add integration tests for the purchase flow
5. Consider migrating from JSON file storage to a proper database for production use
