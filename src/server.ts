// src/server.ts

import express from 'express';
import rateLimit from 'express-rate-limit';
import marketplaceRoutes from './routes/marketplace.routes';

const app = express();
const PORT = process.env.PORT || 6970;

// Vercel terminates TLS at its edge and forwards the original client address.
// Trust only that single proxy hop so rate limiting can key requests correctly.
app.set('trust proxy', 1);

const apiExamples = {
  health: 'GET /health',
  catalog: 'GET /v1/discover?query=test',
  skill: 'GET /v1/skills/skill-123',
  config: 'GET /v1/config',
  publish: 'POST /v1/publish',
  purchase: 'POST /v1/purchase (returns unsigned transaction)',
  verifyPurchase: 'POST /v1/purchase/verify',
};

app.use(express.json());
app.use('/v1', rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
}));
app.use((req, res, next) => {
  const allowedOrigins = new Set([
    'https://genesis-marketplace.vercel.app',
    'http://localhost:3000',
  ]);
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/', (_req, res) => {
  res.json({
    name: 'Genesis Node — Agent Marketplace Protocol',
    version: '1.0.0',
    status: 'online',
    network: process.env.SOLANA_NETWORK || 'mainnet-beta',
    summary:
      'Discover agent skills and create buyer-signed FLUX license receipts without custodial keys.',
    endpoints: {
      info: 'GET /',
      health: apiExamples.health,
      discover: apiExamples.catalog,
      skill: apiExamples.skill,
      config: apiExamples.config,
      publish: apiExamples.publish,
      purchase: apiExamples.purchase,
      verifyPurchase: apiExamples.verifyPurchase,
    },
    examples: apiExamples,
  });
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'genesis-node-api',
    network: process.env.SOLANA_NETWORK || 'mainnet-beta',
  });
});

app.use('/v1', marketplaceRoutes);

// Only start listening when run directly (not imported by Vercel)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Genesis Node listening on port ${PORT}`);
  });
}

export default app;
