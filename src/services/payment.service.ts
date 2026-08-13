import crypto from 'crypto';
import {
  Connection,
  ParsedInstruction,
  PartiallyDecodedInstruction,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
  getMint,
} from '@solana/spl-token';
import { Skill } from '../models/skill.model';

const SOLANA_NETWORK = process.env.SOLANA_NETWORK || 'mainnet-beta';
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const FLUX_MINT_ADDRESS = process.env.FLUX_MINT_ADDRESS || '663aVZEVEKXpUw1SGWZhLhr5Q3te2YehsHXgYrHzpump';
const FLUX_DECIMALS = Number.parseInt(process.env.FLUX_DECIMALS || '6', 10);
const TREASURY_WALLET = process.env.TREASURY_WALLET || 'BiWrDayd4kJUthjqn1zVrLtytL9KUUECrntnhfTjgHSX';
const PROTOCOL_FEE_BPS = 500;
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
let mintVerification: Promise<void> | null = null;

type QuotePayload = {
  quoteId: string;
  buyerAgentId: string;
  skillId: string;
  total: string;
  sellerAmount: string;
  feeAmount: string;
  sellerWallet: string;
  treasuryWallet: string;
  expiresAt: string;
};

function signingSecret(): string {
  const secret = process.env.QUOTE_SIGNING_SECRET;
  if (!secret && process.env.VERCEL) {
    throw new Error('Checkout is temporarily unavailable: quote signing is not configured');
  }
  return secret || 'genesis-local-development-only';
}

function signPayload(payload: QuotePayload): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', signingSecret()).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function verifyPayload(token: string): QuotePayload {
  const [encoded, suppliedSignature] = token.split('.');
  if (!encoded || !suppliedSignature) throw new Error('Invalid quote token');
  const expectedSignature = crypto.createHmac('sha256', signingSecret()).update(encoded).digest();
  const supplied = Buffer.from(suppliedSignature, 'base64url');
  if (supplied.length !== expectedSignature.length || !crypto.timingSafeEqual(supplied, expectedSignature)) {
    throw new Error('Invalid quote signature');
  }
  const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as QuotePayload;
  if (Date.parse(payload.expiresAt) < Date.now()) throw new Error('Quote expired; request a new quote');
  return payload;
}

export function toBaseUnits(amount: number): bigint {
  if (!Number.isFinite(amount) || amount < 0) throw new Error('Invalid FLUX price');
  const scaled = amount * 10 ** FLUX_DECIMALS;
  if (!Number.isSafeInteger(scaled)) throw new Error(`FLUX price must use at most ${FLUX_DECIMALS} decimals`);
  const fixed = amount.toFixed(FLUX_DECIMALS);
  const [whole, fraction = ''] = fixed.split('.');
  return BigInt(`${whole}${fraction.padEnd(FLUX_DECIMALS, '0')}`);
}

export function calculateSplit(total: bigint) {
  const feeAmount = (total * BigInt(PROTOCOL_FEE_BPS)) / 10_000n;
  return { feeAmount, sellerAmount: total - feeAmount };
}

export async function getPaymentConfig() {
  const mintAddress = new PublicKey(FLUX_MINT_ADDRESS);
  let mintVerified = false;
  let verificationError: string | null = null;
  try {
    const mint = await getMint(connection, mintAddress, 'confirmed', TOKEN_2022_PROGRAM_ID);
    mintVerified = mint.decimals === FLUX_DECIMALS && mint.mintAuthority === null && mint.freezeAuthority === null;
    if (!mintVerified) verificationError = 'Mint metadata does not match the configured immutable FLUX token';
  } catch (error) {
    verificationError = error instanceof Error ? error.message : 'Mint verification failed';
  }

  return {
    network: SOLANA_NETWORK,
    mintAddress: FLUX_MINT_ADDRESS,
    decimals: FLUX_DECIMALS,
    tokenProgram: TOKEN_2022_PROGRAM_ID.toBase58(),
    treasuryWallet: TREASURY_WALLET,
    protocolFeeBps: PROTOCOL_FEE_BPS,
    mintVerified,
    verificationError,
    pumpUrl: `https://pump.fun/coin/${FLUX_MINT_ADDRESS}`,
  };
}

async function assertVerifiedMint() {
  if (!mintVerification) {
    mintVerification = (async () => {
      const config = await getPaymentConfig();
      if (!config.mintVerified) throw new Error(config.verificationError || 'FLUX mint verification failed');
    })().catch((error) => {
      mintVerification = null;
      throw error;
    });
  }
  return mintVerification;
}

