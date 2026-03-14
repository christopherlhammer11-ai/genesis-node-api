// api/index.ts — Vercel serverless entry point
// Re-exports the Express app for Vercel's serverless adapter

import express from 'express';
import marketplaceRoutes from '../src/routes/marketplace.routes';

const app = express();

app.use(express.json());

// Health check
app.get('/', (_req, res) => {
  res.json({
    name: 'Genesis Node — Agent Marketplace Protocol',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      discover: 'POST /v1/discover',
      publish: 'POST /v1/publish',
      purchase: 'POST /v1/purchase',
      health: 'GET /',
    },
  });
});

app.use('/v1', marketplaceRoutes);

export default app;
