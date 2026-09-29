"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { AnchorProvider, Program, BN, type Idl } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Wallet, Coins, ArrowDownToLine, ArrowUpFromLine, Copy, Check, ExternalLink, Loader2, ShieldCheck, UserPlus, Power } from "lucide-react";
import { PhantomMark } from "@/components/landing/BrandMarks";
import { InfoDot } from "@/components/ui/InfoDot";
import idl from "@/idl/orbit_vault.json";
import { OrbitWalletName } from "@/lib/orbitWallet";
import { apiFetch } from "@/lib/api";
import { logActivity } from "@/lib/activity";

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
    apiFetch(`/fund-sol`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: publicKey.toBase58() }),
    }).catch(() => {});
    // Log the connect once per wallet per session (so reloads don't spam it).
    try {
      const k = "orbit.connlog." + publicKey.toBase58();
      if (!sessionStorage.getItem(k)) {
        sessionStorage.setItem(k, "1");
        logActivity("wallet_connect", `Connected ${isEmbedded ? "your Orbit account" : "a wallet"}`);
      }
    } catch {}
  }, [connected, publicKey, isEmbedded]);

  const program = useMemo(() => {
    if (!wallet) return null;
    const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
    return new Program(idl as Idl, provider);
  }, [wallet, connection]);

  const pdas = useMemo(() => {
    if (!publicKey || !program || !mint) return null;
    const enc = new TextEncoder();
    const mintPk = new PublicKey(mint);
    const [vault] = PublicKey.findProgramAddressSync([enc.encode("vault"), publicKey.toBytes(), mintPk.toBytes()], program.programId);
    const [reserve] = PublicKey.findProgramAddressSync([enc.encode("reserve"), mintPk.toBytes()], program.programId);
    const [reserveVault] = PublicKey.findProgramAddressSync([enc.encode("reserve_vault"), mintPk.toBytes()], program.programId);
    return { vault, reserve, reserveVault, mintPk };
  }, [publicKey, program, mint]);

  useEffect(() => {
    apiFetch(`/config`).then((r) => r.json()).then((c) => { if (c.mint) setMint(c.mint); }).catch(() => {});
  }, []);

  const refresh = useCallback(async () => {
    if (!program || !publicKey || !mint || !pdas) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const acc: any = await (program.account as any).vault.fetchNullable(pdas.vault);
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
    if (!connected) return;
    refresh();
    // Keep the wallet USDC + vault balance live (e.g. after a faucet or auto-invest elsewhere).
    const t = setInterval(refresh, 12000);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVisible); };
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
      const r = await apiFetch(`/faucet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: publicKey.toBase58(), usd: 100 }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setStatus("Received 100 test USDC");
      logActivity("faucet", "Received 100 test USDC");
      // Refresh in the background (don't block the button on the RPC read); retry
      // once since a freshly-minted token account can lag a beat.
      refresh();
      setTimeout(refresh, 2500);
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
      const exists = await (program.account as any).vault.fetchNullable(pdas.vault);
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
      logActivity("deposit", `Deposited $${amt.toFixed(2)} into your vault`);
      await refresh();
    });

  const withdraw = () =>
    run("withdraw", async () => {
      if (!program || !publicKey || !mint || !pdas) return;
      // Withdraw the full principal; the reserve pays it back plus all accrued interest.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const acc: any = await (program.account as any).vault.fetchNullable(pdas.vault);
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
      await refresh();
      // Mocked off-ramp (mirrors the mocked Stripe deposit hop, in reverse):
      // vault -> your wallet (USDC, real, above) -> Stripe converts USDC -> dollars -> your bank.
      const amt = Number(principalBase.toString()) / 10 ** DECIMALS;
      setStatus("Converting to dollars via Stripe…");
      await new Promise((r) => setTimeout(r, 1300));
      setStatus(`$${amt.toFixed(2)} on its way to your bank 🎉`);
      logActivity("withdraw", `Withdrew $${amt.toFixed(2)} to your bank`);
    });

  return (
    <section className="mt-6">
      <div className="rounded-2xl bg-[var(--surface)] p-5">
        <div className="mb-4 flex items-center gap-1.5 font-display text-[16px] font-bold">
          <ShieldCheck className="h-4 w-4 text-[var(--primary-strong)]" aria-hidden /> Your vault
        </div>
        {!mounted ? (
          <div className="h-24" aria-hidden />
        ) : !connected || !publicKey ? (
          /* ───────── Onboarding ───────── */
          <div className="mx-auto flex max-w-[320px] flex-col items-center gap-3 py-2 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
              <Wallet className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <div className="text-[16px] font-semibold">Open your vault</div>
              <div className="mt-1 text-[14px] leading-relaxed text-[var(--muted)]">One vault, fully yours. Orbit funds it automatically; only you can withdraw.</div>
            </div>
            <button
              type="button"
              onClick={createAccount}
              disabled={creating || connecting}
              className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] text-sm font-semibold text-[var(--on-accent)] transition-opacity hover:opacity-90 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
            >
              {creating || connecting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <UserPlus className="h-4 w-4" aria-hidden />}
              Create an account
            </button>
            <div className="text-[12px] text-[var(--muted)]">No wallet, no seed phrase — Orbit makes one for you.</div>
            <div className="flex w-full items-center gap-3 text-[10px] uppercase tracking-wide text-[var(--faint)]">
              <span className="h-px flex-1 bg-[var(--border)]" /> or <span className="h-px flex-1 bg-[var(--border)]" />
            </div>
            <div className="wallet-adapter-fullwidth flex w-full items-center gap-2.5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[var(--border-strong)] bg-[var(--background)]">
                <PhantomMark className="h-5 w-5 text-[#ab9ff2]" />
              </span>
              <WalletMultiButton
                style={{ height: 44, flex: 1, borderRadius: 12, background: "var(--background)", color: "var(--foreground)", border: "1px solid var(--border-strong)", fontSize: 13, fontWeight: 500, justifyContent: "center" }}
              />
            </div>
            <div className="text-[12px] text-[var(--muted)]">Already have Phantom or Solflare? Connect it (Devnet).</div>
          </div>
        ) : (
          /* ───────── Connected ───────── */
          <div className="space-y-5">
            {/* Account */}
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-4 text-[12px] text-[var(--muted)]">
              <div className="flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => { navigator.clipboard?.writeText(publicKey.toBase58()); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                  className="flex min-w-0 items-center gap-1.5 rounded transition-colors hover:text-[var(--foreground)]"
                  aria-label="Copy account address"
                >
                  <Wallet className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{isEmbedded ? "Orbit account" : "Wallet"} · <span className="font-mono">{truncate(publicKey.toBase58())}</span></span>
                  {copied ? <Check className="h-3.5 w-3.5 shrink-0 text-[var(--primary-strong)]" aria-hidden /> : <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden />}
                </button>
                <span className="flex shrink-0 items-center gap-1 font-mono text-[var(--foreground)]">
                  · {sol.toFixed(2)} SOL
                  <InfoDot label="SOL is Solana's coin, used for tiny network fees. Your savings are held separately in USDC (dollars), which is what 'In your wallet' and your vault track." />
                </span>
              </div>
              <button
                type="button"
                onClick={() => disconnect().catch(() => {})}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--destructive)]/40 px-2.5 py-1 font-medium text-[var(--destructive)] transition-colors hover:bg-[var(--destructive-soft)]"
              >
                <Power className="h-3.5 w-3.5" aria-hidden /> <span className="hidden sm:inline">Disconnect</span>
              </button>
            </div>
            {/* Your savings — the headline (the one card we allow) */}
            <div className="rounded-2xl bg-[var(--background)] p-4">
              <div className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--muted)]">
                Your savings
                <InfoDot label="Held on-chain as USDC, converted from your dollars via Stripe. Earns 6% a year; only you can withdraw." />
              </div>
              <div className="mt-1 font-mono text-[clamp(2rem,5vw,2.75rem)] font-semibold leading-none tabular-nums text-[var(--primary-strong)]">${(principal ?? 0).toFixed(2)}</div>
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-3">
                <div>
                  <div className="flex items-center gap-1 text-[12px] text-[var(--muted)]">
                    In your wallet
                    <InfoDot label="Test USDC sitting in your wallet, ready to add to savings." />
                  </div>
                  <div className="mt-0.5 font-mono text-[15px] font-semibold tabular-nums">${usdc.toFixed(2)}</div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-[12px] text-[var(--muted)]">
                    Converted via Stripe
                    <InfoDot label="Total dollars Orbit converted to USDC and deposited into your vault (Stripe is mocked on devnet)." />
                  </div>
                  <div className="mt-0.5 font-mono text-[15px] font-semibold tabular-nums text-[var(--primary-strong)]">${(principal ?? 0).toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Add money */}
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-[13px]">
                <span className="font-medium text-[var(--muted)]">Add to your savings</span>
                <span className="text-[var(--faint)]">Ready to add <span className="font-mono text-[var(--foreground)]">${usdc.toFixed(2)}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <label htmlFor="deposit-amt" className="sr-only">Amount to add</label>
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-[var(--muted)]">$</span>
                  <input
                    id="deposit-amt"
                    value={depositAmt}
                    onChange={(e) => setDepositAmt(e.target.value.replace(/[^0-9.]/g, ""))}
                    inputMode="decimal"
                    className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-6 pr-14 text-[15px] tabular-nums text-[var(--foreground)] placeholder:text-[var(--faint)] transition-colors focus:border-[var(--border-strong)] focus:outline-none"
                    placeholder="Amount"
                  />
                  <button
                    type="button"
                    onClick={() => setDepositAmt(usdc > 0 ? String(Math.floor(usdc)) : "0")}
                    disabled={busy !== null || usdc <= 0}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-[12px] font-medium text-[var(--primary-strong)] transition-colors hover:bg-[var(--primary-soft)] disabled:pointer-events-none disabled:opacity-40"
                  >
                    Max
                  </button>
                </div>
                <button
                  type="button"
                  onClick={deposit}
                  disabled={busy !== null || usdc <= 0 || Number(depositAmt) <= 0}
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[var(--primary)] px-5 text-[15px] font-semibold text-[var(--primary-fg)] transition-opacity hover:opacity-90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
                >
                  {busy === "deposit" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ArrowDownToLine className="h-4 w-4" aria-hidden />}
                  Add
                </button>
              </div>
              {usdc <= 0 && <p className="mt-1.5 text-[12px] text-[var(--faint)]">No test money yet. Tap “Get test money” below to fund your account first.</p>}
            </div>

            {/* Secondary actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={getUsdc}
                disabled={busy !== null}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-[var(--border-strong)] text-[14px] font-medium transition-colors hover:bg-[var(--surface)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
              >
                {busy === "faucet" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Coins className="h-4 w-4" aria-hidden />}
                Get test money
              </button>
              <button
                type="button"
                onClick={withdraw}
                disabled={busy !== null || (principal ?? 0) <= 0}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-[var(--border-strong)] text-[14px] font-medium transition-colors hover:bg-[var(--surface)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
              >
                {busy === "withdraw" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ArrowUpFromLine className="h-4 w-4" aria-hidden />}
                Withdraw to bank
              </button>
            </div>

            <p className="text-[12px] leading-relaxed text-[var(--muted)]">
              You don&apos;t have to add money yourself, Orbit fills this automatically from your everyday spending. Withdraw sends dollars back to your bank anytime.
            </p>

            {(status || lastSig) && (
              <div className="flex items-center justify-between gap-3 text-[12px]">
                <span className="min-w-0 truncate text-[var(--muted)]">{status}</span>
                {lastSig && (
                  <a href={solTx(lastSig)} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 font-medium text-[var(--primary-strong)] hover:underline">
                    view receipt <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </section>
  );
}
