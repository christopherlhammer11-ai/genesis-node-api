// src/services/marketplace.service.ts
import { promises as fs } from 'fs';
import { Skill } from '../models/skill.model';
import { Connection, PublicKey, Keypair, sendAndConfirmTransaction, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';
import path from 'path';

const DB_PATH = process.env.DB_PATH || './db.json';
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'http://127.0.0.1:8899';
const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
const FLUX_MINT_ADDRESS = process.env.FLUX_MINT_ADDRESS || '4CkR2jysfcsk3Mdn86KuuUkRSBBPwtN1fPaaffawLax9';
const FLUX_MINT_PUBLIC_KEY = new PublicKey(FLUX_MINT_ADDRESS);
const FLUX_DECIMALS = parseInt(process.env.FLUX_DECIMALS || '9', 10);

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
      creatorAgentId: 'Cso4c8LAh84fHMvPDeNoVctLNKhsi6tbcRUUp2bcnKgt',
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
      creatorAgentId: 'Cso4c8LAh84fHMvPDeNoVctLNKhsi6tbcRUUp2bcnKgt',
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
      creatorAgentId: 'Cso4c8LAh84fHMvPDeNoVctLNKhsi6tbcRUUp2bcnKgt',
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
      creatorAgentId: 'Cso4c8LAh84fHMvPDeNoVctLNKhsi6tbcRUUp2bcnKgt',
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
  ],
  wallets: {},
  transactions: [],
};

export async function readDb(): Promise<Database> {
  if (database) return database;
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
  if (database) {
    await fs.writeFile(DB_PATH, JSON.stringify(database, null, 2));
  }
}

export async function publishSkill(skill: Skill): Promise<Skill> {
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

async function getKeypair(agentId: string): Promise<Keypair> {
    const AGENT_KEY_MAP: Record<string, string> = {
        'Hpa8TfRWqyUZCQikiTMgtHsft8favSVNbA82PYdCDwNB': 'agent-buyer',
        'Cso4c8LAh84fHMvPDeNoVctLNKhsi6tbcRUUp2bcnKgt': 'agent-seller',
    };
    const agentName = AGENT_KEY_MAP[agentId];
    if (!agentName) throw new Error(`No keypair found for agent ${agentId}`);
    const keypairPath = path.join(process.env.HOME || '~', 'openclaw-craig', '.openclaw', 'solana', `${agentName}.json`);
    const secretKeyString = await fs.readFile(keypairPath, { encoding: 'utf8' });
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    return Keypair.fromSecretKey(secretKey);
}

export async function purchaseSkill(buyerAgentId: string, skillId: string, db?: Database): Promise<any> {
    database = db || await readDb();
    const skill = database.skills.find(s => s.id === skillId);
    if (!skill) throw new Error('Skill not found');
    if (skill.pricing.currency !== 'FLUX') throw new Error('Skill is not priced in FLUX');

    const sellerAgentId = skill.creatorAgentId;
    const priceInFlux = skill.pricing.amount;
    const priceInSmallestUnit = priceInFlux * (10 ** FLUX_DECIMALS);

    const buyerKeypair = await getKeypair(buyerAgentId);
    const sellerPublicKey = new PublicKey(sellerAgentId);

    // Get the Associated Token Accounts
    const buyerTokenAccountAddress = await getAssociatedTokenAddress(FLUX_MINT_PUBLIC_KEY, buyerKeypair.publicKey);
    const sellerTokenAccountAddress = await getAssociatedTokenAddress(FLUX_MINT_PUBLIC_KEY, sellerPublicKey);

    const transaction = new Transaction().add(
        createTransferInstruction(
            buyerTokenAccountAddress,
            sellerTokenAccountAddress,
            buyerKeypair.publicKey,
            priceInSmallestUnit
        )
    );

    try {
        const signature = await sendAndConfirmTransaction(connection, transaction, [buyerKeypair], { commitment: 'confirmed' });

        const txnRecord = {
            id: signature,
            buyerAgentId,
            sellerAgentId,
            skillId,
            amount: priceInFlux,
            timestamp: new Date().toISOString()
        };
        
        if (database) {
            database.transactions.push(txnRecord);
            await writeDb();
        }

        return {
            message: 'Purchase successful',
            transactionId: signature,
            packageUrl: skill.packageUrl,
        };
    } catch (error) {
        console.error("Transaction failed:", error);
        throw new Error('FLUX token transfer failed.');
    }
}
