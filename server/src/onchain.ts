import fs from 'node:fs';
import os from 'node:os';
import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { config } from './config.js';

// Real on-chain client for the orbit-vault program on devnet. The server acts as the
// *funder* — it stands in for Stripe's fiat->USDC settlement: it mints test USDC into its
// own token account and deposits it into each user's OWN vault (the user is the owner).
// Only the user's key can ever withdraw, so the server never takes custody of savings.

const USDC_DECIMALS = 6;
const toBase = (usd: number) => Math.round(usd * 10 ** USDC_DECIMALS);
const fromBase = (b: number) => b / 10 ** USDC_DECIMALS;

type Ctx = {
  connection: Connection;
  wallet: Keypair; // the funder / rent payer (Orbit backend dev wallet)
  program: anchor.Program;
  mint: PublicKey;
  funderAta: PublicKey; // server's USDC token account — the source of pipeline deposits
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

/** Deterministic PDAs for a given vault owner (user wallet). */
function vaultPdas(program: anchor.Program, owner: PublicKey) {
  const [vault] = PublicKey.findProgramAddressSync([Buffer.from('vault'), owner.toBuffer()], program.programId);
  const [vaultToken] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault_token'), owner.toBuffer()],
    program.programId,
  );
  return { vault, vaultToken };
}

async function build(): Promise<Ctx> {
  const wallet = loadKeypair();
  const connection = new Connection(config.solana.rpcUrl, 'confirmed');
  const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(wallet), { commitment: 'confirmed' });
  const idl = JSON.parse(
    fs.readFileSync(new URL('../../orbit-vault/target/idl/orbit_vault.json', import.meta.url), 'utf8'),
  ) as anchor.Idl;
  const program = new anchor.Program(idl, provider);
  const mint = await loadOrCreateMint(connection, wallet);
  const ata = await getOrCreateAssociatedTokenAccount(connection, wallet, mint, wallet.publicKey);
  return { connection, wallet, program, mint, funderAta: ata.address };
}

function ctx(): Promise<Ctx> {
  if (!ctxPromise) ctxPromise = build();
  return ctxPromise;
}

/** Ensure a user's vault exists; if not, the server opens it (server pays rent, user owns it). */
async function ensureVault(c: Ctx, owner: PublicKey) {
  const { vault, vaultToken } = vaultPdas(c.program, owner);
  try {
    await c.program.account.vault.fetch(vault);
  } catch {
    await c.program.methods
      .initializeVault()
      .accounts({
        payer: c.wallet.publicKey,
        owner,
        vault,
        mint: c.mint,
        vaultTokenAccount: vaultToken,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }
}

/** Mock Stripe hop: mint test USDC into the server's (funder's) token account. */
export async function deliverUsdc(usd: number): Promise<void> {
  const c = await ctx();
  await mintTo(c.connection, c.wallet, c.mint, c.funderAta, c.wallet, toBase(usd));
}

/** Deposit USDC from the server (funder) into the user's OWN vault. Returns the tx signature. */
export async function depositOnChain(ownerAddress: string, usd: number): Promise<string> {
  const c = await ctx();
  const owner = new PublicKey(ownerAddress);
  await ensureVault(c, owner);
  const { vault, vaultToken } = vaultPdas(c.program, owner);
  return c.program.methods
    .deposit(new anchor.BN(toBase(usd)))
    .accounts({
      funder: c.wallet.publicKey,
      owner,
      vault,
      vaultTokenAccount: vaultToken,
      funderTokenAccount: c.funderAta,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
}

/** Read a user's live on-chain vault state (zeros if not opened yet). */
export async function getVaultOnChain(ownerAddress: string) {
  const c = await ctx();
  const owner = new PublicKey(ownerAddress);
  const { vault, vaultToken } = vaultPdas(c.program, owner);
  let principalUsd = 0;
  let accruedYieldUsd = 0;
  let lastUpdateTs = 0;
  let exists = false;
  try {
    const v = (await c.program.account.vault.fetch(vault)) as any;
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
    programId: c.program.programId.toBase58(),
    vaultAccount: vault.toBase58(),
    vaultTokenAccount: vaultToken.toBase58(),
    cluster: config.solana.cluster,
  };
}

/** Program + mint config for the client (so a connected wallet uses the same test mint). */
export async function getConfig() {
  const c = await ctx();
  return {
    mint: c.mint.toBase58(),
    programId: c.program.programId.toBase58(),
    cluster: config.solana.cluster,
  };
}

/** Faucet: mint test USDC to an arbitrary wallet (the dev wallet is the mint authority). */
export async function mintToAddress(address: string, usd: number): Promise<{ mint: string; ata: string }> {
  const c = await ctx();
  const owner = new PublicKey(address);
  const ata = await getOrCreateAssociatedTokenAccount(c.connection, c.wallet, c.mint, owner);
  await mintTo(c.connection, c.wallet, c.mint, ata.address, c.wallet, toBase(usd));
  return { mint: c.mint.toBase58(), ata: ata.address.toBase58() };
}
