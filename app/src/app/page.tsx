"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Orbit,
  Landmark,
  Zap,
  ShoppingBag,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  RotateCcw,
  TrendingUp,
  Loader2,
} from "lucide-react";

const API = "http://localhost:4000";
const THRESHOLD = 10;
const APY = 0.06;
const SECONDS_PER_YEAR = 31_536_000;

type SavingsState = {
  userId: string;
  pendingUsd: number;
  investedUsd: number;
  lastDepositSig?: string;
};
type OnChain = {
  principalUsd: number;
  accruedYieldUsd: number;
  vaultAccount: string;
  vaultTokenAccount: string;
  programId: string;
  cluster: string;
};
type Entry = { id: number; kind: "spend" | "deposit" | "none" | "info"; text: string };

const usd = (n: number) => `$${n.toFixed(2)}`;
const truncate = (a: string, n = 4) => (a.length <= n * 2 + 1 ? a : `${a.slice(0, n)}…${a.slice(-n)}`);
const solTx = (s: string) => `https://solscan.io/tx/${s}?cluster=devnet`;
const solAcct = (a: string) => `https://solscan.io/account/${a}?cluster=devnet`;

function CopyAddress({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      aria-label={`Copy ${label}`}
      className="inline-flex items-center gap-1.5 rounded font-mono text-neutral-400 transition-colors hover:text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      {truncate(value)}
    </button>
  );
}

function ExplorerLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded text-indigo-300 transition-colors hover:text-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
    >
      {children}
      <ExternalLink className="h-3 w-3" aria-hidden />
    </a>
  );
}

