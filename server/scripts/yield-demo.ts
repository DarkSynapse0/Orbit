/**
 * Proof that yield is REAL: deposit into a fresh vault (routed to the reserve), wait, then
 * withdraw as the owner and show the wallet receives MORE than was deposited — real interest
 * paid out in tokens from the reserve, not a cosmetic counter.
 *
 * Run: pnpm --filter server exec tsx scripts/yield-demo.ts
 */
import fs from 'node:fs';
import os from 'node:os';
import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID, getAccount } from '@solana/spl-token';

const RPC = process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com';
const DEC = 6;
const usd = (b: bigint | number) => (Number(b) / 10 ** DEC).toFixed(6);
const DEPOSIT_USD = 1_000_000;
const WAIT_S = 15;
const acct = (a: string) => `https://solscan.io/account/${a}?cluster=devnet`;
const tx = (s: string) => `https://solscan.io/tx/${s}?cluster=devnet`;

async function main() {
  const funder = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(`${os.homedir()}/.config/solana/id.json`, 'utf8'))),
  );
  const connection = new Connection(RPC, 'confirmed');
  const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(funder), { commitment: 'confirmed' });
  const idl = JSON.parse(
    fs.readFileSync(new URL('../../orbit-vault/target/idl/orbit_vault.json', import.meta.url), 'utf8'),
  ) as anchor.Idl;
  const program = new anchor.Program(idl, provider);
  const mint = new PublicKey(JSON.parse(fs.readFileSync(new URL('../.devnet.json', import.meta.url), 'utf8')).mint);

  const owner = Keypair.generate();
  console.log('owner (fresh user):', owner.publicKey.toBase58());

  // Give the owner a little SOL so it can pay the withdraw fee (it signs its own withdrawal).
  const fund = await connection.requestAirdrop(owner.publicKey, 0.05 * LAMPORTS_PER_SOL).catch(() => null);
  if (fund) await connection.confirmTransaction(fund, 'confirmed');
  else {
    const ix = anchor.web3.SystemProgram.transfer({ fromPubkey: funder.publicKey, toPubkey: owner.publicKey, lamports: 0.02 * LAMPORTS_PER_SOL });
    await provider.sendAndConfirm(new anchor.web3.Transaction().add(ix));
  }

  const [vault] = PublicKey.findProgramAddressSync([Buffer.from('vault'), owner.publicKey.toBuffer()], program.programId);
  const [reserve] = PublicKey.findProgramAddressSync([Buffer.from('reserve'), mint.toBuffer()], program.programId);
  const [reserveVault] = PublicKey.findProgramAddressSync([Buffer.from('reserve_vault'), mint.toBuffer()], program.programId);

  const funderAta = await getOrCreateAssociatedTokenAccount(connection, funder, mint, funder.publicKey);
  const ownerAta = await getOrCreateAssociatedTokenAccount(connection, funder, mint, owner.publicKey);
  await mintTo(connection, funder, mint, funderAta.address, funder, BigInt(DEPOSIT_USD) * BigInt(10 ** DEC));

  // Open the owner's vault (server/funder pays rent, owner owns it).
  await program.methods
    .initializeVault()
    .accounts({ payer: funder.publicKey, owner: owner.publicKey, vault, mint, systemProgram: SystemProgram.programId })
    .rpc();

  // Deposit — routed into the reserve.
  const depSig = await program.methods
    .deposit(new anchor.BN(BigInt(DEPOSIT_USD) * BigInt(10 ** DEC)))
    .accounts({ funder: funder.publicKey, owner: owner.publicKey, vault, reserve, reserveVault, mint, funderTokenAccount: funderAta.address, tokenProgram: TOKEN_PROGRAM_ID })
    .rpc();
  console.log(`deposited $${DEPOSIT_USD.toLocaleString()}  tx=${tx(depSig)}`);

  const before = (await getAccount(connection, ownerAta.address)).amount;
  console.log(`owner wallet USDC before withdraw: ${usd(before)}`);
  console.log(`waiting ${WAIT_S}s for yield to accrue...`);
  await new Promise((r) => setTimeout(r, WAIT_S * 1000));

  const v: any = await program.account.vault.fetch(vault);
  const principal = BigInt(v.principal.toString());

  // Withdraw all principal — owner signs. Reserve pays principal + interest.
  const wSig = await program.methods
    .withdraw(new anchor.BN(principal.toString()))
    .accounts({ authority: owner.publicKey, vault, reserve, reserveVault, mint, userTokenAccount: ownerAta.address, tokenProgram: TOKEN_PROGRAM_ID })
    .signers([owner])
    .rpc();
  console.log(`withdrew all  tx=${tx(wSig)}`);

  const after = (await getAccount(connection, ownerAta.address)).amount;
  const received = after - before;
  const interest = received - principal;
  console.log('\n--- RESULT ---');
  console.log(`deposited : ${usd(principal)} USDC`);
  console.log(`received  : ${usd(received)} USDC`);
  console.log(`interest  : ${usd(interest)} USDC  ${interest > 0n ? '✅ REAL yield paid out' : '❌ no yield'}`);
  console.log(`vault:   ${acct(vault.toBase58())}`);
  console.log(`reserve: ${acct(reserveVault.toBase58())}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
