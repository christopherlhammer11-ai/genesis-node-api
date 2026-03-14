// src/models/agent.model.ts

export interface AgentIdentity {
  id: string; // UUID
  name: string;
  publicKey: string;
  endpoints: {
    info: string; // URL
    wallet: string; // URL
  };
  reputationScore: number;
  createdAt: string; // ISO 8601
}
