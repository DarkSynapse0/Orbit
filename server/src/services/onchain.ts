import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import bs58 from 'bs58';
import * as anchor from '@coral-xyz/anchor';

// Resolve BN across CJS/ESM interop shapes. Depending on the Node version / loader,
// `anchor.BN` may live at the top level or under `.default` — the container hit the
// latter, which threw "anchor.BN is not a constructor". Fall back to bn.js if needed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BN: any = (anchor as any).BN ?? (anchor as any).default?.BN;
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { config } from '../lib/config.js';

// Real on-chain client for the orbit-vault program on devnet.
// - The server is the *funder* (mock Stripe): it mints test USDC and deposits into each
//   user's OWN vault. Only the user (owner) can withdraw — the server never holds custody.
// - Deposits are routed into a shared *yield reserve* (the on-chain "venue", a lending pool
//   standing in for Kamino on devnet). The reserve holds pooled USDC + a prefunded interest
//   buffer and pays real interest on withdrawal, so users receive more than they deposited.

const USDC_DECIMALS = 6;
const APY_BPS = 600; // 6%
const RESERVE_BUFFER_USD = 1_000_000; // prefunded so the reserve can always pay interest
const toBase = (usd: number) => Math.round(usd * 10 ** USDC_DECIMALS);
const fromBase = (b: number) => b / 10 ** USDC_DECIMALS;

type Ctx = {
  connection: Connection;
  wallet: Keypair; // funder / rent payer / reserve admin (Orbit backend dev wallet)
  program: anchor.Program;
  mint: PublicKey;
  funderAta: PublicKey; // server's USDC token account — source of pipeline deposits
  reserve: PublicKey;
  reserveVault: PublicKey;
};

let ctxPromise: Promise<Ctx> | null = null;
// Saved test mint lives on the data volume when DATA_DIR is set (survives redeploys),
// otherwise alongside the source for local dev.
const mintFile: string | URL = config.dataDir
  ? path.join(config.dataDir, 'devnet.json')
  : new URL('../../.devnet.json', import.meta.url);

function loadKeypair(): Keypair {
  // Prefer an env secret (for hosted deploys); fall back to the local CLI wallet (dev).
  const secret = config.funderSecretKey.trim();
  if (secret) {
    try {
      if (secret.startsWith('[')) return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret)));
      // base58-encoded secret key
      return Keypair.fromSecretKey(bs58.decode(secret));
    } catch (e) {
      throw new Error(`FUNDER_SECRET_KEY is set but invalid: ${(e as Error).message}`);
    }
  }
  const path = `${os.homedir()}/.config/solana/id.json`;
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(path, 'utf8'))));
}

async function loadOrCreateMint(connection: Connection, wallet: Keypair): Promise<PublicKey> {
  try {
    const saved = JSON.parse(fs.readFileSync(mintFile, 'utf8'));
    if (saved.mint) return new PublicKey(saved.mint);
  } catch {
    /* not created yet */
  }
  const mint = await createMint(connection, wallet, wallet.publicKey, null, USDC_DECIMALS);
  fs.writeFileSync(mintFile, JSON.stringify({ mint: mint.toBase58() }, null, 2));
  return mint;
}

function vaultPda(program: anchor.Program, owner: PublicKey, mint: PublicKey) {
  const [vault] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), owner.toBuffer(), mint.toBuffer()],
    program.programId,
  );
  return vault;
}

function reservePdas(program: anchor.Program, mint: PublicKey) {
  const [reserve] = PublicKey.findProgramAddressSync([Buffer.from('reserve'), mint.toBuffer()], program.programId);
  const [reserveVault] = PublicKey.findProgramAddressSync(
    [Buffer.from('reserve_vault'), mint.toBuffer()],
    program.programId,
  );
  return { reserve, reserveVault };
}

function readIdl(): string {
  const bundled = new URL('../idl/orbit_vault.json', import.meta.url);
  try {
    return fs.readFileSync(bundled, 'utf8');
  } catch {
    return fs.readFileSync(new URL('../../../orbit-vault/target/idl/orbit_vault.json', import.meta.url), 'utf8');
  }
}

async function build(): Promise<Ctx> {
  const wallet = loadKeypair();
  const connection = new Connection(config.solana.rpcUrl, 'confirmed');
  const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(wallet), { commitment: 'confirmed' });
  // IDL is bundled with the server (works on hosts without the Anchor build tree);
  // fall back to the built copy in the monorepo for local dev after a rebuild.
  const idl = JSON.parse(readIdl()) as anchor.Idl;
  const program = new anchor.Program(idl, provider);
  const mint = await loadOrCreateMint(connection, wallet);
  const ata = await getOrCreateAssociatedTokenAccount(connection, wallet, mint, wallet.publicKey);
  const { reserve, reserveVault } = reservePdas(program, mint);
  const ctx: Ctx = { connection, wallet, program, mint, funderAta: ata.address, reserve, reserveVault };
  await ensureReserve(ctx);
  return ctx;
}

