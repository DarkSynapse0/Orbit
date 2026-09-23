import fs from 'node:fs';
import os from 'node:os';
import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { config } from './config.js';

// Real on-chain client for the orbit-vault program on devnet. The server operates as
// the single demo user (the CLI dev wallet): it mints test USDC (standing in for
// Stripe's fiat->USDC hop) and deposits it into the on-chain vault.

const USDC_DECIMALS = 6;
const toBase = (usd: number) => Math.round(usd * 10 ** USDC_DECIMALS);
const fromBase = (b: number) => b / 10 ** USDC_DECIMALS;

type Ctx = {
  connection: Connection;
  wallet: Keypair;
  program: anchor.Program;
  mint: PublicKey;
  vaultPda: PublicKey;
  vaultTokenPda: PublicKey;
  userAta: PublicKey;
};

let ctxPromise: Promise<Ctx> | null = null;
const mintFile = new URL('../.devnet.json', import.meta.url);

function loadKeypair(): Keypair {
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

async function build(): Promise<Ctx> {
  const wallet = loadKeypair();
  const connection = new Connection(config.solana.rpcUrl, 'confirmed');
  const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(wallet), { commitment: 'confirmed' });
  const idl = JSON.parse(
    fs.readFileSync(new URL('../../orbit-vault/target/idl/orbit_vault.json', import.meta.url), 'utf8'),
  ) as anchor.Idl;
  const program = new anchor.Program(idl, provider);

  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), wallet.publicKey.toBuffer()],
    program.programId,
  );
  const [vaultTokenPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault_token'), wallet.publicKey.toBuffer()],
    program.programId,
  );

  // If the vault already exists (e.g. from the CLI demo), adopt its on-chain mint so the
  // token accounts line up; otherwise create/reuse our own test mint. The dev wallet is the
  // mint authority either way, so we can always mint test USDC.
  let mint: PublicKey;
  try {
    const existing = (await program.account.vault.fetch(vaultPda)) as any;
    mint = new PublicKey(existing.mint);
  } catch {
    mint = await loadOrCreateMint(connection, wallet);
  }

  const ata = await getOrCreateAssociatedTokenAccount(connection, wallet, mint, wallet.publicKey);
  const ctx: Ctx = { connection, wallet, program, mint, vaultPda, vaultTokenPda, userAta: ata.address };
  await ensureVault(ctx);
  return ctx;
}

async function ensureVault(c: Ctx) {
  try {
    await c.program.account.vault.fetch(c.vaultPda);
  } catch {
    await c.program.methods
      .initializeVault()
      .accounts({
        authority: c.wallet.publicKey,
        vault: c.vaultPda,
        mint: c.mint,
        vaultTokenAccount: c.vaultTokenPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }
}

function ctx(): Promise<Ctx> {
  if (!ctxPromise) ctxPromise = build();
  return ctxPromise;
}

/** Mock Stripe hop: deliver USDC to the user's wallet by minting test USDC. */
export async function deliverUsdc(usd: number): Promise<void> {
  const c = await ctx();
  await mintTo(c.connection, c.wallet, c.mint, c.userAta, c.wallet, toBase(usd));
}

/** Real on-chain deposit of USDC from the user's wallet into the vault. Returns the tx signature. */
export async function depositOnChain(usd: number): Promise<string> {
  const c = await ctx();
  return c.program.methods
    .deposit(new anchor.BN(toBase(usd)))
    .accounts({
      authority: c.wallet.publicKey,
      vault: c.vaultPda,
      vaultTokenAccount: c.vaultTokenPda,
      userTokenAccount: c.userAta,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
}

/** Withdraw all principal back to the user (used by demo reset). */
export async function withdrawAllOnChain(): Promise<void> {
  const c = await ctx();
  const v = (await c.program.account.vault.fetch(c.vaultPda)) as any;
  const principal = Number(v.principal);
  if (principal > 0) {
    await c.program.methods
      .withdraw(new anchor.BN(principal))
      .accounts({
        authority: c.wallet.publicKey,
        vault: c.vaultPda,
        vaultTokenAccount: c.vaultTokenPda,
        userTokenAccount: c.userAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
  }
}

/** Read the live on-chain vault state. */
export async function getVaultOnChain() {
  const c = await ctx();
  const v = (await c.program.account.vault.fetch(c.vaultPda)) as any;
  return {
    principalUsd: fromBase(Number(v.principal)),
    accruedYieldUsd: fromBase(Number(v.accruedYield)),
    programId: c.program.programId.toBase58(),
    vaultAccount: c.vaultPda.toBase58(),
    vaultTokenAccount: c.vaultTokenPda.toBase58(),
    cluster: config.solana.cluster,
  };
}