export async function createPurchaseQuote(buyerAgentId: string, skill: Skill) {
  if (skill.pricing.currency !== 'FLUX') throw new Error('Skill is not priced in FLUX');
  if (skill.pricing.amount === 0) {
    return {
      status: 'free',
      message: 'No payment required',
      skillId: skill.id,
      packageUrl: skill.packageUrl,
      checksum: skill.checksum,
    };
  }

  await assertVerifiedMint();

  const buyer = new PublicKey(buyerAgentId);
  const seller = new PublicKey(skill.creatorAgentId);
  const treasury = new PublicKey(TREASURY_WALLET);
  const mint = new PublicKey(FLUX_MINT_ADDRESS);
  const total = toBaseUnits(skill.pricing.amount);
  const { feeAmount, sellerAmount } = calculateSplit(total);
  const quoteId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const payload: QuotePayload = {
    quoteId,
    buyerAgentId,
    skillId: skill.id,
    total: total.toString(),
    sellerAmount: sellerAmount.toString(),
    feeAmount: feeAmount.toString(),
    sellerWallet: seller.toBase58(),
    treasuryWallet: treasury.toBase58(),
    expiresAt,
  };

  const buyerAta = getAssociatedTokenAddressSync(mint, buyer, false, TOKEN_2022_PROGRAM_ID);
  const sellerAta = getAssociatedTokenAddressSync(mint, seller, false, TOKEN_2022_PROGRAM_ID);
  const treasuryAta = getAssociatedTokenAddressSync(mint, treasury, false, TOKEN_2022_PROGRAM_ID);
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  const transaction = new Transaction({ feePayer: buyer, recentBlockhash: blockhash });

  transaction.add(
    createAssociatedTokenAccountIdempotentInstruction(buyer, buyerAta, buyer, mint, TOKEN_2022_PROGRAM_ID),
    createAssociatedTokenAccountIdempotentInstruction(buyer, sellerAta, seller, mint, TOKEN_2022_PROGRAM_ID),
  );
  if (!treasury.equals(seller)) {
    transaction.add(createAssociatedTokenAccountIdempotentInstruction(buyer, treasuryAta, treasury, mint, TOKEN_2022_PROGRAM_ID));
  }
  transaction.add(createTransferCheckedInstruction(buyerAta, mint, sellerAta, buyer, sellerAmount, FLUX_DECIMALS, [], TOKEN_2022_PROGRAM_ID));
  if (feeAmount > 0n) {
    transaction.add(createTransferCheckedInstruction(buyerAta, mint, treasuryAta, buyer, feeAmount, FLUX_DECIMALS, [], TOKEN_2022_PROGRAM_ID));
  }
  transaction.add(new TransactionInstruction({
    keys: [],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(`genesis:${quoteId}:${skill.id}`, 'utf8'),
  }));

  return {
    status: 'signature_required',
    message: 'The buyer must review, sign, and submit this transaction. Genesis never receives the private key.',
    quoteToken: signPayload(payload),
    quoteId,
    expiresAt,
    lastValidBlockHeight,
    transactionBase64: transaction.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64'),
    payment: {
      total: skill.pricing.amount,
      currency: 'FLUX',
      sellerAmount: Number(sellerAmount) / 10 ** FLUX_DECIMALS,
      protocolFee: Number(feeAmount) / 10 ** FLUX_DECIMALS,
      feeRate: `${PROTOCOL_FEE_BPS / 100}%`,
      mint: FLUX_MINT_ADDRESS,
      tokenProgram: TOKEN_2022_PROGRAM_ID.toBase58(),
    },
  };
}

function parsedInstructions(transaction: Awaited<ReturnType<Connection['getParsedTransaction']>>): ParsedInstruction[] {
  if (!transaction) return [];
  return transaction.transaction.message.instructions.filter(
    (instruction): instruction is ParsedInstruction => 'parsed' in instruction,
  );
}

export async function verifyPurchase(signature: string, quoteToken: string, skill: Skill) {
  const payload = verifyPayload(quoteToken);
  if (payload.skillId !== skill.id) throw new Error('Quote does not match this skill');
  const transaction = await connection.getParsedTransaction(signature, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 });
  if (!transaction || transaction.meta?.err) throw new Error('Confirmed successful transaction not found');

  const instructions = parsedInstructions(transaction);
  const transfers = instructions.filter((instruction) => {
    const parsed = instruction.parsed as { type?: string; info?: Record<string, unknown> };
    return parsed.type === 'transferChecked' && parsed.info?.mint === FLUX_MINT_ADDRESS && parsed.info?.authority === payload.buyerAgentId;
  });
  const mint = new PublicKey(FLUX_MINT_ADDRESS);
  const sellerAta = getAssociatedTokenAddressSync(mint, new PublicKey(payload.sellerWallet), false, TOKEN_2022_PROGRAM_ID).toBase58();
  const treasuryAta = getAssociatedTokenAddressSync(mint, new PublicKey(payload.treasuryWallet), false, TOKEN_2022_PROGRAM_ID).toBase58();
  const expectedTransfers = [
    `${sellerAta}:${payload.sellerAmount}`,
    ...(payload.feeAmount === '0' ? [] : [`${treasuryAta}:${payload.feeAmount}`]),
  ].sort();
  const actualTransfers = transfers.map((instruction) => {
    const info = (instruction.parsed as { info: { destination: string; tokenAmount: { amount: string } } }).info;
    return `${info.destination}:${info.tokenAmount.amount}`;
  }).sort();
  if (JSON.stringify(actualTransfers) !== JSON.stringify(expectedTransfers)) {
    throw new Error('Transaction payment does not match the signed quote');
  }

  const memo = instructions.find((instruction) => instruction.program === 'spl-memo');
  const expectedMemo = `genesis:${payload.quoteId}:${payload.skillId}`;
  if (!memo || memo.parsed !== expectedMemo) throw new Error('Transaction is missing the Genesis quote memo');

  return {
    status: 'verified',
    receipt: {
      transactionId: signature,
      quoteId: payload.quoteId,
      buyerAgentId: payload.buyerAgentId,
      sellerAgentId: payload.sellerWallet,
      skillId: payload.skillId,
      amount: Number(payload.total) / 10 ** FLUX_DECIMALS,
      currency: 'FLUX',
      verifiedAt: new Date().toISOString(),
      explorerUrl: `https://solscan.io/tx/${signature}`,
    },
    license: {
      type: 'on-chain support and usage receipt',
      packageUrl: skill.packageUrl,
      checksum: skill.checksum,
    },
    packageUrl: skill.packageUrl,
    checksum: skill.checksum,
  };
}
