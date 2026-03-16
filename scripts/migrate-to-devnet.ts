#!/usr/bin/env npx ts-node
/**
 * Migrate FLUX token from localhost to Solana devnet.
 *
 * Steps:
 * 1. Load existing keypairs (same keys work on any network)
 * 2. Request devnet SOL from faucet
 * 3. Create new FLUX mint on devnet
 * 4. Create Associated Token Accounts
 * 5. Mint initial FLUX supply
 * 6. Output new config values
 *
 * Usage: npx ts-node scripts/migrate-to-devnet.ts
 */

import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';

const DEVNET_RPC = 'https://api.devnet.solana.com';
const KEYPAIRS_DIR = path.join(process.env.HOME || '~', 'openclaw-craig', '.openclaw', 'solana');
const FLUX_DECIMALS = 9;
const INITIAL_SUPPLY = 1_000_000; // 1M FLUX

async function loadKeypair(name: string): Promise<Keypair> {
  const filePath = path.join(KEYPAIRS_DIR, `${name}.json`);
  const secretKey = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return Keypair.fromSecretKey(Uint8Array.from(secretKey));
}

async function requestAirdrop(connection: Connection, keypair: Keypair, amount: number = 2) {
  console.log(`  Requesting ${amount} SOL for ${keypair.publicKey.toBase58().slice(0, 12)}...`);
  try {
    const sig = await connection.requestAirdrop(keypair.publicKey, amount * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig, 'confirmed');
    const balance = await connection.getBalance(keypair.publicKey);
    console.log(`  ✓ Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    return true;
  } catch (err: any) {
    console.log(`  ⚠ Airdrop failed (may already have SOL): ${err.message?.slice(0, 80)}`);
    const balance = await connection.getBalance(keypair.publicKey);
    if (balance > 0) {
      console.log(`  Current balance: ${balance / LAMPORTS_PER_SOL} SOL — continuing`);
      return true;
    }
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  FLUX Token — Devnet Migration');
  console.log('═══════════════════════════════════════════════════\n');

  // Connect to devnet
  const connection = new Connection(DEVNET_RPC, 'confirmed');
  console.log(`Connected to: ${DEVNET_RPC}`);

  // Load keypairs
  console.log('\n[1/5] Loading keypairs...');
  const treasury = await loadKeypair('treasury');
  const seller = await loadKeypair('agent-seller');
  const buyer = await loadKeypair('agent-buyer');
  console.log(`  Treasury:  ${treasury.publicKey.toBase58()}`);
  console.log(`  Seller:    ${seller.publicKey.toBase58()}`);
  console.log(`  Buyer:     ${buyer.publicKey.toBase58()}`);

  // Airdrop devnet SOL
  console.log('\n[2/5] Requesting devnet SOL...');
  await requestAirdrop(connection, treasury, 2);
  // Wait a bit between airdrops to avoid rate limiting
  await new Promise(r => setTimeout(r, 2000));
  await requestAirdrop(connection, seller, 1);
  await new Promise(r => setTimeout(r, 2000));
  await requestAirdrop(connection, buyer, 1);

  // Create FLUX mint
  console.log('\n[3/5] Creating FLUX mint on devnet...');
  const mint = await createMint(
    connection,
    treasury,       // payer
    treasury.publicKey,  // mint authority
    treasury.publicKey,  // freeze authority (optional)
    FLUX_DECIMALS,
  );
  console.log(`  ✓ FLUX Mint: ${mint.toBase58()}`);

  // Create Associated Token Accounts
  console.log('\n[4/5] Creating token accounts...');
  const treasuryATA = await getOrCreateAssociatedTokenAccount(
    connection, treasury, mint, treasury.publicKey,
  );
  console.log(`  Treasury ATA: ${treasuryATA.address.toBase58()}`);

  const sellerATA = await getOrCreateAssociatedTokenAccount(
    connection, treasury, mint, seller.publicKey,
  );
  console.log(`  Seller ATA:   ${sellerATA.address.toBase58()}`);

  const buyerATA = await getOrCreateAssociatedTokenAccount(
    connection, treasury, mint, buyer.publicKey,
  );
  console.log(`  Buyer ATA:    ${buyerATA.address.toBase58()}`);

  // Mint initial supply
  console.log('\n[5/5] Minting initial FLUX supply...');
  const supplyInSmallestUnit = BigInt(INITIAL_SUPPLY) * BigInt(10 ** FLUX_DECIMALS);

  // Mint 500K to treasury, 250K to seller, 250K to buyer (for testing)
  const treasuryAmount = BigInt(500_000) * BigInt(10 ** FLUX_DECIMALS);
  const sellerAmount = BigInt(250_000) * BigInt(10 ** FLUX_DECIMALS);
  const buyerAmount = BigInt(250_000) * BigInt(10 ** FLUX_DECIMALS);

  await mintTo(connection, treasury, mint, treasuryATA.address, treasury, treasuryAmount);
  console.log(`  ✓ Minted 500,000 FLUX to treasury`);

  await mintTo(connection, treasury, mint, sellerATA.address, treasury, sellerAmount);
  console.log(`  ✓ Minted 250,000 FLUX to seller`);

  await mintTo(connection, treasury, mint, buyerATA.address, treasury, buyerAmount);
  console.log(`  ✓ Minted 250,000 FLUX to buyer`);

  // Output config
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  MIGRATION COMPLETE — Update your .env:');
  console.log('═══════════════════════════════════════════════════\n');
  console.log(`SOLANA_RPC_URL=https://api.devnet.solana.com`);
  console.log(`SOLANA_NETWORK=devnet`);
  console.log(`FLUX_MINT_ADDRESS=${mint.toBase58()}`);
  console.log(`FLUX_DECIMALS=9`);
  console.log('');
  console.log(`# Verify on Solana Explorer:`);
  console.log(`# https://explorer.solana.com/address/${mint.toBase58()}?cluster=devnet`);
  console.log(`# https://explorer.solana.com/address/${treasury.publicKey.toBase58()}?cluster=devnet`);
}

main().catch(console.error);
