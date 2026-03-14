// src/server.ts

import express from 'express';

const app = express();
const PORT = process.env.PORT || 6970; // AGNT on a phone keypad

app.use(express.json());

import marketplaceRoutes from './routes/marketplace.routes';

app.use('/v1', marketplaceRoutes);

app.listen(PORT, () => {
  console.log(`Genesis Node listening on port ${PORT}`);
});
