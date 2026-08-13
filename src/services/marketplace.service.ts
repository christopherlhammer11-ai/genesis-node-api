// src/services/marketplace.service.ts
import { promises as fs } from 'fs';
import { Skill } from '../models/skill.model';

const DB_PATH = process.env.DB_PATH;

interface Database {
  skills: Skill[];
  wallets: Record<string, { balance: number }>;
  transactions: any[];
}

// In-memory cache of the database to avoid constant reading
let database: Database | null = null;

// Default seed data for when db.json is unavailable (e.g. Vercel serverless)
const SEED_DB: Database = {
  skills: [
    {
      id: 'skill-text-summarizer',
      name: 'Text Summarizer',
      description: 'AI-powered text summarization. Send any text, get a concise summary back.',
      version: '1.0.0',
      creatorAgentId: 'BiWrDayd4kJUthjqn1zVrLtytL9KUUECrntnhfTjgHSX',
      pricing: { type: 'per-call', amount: 5, currency: 'FLUX' },
      dependencies: [],
      interface: {
        inputType: { type: 'object', properties: { text: { type: 'string' } } },
        outputType: { type: 'object', properties: { summary: { type: 'string' } } },
      },
      packageUrl: 'https://github.com/christopherlhammer11-ai/genesis-node-api',
      checksum: 'sha256-pending',
      performanceMetrics: { avgLatencyMs: 150, successRate: 0.995 },
    },
    {
      id: 'skill-code-review',
      name: 'Code Reviewer',
      description: 'Automated code review agent. Submit code, get quality analysis, bug detection, and improvement suggestions.',
      version: '1.0.0',
      creatorAgentId: 'BiWrDayd4kJUthjqn1zVrLtytL9KUUECrntnhfTjgHSX',
      pricing: { type: 'per-call', amount: 10, currency: 'FLUX' },
      dependencies: [],
      interface: {
        inputType: { type: 'object', properties: { code: { type: 'string' }, language: { type: 'string' } } },
        outputType: { type: 'object', properties: { issues: { type: 'array' }, score: { type: 'number' } } },
      },
      packageUrl: 'https://github.com/christopherlhammer11-ai/genesis-node-api',
      checksum: 'sha256-pending',
      performanceMetrics: { avgLatencyMs: 300, successRate: 0.99 },
    },
    {
      id: 'skill-web-scraper',
      name: 'Web Scraper',
      description: 'Extract structured data from any public webpage. Returns clean JSON.',
      version: '1.0.0',
      creatorAgentId: 'BiWrDayd4kJUthjqn1zVrLtytL9KUUECrntnhfTjgHSX',
      pricing: { type: 'per-call', amount: 3, currency: 'FLUX' },
      dependencies: [],
      interface: {
        inputType: { type: 'object', properties: { url: { type: 'string' }, selectors: { type: 'object' } } },
        outputType: { type: 'object', properties: { data: { type: 'object' } } },
      },
      packageUrl: 'https://github.com/christopherlhammer11-ai/genesis-node-api',
      checksum: 'sha256-pending',
      performanceMetrics: { avgLatencyMs: 500, successRate: 0.98 },
    },
    {
      id: 'skill-tool-use-guardian',
      name: 'Tool Use Guardian',
      description: 'FREE — Intelligent tool-call reliability wrapper. Monitors, retries, fixes, and learns from tool failures. Auto-recovers from truncated JSON, timeouts, rate limits, and mid-chain failures.',
      version: '1.0.0',
      creatorAgentId: 'BiWrDayd4kJUthjqn1zVrLtytL9KUUECrntnhfTjgHSX',
      pricing: { type: 'per-call', amount: 0, currency: 'FLUX' },
      dependencies: [],
      interface: {
        inputType: { type: 'object', properties: { installCommand: { type: 'string', const: 'npx skills add christopherlhammer11-ai/tool-use-guardian' } } },
        outputType: { type: 'object', properties: { status: { type: 'string' } } },
      },
      packageUrl: 'https://github.com/christopherlhammer11-ai/tool-use-guardian',
      checksum: 'sha256-pending',
      performanceMetrics: { avgLatencyMs: 0, successRate: 1.0 },
    },
    {
      id: 'skill-recallmax',
      name: 'RecallMax',
      description: 'FREE — Ensure God-Tier Long-Context Memory. Injects extensive clean tokens, captures intent across conversations.',
      version: '1.0.0',
      creatorAgentId: 'BiWrDayd4kJUthjqn1zVrLtytL9KUUECrntnhfTjgHSX',
      pricing: { type: 'per-call', amount: 0, currency: 'FLUX' },
      dependencies: [],
      interface: {
        inputType: { type: 'object', properties: { text: { type: 'string' } } },
        outputType: { type: 'object', properties: { summary: { type: 'string' }, condensed: { type: 'string' } } },
      },
      packageUrl: 'https://github.com/christopherlhammer11-ai/recallmax',
      checksum: 'sha256-pending',
      performanceMetrics: { avgLatencyMs: 100, successRate: 1.0 },
    
    },
    {
      id: 'skill-real-time-verifier',
      name: 'Real-time Verifier',
      description: 'Verifies real-time data across sources with trust scores.',
      version: '1.0.0',
      creatorAgentId: 'BiWrDayd4kJUthjqn1zVrLtytL9KUUECrntnhfTjgHSX',
      pricing: { type: 'per-call', amount: 15, currency: 'FLUX' },
      dependencies: [],
      interface: {
        inputType: { type: 'object', properties: { urls: { type: 'array', items: { type: 'string' } } } },
        outputType: { type: 'object', properties: { results: { type: 'array', items: { type: 'object', properties: { url: { type: 'string' }, trustScore: { type: 'number' }, data: { type: 'object' } } } } } }
      },
      packageUrl: 'https://github.com/christopherlhammer11-ai/real-time-verifier',
      checksum: 'sha256-pending',
      performanceMetrics: { avgLatencyMs: 8000, successRate: 1.0 },
    },
    {
      id: 'skill-surgical-code-editor',
      name: 'Surgical Code Editor',
      description: 'Analyzes and optimizes code with advanced insights.',
      version: '1.0.0',
      creatorAgentId: 'BiWrDayd4kJUthjqn1zVrLtytL9KUUECrntnhfTjgHSX',
      pricing: { type: 'per-call', amount: 20, currency: 'FLUX' },
      dependencies: [],
      interface: {
        inputType: { type: 'object', properties: { code: { type: 'string' } } },
        outputType: { type: 'object', properties: { analysis: { type: 'object', properties: { complexity: { type: 'string' }, issues: { type: 'array' }, suggestions: { type: 'array' } } } } }
      },
      packageUrl: 'https://github.com/christopherlhammer11-ai/surgical-code-editor',
      checksum: 'sha256-pending',
      performanceMetrics: { avgLatencyMs: 2000, successRate: 1.0 },
    },
    {
      id: 'skill-prompt-condenser',
      name: 'Prompt Condenser',
      description: 'Condenses prompts into more efficient forms for faster processing.',
      version: '1.0.0',
      creatorAgentId: 'BiWrDayd4kJUthjqn1zVrLtytL9KUUECrntnhfTjgHSX',
      pricing: { type: 'per-call', amount: 8, currency: 'FLUX' },
      dependencies: [],
      interface: {
        inputType: { type: 'object', properties: { prompts: { type: 'array', items: { type: 'string' } } } },
        outputType: { type: 'object', properties: { condensed: { type: 'array', items: { type: 'object', properties: { original: { type: 'string' }, condensed: { type: 'string' } } } } } }
      },
      packageUrl: 'https://github.com/christopherlhammer11-ai/prompt-condenser',
      checksum: 'sha256-pending',
      performanceMetrics: { avgLatencyMs: 500, successRate: 1.0 },
    }],
  wallets: {},
  transactions: [],
};

