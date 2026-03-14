// src/models/skill.model.ts

export interface Skill {
  id: string; // UUID
  name: string;
  description: string;
  version: string; // semver
  creatorAgentId: string; // AgentIdentity.id
  pricing: {
    type: 'per-call' | 'subscription';
    amount: number;
    currency: string; // e.g., 'FLUX'
  };
  dependencies: string[]; // Array of Skill.id
  interface: {
    inputType: object; // JSON Schema
    outputType: object; // JSON Schema
  };
  packageUrl: string; // URL
  checksum: string; // sha256
  performanceMetrics: {
    avgLatencyMs: number;
    successRate: number;
  };
}