/** Ensure the shared yield reserve exists and is funded with an interest buffer. */
async function ensureReserve(c: Ctx) {
  try {
    // Generic Idl Program doesn't type the account namespace — access it loosely.
    await (c.program.account as any).reserve.fetch(c.reserve);
    return;
  } catch {
    /* not created yet */
  }
  await c.program.methods
    .initializeReserve(APY_BPS)
    .accounts({
      admin: c.wallet.publicKey,
      reserve: c.reserve,
      mint: c.mint,
      reserveVault: c.reserveVault,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  // Prefund the interest buffer (server is the mint authority) so the reserve can always
  // pay out more than principal — this is the yield source on devnet.
  await mintTo(c.connection, c.wallet, c.mint, c.reserveVault, c.wallet, toBase(RESERVE_BUFFER_USD));
}

/** Ensure a user's vault exists; if not, the server opens it (server pays rent, user owns it). */
async function ensureVault(c: Ctx, owner: PublicKey) {
  const vault = vaultPda(c.program, owner, c.mint);
  try {
    await (c.program.account as any).vault.fetch(vault);
  } catch {
    await c.program.methods
      .initializeVault()
      .accounts({
        payer: c.wallet.publicKey,
        owner,
        vault,
        mint: c.mint,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }
}

function ctx(): Promise<Ctx> {
  if (!ctxPromise) ctxPromise = build();
  return ctxPromise;
}

/** Mock Stripe hop: mint test USDC into the server's (funder's) token account. */
export async function deliverUsdc(usd: number): Promise<void> {
  const c = await ctx();
  await mintTo(c.connection, c.wallet, c.mint, c.funderAta, c.wallet, toBase(usd));
}

/** Deposit USDC from the server (funder) into the user's OWN vault, routed into the yield
 *  reserve. Returns the tx signature. */
export async function depositOnChain(ownerAddress: string, usd: number): Promise<string> {
  const c = await ctx();
  const owner = new PublicKey(ownerAddress);
  await ensureVault(c, owner);
  const vault = vaultPda(c.program, owner, c.mint);
  return c.program.methods
    .deposit(new BN(toBase(usd)))
    .accounts({
      funder: c.wallet.publicKey,
      owner,
      vault,
      reserve: c.reserve,
      reserveVault: c.reserveVault,
      mint: c.mint,
      funderTokenAccount: c.funderAta,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
}

/** Read a user's live on-chain vault state (zeros if not opened yet). */
export async function getVaultOnChain(ownerAddress: string) {
  const c = await ctx();
  const owner = new PublicKey(ownerAddress);
  const vault = vaultPda(c.program, owner, c.mint);
  let principalUsd = 0;
  let accruedYieldUsd = 0;
  let lastUpdateTs = 0;
  let exists = false;
  try {
    const v = (await (c.program.account as any).vault.fetch(vault)) as any;
    principalUsd = fromBase(Number(v.principal));
    accruedYieldUsd = fromBase(Number(v.accruedYield));
    lastUpdateTs = Number(v.lastUpdateTs);
    exists = true;
  } catch {
    /* vault not opened yet */
  }
  return {
    exists,
    principalUsd,
    accruedYieldUsd,
    lastUpdateTs,
    apyBps: APY_BPS,
    programId: c.program.programId.toBase58(),
    vaultAccount: vault.toBase58(),
    reserveVault: c.reserveVault.toBase58(),
    cluster: config.solana.cluster,
  };
}

/** Program + mint config for the client (so a connected wallet uses the same test mint). */
export async function getConfig() {
  const c = await ctx();
  return {
    mint: c.mint.toBase58(),
    programId: c.program.programId.toBase58(),
    reserve: c.reserve.toBase58(),
    reserveVault: c.reserveVault.toBase58(),
    cluster: config.solana.cluster,
  };
}

/** Gas faucet: top up a wallet with a little devnet SOL so it can pay tx fees (used by the
 *  embedded/no-install account, which starts with zero SOL). Skips if it already has enough. */
export async function fundSol(address: string, sol = 0.02): Promise<{ funded: boolean; sig?: string }> {
  const c = await ctx();
  const to = new PublicKey(address);
  const balance = await c.connection.getBalance(to);
  if (balance >= 0.01 * 1e9) return { funded: false };
  const tx = new Transaction().add(
    SystemProgram.transfer({ fromPubkey: c.wallet.publicKey, toPubkey: to, lamports: Math.round(sol * 1e9) }),
  );
  const sig = await sendAndConfirmTransaction(c.connection, tx, [c.wallet]);
  return { funded: true, sig };
}

/** Faucet: mint test USDC to an arbitrary wallet (the dev wallet is the mint authority). */
export async function mintToAddress(address: string, usd: number): Promise<{ mint: string; ata: string }> {
  const c = await ctx();
  const owner = new PublicKey(address);
  const ata = await getOrCreateAssociatedTokenAccount(c.connection, c.wallet, c.mint, owner);
  await mintTo(c.connection, c.wallet, c.mint, ata.address, c.wallet, toBase(usd));
  return { mint: c.mint.toBase58(), ata: ata.address.toBase58() };
}
