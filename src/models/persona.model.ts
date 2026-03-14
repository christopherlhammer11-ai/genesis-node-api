// src/models/persona.model.ts

export interface Persona {
  id: string; // UUID
  name: string;
  description: string;
  version: string; // semver
  creatorAgentId: string; // AgentIdentity.id
  pricing: {
    type: 'one-time';
    amount: number;
    currency: string; // e.g., 'FLUX'
  };
  coreFiles: {
    soul: string; // URL
    identity: string; // URL
    agents: string; // URL
  };
  baseSkillIds: string[]; // Array of Skill.id
  packageUrl: string; // URL
  checksum: string; // sha256
}