export async function readDb(): Promise<Database> {
  if (database) return database;
  if (!DB_PATH) {
    database = JSON.parse(JSON.stringify(SEED_DB));
    return database as Database;
  }
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    database = JSON.parse(data);
    return database as Database;
  } catch (error) {
    // On serverless (Vercel), filesystem is read-only — use seed data
    database = JSON.parse(JSON.stringify(SEED_DB));
    try {
      await fs.writeFile(DB_PATH, JSON.stringify(database, null, 2));
    } catch {
      // Silently continue with in-memory seed data
    }
    return database as Database;
  }
}

export async function writeDb() {
  if (database && DB_PATH) {
    await fs.writeFile(DB_PATH, JSON.stringify(database, null, 2));
  }
}

export async function publishSkill(skill: Skill): Promise<Skill> {
    if (!DB_PATH) {
        throw new Error('Direct publishing is review-gated until durable catalog storage is configured');
    }
    const db = await readDb();
    if (db.skills.some(s => s.id === skill.id)) {
        throw new Error('Skill with this ID already exists');
    }
    db.skills.push(skill);
    await writeDb();
    return skill;
}

export async function discoverSkills(query: string): Promise<Skill[]> {
    const db = await readDb();
    if (!query) return db.skills;
    const lowerCaseQuery = query.toLowerCase();
    return db.skills.filter(skill =>
        skill.name.toLowerCase().includes(lowerCaseQuery) ||
        skill.description.toLowerCase().includes(lowerCaseQuery)
    );
}

export async function getSkillById(skillId: string): Promise<Skill | null> {
    const db = await readDb();
    return db.skills.find((skill) => skill.id === skillId) ?? null;
}
