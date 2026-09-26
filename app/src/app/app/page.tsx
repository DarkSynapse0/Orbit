"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
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
  LayoutDashboard,
  Activity as ActivityIcon,
  Lock,
  SlidersHorizontal,
  Percent,
  Settings as SettingsIcon,
  User as UserIcon,
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Coins,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { StatCard, GroupedBars, Donut, Bars, HBars } from "@/components/dashboard/Charts";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletVault } from "@/components/WalletVault";
import { OrbitMark } from "@/components/landing/OrbitMark";
import { ThemeToggle } from "@/components/ThemeToggle";

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
  exists: boolean;
  principalUsd: number;
  accruedYieldUsd: number;
  lastUpdateTs: number;
  apyBps: number;
  vaultAccount: string;
  reserveVault: string;
  programId: string;
  cluster: string;
};
type Entry = { id: number; kind: "spend" | "deposit" | "none" | "info"; text: string };
type TabId = "overview" | "activity" | "vault" | "bank" | "automation" | "earn" | "account" | "settings";

const usd = (n: number) => `$${n.toFixed(2)}`;
const truncate = (a: string, n = 4) => (a.length <= n * 2 + 1 ? a : `${a.slice(0, n)}…${a.slice(-n)}`);
const solTx = (s: string) => `https://solscan.io/tx/${s}?cluster=devnet`;
const solAcct = (a: string) => `https://solscan.io/account/${a}?cluster=devnet`;

const PANEL = "rounded-2xl border border-[var(--border)] bg-[var(--surface)]";

// Illustrative analytics data for the dashboard (demo).
const SAMPLE_WEEKLY = [
  { x: "W1", a: 40, b: 90 },
  { x: "W2", a: 65, b: 120 },
  { x: "W3", a: 50, b: 150 },
  { x: "W4", a: 85, b: 200 },
  { x: "W5", a: 45, b: 230 },
  { x: "W6", a: 70, b: 290 },
  { x: "W7", a: 60, b: 340 },
];
const SAMPLE_MONTHLY = [
  { x: "Jan", v: 45 },
  { x: "Feb", v: 62 },
  { x: "Mar", v: 38 },
  { x: "Apr", v: 78 },
  { x: "May", v: 52 },
  { x: "Jun", v: 84 },
];
const SAMPLE_CATEGORIES = [
  { label: "Groceries", v: 320 },
  { label: "Dining", v: 180 },
  { label: "Transport", v: 140 },
  { label: "Shopping", v: 95 },
  { label: "Bills", v: 60 },
];

// Yield venues the vault's USDC can be routed to. The Orbit reserve is live on devnet now;
// the mainnet lenders are where deposits route in production. APY/TVL are indicative.
type Venue = { id: string; name: string; mono: string; apy: number; tvl: string; blurb: string; live: boolean };
const VENUES: Venue[] = [
  { id: "reserve", name: "Orbit Reserve", mono: "O", apy: 6.0, tvl: "devnet", blurb: "Audited program vault. Live now.", live: true },
  { id: "kamino", name: "Kamino Lend", mono: "K", apy: 8.4, tvl: "$1.4B", blurb: "The most-used lending market on Solana.", live: false },
  { id: "aave", name: "Aave v3", mono: "A", apy: 5.2, tvl: "$22B", blurb: "The largest lending protocol in DeFi.", live: false },
  { id: "save", name: "Save · Solend", mono: "S", apy: 6.9, tvl: "$380M", blurb: "Battle-tested Solana lending.", live: false },
  { id: "marginfi", name: "marginfi", mono: "m", apy: 5.7, tvl: "$420M", blurb: "Permissionless Solana lending.", live: false },
];

