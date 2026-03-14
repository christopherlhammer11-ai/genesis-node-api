// src/services/marketplace.service.ts
import { promises as fs } from 'fs';
import { Skill } from '../models/skill.model';
import { Connection, PublicKey, Keypair, sendAndConfirmTransaction, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';
import path from 'path';

const DB_PATH = './db.json';
const SOLANA_RPC_URL = 'http://127.0.0.1:8899';
const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
const FLUX_MINT_ADDRESS = '4CkR2jysfcsk3Mdn86KuuUkRSBBPwtN1fPaaffawLax9';
const FLUX_MINT_PUBLIC_KEY = new PublicKey(FLUX_MINT_ADDRESS);
const FLUX_DECIMALS = 9;

interface Database {
  skills: Skill[];
  wallets: Record<string, { balance: number }>;
  transactions: any[];
}

// In-memory cache of the database to avoid constant reading
let database: Database | null = null;

export async function readDb(): Promise<Database> {
  if (database) return database;
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    database = JSON.parse(data);
    return database as Database;
  } catch (error) {
    const newDb: Database = { skills: [], wallets: {}, transactions: [] };
    await fs.writeFile(DB_PATH, JSON.stringify(newDb, null, 2));
    database = newDb;
    return database;
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
