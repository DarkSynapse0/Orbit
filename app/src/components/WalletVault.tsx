"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { AnchorProvider, Program, BN, type Idl } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Wallet, Coins, ArrowDownToLine, ArrowUpFromLine, Copy, Check, ExternalLink, Loader2, ShieldCheck, Sparkles, Power } from "lucide-react";
import idl from "@/idl/orbit_vault.json";
import { OrbitWalletName } from "@/lib/orbitWallet";

const API = "http://localhost:4000";
const DECIMALS = 6;
const base = (usd: number) => new BN(Math.round(usd * 10 ** DECIMALS));
const truncate = (a: string, n = 4) => `${a.slice(0, n)}…${a.slice(-n)}`;
const solTx = (s: string) => `https://solscan.io/tx/${s}?cluster=devnet`;

// The single vault card: connect a wallet, fund it (auto via Plaid or manual here), withdraw.
// The balance itself is shown in the hero above — this card is your controls + on-chain proof.
export function WalletVault({ onChanged }: { onChanged?: () => void }) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const { publicKey, connected, connecting, select, connect, disconnect, wallet: activeWallet } = useWallet();
  const isEmbedded = activeWallet?.adapter.name === OrbitWalletName;

  const [mint, setMint] = useState<string | null>(null);
  const [usdc, setUsdc] = useState(0);
  const [sol, setSol] = useState(0);
  const [solPrice, setSolPrice] = useState(0);
  const [principal, setPrincipal] = useState<number | null>(null);
  const [depositAmt, setDepositAmt] = useState("10");
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [lastSig, setLastSig] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // Wallet state isn't known during SSR; render the card only after mount to avoid a
  // hydration mismatch inside WalletMultiButton.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Non-crypto onboarding: create an in-app embedded wallet and connect it. select() switches
  // the active adapter; we connect once it's the Orbit one.
  const [creating, setCreating] = useState(false);
  const createAccount = useCallback(() => {
    setCreating(true);
    select(OrbitWalletName);
  }, [select]);
  useEffect(() => {
    if (creating && activeWallet?.adapter.name === OrbitWalletName && !connected && !connecting) {
      connect()
        .catch(() => {})
        .finally(() => setCreating(false));
    }
  }, [creating, activeWallet, connected, connecting, connect]);

  // A freshly created embedded wallet has no SOL for tx fees — top it up (server skips if it
  // already has enough, so Solflare/Phantom users aren't funded).
  useEffect(() => {
    if (!connected || !publicKey) return;
    fetch(`${API}/fund-sol`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: publicKey.toBase58() }),
    }).catch(() => {});
  }, [connected, publicKey]);

  const program = useMemo(() => {
    if (!wallet) return null;
    const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
    return new Program(idl as Idl, provider);
  }, [wallet, connection]);

  const pdas = useMemo(() => {
    if (!publicKey || !program || !mint) return null;
    const enc = new TextEncoder();
    const mintPk = new PublicKey(mint);
    const [vault] = PublicKey.findProgramAddressSync([enc.encode("vault"), publicKey.toBytes()], program.programId);
    const [reserve] = PublicKey.findProgramAddressSync([enc.encode("reserve"), mintPk.toBytes()], program.programId);
    const [reserveVault] = PublicKey.findProgramAddressSync([enc.encode("reserve_vault"), mintPk.toBytes()], program.programId);
    return { vault, reserve, reserveVault, mintPk };
  }, [publicKey, program, mint]);

  useEffect(() => {
    fetch(`${API}/config`).then((r) => r.json()).then((c) => { if (c.mint) setMint(c.mint); }).catch(() => {});
    fetch(`${API}/price/sol`).then((r) => r.json()).then((p) => { if (p.usd) setSolPrice(p.usd); }).catch(() => {});
  }, []);

  const refresh = useCallback(async () => {
    if (!program || !publicKey || !mint || !pdas) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const acc: any = await program.account.vault.fetchNullable(pdas.vault);
      setPrincipal(acc ? Number(acc.principal) / 10 ** DECIMALS : null);
    } catch {
      setPrincipal(null);
    }
    try {
      const ata = getAssociatedTokenAddressSync(new PublicKey(mint), publicKey);
      const bal = await connection.getTokenAccountBalance(ata);
      setUsdc(Number(bal.value.amount) / 10 ** DECIMALS);
    } catch {
      setUsdc(0);
    }
    try {
      const lamports = await connection.getBalance(publicKey);
      setSol(lamports / 1e9);
    } catch {
      setSol(0);
    }
  }, [program, publicKey, mint, pdas, connection]);

  useEffect(() => {
    if (connected) refresh();
  }, [connected, refresh]);

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    setStatus(null);
    try {
      await fn();
      onChanged?.();
    } catch (e) {
      setStatus((e as Error).message ?? "Failed");
    } finally {
      setBusy(null);
    }
  };

  const getUsdc = () =>
    run("faucet", async () => {
      if (!publicKey) return;
      const r = await fetch(`${API}/faucet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: publicKey.toBase58(), usd: 100 }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setStatus("Received 100 test USDC");
      await refresh();
    });

  const deposit = () =>
    run("deposit", async () => {
      if (!program || !publicKey || !mint || !pdas) return;
      const amt = Math.min(Math.max(Number(depositAmt) || 0, 0), usdc);
      if (amt <= 0) {
        setStatus("Enter an amount you have");
        return;
      }
      const userAta = getAssociatedTokenAddressSync(pdas.mintPk, publicKey);
      const ixs = [];
      const exists = await program.account.vault.fetchNullable(pdas.vault);
      if (!exists) {
        ixs.push(
          await program.methods
            .initializeVault()
            .accounts({
              payer: publicKey,
              owner: publicKey,
              vault: pdas.vault,
              mint: pdas.mintPk,
              systemProgram: SystemProgram.programId,
            })
            .instruction(),
        );
      }
      ixs.push(
        await program.methods
          .deposit(base(amt))
          .accounts({
            funder: publicKey,
            owner: publicKey,
            vault: pdas.vault,
            reserve: pdas.reserve,
            reserveVault: pdas.reserveVault,
            mint: pdas.mintPk,
            funderTokenAccount: userAta,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .instruction(),
      );
      const tx = new Transaction().add(...ixs);
      const sig = await (program.provider as AnchorProvider).sendAndConfirm(tx);
      setLastSig(sig);
      setStatus(exists ? `Deposited ${amt} USDC` : `Opened vault + deposited ${amt} USDC`);
      await refresh();
    });

  const withdraw = () =>
    run("withdraw", async () => {
      if (!program || !publicKey || !mint || !pdas) return;
      // Withdraw the full principal; the reserve pays it back plus all accrued interest.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const acc: any = await program.account.vault.fetchNullable(pdas.vault);
      const principalBase = acc ? new BN(acc.principal.toString()) : new BN(0);
      if (principalBase.isZero()) {
        setStatus("Nothing to withdraw");
        return;
      }
      const userAta = getAssociatedTokenAddressSync(pdas.mintPk, publicKey);
      const sig = await program.methods
        .withdraw(principalBase)
        .accounts({
          authority: publicKey,
          vault: pdas.vault,
          reserve: pdas.reserve,
          reserveVault: pdas.reserveVault,
          mint: pdas.mintPk,
          userTokenAccount: userAta,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
      setLastSig(sig);
      setStatus("Withdrew everything + yield");
      await refresh();
    });

  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-neutral-500">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Your vault · you hold the keys
      </div>
      <div className="rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-white/[0.02] p-4">
        {!mounted ? (
          <div className="h-24" aria-hidden />
        ) : !connected || !publicKey ? (
          <div className="mx-auto flex max-w-[300px] flex-col items-center gap-3 py-2 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-green-500/10 ring-1 ring-inset ring-green-500/25">
              <Wallet className="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden />
            </span>
            <div>
              <div className="text-sm font-medium">Open your vault</div>
              <div className="mt-0.5 text-[12px] text-neutral-500">One vault, fully yours. Orbit funds it automatically; only you can withdraw.</div>
            </div>
            <button
              type="button"
              onClick={createAccount}
              disabled={creating || connecting}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-semibold text-white transition-[background,transform] duration-150 ease-out hover:bg-green-500 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/60"
            >
              {creating || connecting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />}
              Create an account
            </button>
            <div className="text-[11px] text-neutral-600 dark:text-neutral-400">No wallet, no seed phrase — Orbit makes one for you.</div>
            <div className="flex w-full items-center gap-3 text-[10px] uppercase tracking-wide text-neutral-500">
              <span className="h-px flex-1 bg-black/[0.1] dark:bg-white/[0.1]" /> or <span className="h-px flex-1 bg-black/[0.1] dark:bg-white/[0.1]" />
            </div>
            <div className="wallet-adapter-fullwidth w-full">
              <WalletMultiButton
                style={{
                  height: 44,
                  width: "100%",
                  borderRadius: 12,
                  background: "var(--surface)",
                  color: "var(--foreground)",
                  border: "1px solid var(--border-strong)",
                  fontSize: 13,
                  fontWeight: 500,
                  justifyContent: "center",
                }}
              />
            </div>
            <div className="text-[11px] text-neutral-600 dark:text-neutral-400">Already have Phantom or Solflare? Connect it (Devnet).</div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-black/[0.04] dark:bg-white/[0.04] ring-1 ring-inset ring-black/[0.08] dark:ring-white/[0.08]">
                  <Wallet className="h-4 w-4 text-neutral-700 dark:text-neutral-300" aria-hidden />
                </span>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(publicKey.toBase58());
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                    className="inline-flex items-center gap-1.5 rounded font-mono text-sm text-neutral-900 dark:text-neutral-100 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/60"
                    aria-label="Copy wallet address"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" aria-hidden /> : <Copy className="h-3.5 w-3.5 text-neutral-500" aria-hidden />}
                    {truncate(publicKey.toBase58())}
                    {isEmbedded && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-1.5 py-0.5 text-[10px] font-medium text-green-600 dark:text-green-400">
                        <Sparkles className="h-2.5 w-2.5" aria-hidden /> Orbit account
                      </span>
                    )}
                  </button>
                  <div className="font-mono text-[11px] tabular-nums text-neutral-500">
                    {sol.toFixed(2)} SOL{solPrice > 0 && ` · ≈ $${(sol * solPrice).toFixed(2)}`}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => disconnect().catch(() => {})}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-black/[0.1] px-3 text-[12px] font-medium text-neutral-600 transition-colors hover:bg-black/[0.04] hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 dark:border-white/[0.12] dark:text-neutral-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
              >
                <Power className="h-3.5 w-3.5" aria-hidden /> Disconnect
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <label htmlFor="deposit-amt" className="sr-only">Deposit amount in USDC</label>
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-neutral-500">$</span>
                <input
                  id="deposit-amt"
                  value={depositAmt}
                  onChange={(e) => setDepositAmt(e.target.value.replace(/[^0-9.]/g, ""))}
                  inputMode="decimal"
                  className="h-11 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-white/[0.02] pl-6 pr-3 text-[13px] tabular-nums text-foreground placeholder:text-neutral-600 transition-colors focus:border-green-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/40"
                  placeholder="Amount"
                />
              </div>
              <button
                type="button"
                onClick={() => setDepositAmt(usdc > 0 ? String(Math.floor(usdc)) : "0")}
                disabled={busy !== null || usdc <= 0}
                className="h-11 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-white/[0.02] px-3 text-[12px] font-medium text-neutral-600 dark:text-neutral-400 transition-colors hover:text-neutral-900 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/60"
              >
                Max
              </button>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={getUsdc}
                disabled={busy !== null}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-white/[0.02] text-[13px] font-medium transition-[background,transform] duration-150 ease-out hover:bg-black/[0.05] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/60"
              >
                {busy === "faucet" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Coins className="h-4 w-4" aria-hidden />}
                Get USDC
              </button>
              <button
                type="button"
                onClick={deposit}
                disabled={busy !== null || usdc <= 0 || Number(depositAmt) <= 0}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-green-600 text-[13px] font-semibold text-white transition-[background,transform] duration-150 ease-out hover:bg-green-500 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/60"
              >
                {busy === "deposit" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ArrowDownToLine className="h-4 w-4" aria-hidden />}
                Deposit
              </button>
              <button
                type="button"
                onClick={withdraw}
                disabled={busy !== null || (principal ?? 0) <= 0}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-white/[0.02] text-[13px] font-medium transition-[background,transform] duration-150 ease-out hover:bg-black/[0.05] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/60"
              >
                {busy === "withdraw" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ArrowUpFromLine className="h-4 w-4" aria-hidden />}
                Withdraw all
              </button>
            </div>

            <p className="mt-3 text-[11px] text-neutral-500">
              Manual deposit is optional — Orbit funds this same vault automatically when your set-aside hits the threshold.
            </p>

            {(status || lastSig) && (
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-neutral-600 dark:text-neutral-400">{status}</span>
                {lastSig && (
                  <a href={solTx(lastSig)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 hover:text-green-300">
                    view tx <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