type TabDef = { id: TabId; label: string; icon: typeof LayoutDashboard };
// Working sections — shown as tabs across the top of the content.
const SECTION_TABS: TabDef[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "activity", label: "Activity", icon: ActivityIcon },
  { id: "vault", label: "Vault", icon: Lock },
  { id: "bank", label: "Bank", icon: Landmark },
  { id: "automation", label: "Automation", icon: SlidersHorizontal },
  { id: "earn", label: "Earn", icon: Percent },
];
// Account-level destinations — kept in the sidebar.
const SIDEBAR_TABS: TabDef[] = [
  { id: "account", label: "Account", icon: UserIcon },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

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
      className="inline-flex items-center gap-1.5 rounded font-mono text-[var(--muted)] transition-colors hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
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
      className="inline-flex items-center gap-1 rounded text-[var(--accent-strong)] transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
    >
      {children}
      <ExternalLink className="h-3 w-3" aria-hidden />
    </a>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--faint)]">{children}</div>;
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 ${
        on ? "bg-[var(--accent)]" : "bg-[var(--border-strong)]"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-[left] duration-200 ${on ? "left-[22px]" : "left-0.5"}`}
      />
    </button>
  );
}

export default function Home() {
  const [tab, setTab] = useState<TabId>("overview");
  const [state, setState] = useState<SavingsState>({ userId: "demo", pendingUsd: 0, investedUsd: 0 });
  const [feed, setFeed] = useState<Entry[]>([]);
  const [amount, setAmount] = useState("120");
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState<boolean | null>(null);
  const [onchain, setOnchain] = useState<OnChain | null>(null);
  const [lastSig, setLastSig] = useState<string | null>(null);
  const [plaid, setPlaid] = useState<{ configured: boolean; connected: boolean } | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Automation (demo-local controls)
  const [autoInvest, setAutoInvest] = useState(true);
  const [paused, setPaused] = useState(false);
  const [multiplier, setMultiplier] = useState(1);

  // Earn projection + yield venue
  const [projAmt, setProjAmt] = useState("2000");
  const [projYears, setProjYears] = useState(5);
  const [venueId, setVenueId] = useState("reserve");
  useEffect(() => {
    try {
      const v = localStorage.getItem("orbit.venue");
      if (v) setVenueId(v);
    } catch {}
  }, []);
  const selectVenue = (id: string) => {
    setVenueId(id);
    try {
      localStorage.setItem("orbit.venue", id);
    } catch {}
  };

  const { publicKey, connected } = useWallet();
  const owner = publicKey?.toBase58() ?? null;

  const [now, setNow] = useState(() => Date.now());

  const principalUsd = onchain?.principalUsd ?? 0;
  const elapsed = onchain?.lastUpdateTs ? Math.max(0, now / 1000 - onchain.lastUpdateTs) : 0;
  const liveYield = (onchain?.accruedYieldUsd ?? 0) + (principalUsd * APY * elapsed) / SECONDS_PER_YEAR;
  const total = state.pendingUsd + principalUsd + liveYield;
  const pct = Math.min(100, (state.pendingUsd / THRESHOLD) * 100);

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
    if (!principalUsd) return;
    const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const t = setInterval(() => setNow(Date.now()), reduced ? 1000 : 200);
    return () => clearInterval(t);
  }, [principalUsd]);

  useEffect(() => {
    fetch(`${API}/health`).then((r) => setOnline(r.ok)).catch(() => setOnline(false));
    fetch(`${API}/plaid/status`).then((r) => r.json()).then(setPlaid).catch(() => {});
  }, []);

  const log = (kind: Entry["kind"], text: string) =>
    setFeed((f) => [{ id: Date.now() + Math.random(), kind, text }, ...f].slice(0, 40));

  const refreshVault = useCallback(() => {
    if (!owner) return;
    fetch(`${API}/vault?owner=${owner}`).then((r) => r.json()).then((v) => { if (!v.error) setOnchain(v); }).catch(() => {});
  }, [owner]);

  useEffect(() => {
    if (!connected || !owner) {
      setOnchain(null);
      return;
    }
    refreshVault();
    const t = setInterval(refreshVault, 6000);
    return () => clearInterval(t);
  }, [connected, owner, refreshVault]);

  const spend = useCallback(
    async (amt: number) => {
      if (!amt || amt <= 0) return;
      setBusy(true);
      try {
        const res = await fetch(`${API}/plaid/simulate-purchase`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: `p${Date.now()}`, userId: "demo", amountUsd: amt, wallet: owner, detectedAt: new Date().toISOString() }),
        });
        const data: { setAside: number; deposited: boolean; needsWallet?: boolean; depositError?: string; state: SavingsState } = await res.json();
        setState(data.state);
        if (data.setAside > 0) log("spend", `Spent ${usd(amt)} · set aside ${usd(data.setAside)}`);
        else log("none", `Spent ${usd(amt)} · below tier, nothing set aside`);
        if (data.deposited) {
          log("deposit", `Threshold reached · deposited into your vault on-chain`);
          if (data.state.lastDepositSig && !data.state.lastDepositSig.startsWith("mock-")) setLastSig(data.state.lastDepositSig);
          refreshVault();
        } else if (data.depositError) {
          log("none", `Deposit failed — kept pending, will retry. (${data.depositError.slice(0, 80)})`);
        } else if (data.needsWallet) {
          log("info", "Threshold reached — connect your wallet to move it into your vault");
        }
      } catch {
        setOnline(false);
      } finally {
        setBusy(false);
      }
    },
    [owner, refreshVault],
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
          body: JSON.stringify({ userId: "demo", wallet: owner }),
        })
      ).json();
      if (d.error) {
        log("none", `Plaid: ${d.error}`);
        return;
      }
      for (const p of d.processed ?? []) {
        if (p.setAside > 0) log("spend", `${p.name} · ${usd(p.amountUsd)} → set aside ${usd(p.setAside)}`);
        else log("none", `${p.name} · ${usd(p.amountUsd)} → below tier`);
        if (p.deposited) log("deposit", `Threshold reached · deposited into your vault`);
      }
      if (!d.processed?.length) log("info", "No new spending from Plaid");
      if (d.needsWallet) log("info", "Threshold reached — connect your wallet to move it into your vault");
      if (d.state) {
        setState(d.state);
        if (d.state.lastDepositSig && !d.state.lastDepositSig.startsWith("mock-")) setLastSig(d.state.lastDepositSig);
        if ((d.processed ?? []).some((p: { deposited: boolean }) => p.deposited)) refreshVault();
      }
    } catch {
      log("none", "Plaid sync failed");
    } finally {
      setSyncing(false);
    }
  }, [owner, refreshVault]);

  const reset = useCallback(async () => {
    await fetch(`${API}/plaid/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "demo" }),
    }).catch(() => {});
    setState({ userId: "demo", pendingUsd: 0, investedUsd: 0 });
    setFeed([]);
    setLastSig(null);
    setPlaid((p) => (p ? { ...p, connected: false } : p));
    refreshVault();
  }, [refreshVault]);

  const feedIcon = (kind: Entry["kind"]) => {
    if (kind === "deposit") return <Zap className="h-4 w-4 text-[var(--accent)]" aria-hidden />;
    if (kind === "info") return <Landmark className="h-4 w-4 text-[var(--accent-strong)]" aria-hidden />;
    return <ShoppingBag className="h-4 w-4 text-[var(--muted)]" aria-hidden />;
  };

  const selectedVenue = VENUES.find((v) => v.id === venueId) ?? VENUES[0];
  const projected = useMemo(() => {
    const a = Number(projAmt) || 0;
    const rate = selectedVenue.apy / 100;
    return a * Math.pow(1 + rate, projYears);
  }, [projAmt, projYears, selectedVenue.apy]);

  const activeLabel = [...SECTION_TABS, ...SIDEBAR_TABS].find((t) => t.id === tab)?.label ?? "";

  return (
    <div className="flex min-h-full flex-1">
      {/* ───────── Sidebar (desktop) ───────── */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-[var(--border)] px-3 py-5 lg:flex">
        <Link href="/" className="flex items-center gap-2.5 px-2" aria-label="Orbit home">
          <OrbitMark className="h-8 w-8" title="Orbit" />
          <div>
            <div className="font-display text-[15px] font-semibold leading-none tracking-tight">Orbit</div>
            <div className="mt-1 text-[11px] leading-none text-[var(--muted)]">self-driving savings</div>
          </div>
        </Link>

        <nav className="mt-8 flex-1 space-y-0.5">
          {SIDEBAR_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${
                tab === t.id
                  ? "bg-[var(--surface)] font-medium text-[var(--foreground)]"
                  : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
              }`}
            >
              <t.icon className="h-[18px] w-[18px]" aria-hidden />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="space-y-3 border-t border-[var(--border)] px-2 pt-4">
          <div className="flex items-center gap-2 text-[12px]">
            <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-[var(--accent)]" : "bg-[var(--faint)]"}`} aria-hidden />
            <span className="truncate font-mono text-[var(--muted)]">{owner ? truncate(owner) : "No wallet"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface)] px-2 py-1 text-[11px] text-[var(--muted)]">
              <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-[var(--accent)]" : online === false ? "bg-red-500" : "bg-[var(--faint)]"}`} aria-hidden />
              {online === null ? "…" : online ? "Devnet · live" : "offline"}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* ───────── Main ───────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar — label on the left, section tabs on the right beside the wallet */}
        <header className="sticky top-0 z-20 flex h-16 items-stretch justify-between gap-4 border-b border-[var(--border)] bg-[var(--background)]/80 px-5 backdrop-blur-md lg:px-8">
          <div className="flex shrink-0 items-center gap-2.5">
            <Link href="/" className="flex shrink-0 items-center lg:hidden" aria-label="Orbit home">
              <OrbitMark className="h-7 w-7" title="Orbit" />
            </Link>
            <span className="font-display text-lg font-semibold tracking-tight">{activeLabel}</span>
          </div>
          <div className="flex min-w-0 items-stretch gap-4">
            <nav className="flex items-center gap-5 overflow-x-auto px-1">
              {SECTION_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`shrink-0 text-[14px] transition-colors focus-visible:outline-none ${
                    tab === t.id ? "font-medium text-[var(--accent-strong)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </nav>
            <div className="flex shrink-0 items-center gap-2 border-l border-[var(--border)] pl-4">
              {connected ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1.5 text-[12px]">
                  <Wallet className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden />
                  <span className="font-mono">{truncate(owner!)}</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setTab("vault")}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--contrast)] px-3.5 py-2 text-[12px] font-semibold text-[var(--contrast-fg)] transition-opacity hover:opacity-90"
                >
                  <Wallet className="h-3.5 w-3.5" aria-hidden /> Connect
                </button>
              )}
              <span className="lg:hidden">
                <ThemeToggle />
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 py-8 lg:px-10 lg:py-10">
          {/* ───────── Overview ───────── */}
          {tab === "overview" && (
            <div className="space-y-4">
              {/* Stat cards */}
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  highlight
                  icon={<Wallet className="h-5 w-5 text-[var(--foreground)]" aria-hidden />}
                  delta={{ up: true, value: "6.0%" }}
                  value={usd(total)}
                  label="Total balance"
                />
                <StatCard
                  icon={<Coins className="h-5 w-5 text-[var(--foreground)]" aria-hidden />}
                  delta={onchain ? { up: true, value: "on-chain" } : undefined}
                  value={usd(principalUsd)}
                  label="Invested in vault"
                />
                <StatCard
                  icon={<TrendingUp className="h-5 w-5 text-[var(--accent-strong)]" aria-hidden />}
                  delta={{ up: true, value: "live" }}
                  value={liveYield.toFixed(6)}
                  label="Yield earned"
                />
              </div>

              {/* Main + right analytics */}
              <div className="grid gap-4 lg:grid-cols-3">
                {/* Left column */}
                <div className="space-y-4 lg:col-span-2">
                  <section className={`${PANEL} p-6`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-[15px] font-semibold">Savings analytic</h3>
                      <div className="flex items-center gap-1.5">
                        <button type="button" className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1 text-[12px] text-[var(--muted)] transition-colors hover:bg-[var(--background)]">
                          7 weeks <ChevronDown className="h-3 w-3" aria-hidden />
                        </button>
                        <button type="button" aria-label="Previous" className="grid h-7 w-7 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition-colors hover:bg-[var(--background)]"><ChevronLeft className="h-3.5 w-3.5" aria-hidden /></button>
                        <button type="button" aria-label="Next" className="grid h-7 w-7 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition-colors hover:bg-[var(--background)]"><ChevronRight className="h-3.5 w-3.5" aria-hidden /></button>
                      </div>
                    </div>
                    <div className="mt-6">
                      <GroupedBars data={SAMPLE_WEEKLY} aLabel="Set aside" bLabel="In vault" />
                    </div>
                  </section>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <section className={`${PANEL} p-6`}>
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-[15px] font-semibold">Allocation</h3>
                        <span className="rounded-lg border border-[var(--border)] px-2.5 py-1 text-[12px] text-[var(--muted)]">This month</span>
                      </div>
                      <div className="mt-6">
                        <Donut
                          centerTop={usd(total)}
                          centerBottom="total"
                          segments={
                            principalUsd + state.pendingUsd + liveYield > 0.001
                              ? [
                                  { label: "In vault", value: principalUsd, color: "var(--accent)" },
                                  { label: "Set aside", value: state.pendingUsd, color: "var(--muted)" },
                                  { label: "Yield", value: liveYield, color: "var(--faint)" },
                                ]
                              : [
                                  { label: "In vault", value: 80, color: "var(--accent)" },
                                  { label: "Set aside", value: 15, color: "var(--muted)" },
                                  { label: "Yield", value: 5, color: "var(--faint)" },
                                ]
                          }
                        />
                      </div>
                    </section>

                    <section className={`${PANEL} p-6`}>
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-[15px] font-semibold">Set-asides</h3>
                        <span className="rounded-lg border border-[var(--border)] px-2.5 py-1 text-[12px] text-[var(--muted)]">6 months</span>
                      </div>
                      <div className="mt-6">
                        <Bars data={SAMPLE_MONTHLY} />
                      </div>
                    </section>
                  </div>
                </div>

                {/* Right column */}
                <div className="space-y-4">
                  <section className={`${PANEL} p-6`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-[15px] font-semibold">By category</h3>
                      <span className="rounded-lg border border-[var(--border)] px-2.5 py-1 text-[12px] text-[var(--muted)]">This month</span>
                    </div>
                    <p className="mt-1 text-[11px] text-[var(--faint)]">Where your set-asides come from</p>
                    <div className="mt-5">
                      <HBars rows={SAMPLE_CATEGORIES} />
                    </div>
                  </section>

                  <section className={`${PANEL} p-6`}>
                    <SectionLabel>Quick actions</SectionLabel>
                    <div className="mt-4 space-y-2">
                      <button type="button" onClick={() => setTab("vault")} className="flex w-full items-center gap-2 rounded-xl bg-[var(--contrast)] px-4 py-2.5 text-[13px] font-semibold text-[var(--contrast-fg)] transition-opacity hover:opacity-90">
                        <ArrowDownToLine className="h-4 w-4" aria-hidden /> Deposit
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setTab("vault")} className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] px-3 py-2.5 text-[13px] font-medium transition-colors hover:bg-[var(--background)]">
                          <ArrowUpFromLine className="h-4 w-4" aria-hidden /> Withdraw
                        </button>
                        <button type="button" onClick={() => setTab("bank")} className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] px-3 py-2.5 text-[13px] font-medium transition-colors hover:bg-[var(--background)]">
                          <ShoppingBag className="h-4 w-4" aria-hidden /> Spend
                        </button>
                      </div>
                    </div>
                  </section>

                  <section className={`${PANEL} p-6`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-[15px] font-semibold">Recent activity</h3>
                      <button type="button" onClick={() => setTab("activity")} className="inline-flex items-center gap-1 text-[12px] text-[var(--muted)] hover:text-[var(--foreground)]">
                        View all <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                    {feed.length === 0 ? (
                      <p className="mt-4 text-[13px] text-[var(--muted)]">No activity yet. Sync a bank or add spending to start.</p>
                    ) : (
                      <ul className="mt-4 space-y-2.5">
                        {feed.slice(0, 5).map((e) => (
                          <li key={e.id} className="flex items-center gap-3 text-[13px]">
                            {feedIcon(e.kind)}
                            <span className="min-w-0 flex-1 truncate text-[var(--foreground)]">{e.text}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>
              </div>
            </div>
          )}

          {/* ───────── Activity ───────── */}
          {tab === "activity" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <SectionLabel>All activity</SectionLabel>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1 rounded text-[12px] text-[var(--muted)] transition-colors hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden /> reset
                </button>
              </div>
              {feed.length === 0 ? (
                <div className={`${PANEL} border-dashed px-4 py-14 text-center`}>
                  <ShoppingBag className="mx-auto h-6 w-6 text-[var(--muted)]" aria-hidden />
                  <p className="mt-2 text-sm text-[var(--muted)]">No activity yet</p>
                  <p className="mt-0.5 text-[12px] text-[var(--faint)]">Sync a bank or simulate a purchase to start saving.</p>
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {feed.map((e) => (
                    <li
                      key={e.id}
                      className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-sm ${
                        e.kind === "deposit"
                          ? "border-[var(--accent-soft)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                          : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]"
                      }`}
                    >
                      {feedIcon(e.kind)}
                      <span className="min-w-0 flex-1">{e.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ───────── Vault ───────── */}
          {tab === "vault" && (
            <div className="space-y-4">
              <WalletVault onChanged={refreshVault} />

              <div className="grid items-start gap-4 lg:grid-cols-2">
              <section className={`${PANEL} p-6`}>
                <SectionLabel>On-chain details</SectionLabel>
                {onchain ? (
                  <dl className="mt-4 space-y-3 text-[13px]">
                    {[
                      { k: "Vault account", v: onchain.vaultAccount },
                      { k: "Yield reserve", v: onchain.reserveVault },
                      { k: "Program", v: onchain.programId },
                    ].map((row) => (
                      <div key={row.k} className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
                        <dt className="text-[var(--muted)]">{row.k}</dt>
                        <dd className="flex items-center gap-3">
                          <CopyAddress value={row.v} label={row.k} />
                          <ExplorerLink href={solAcct(row.v)}>Solscan</ExplorerLink>
                        </dd>
                      </div>
                    ))}
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-[var(--muted)]">Network · APY</dt>
                      <dd className="font-mono">{onchain.cluster} · {(onchain.apyBps / 100).toFixed(1)}%</dd>
                    </div>
                    {lastSig && (
                      <div className="pt-1">
                        <ExplorerLink href={solTx(lastSig)}>View last deposit transaction</ExplorerLink>
                      </div>
                    )}
                  </dl>
                ) : (
                  <p className="mt-4 text-[13px] text-[var(--muted)]">Connect or create a wallet above to see your vault on-chain.</p>
                )}
              </section>

              <div className={`${PANEL} flex items-start gap-3 p-5`}>
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden />
                <p className="text-[13px] leading-relaxed text-[var(--muted)]">
                  Self-custodial by design. Orbit can fund your vault, but the program only lets{" "}
                  <span className="text-[var(--foreground)]">your key</span> withdraw. No lock-ups, no gatekeeper.
                </p>
              </div>
              </div>
            </div>
          )}

          {/* ───────── Bank ───────── */}
          {tab === "bank" && (
            <div className="grid items-start gap-4 lg:grid-cols-2">
              <section className={`${PANEL} p-6`}>
                <SectionLabel>Connected bank</SectionLabel>
                <div className="mt-4 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--background)] ring-1 ring-inset ring-[var(--border)]">
                    <Landmark className="h-5 w-5 text-[var(--foreground)]" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{plaid?.connected ? "First Platypus Bank" : "No bank connected"}</div>
                    <div className="text-[12px] text-[var(--muted)]">{plaid?.connected ? "Plaid sandbox · detection only" : "Connect to detect spending"}</div>
                  </div>
                  {plaid?.connected && <span className="h-2 w-2 rounded-full bg-[var(--accent)]" aria-hidden />}
                </div>

                {plaid && !plaid.configured && (
                  <p className="mt-4 rounded-lg bg-[var(--surface)] px-3 py-2 text-[12px] text-[var(--muted)]">
                    Add <code className="font-mono">PLAID_CLIENT_ID</code> and <code className="font-mono">PLAID_SECRET</code> to <code className="font-mono">server/.env</code> to enable real detection.
                  </p>
                )}
                {plaid?.configured && !plaid.connected && (
                  <button
                    type="button"
                    onClick={connectBank}
                    disabled={busy}
                    className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] text-sm font-medium transition-colors hover:bg-[var(--surface)] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Landmark className="h-4 w-4" aria-hidden />} Connect a test bank
                  </button>
                )}
                {plaid?.connected && (
                  <button
                    type="button"
                    onClick={syncSpending}
                    disabled={syncing}
                    aria-busy={syncing}
                    className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
                  >
                    <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} aria-hidden />
                    {syncing ? "Pulling transactions…" : "Sync spending from Plaid"}
                  </button>
                )}
              </section>

              <section className={`${PANEL} p-6`}>
                <SectionLabel>Simulate a purchase</SectionLabel>
                {!connected && (
                  <p className="mt-3 rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-[12px] text-[var(--accent-strong)]">
                    Connect your wallet (Vault) to open your vault — that&apos;s where set-asides get deposited.
                  </p>
                )}
                <div className="mt-4 flex gap-2">
                  {[45, 120, 600].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => spend(v)}
                      disabled={busy || !online || !connected}
                      className="h-11 flex-1 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm font-medium tabular-nums transition-colors hover:border-[var(--accent)]/40 hover:bg-[var(--surface)] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
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
                    className="h-11 flex-1 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 text-sm tabular-nums text-[var(--foreground)] placeholder:text-[var(--faint)] transition-colors focus:border-[var(--accent)]/50 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => spend(Number(amount))}
                    disabled={busy || !online || !connected}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] px-5 text-sm font-medium transition-colors hover:bg-[var(--surface)] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null} Spend
                  </button>
                </div>
                <p className="mt-3 text-[12px] text-[var(--muted)]">Tier rule · over $500 sets aside $10 · over $100 sets aside $5 · else nothing.</p>
              </section>
            </div>
          )}

          {/* ───────── Automation ───────── */}
          {tab === "automation" && (
            <div className="space-y-4">
              <div className="grid items-start gap-4 lg:grid-cols-2">
              <section className={`${PANEL} p-6`}>
                <SectionLabel>Round-up rule</SectionLabel>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {[
                    { spend: "Over $100", set: "$5" },
                    { spend: "Over $500", set: "$10" },
                  ].map((t) => (
                    <div key={t.spend} className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5">
                      <div className="text-[12px] text-[var(--muted)]">{t.spend}</div>
                      <div className="mt-2 font-mono text-3xl font-semibold text-[var(--accent-strong)]">{t.set}</div>
                      <div className="mt-1 text-[11px] text-[var(--muted)]">set aside</div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-[var(--border)] pt-4 text-[13px]">
                  <span className="text-[var(--muted)]">Deposit threshold</span>
                  <span className="font-mono">{usd(THRESHOLD)}</span>
                </div>
              </section>

              <section className={`${PANEL} divide-y divide-[var(--border)]`}>
                {[
                  { label: "Auto-invest at threshold", desc: "Move set-asides into your vault automatically.", on: autoInvest, set: () => setAutoInvest((v) => !v) },
                  { label: "Pause saving", desc: "Keep detecting, stop setting money aside.", on: paused, set: () => setPaused((v) => !v) },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4 p-5">
                    <div>
                      <div className="text-sm font-medium">{row.label}</div>
                      <div className="mt-0.5 text-[12px] text-[var(--muted)]">{row.desc}</div>
                    </div>
                    <Toggle on={row.on} onClick={row.set} label={row.label} />
                  </div>
                ))}
                <div className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <div className="text-sm font-medium">Round-up multiplier</div>
                    <div className="mt-0.5 text-[12px] text-[var(--muted)]">Save more per purchase.</div>
                  </div>
                  <div className="flex rounded-full border border-[var(--border)] p-0.5">
                    {[1, 2, 3].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMultiplier(m)}
                        className={`rounded-full px-3 py-1 text-[13px] font-medium transition-colors ${
                          multiplier === m ? "bg-[var(--contrast)] text-[var(--contrast-fg)]" : "text-[var(--muted)]"
                        }`}
                      >
                        {m}×
                      </button>
                    ))}
                  </div>
                </div>
              </section>
              </div>
              <p className="text-[12px] text-[var(--faint)]">These controls are a demo preview; the live rule is fixed at the tiers above.</p>
            </div>
          )}

          {/* ───────── Earn ───────── */}
          {tab === "earn" && (
            <div className="space-y-6">
              <section className={`${PANEL} p-6 lg:p-8`}>
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-mono text-[clamp(2.4rem,6vw,3.5rem)] font-semibold leading-none text-[var(--accent-strong)]">
                    {selectedVenue.apy.toFixed(1)}%
                  </span>
                  <span className="text-sm text-[var(--muted)]">APY · {selectedVenue.name}</span>
                </div>
                <p className="mt-4 max-w-md text-[13px] leading-relaxed text-[var(--muted)]">
                  Your vault&rsquo;s USDC earns in an on-chain lending venue, compounding every second. Pick where it
                  works below.
                </p>
              </section>

              {/* Venue chooser */}
              <section className={`${PANEL} p-6`}>
                <div className="flex items-center justify-between">
                  <SectionLabel>Yield venue</SectionLabel>
                  <span className="text-[11px] text-[var(--faint)]">where your money invests</span>
                </div>
                <div className="mt-4 space-y-2">
                  {VENUES.map((v) => {
                    const on = v.id === venueId;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => selectVenue(v.id)}
                        aria-pressed={on}
                        className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${
                          on ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--border-strong)]"
                        }`}
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] font-mono text-lg font-semibold">
                          {v.mono}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="text-sm font-medium">{v.name}</span>
                            {v.live ? (
                              <span className="rounded-full bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--accent-strong)]">Live · devnet</span>
                            ) : (
                              <span className="rounded-full bg-[var(--surface)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]">Mainnet</span>
                            )}
                          </span>
                          <span className="mt-0.5 block truncate text-[12px] text-[var(--muted)]">{v.blurb}</span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block font-mono text-base font-semibold text-[var(--accent-strong)]">{v.apy.toFixed(1)}%</span>
                          <span className="block text-[11px] text-[var(--muted)]">TVL {v.tvl}</span>
                        </span>
                        <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${on ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--border-strong)]"}`}>
                          {on && <Check className="h-3 w-3 text-white" aria-hidden />}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-4 text-[11px] leading-5 text-[var(--faint)]">
                  On devnet, deposits earn in the audited Orbit reserve. Choosing a mainnet venue sets where Orbit routes
                  your USDC in production. Rates vary and are indicative.
                </p>
              </section>

              <section className={`${PANEL} p-6`}>
                <SectionLabel>Projection</SectionLabel>
                <div className="mt-5 grid gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="proj" className="text-[12px] text-[var(--muted)]">Starting balance</label>
                    <div className="mt-2 flex items-center rounded-xl border border-[var(--border)] bg-[var(--background)] px-3">
                      <span className="text-[var(--muted)]">$</span>
                      <input
                        id="proj"
                        value={projAmt}
                        onChange={(e) => setProjAmt(e.target.value)}
                        inputMode="decimal"
                        className="h-11 w-full bg-transparent px-1.5 font-mono text-sm tabular-nums focus:outline-none"
                      />
                    </div>
                    <label htmlFor="years" className="mt-5 block text-[12px] text-[var(--muted)]">
                      Time · <span className="font-mono text-[var(--foreground)]">{projYears} {projYears === 1 ? "year" : "years"}</span>
                    </label>
                    <input
                      id="years"
                      type="range"
                      min={1}
                      max={30}
                      value={projYears}
                      onChange={(e) => setProjYears(Number(e.target.value))}
                      className="mt-3 w-full accent-[var(--accent)]"
                    />
                  </div>
                  <div className="flex flex-col justify-center rounded-xl border border-[var(--border)] bg-[var(--background)] p-5">
                    <div className="text-[12px] text-[var(--muted)]">Projected value</div>
                    <div className="mt-1 font-mono text-3xl font-semibold tabular-nums text-[var(--accent-strong)]">
                      ${projected.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </div>
                    <div className="mt-1 text-[12px] text-[var(--muted)]">
                      +${(projected - (Number(projAmt) || 0)).toLocaleString("en-US", { maximumFractionDigits: 0 })} in yield
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-[11px] text-[var(--faint)]">
                  Illustrative at {selectedVenue.name}&rsquo;s {selectedVenue.apy.toFixed(1)}% APY, compounded annually. Not a guarantee.
                </p>
              </section>
            </div>
          )}

          {/* ───────── Account ───────── */}
          {tab === "account" && (
            <div className="grid items-start gap-4 lg:grid-cols-2">
              <section className={`${PANEL} p-6`}>
                <SectionLabel>Wallet</SectionLabel>
                <div className="mt-4 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--surface)] ring-1 ring-inset ring-[var(--border)]">
                    <Wallet className="h-5 w-5 text-[var(--foreground)]" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{connected ? "Orbit account" : "No wallet connected"}</div>
                    <div className="mt-0.5 truncate font-mono text-[12px] text-[var(--muted)]">{owner ?? "Create or connect one in Vault"}</div>
                  </div>
                  {connected && <span className="h-2 w-2 rounded-full bg-[var(--accent)]" aria-hidden />}
                </div>
                <button
                  type="button"
                  onClick={() => setTab("vault")}
                  className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] text-sm font-medium transition-colors hover:bg-[var(--surface)]"
                >
                  {connected ? "Manage in Vault" : "Connect or create a wallet"}
                </button>
              </section>

              <section className={`${PANEL} divide-y divide-[var(--border)]`}>
                <div className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <div className="text-sm font-medium">Network</div>
                    <div className="mt-0.5 text-[12px] text-[var(--muted)]">Solana devnet</div>
                  </div>
                  <ExplorerLink href={solAcct(onchain?.programId ?? "8LEjyrMCKukhxA4q3DRaYGfkappxRayiTPM7saZG2Kgi")}>Program</ExplorerLink>
                </div>
                <div className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <div className="text-sm font-medium">Backend</div>
                    <div className="mt-0.5 text-[12px] text-[var(--muted)]">Detection &amp; deposit service</div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--muted)]">
                    <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-[var(--accent)]" : online === false ? "bg-red-500" : "bg-[var(--faint)]"}`} aria-hidden />
                    {online === null ? "…" : online ? "Connected" : "Offline"}
                  </span>
                </div>
              </section>
            </div>
          )}

          {/* ───────── Settings ───────── */}
          {tab === "settings" && (
            <div className="space-y-4">
              <section className={`${PANEL} divide-y divide-[var(--border)]`}>
                <div className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <div className="text-sm font-medium">Appearance</div>
                    <div className="mt-0.5 text-[12px] text-[var(--muted)]">Light or dark theme.</div>
                  </div>
                  <ThemeToggle />
                </div>
                <div className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <div className="text-sm font-medium">Reset demo data</div>
                    <div className="mt-0.5 text-[12px] text-[var(--muted)]">Clears set-asides and activity. Your on-chain vault is untouched.</div>
                  </div>
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--border-strong)] px-3.5 py-2 text-[12px] font-medium transition-colors hover:bg-[var(--surface)]"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset
                  </button>
                </div>
              </section>
              <p className="text-[11px] leading-5 text-[var(--faint)]">
                Live on Solana devnet. Detection, threshold, and the vault deposit are real; the fiat→USDC step (Stripe)
                is mocked. Not a bank. Not FDIC-insured — principal is not guaranteed.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
