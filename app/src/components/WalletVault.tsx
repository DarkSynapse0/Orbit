"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { AnchorProvider, Program, BN, type Idl } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Wallet, Coins, ArrowDownToLine, ArrowUpFromLine, Copy, Check, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import idl from "@/idl/orbit_vault.json";

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
  const { publicKey, connected } = useWallet();

  const [mint, setMint] = useState<string | null>(null);
  const [usdc, setUsdc] = useState(0);
  const [sol, setSol] = useState(0);
  const [solPrice, setSolPrice] = useState(0);
  const [principal, setPrincipal] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [lastSig, setLastSig] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // Wallet state isn't known during SSR; render the card only after mount to avoid a
  // hydration mismatch inside WalletMultiButton.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
          .deposit(base(10))
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
      setStatus(exists ? "Deposited 10 USDC" : "Opened vault + deposited 10 USDC");
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
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        {!mounted ? (
          <div className="h-24" aria-hidden />
        ) : !connected || !publicKey ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-500/10 ring-1 ring-inset ring-indigo-400/25">
              <Wallet className="h-5 w-5 text-indigo-300" aria-hidden />
            </span>
            <div>
              <div className="text-sm font-medium">Connect a wallet to open your vault</div>
              <div className="mt-0.5 text-[12px] text-neutral-500">One vault, fully yours. Orbit funds it automatically; only you can withdraw.</div>
            </div>
            <WalletMultiButton style={{ height: 44, borderRadius: 12, background: "#6366f1", fontSize: 14 }} />
            <div className="text-[11px] text-neutral-600">Phantom or Solflare · switch the wallet to Devnet</div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06]">
                  <Wallet className="h-4 w-4 text-neutral-300" aria-hidden />
                </span>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(publicKey.toBase58());
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                    className="inline-flex items-center gap-1.5 rounded font-mono text-sm text-neutral-200 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                    aria-label="Copy wallet address"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden /> : <Copy className="h-3.5 w-3.5 text-neutral-500" aria-hidden />}
                    {truncate(publicKey.toBase58())}
                  </button>
                  <div className="font-mono text-[11px] tabular-nums text-neutral-500">
                    {sol.toFixed(2)} SOL{solPrice > 0 && ` · ≈ $${(sol * solPrice).toFixed(2)}`}
                  </div>
                </div>
              </div>
              <WalletMultiButton style={{ height: 32, borderRadius: 10, background: "rgba(255,255,255,0.06)", fontSize: 12, padding: "0 10px" }} />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={getUsdc}
                disabled={busy !== null}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-[13px] font-medium transition-[background,transform] duration-150 ease-out hover:bg-white/[0.05] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
              >
                {busy === "faucet" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Coins className="h-4 w-4" aria-hidden />}
                Get USDC
              </button>
              <button
                type="button"
                onClick={deposit}
                disabled={busy !== null || usdc < 10}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-indigo-500 text-[13px] font-semibold text-white transition-[background,transform] duration-150 ease-out hover:bg-indigo-400 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70"
              >
                {busy === "deposit" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ArrowDownToLine className="h-4 w-4" aria-hidden />}
                Deposit $10
              </button>
              <button
                type="button"
                onClick={withdraw}
                disabled={busy !== null || (principal ?? 0) <= 0}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-[13px] font-medium transition-[background,transform] duration-150 ease-out hover:bg-white/[0.05] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
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
                <span className="text-neutral-400">{status}</span>
                {lastSig && (
                  <a href={solTx(lastSig)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-300 hover:text-indigo-200">
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