export default function Home() {
  const [state, setState] = useState<SavingsState>({ userId: "demo", pendingUsd: 0, investedUsd: 0 });
  const [feed, setFeed] = useState<Entry[]>([]);
  const [amount, setAmount] = useState("120");
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState<boolean | null>(null);
  const [onchain, setOnchain] = useState<OnChain | null>(null);
  const [lastSig, setLastSig] = useState<string | null>(null);
  const [plaid, setPlaid] = useState<{ configured: boolean; connected: boolean } | null>(null);
  const [syncing, setSyncing] = useState(false);

  const investedSince = useRef<number>(Date.now());
  const [liveYield, setLiveYield] = useState(0);

  const principalUsd = onchain?.principalUsd ?? state.investedUsd;
  const total = state.pendingUsd + principalUsd + liveYield;
  const pct = Math.min(100, (state.pendingUsd / THRESHOLD) * 100);

  // Flash the balance green when a deposit lands (not on the micro yield ticks).
  const [flash, setFlash] = useState(false);
  const prevPrincipal = useRef(principalUsd);
  useEffect(() => {
    if (principalUsd > prevPrincipal.current + 1e-6) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 900);
      prevPrincipal.current = principalUsd;
      return () => clearTimeout(t);
    }
    prevPrincipal.current = principalUsd;
  }, [principalUsd]);

  useEffect(() => {
    const t = setInterval(() => {
      const elapsed = (Date.now() - investedSince.current) / 1000;
      setLiveYield((principalUsd * APY * elapsed) / SECONDS_PER_YEAR);
    }, 120);
    return () => clearInterval(t);
  }, [principalUsd]);

  useEffect(() => {
    fetch(`${API}/health`).then((r) => setOnline(r.ok)).catch(() => setOnline(false));
    fetch(`${API}/plaid/status`).then((r) => r.json()).then(setPlaid).catch(() => {});
  }, []);

  const log = (kind: Entry["kind"], text: string) =>
    setFeed((f) => [{ id: Date.now() + Math.random(), kind, text }, ...f].slice(0, 14));

  const refreshVault = () =>
    fetch(`${API}/vault`).then((r) => r.json()).then((v) => { if (!v.error) setOnchain(v); }).catch(() => {});

  const spend = useCallback(
    async (amt: number) => {
      if (!amt || amt <= 0) return;
      setBusy(true);
      try {
        const prev = principalUsd;
        const res = await fetch(`${API}/plaid/simulate-purchase`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: `p${Date.now()}`, userId: "demo", amountUsd: amt, detectedAt: new Date().toISOString() }),
        });
        const data: { setAside: number; deposited: boolean; state: SavingsState } = await res.json();
        setState(data.state);
        if (data.setAside > 0) log("spend", `Spent ${usd(amt)} · set aside ${usd(data.setAside)}`);
        else log("none", `Spent ${usd(amt)} · below tier, nothing set aside`);
        if (data.deposited) {
          investedSince.current = Date.now();
          log("deposit", `Threshold reached · ${usd(data.state.investedUsd - prev)} deposited on-chain`);
          if (data.state.lastDepositSig && !data.state.lastDepositSig.startsWith("mock-")) setLastSig(data.state.lastDepositSig);
          refreshVault();
        }
      } catch {
        setOnline(false);
      } finally {
        setBusy(false);
      }
    },
    [principalUsd],
  );

  const connectBank = useCallback(async () => {
    setBusy(true);
    try {
      const d = await (await fetch(`${API}/plaid/connect`, { method: "POST" })).json();
      if (d.connected) {
        setPlaid({ configured: true, connected: true });
        log("info", "Connected First Platypus Bank via Plaid sandbox");
      } else log("none", `Plaid: ${d.error ?? "connect failed"}`);
    } catch {
      log("none", "Plaid connect failed");
    } finally {
      setBusy(false);
    }
  }, []);

  const syncSpending = useCallback(async () => {
    setSyncing(true);
    try {
      const d = await (
        await fetch(`${API}/plaid/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: "demo" }),
        })
      ).json();
      if (d.error) {
        log("none", `Plaid: ${d.error}`);
        return;
      }
      for (const p of d.processed ?? []) {
        if (p.setAside > 0) log("spend", `${p.name} · ${usd(p.amountUsd)} → set aside ${usd(p.setAside)}`);
        else log("none", `${p.name} · ${usd(p.amountUsd)} → below tier`);
        if (p.deposited) log("deposit", `Threshold reached · deposited on-chain`);
      }
      if (!d.processed?.length) log("info", "No new spending from Plaid");
      if (d.state) {
        setState(d.state);
        if (d.state.lastDepositSig && !d.state.lastDepositSig.startsWith("mock-")) setLastSig(d.state.lastDepositSig);
        if ((d.processed ?? []).some((p: { deposited: boolean }) => p.deposited)) {
          investedSince.current = Date.now();
          refreshVault();
        }
      }
    } catch {
      log("none", "Plaid sync failed");
    } finally {
      setSyncing(false);
    }
  }, []);

  const reset = useCallback(async () => {
    await fetch(`${API}/plaid/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "demo" }),
    }).catch(() => {});
    setState({ userId: "demo", pendingUsd: 0, investedUsd: 0 });
    setFeed([]);
    setLiveYield(0);
    setOnchain(null);
    setLastSig(null);
    setPlaid((p) => (p ? { ...p, connected: false } : p));
    investedSince.current = Date.now();
  }, []);

  const feedIcon = (kind: Entry["kind"]) => {
    if (kind === "deposit") return <Zap className="h-4 w-4 text-indigo-300" aria-hidden />;
    if (kind === "spend") return <ShoppingBag className="h-4 w-4 text-neutral-400" aria-hidden />;
    if (kind === "info") return <Landmark className="h-4 w-4 text-emerald-400" aria-hidden />;
    return <ShoppingBag className="h-4 w-4 text-neutral-600" aria-hidden />;
  };

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-5 pb-16 pt-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500/15 ring-1 ring-inset ring-indigo-400/30">
            <Orbit className="h-5 w-5 text-indigo-300" aria-hidden />
          </span>
          <div>
            <div className="text-[15px] font-semibold leading-none tracking-tight">Orbit</div>
            <div className="mt-1 text-[11px] leading-none text-neutral-500">self-driving savings</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-amber-400/10 px-2 py-1 text-[11px] font-medium text-amber-300 ring-1 ring-inset ring-amber-400/20">
            Devnet
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-2 py-1 text-[11px] text-neutral-400 ring-1 ring-inset ring-white/[0.06]"
            title={online ? "Backend connected" : "Backend offline"}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-400" : online === false ? "bg-red-400" : "bg-neutral-500"}`} aria-hidden />
            {online === null ? "…" : online ? "live" : "offline"}
          </span>
        </div>
      </header>

      {/* Balance hero */}
      <section className="mt-7 rounded-3xl border border-white/[0.07] bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-6 shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset]">
        <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">Total saved</div>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span
            className={`font-mono text-[40px] font-semibold leading-none tabular-nums transition-colors duration-700 ${
              flash ? "text-emerald-300" : "text-foreground"
            }`}
          >
            {usd(total)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
            <TrendingUp className="h-3.5 w-3.5" aria-hidden /> ~6% APY
          </span>
        </div>

        {/* Two tiles */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5">
            <div className="text-[11px] text-neutral-500">Set aside · in bank</div>
            <div className="mt-1 font-mono text-lg font-medium tabular-nums text-amber-300">{usd(state.pendingUsd)}</div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full bg-amber-400 transition-[width] duration-300 ease-out" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-1.5 text-[11px] tabular-nums text-neutral-500">{usd(state.pendingUsd)} / {usd(THRESHOLD)} to deposit</div>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5">
            <div className="flex items-center justify-between">
              <div className="text-[11px] text-neutral-500">In vault</div>
              {onchain && (
                <span className="rounded-full bg-indigo-500/15 px-1.5 py-0.5 text-[10px] text-indigo-300">on-chain</span>
              )}
            </div>
            <div className="mt-1 font-mono text-lg font-medium tabular-nums text-indigo-200">{usd(principalUsd)}</div>
            <div className="mt-2.5 font-mono text-[11px] tabular-nums text-emerald-400">+{liveYield.toFixed(6)}</div>
            <div className="mt-0.5 text-[11px] text-neutral-500">yield, accruing live</div>
          </div>
        </div>

        {/* Verify on-chain */}
        {onchain && (
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-white/[0.06] pt-3 text-[11px]">
            <span className="text-neutral-500">Verify:</span>
            <span className="text-neutral-400">
              vault <CopyAddress value={onchain.vaultTokenAccount} label="vault address" />
            </span>
            <ExplorerLink href={solAcct(onchain.vaultTokenAccount)}>Solscan</ExplorerLink>
            {lastSig && <ExplorerLink href={solTx(lastSig)}>last deposit</ExplorerLink>}
          </div>
        )}
      </section>

      {/* Bank / Plaid */}
      <section className="mt-6">
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">Your bank</div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06]">
              <Landmark className="h-5 w-5 text-neutral-300" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{plaid?.connected ? "First Platypus Bank" : "No bank connected"}</div>
              <div className="text-[11px] text-neutral-500">
                {plaid?.connected ? "Plaid sandbox · detection only" : "Connect to detect spending"}
              </div>
            </div>
            {plaid?.connected && <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />}
          </div>

          {plaid && !plaid.configured && (
            <p className="mt-3 rounded-lg bg-amber-400/10 px-3 py-2 text-[12px] text-amber-200/90">
              Add <code className="font-mono">PLAID_CLIENT_ID</code> and <code className="font-mono">PLAID_SECRET</code> to <code className="font-mono">server/.env</code> to enable real detection.
            </p>
          )}

          {plaid?.configured && !plaid.connected && (
            <button
              type="button"
              onClick={connectBank}
              disabled={busy}
              className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white/[0.06] text-sm font-medium text-neutral-100 ring-1 ring-inset ring-white/[0.08] transition-[background,transform] duration-150 ease-out hover:bg-white/[0.1] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Landmark className="h-4 w-4" aria-hidden />}
              Connect a test bank
            </button>
          )}

          {plaid?.connected && (
            <button
              type="button"
              onClick={syncSpending}
              disabled={syncing}
              aria-busy={syncing}
              className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-[background,transform] duration-150 ease-out hover:bg-indigo-400 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080c]"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} aria-hidden />
              {syncing ? "Pulling transactions…" : "Sync spending from Plaid"}
            </button>
          )}
        </div>
      </section>

      {/* Simulate (secondary) */}
      <section className="mt-6">
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">Or simulate a purchase</div>
        <div className="flex gap-2">
          {[45, 120, 600].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => spend(v)}
              disabled={busy || !online}
              className="h-11 flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] text-sm font-medium tabular-nums transition-[background,transform,border-color] duration-150 ease-out hover:border-indigo-400/40 hover:bg-white/[0.05] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
            >
              ${v}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <label htmlFor="amount" className="sr-only">Purchase amount in dollars</label>
          <input
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="Custom amount"
            className="h-11 flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 text-sm tabular-nums text-foreground placeholder:text-neutral-600 transition-colors focus:border-indigo-400/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
          />
          <button
            type="button"
            onClick={() => spend(Number(amount))}
            disabled={busy || !online}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white/[0.06] px-5 text-sm font-medium ring-1 ring-inset ring-white/[0.08] transition-[background,transform] duration-150 ease-out hover:bg-white/[0.1] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Spend
          </button>
        </div>
        <p className="mt-2 text-[11px] text-neutral-500">
          Tier rule · over $500 sets aside $10 · over $100 sets aside $5 · else nothing.
        </p>
      </section>

      {/* Activity */}
      <section className="mt-7">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">Activity</div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1 rounded text-[11px] text-neutral-500 transition-colors hover:text-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
          >
            <RotateCcw className="h-3 w-3" aria-hidden /> reset
          </button>
        </div>
        {feed.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] px-4 py-8 text-center">
            <ShoppingBag className="mx-auto h-6 w-6 text-neutral-600" aria-hidden />
            <p className="mt-2 text-sm text-neutral-400">No activity yet</p>
            <p className="mt-0.5 text-[12px] text-neutral-600">Sync a bank or simulate a purchase to start saving.</p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {feed.map((e) => (
              <li
                key={e.id}
                className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm ${
                  e.kind === "deposit"
                    ? "border-indigo-500/25 bg-indigo-500/[0.08] text-indigo-100"
                    : e.kind === "info"
                      ? "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-100"
                      : e.kind === "spend"
                        ? "border-white/[0.06] bg-white/[0.02] text-neutral-200"
                        : "border-white/[0.04] bg-white/[0.01] text-neutral-500"
                }`}
              >
                {feedIcon(e.kind)}
                <span className="min-w-0 flex-1">{e.text}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Footer / disclosure */}
      <footer className="mt-8 border-t border-white/[0.06] pt-4">
        <p className="text-[11px] leading-5 text-neutral-600">
          Live on Solana devnet. Set-aside detection, threshold, and the vault deposit are real; the fiat→USDC step
          (Stripe) is mocked. Not a bank. Not FDIC-insured — principal is not guaranteed.
        </p>
      </footer>
    </main>
  );
}
