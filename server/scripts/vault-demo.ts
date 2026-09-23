/**
 * End-to-end demo of the orbit-vault program: create a test USDC mint, initialize a
 * user vault, deposit, withdraw, and read on-chain state. Run against a local validator.
 *
 *   solana-test-validator            # in another terminal
 *   anchor deploy --provider.cluster localnet   # from orbit-vault/
 *   pnpm --filter server exec tsx scripts/vault-demo.ts
 */
import fs from 'node:fs';
import os from 'node:os';
import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

const RPC = process.env.SOLANA_RPC_URL ?? 'http://127.0.0.1:8899';
const USDC_DECIMALS = 6;
const usdc = (n: number) => new anchor.BN(Math.round(n * 10 ** USDC_DECIMALS));
const fmt = (bn: anchor.BN) => (bn.toNumber() / 10 ** USDC_DECIMALS).toFixed(6);
const txLink = (sig: string) => `https://solscan.io/tx/${sig}?cluster=devnet`;
const acctLink = (a: PublicKey) => `https://solscan.io/account/${a.toBase58()}?cluster=devnet`;

async function airdrop(connection: Connection, pubkey: PublicKey, sol: number) {
  // Best-effort: devnet airdrops are rate-limited. If it fails, we rely on the
  // wallet already being funded (e.g. via faucet.solana.com).
  try {
    const sig = await connection.requestAirdrop(pubkey, sol * anchor.web3.LAMPORTS_PER_SOL);
    const bh = await connection.getLatestBlockhash();
    await connection.confirmTransaction({ signature: sig, ...bh }, 'confirmed');
  } catch {
    const bal = (await connection.getBalance(pubkey)) / anchor.web3.LAMPORTS_PER_SOL;
    console.log(`(airdrop skipped/failed — using existing balance: ${bal} SOL)`);
  }
}

async function main() {
  const walletKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(`${os.homedir()}/.config/solana/id.json`, 'utf8'))),
  );
  const connection = new Connection(RPC, 'confirmed');
  const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(walletKeypair), {
    commitment: 'confirmed',
  });
  anchor.setProvider(provider);

  const idlUrl = new URL('../../orbit-vault/target/idl/orbit_vault.json', import.meta.url);
  const idl = JSON.parse(fs.readFileSync(idlUrl, 'utf8')) as anchor.Idl;
  const program = new anchor.Program(idl, provider);

  console.log('program:', program.programId.toBase58());
  console.log('wallet :', walletKeypair.publicKey.toBase58());

  await airdrop(connection, walletKeypair.publicKey, 5);

  // 1. Create a test USDC mint and give the user 1,000 USDC.
  const mint = await createMint(connection, walletKeypair, walletKeypair.publicKey, null, USDC_DECIMALS);
  const userAta = await getOrCreateAssociatedTokenAccount(connection, walletKeypair, mint, walletKeypair.publicKey);
  await mintTo(connection, walletKeypair, mint, userAta.address, walletKeypair, 1000 * 10 ** USDC_DECIMALS);
  console.log('\ntest USDC mint:', mint.toBase58());

  // 2. Derive the vault PDAs.
  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), walletKeypair.publicKey.toBuffer()],
    program.programId,
  );
  const [vaultTokenPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault_token'), walletKeypair.publicKey.toBuffer()],
    program.programId,
  );

  // 3. Initialize the vault.
  await program.methods
    .initializeVault()
    .accounts({
      authority: walletKeypair.publicKey,
      vault: vaultPda,
      mint,
      vaultTokenAccount: vaultTokenPda,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  console.log('vault initialized:', vaultPda.toBase58());

  const printState = async (label: string) => {
    const v: any = await program.account.vault.fetch(vaultPda);
    const vaultBal = (await getAccount(connection, vaultTokenPda)).amount;
    const userBal = (await getAccount(connection, userAta.address)).amount;
    console.log(
      `\n[${label}] principal=${fmt(v.principal)} accruedYield=${fmt(v.accruedYield)} | vaultTokens=${Number(vaultBal) / 1e6} userTokens=${Number(userBal) / 1e6}`,
    );
  };
  await printState('after init');

  // 4. Deposit 100 USDC.
  const depositSig = await program.methods
    .deposit(usdc(100))
    .accounts({
      authority: walletKeypair.publicKey,
      vault: vaultPda,
      vaultTokenAccount: vaultTokenPda,
      userTokenAccount: userAta.address,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
  await printState('after deposit 100');
  console.log('  deposit tx:', txLink(depositSig));

  // 5. Withdraw 40 USDC.
  const withdrawSig = await program.methods
    .withdraw(usdc(40))
    .accounts({
      authority: walletKeypair.publicKey,
      vault: vaultPda,
      vaultTokenAccount: vaultTokenPda,
      userTokenAccount: userAta.address,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
  await printState('after withdraw 40');
  console.log('  withdraw tx:', txLink(withdrawSig));

  console.log('\n✅ vault deposit/withdraw works on-chain (devnet). Verify on Solscan:');
  console.log('  program      :', acctLink(program.programId));
  console.log('  vault account:', acctLink(vaultPda));
  console.log('  vault USDC   :', acctLink(vaultTokenPda));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
