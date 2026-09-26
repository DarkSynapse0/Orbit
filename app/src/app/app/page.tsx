"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Home as HomeIcon,
  PiggyBank,
  Sprout,
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
  Activity as ActivityIcon,
  User as UserIcon,
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronRight,
  ChevronDown,
  Coins,
  ShieldCheck,
  Wallet,
  LogIn,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { AuthScreen } from "@/components/AuthScreen";
import { UserMenu, Avatar } from "@/components/UserMenu";
import { LineArea, HBars } from "@/components/dashboard/Charts";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletVault } from "@/components/WalletVault";
import { OrbitMark } from "@/components/landing/OrbitMark";
import { OrbitLogo } from "@/components/OrbitLogo";
import { AaveMark, KaminoMark, SaveMark, MarginfiMark } from "@/components/landing/BrandMarks";
import { ThemeToggle } from "@/components/ThemeToggle";

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
type Txn = { id: number; name: string; category: string; amountUsd: number; setAside: number; deposited: boolean; ts: number };
type TabId = "home" | "save" | "grow" | "activity" | "account";

const usd = (n: number) => `$${n.toFixed(2)}`;
// Live yield reads as money: clean $0.00 when there's nothing, otherwise enough
// precision to watch it tick up on small balances.
const fmtYield = (n: number) => (n > 0 ? `$${n.toFixed(6)}` : "$0.00");
const fmtTvl = (n: number) =>
  n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${Math.round(n / 1e6)}M` : n >= 1e3 ? `$${Math.round(n / 1e3)}k` : `$${Math.round(n)}`;
const truncate = (a: string, n = 4) => (a.length <= n * 2 + 1 ? a : `${a.slice(0, n)}…${a.slice(-n)}`);
const solTx = (s: string) => `https://solscan.io/tx/${s}?cluster=devnet`;
const solAcct = (a: string) => `https://solscan.io/account/${a}?cluster=devnet`;

const PANEL = "rounded-2xl border border-[var(--border)] bg-[var(--surface)]";

// Placeholder shown only until there are real transactions (fresh account).
const SAMPLE_LINE = [15, 25, 30, 45, 55, 75, 90, 110, 130, 160];
const SAMPLE_LINE_LABELS = ["", "", "", "", "", "", "", "", "", "now"];
const SAMPLE_CATEGORIES = [
  { label: "Groceries", v: 25 },
  { label: "Dining", v: 20 },
  { label: "Transport", v: 15 },
  { label: "Shopping", v: 10 },
];

// Yield venues the vault's USDC can be routed to. The Orbit reserve is live on devnet now;
// the mainnet lenders are where deposits route in production. APY/TVL are indicative.
type Venue = {
  id: string;
  name: string;
  mono: string;
  apy: number;
  tvl: string;
  blurb: string;
  live: boolean;
  Mark?: React.ComponentType<{ className?: string }>;
};
const VENUES: Venue[] = [
  { id: "reserve", name: "Orbit Reserve", mono: "O", apy: 6.0, tvl: "devnet", blurb: "Audited program vault. Live now.", live: true, Mark: OrbitMark },
  { id: "kamino", name: "Kamino Lend", mono: "K", apy: 8.4, tvl: "$1.4B", blurb: "The most-used lending market on Solana.", live: false, Mark: KaminoMark },
  { id: "aave", name: "Aave v3", mono: "A", apy: 5.2, tvl: "$22B", blurb: "The largest lending protocol in DeFi.", live: false, Mark: AaveMark },
  { id: "save", name: "Save · Solend", mono: "S", apy: 6.9, tvl: "$380M", blurb: "Battle-tested Solana lending.", live: false, Mark: SaveMark },
  { id: "marginfi", name: "marginfi", mono: "m", apy: 5.7, tvl: "$420M", blurb: "Permissionless Solana lending.", live: false, Mark: MarginfiMark },
];

// Renders a venue's real logo when available, else a monogram tile.
function VenueMark({ venue, className = "h-8 w-8" }: { venue: Venue; className?: string }) {
  if (venue.Mark) {
    return (
      <span className={`grid ${className} shrink-0 place-items-center`}>
        <venue.Mark className="h-full w-full" />
      </span>
    );
  }
  return (
    <span className={`grid ${className} shrink-0 place-items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] font-mono text-sm font-semibold`}>
      {venue.mono}
    </span>
  );
}

// The product story: money comes in (Save) → it grows (Grow) → see it (Activity) → your stuff (Account).
type TabDef = { id: TabId; label: string; icon: typeof HomeIcon; hint: string };
const NAV: TabDef[] = [
  { id: "home", label: "Home", icon: HomeIcon, hint: "Your money at a glance" },
  { id: "save", label: "Save", icon: PiggyBank, hint: "How money is set aside" },
  { id: "grow", label: "Grow", icon: Sprout, hint: "Your vault & yield" },
  { id: "activity", label: "Activity", icon: ActivityIcon, hint: "Every transaction" },
  { id: "account", label: "Account", icon: UserIcon, hint: "Wallet & settings" },
];

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
  return <div className="text-[12px] font-medium uppercase tracking-[0.16em] text-[var(--faint)]">{children}</div>;
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
  const { user, ready: authReady, signInWithGoogle, signOut } = useAuth();
  const [tab, setTab] = useState<TabId>("home");
  const [state, setState] = useState<SavingsState>({ userId: "demo", pendingUsd: 0, investedUsd: 0 });
  const [feed, setFeed] = useState<Entry[]>([]);
  const [amount, setAmount] = useState("120");
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState<boolean | null>(null);
  const [onchain, setOnchain] = useState<OnChain | null>(null);
  const [lastSig, setLastSig] = useState<string | null>(null);
  const [plaid, setPlaid] = useState<{ configured: boolean; connected: boolean } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [investing, setInvesting] = useState(false);

  // Automation (demo-local controls)
  const [autoInvest, setAutoInvest] = useState(true);
  const [paused, setPaused] = useState(false);
  const [multiplier, setMultiplier] = useState(1);

  // Earn projection + yield venue
  const [projAmt, setProjAmt] = useState("2000");
  const [projYears, setProjYears] = useState(5);
  const [venueId, setVenueId] = useState("reserve");
  const [venueOpen, setVenueOpen] = useState(false);
  const [liveVenues, setLiveVenues] = useState<Record<string, { apy: number | null; tvl: number | null }>>({});
  useEffect(() => {
    apiFetch(`/venues`)
      .then((r) => r.json())
      .then((d) => d.venues && setLiveVenues(d.venues))
      .catch(() => {});
  }, []);
  useEffect(() => {
    try {
      const v = localStorage.getItem("orbit.venue");
      if (v) setVenueId(v);
    } catch {}
  }, []);
  const selectVenue = (id: string) => {
    setVenueId(id);
    setVenueOpen(false);
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
    apiFetch(`/health`).then((r) => setOnline(r.ok)).catch(() => setOnline(false));
    apiFetch(`/plaid/status`).then((r) => r.json()).then(setPlaid).catch(() => {});
  }, []);

  const log = (kind: Entry["kind"], text: string) =>
    setFeed((f) => [{ id: Date.now() + Math.random(), kind, text }, ...f].slice(0, 40));

  const refreshVault = useCallback(() => {
    if (!owner) return;
    apiFetch(`/vault?owner=${owner}`).then((r) => r.json()).then((v) => { if (!v.error) setOnchain(v); }).catch(() => {});
  }, [owner]);

  const [txns, setTxns] = useState<Txn[]>([]);
  const refreshTxns = useCallback(() => {
    apiFetch(`/plaid/transactions`)
      .then((r) => r.json())
      .then((d) => setTxns(d.transactions ?? []))
      .catch(() => {});
  }, []);
  useEffect(() => {
    refreshTxns();
    // Load the saved state so balances survive reloads.
    apiFetch(`/plaid/state`)
      .then((r) => r.json())
      .then((d) => d.state && setState(d.state))
      .catch(() => {});
  }, [refreshTxns]);

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
        const res = await apiFetch(`/plaid/simulate-purchase`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amountUsd: amt, wallet: owner, detectedAt: new Date().toISOString() }),
        });
        const data: { setAside: number; deposited: boolean; needsWallet?: boolean; depositError?: string; state: SavingsState } = await res.json();
        setState(data.state);
        refreshTxns();
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
    [owner, refreshVault, refreshTxns],
  );

  // Move whatever is already set aside into the vault now (no new purchase needed).
  // Runs when a wallet connects with a backlog, or from the "Invest now" button.
  const investNow = useCallback(async () => {
    if (!owner) return;
    setInvesting(true);
    try {
      const d = await (
        await apiFetch(`/plaid/invest-now`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet: owner }),
        })
      ).json();
      if (d.state) setState(d.state);
      if (d.deposited) {
        log("deposit", `Moved ${usd(d.batch)} into your vault on-chain`);
        if (d.state?.lastDepositSig && !d.state.lastDepositSig.startsWith("mock-")) setLastSig(d.state.lastDepositSig);
        refreshVault();
      } else if (d.error) {
        log("none", `Invest failed — kept pending, try again. (${String(d.error).slice(0, 80)})`);
      }
    } catch {
      log("none", "Invest failed — try again");
    } finally {
      setInvesting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner, refreshVault]);

  // Self-driving: whenever a wallet is connected and the set-aside reaches the
  // threshold, invest it automatically — no button press needed. We remember the
  // amount we last auto-invested so a failed attempt doesn't loop, but any *new*
  // threshold crossing (or a reconnect) triggers a fresh auto-invest.
  const autoInvestedFor = useRef(0);
  useEffect(() => {
    if (!connected || !owner) {
      autoInvestedFor.current = 0;
      return;
    }
    if (state.pendingUsd >= THRESHOLD && !investing && autoInvestedFor.current !== state.pendingUsd) {
      autoInvestedFor.current = state.pendingUsd;
      investNow();
    }
  }, [connected, owner, state.pendingUsd, investing, investNow]);

  const connectBank = useCallback(async () => {
    setBusy(true);
    try {
      const d = await (await apiFetch(`/plaid/connect`, { method: "POST" })).json();
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
        await apiFetch(`/plaid/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet: owner }),
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
      refreshTxns();
    } catch {
      log("none", "Plaid sync failed");
    } finally {
      setSyncing(false);
    }
  }, [owner, refreshVault, refreshTxns]);

  const reset = useCallback(async () => {
    await apiFetch(`/plaid/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).catch(() => {});
    setState({ userId: "demo", pendingUsd: 0, investedUsd: 0 });
    setFeed([]);
    setLastSig(null);
    setPlaid((p) => (p ? { ...p, connected: false } : p));
    refreshVault();
    refreshTxns();
  }, [refreshVault, refreshTxns]);

  const feedIcon = (kind: Entry["kind"]) => {
    if (kind === "deposit") return <Zap className="h-4 w-4 text-[var(--accent)]" aria-hidden />;
    if (kind === "info") return <Landmark className="h-4 w-4 text-[var(--accent-strong)]" aria-hidden />;
    return <ShoppingBag className="h-4 w-4 text-[var(--muted)]" aria-hidden />;
  };

  // Merge in live APY/TVL from DefiLlama where available (Orbit Reserve stays our rate).
  const venues = useMemo(
    () =>
      VENUES.map((v) => {
        const live = liveVenues[v.id];
        return {
          ...v,
          apy: live && live.apy != null ? Math.round(live.apy * 10) / 10 : v.apy,
          tvl: live && live.tvl != null ? fmtTvl(live.tvl) : v.tvl,
          isLive: !!(live && live.apy != null),
        };
      }),
    [liveVenues],
  );
  const selectedVenue = venues.find((v) => v.id === venueId) ?? venues[0];
  const projected = useMemo(() => {
    const a = Number(projAmt) || 0;
    const rate = selectedVenue.apy / 100;
    return a * Math.pow(1 + rate, projYears);
  }, [projAmt, projYears, selectedVenue.apy]);

  // Real chart data derived from the transaction history (simple + readable).
  const analytics = useMemo(() => {
    const asc = [...txns].sort((a, b) => a.ts - b.ts);
    let cum = 0;
    const pts = asc.map((t) => {
      cum += t.setAside;
      return { ts: t.ts, cum };
    });
    const recent = pts.slice(-10);
    const savingsLine = recent.map((p) => Math.round(p.cum));
    const savingsLabels = recent.map((p) =>
      new Date(p.ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    );
    const catMap: Record<string, number> = {};
    for (const t of txns) catMap[t.category] = (catMap[t.category] ?? 0) + t.setAside;
    const categories = Object.entries(catMap)
      .map(([label, v]) => ({ label, v: Math.round(v) }))
      .sort((a, b) => b.v - a.v)
      .slice(0, 5);
    return { hasData: txns.length > 0, savingsLine, savingsLabels, categories, totalSaved: Math.round(cum) };
  }, [txns]);

  const activeNav = NAV.find((t) => t.id === tab) ?? NAV[0];
  // Setup status for the Home checklist.
  const setup = {
    bank: !!plaid?.connected,
    vault: connected,
    saving: state.pendingUsd > 0 || principalUsd > 0,
  };
  // Friendly transaction row helper.
  const txnDate = (ts: number) => new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  // Gate the dashboard behind sign-in. Wait for the stored session to load to
  // avoid flashing the login screen for an already-signed-in user.
  if (!authReady) return <div className="min-h-dvh bg-[var(--background)]" />;
  if (!user) return <AuthScreen />;

  return (
    <div className="flex min-h-full flex-1">
      {/* ───────── Sidebar (desktop) ───────── */}
      <aside className="sticky top-0 hidden h-screen w-[15rem] shrink-0 flex-col border-r border-[var(--border)] px-4 py-6 lg:flex">
        <Link href="/" className="flex flex-col items-start gap-1 px-1" aria-label="Orbit home">
          <OrbitLogo className="h-7" />
          <div className="text-[12px] leading-none text-[var(--muted)]">self-driving savings</div>
        </Link>

        <nav className="mt-9 flex-1 space-y-1">
          {NAV.map((t) => (
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

        <div className="space-y-3 border-t border-[var(--border)] px-1 pt-4">
          {user ? (
            <button
              type="button"
              onClick={() => setTab("account")}
              className="flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors hover:bg-[var(--surface)]"
            >
              <Avatar user={user} size="h-8 w-8" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium">{user.name}</span>
                <span className="block truncate text-[11px] text-[var(--muted)]">{user.email}</span>
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={signInWithGoogle}
              className="flex w-full items-center gap-2 rounded-xl border border-[var(--border-strong)] px-3 py-2 text-[13px] font-medium transition-colors hover:bg-[var(--surface)]"
            >
              <LogIn className="h-4 w-4" aria-hidden /> Sign in
            </button>
          )}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface)] px-2 py-1 text-[12px] text-[var(--muted)]">
              <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-[var(--accent)]" : online === false ? "bg-red-500" : "bg-[var(--faint)]"}`} aria-hidden />
              {online === null ? "…" : online ? "Devnet · live" : "offline"}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* ───────── Main ───────── */}
      <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--background)]/80 px-5 backdrop-blur-md lg:px-8">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="flex items-center lg:hidden" aria-label="Orbit home">
              <OrbitLogo mark className="h-7" />
            </Link>
            <div>
              <h1 className="font-display text-lg font-semibold leading-none tracking-tight">{activeNav.label}</h1>
              <p className="mt-1 hidden text-[13px] leading-none text-[var(--muted)] sm:block">{activeNav.hint}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="lg:hidden">
              <ThemeToggle />
            </span>
            <UserMenu />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1200px] flex-1 px-5 py-6 lg:px-8 lg:py-8">
          {/* ═══════════ HOME ═══════════ */}
          {tab === "home" && (
            <div className="space-y-4">
              {/* Hero: balance + growth curve */}
              <section className={`${PANEL} overflow-hidden`}>
                <div className="grid grid-cols-1 divide-y divide-[var(--border)] lg:grid-cols-[0.82fr_1.18fr] lg:divide-x lg:divide-y-0">
                  <div className="flex flex-col p-6 lg:p-8">
                    <SectionLabel>Total saved</SectionLabel>
                    <div
                      className={`mt-3 font-mono text-[clamp(2.75rem,6vw,4.25rem)] font-semibold leading-none tabular-nums transition-colors duration-700 ${
                        flash ? "text-[var(--accent)]" : "text-[var(--foreground)]"
                      }`}
                    >
                      {usd(total)}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[14px]">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 font-medium text-[var(--accent-strong)]">
                        <TrendingUp className="h-3.5 w-3.5" aria-hidden /> 6% a year
                      </span>
                      <span className="font-mono text-[var(--accent-strong)]">{liveYield > 0 ? "+" : ""}{fmtYield(liveYield)}</span>
                      <span className="text-[var(--muted)]">earned, live</span>
                    </div>
                    <div className="mt-auto flex flex-wrap gap-2 pt-8">
                      <button type="button" onClick={() => setTab("grow")} className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-[14px] font-semibold text-[var(--on-accent)] transition-opacity hover:opacity-90">
                        <ArrowDownToLine className="h-4 w-4" aria-hidden /> Add money
                      </button>
                      <button type="button" onClick={() => setTab("grow")} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-strong)] px-4 py-2.5 text-[14px] font-medium transition-colors hover:bg-[var(--background)]">
                        <ArrowUpFromLine className="h-4 w-4" aria-hidden /> Take out
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-[16px] font-semibold">Your savings over time</h3>
                      <span className="rounded-lg border border-[var(--border)] px-2.5 py-1 text-[12px] text-[var(--muted)]">{analytics.hasData ? "all time" : "sample"}</span>
                    </div>
                    <div className="mt-5">
                      <LineArea
                        series={[{ label: "Saved", points: analytics.hasData ? analytics.savingsLine : SAMPLE_LINE }]}
                        xLabels={analytics.hasData ? analytics.savingsLabels : SAMPLE_LINE_LABELS}
                        fmtY={(v) => `$${v >= 1000 ? `${Math.round(v / 1000)}k` : Math.round(v)}`}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Breakdown — two compact tiles (interest lives in the hero above) */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`${PANEL} p-4`}>
                  <div className="flex items-center gap-1.5 text-[12px] text-[var(--muted)]">
                    <Coins className="h-4 w-4 shrink-0" aria-hidden /> In vault
                    {onchain && <span className="hidden rounded-full bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] text-[var(--accent-strong)] sm:inline">on-chain</span>}
                  </div>
                  <div className="mt-2 font-mono text-lg font-semibold tabular-nums text-[var(--accent-strong)] sm:text-xl">{usd(principalUsd)}</div>
                  <div className="mt-1 hidden text-[12px] text-[var(--faint)] sm:block">invested, earning yield</div>
                </div>
                <div className={`${PANEL} p-4`}>
                  <div className="flex items-center gap-1.5 text-[12px] text-[var(--muted)]"><Landmark className="h-4 w-4 shrink-0" aria-hidden /> Set aside</div>
                  <div className="mt-2 font-mono text-lg font-semibold tabular-nums sm:text-xl">{usd(state.pendingUsd)}</div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
                    <div
                      className={`h-full rounded-full transition-[width] duration-300 ${state.pendingUsd >= THRESHOLD ? "bg-[var(--accent)]" : "bg-[var(--faint)]"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {state.pendingUsd >= THRESHOLD ? (
                    connected ? (
                      investing ? (
                        <div className="mt-2.5 flex items-center gap-1.5 text-[12px] text-[var(--accent-strong)]">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Investing automatically…
                        </div>
                      ) : (
                        // Auto-invests on its own; this is just a manual retry if that failed.
                        <button
                          type="button"
                          onClick={investNow}
                          className="mt-2.5 text-[12px] font-medium text-[var(--accent-strong)] underline-offset-2 hover:underline"
                        >
                          Invest now
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() => setTab("grow")}
                        className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-[var(--background)]"
                      >
                        Connect wallet
                      </button>
                    )
                  ) : (
                    <div className="mt-1.5 font-mono text-[11px] tabular-nums text-[var(--faint)] sm:text-[12px]">{usd(state.pendingUsd)} / {usd(THRESHOLD)}</div>
                  )}
                </div>
              </div>

              {/* Recent activity + (setup checklist OR categories) */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
                <section className={`${PANEL} p-6`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-[16px] font-semibold">Recent activity</h3>
                    <button type="button" onClick={() => setTab("activity")} className="inline-flex items-center gap-1 text-[13px] text-[var(--muted)] hover:text-[var(--foreground)]">
                      See all <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                  {txns.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--background)] ring-1 ring-inset ring-[var(--border)]"><ShoppingBag className="h-5 w-5 text-[var(--muted)]" aria-hidden /></span>
                      <p className="mt-3 text-[14px] text-[var(--muted)]">Nothing yet</p>
                      <p className="mt-0.5 text-[13px] text-[var(--faint)]">Spend or sync a bank to start saving.</p>
                    </div>
                  ) : (
                    <ul className="mt-3 space-y-0.5">
                      {txns.slice(0, 5).map((t) => (
                        <li key={t.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-[var(--background)]">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--background)]">
                            {t.deposited ? <Zap className="h-4 w-4 text-[var(--accent)]" aria-hidden /> : <ShoppingBag className="h-4 w-4 text-[var(--muted)]" aria-hidden />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[14px] font-medium">{t.name}</span>
                            <span className="block text-[12px] text-[var(--muted)]">{t.category} · {txnDate(t.ts)}</span>
                          </span>
                          <span className={`shrink-0 font-mono text-[14px] tabular-nums ${t.setAside > 0 ? "text-[var(--accent-strong)]" : "text-[var(--faint)]"}`}>
                            {t.setAside > 0 ? `+${usd(t.setAside)}` : "—"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {setup.bank && setup.vault ? (
                  <section className={`${PANEL} p-6`}>
                    <h3 className="font-display text-[16px] font-semibold">Where your savings come from</h3>
                    <p className="mt-0.5 text-[13px] text-[var(--muted)]">Set aside from your spending</p>
                    <div className="mt-5">
                      <HBars rows={analytics.categories.length ? analytics.categories : SAMPLE_CATEGORIES} />
                    </div>
                  </section>
                ) : (
                  <section className={`${PANEL} p-6`}>
                    <h3 className="font-display text-[16px] font-semibold">Get set up</h3>
                    <p className="mt-0.5 text-[13px] text-[var(--muted)]">Two quick steps to start saving on autopilot</p>
                    <div className="mt-5 space-y-2.5">
                      {[
                        { done: setup.vault, label: "Open your vault", desc: "Create an account in one tap", go: "grow" as TabId },
                        { done: setup.bank, label: "Connect your bank", desc: "So Orbit can watch your spending", go: "save" as TabId },
                      ].map((s) => (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => setTab(s.go)}
                          className="flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 text-left transition-colors hover:border-[var(--border-strong)]"
                        >
                          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${s.done ? "bg-[var(--accent)] text-white" : "bg-[var(--surface)] text-[var(--muted)] ring-1 ring-inset ring-[var(--border)]"}`}>
                            {s.done ? <Check className="h-4 w-4" aria-hidden /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={`block text-[15px] font-medium ${s.done ? "text-[var(--muted)] line-through" : ""}`}>{s.label}</span>
                            <span className="block text-[13px] text-[var(--muted)]">{s.desc}</span>
                          </span>
                          {!s.done && <ChevronRight className="h-4 w-4 shrink-0 text-[var(--faint)]" aria-hidden />}
                        </button>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          )}

          {/* ═══════════ SAVE ═══════════ */}
          {tab === "save" && (
            <div className="space-y-4">
              <div className={`${PANEL} p-6`}>
                <h3 className="font-display text-[16px] font-semibold">Money comes in on its own</h3>
                <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-[var(--muted)]">
                  Connect your bank and Orbit quietly sets aside a little whenever you spend, then moves it to your vault
                  once it adds up. You never have to decide to save.
                </p>
              </div>

              <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
                {/* Bank */}
                <section className={`${PANEL} p-6`}>
                  <SectionLabel>Your bank</SectionLabel>
                  <div className="mt-4 flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--background)] ring-1 ring-inset ring-[var(--border)]"><Landmark className="h-5 w-5 text-[var(--foreground)]" aria-hidden /></span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{plaid?.connected ? "First Platypus Bank" : "No bank connected"}</div>
                      <div className="text-[13px] text-[var(--muted)]">{plaid?.connected ? "Plaid sandbox · detection only" : "Connect to detect spending"}</div>
                    </div>
                    {plaid?.connected && <span className="h-2 w-2 rounded-full bg-[var(--accent)]" aria-hidden />}
                  </div>
                  {plaid && !plaid.configured && (
                    <p className="mt-4 rounded-lg bg-[var(--background)] px-3 py-2 text-[13px] text-[var(--muted)]">Set <code className="font-mono">PLAID_CLIENT_ID</code> and <code className="font-mono">PLAID_SECRET</code> in the server environment to detect real spending.</p>
                  )}
                  {plaid?.configured && !plaid.connected && (
                    <button type="button" onClick={connectBank} disabled={busy} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] text-sm font-medium transition-colors hover:bg-[var(--background)] disabled:pointer-events-none disabled:opacity-50">
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Landmark className="h-4 w-4" aria-hidden />} Connect a test bank
                    </button>
                  )}
                  {plaid?.connected && (
                    <button type="button" onClick={syncSpending} disabled={syncing} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] text-sm font-semibold text-[var(--on-accent)] transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-60">
                      <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} aria-hidden /> {syncing ? "Pulling transactions…" : "Sync spending"}
                    </button>
                  )}
                </section>

                {/* Try it */}
                <section className={`${PANEL} p-6`}>
                  <SectionLabel>Try it — simulate a purchase</SectionLabel>
                  {!connected && (
                    <p className="mt-3 rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-[13px] text-[var(--accent-strong)]">Open your vault in Grow first — that&apos;s where set-asides land.</p>
                  )}
                  <div className="mt-4 flex gap-2">
                    {[45, 120, 600].map((v) => (
                      <button key={v} type="button" onClick={() => spend(v)} disabled={busy || !online || !connected} className="h-11 flex-1 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm font-medium tabular-nums transition-colors hover:border-[var(--accent)]/40 disabled:pointer-events-none disabled:opacity-40">${v}</button>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <label htmlFor="amount" className="sr-only">Purchase amount</label>
                    <input id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="Custom amount" className="h-11 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 text-sm tabular-nums text-[var(--foreground)] placeholder:text-[var(--faint)] focus:border-[var(--accent)]/50 focus:outline-none" />
                    <button type="button" onClick={() => spend(Number(amount))} disabled={busy || !online || !connected} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] px-5 text-sm font-medium transition-colors hover:bg-[var(--background)] disabled:pointer-events-none disabled:opacity-40">{busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null} Spend</button>
                  </div>
                </section>
              </div>

              {/* Rule + automation */}
              <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
                <section className={`${PANEL} p-6`}>
                  <SectionLabel>The round-up rule</SectionLabel>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {[{ spend: "Over $100", set: "$5" }, { spend: "Over $500", set: "$10" }].map((t) => (
                      <div key={t.spend} className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5">
                        <div className="text-[13px] text-[var(--muted)]">{t.spend}</div>
                        <div className="mt-2 font-mono text-3xl font-semibold text-[var(--accent-strong)]">{t.set}</div>
                        <div className="mt-1 text-[12px] text-[var(--muted)]">set aside</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-[var(--border)] pt-4 text-[14px]">
                    <span className="text-[var(--muted)]">Moves to vault at</span>
                    <span className="font-mono">{usd(THRESHOLD)}</span>
                  </div>
                </section>

                <section className={`${PANEL} divide-y divide-[var(--border)]`}>
                  <div className="flex items-center justify-between gap-4 p-5">
                    <div><div className="text-sm font-medium">Auto-invest at threshold</div><div className="mt-0.5 text-[13px] text-[var(--muted)]">Move set-asides into your vault automatically.</div></div>
                    <Toggle on={autoInvest} onClick={() => setAutoInvest((v) => !v)} label="Auto-invest" />
                  </div>
                  <div className="flex items-center justify-between gap-4 p-5">
                    <div><div className="text-sm font-medium">Pause saving</div><div className="mt-0.5 text-[13px] text-[var(--muted)]">Keep watching, stop setting aside.</div></div>
                    <Toggle on={paused} onClick={() => setPaused((v) => !v)} label="Pause" />
                  </div>
                  <div className="flex items-center justify-between gap-4 p-5">
                    <div><div className="text-sm font-medium">Save more per purchase</div><div className="mt-0.5 text-[13px] text-[var(--muted)]">Multiply each set-aside.</div></div>
                    <div className="flex rounded-full border border-[var(--border)] p-0.5">
                      {[1, 2, 3].map((m) => (
                        <button key={m} type="button" onClick={() => setMultiplier(m)} className={`rounded-full px-3 py-1 text-[14px] font-medium transition-colors ${multiplier === m ? "bg-[var(--contrast)] text-[var(--contrast-fg)]" : "text-[var(--muted)]"}`}>{m}×</button>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
              <p className="text-[12px] text-[var(--faint)]">Automation controls are a demo preview; the live rule is fixed at the tiers above.</p>
            </div>
          )}

          {/* ═══════════ GROW ═══════════ */}
          {tab === "grow" && (
            <div className="space-y-4">
              {/* Vault first — the one thing that matters */}
              <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
                <div className="[&>section]:mt-0">
                  <WalletVault onChanged={refreshVault} />
                </div>

                {/* Earning: big APY + venue picker + trust chips (was 3 text sections) */}
                <section className={`${PANEL} p-6`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <SectionLabel>Earning</SectionLabel>
                      <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="font-mono text-4xl font-semibold text-[var(--accent-strong)]">{selectedVenue.apy.toFixed(1)}%</span>
                        <span className="text-[13px] text-[var(--muted)]">APY</span>
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setVenueOpen((o) => !o)}
                        aria-expanded={venueOpen}
                        className="flex items-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--background)] px-3 py-2 transition-colors hover:bg-[var(--surface)]"
                      >
                        <VenueMark venue={selectedVenue} className="h-6 w-6" />
                        <span className="max-w-[7rem] truncate text-[13px] font-medium">{selectedVenue.name}</span>
                        <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--muted)] transition-transform ${venueOpen ? "rotate-180" : ""}`} aria-hidden />
                      </button>
                      {venueOpen && (
                        <>
                          <button type="button" aria-hidden tabIndex={-1} className="fixed inset-0 z-10 cursor-default" onClick={() => setVenueOpen(false)} />
                          <div className="absolute right-0 z-20 mt-2 w-[min(20rem,calc(100vw-3rem))] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[0_16px_44px_-14px_rgba(2,6,23,0.4)]">
                            {venues.map((v) => {
                              const on = v.id === venueId;
                              return (
                                <button key={v.id} type="button" onClick={() => selectVenue(v.id)} className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors ${on ? "bg-[var(--accent-soft)]" : "hover:bg-[var(--background)]"}`}>
                                  <VenueMark venue={v} className="h-8 w-8" />
                                  <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-1.5">
                                      <span className="truncate text-[14px] font-medium">{v.name}</span>
                                      {v.live ? <span className="rounded-full bg-[var(--accent-soft)] px-1.5 py-0.5 text-[9px] font-medium text-[var(--accent-strong)]">Live</span> : <span className="rounded-full bg-[var(--background)] px-1.5 py-0.5 text-[9px] text-[var(--muted)]">Mainnet</span>}
                                    </span>
                                    <span className="block truncate text-[12px] text-[var(--muted)]">{v.apy.toFixed(1)}% APY · {v.tvl}</span>
                                  </span>
                                  {on && <Check className="h-4 w-4 shrink-0 text-[var(--accent-strong)]" aria-hidden />}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {[
                      { icon: ShieldCheck, l: "Self-custody" },
                      { icon: ExternalLink, l: "On-chain" },
                      { icon: RefreshCw, l: "Withdraw anytime" },
                    ].map((c) => (
                      <span key={c.l} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-[12px] font-medium text-[var(--accent-strong)]">
                        <c.icon className="h-3.5 w-3.5" aria-hidden /> {c.l}
                      </span>
                    ))}
                  </div>

                  {connected && onchain ? (
                    <a href={solAcct(onchain.vaultAccount)} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--accent-strong)] hover:underline">
                      View your vault on Solscan <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </a>
                  ) : (
                    <p className="mt-4 text-[12px] text-[var(--faint)]">Open your vault to see it live on Solana.</p>
                  )}
                </section>
              </div>

              {/* Projection — the visual payoff */}
              <section className={`${PANEL} p-6`}>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_0.8fr] md:items-center">
                  <div>
                    <SectionLabel>If you saved</SectionLabel>
                    <div className="mt-3 flex items-center rounded-xl border border-[var(--border)] bg-[var(--background)] px-3">
                      <span className="text-[var(--muted)]">$</span>
                      <input id="proj" value={projAmt} onChange={(e) => setProjAmt(e.target.value)} inputMode="decimal" className="h-11 w-full min-w-0 bg-transparent px-1.5 font-mono text-sm tabular-nums focus:outline-none" />
                    </div>
                    <label htmlFor="years" className="mt-4 block text-[13px] text-[var(--muted)]">for <span className="font-mono text-[var(--foreground)]">{projYears} {projYears === 1 ? "year" : "years"}</span></label>
                    <input id="years" type="range" min={1} max={30} value={projYears} onChange={(e) => setProjYears(Number(e.target.value))} className="mt-3 w-full accent-[var(--accent)]" />
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5">
                    <div className="text-[13px] text-[var(--muted)]">Could become</div>
                    <div className="mt-1 font-mono text-[clamp(2.25rem,8vw,3rem)] font-semibold leading-none tabular-nums text-[var(--accent-strong)]">${projected.toLocaleString("en-US", { maximumFractionDigits: 0 })}</div>
                    <div className="mt-2 text-[13px] text-[var(--muted)]">+${(projected - (Number(projAmt) || 0)).toLocaleString("en-US", { maximumFractionDigits: 0 })} earned</div>
                  </div>
                </div>
                <p className="mt-4 text-[11px] text-[var(--faint)]">Illustrative at {selectedVenue.apy.toFixed(1)}% APY, compounded yearly. Not a guarantee.</p>
              </section>
            </div>
          )}

          {/* ═══════════ ACTIVITY ═══════════ */}
          {tab === "activity" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <SectionLabel>Every transaction</SectionLabel>
                <button type="button" onClick={reset} className="inline-flex items-center gap-1 rounded text-[13px] text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"><RotateCcw className="h-3.5 w-3.5" aria-hidden /> reset</button>
              </div>
              {txns.length === 0 ? (
                <div className={`${PANEL} border-dashed px-4 py-16 text-center`}>
                  <ShoppingBag className="mx-auto h-6 w-6 text-[var(--muted)]" aria-hidden />
                  <p className="mt-2 text-sm text-[var(--muted)]">No transactions yet</p>
                  <p className="mt-0.5 text-[13px] text-[var(--faint)]">Simulate a purchase or sync a bank in Save.</p>
                </div>
              ) : (
                <section className={`${PANEL} overflow-hidden`}>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-[14px]">
                      <thead>
                        <tr className="border-b border-[var(--border)] text-[12px] uppercase tracking-[0.14em] text-[var(--faint)]">
                          <th className="px-5 py-3 font-medium">Transaction</th>
                          <th className="px-5 py-3 font-medium">Category</th>
                          <th className="px-5 py-3 font-medium">Date</th>
                          <th className="px-5 py-3 text-right font-medium">Spent</th>
                          <th className="px-5 py-3 text-right font-medium">Set aside</th>
                          <th className="px-5 py-3 text-right font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {txns.map((t) => (
                          <tr key={t.id} className="transition-colors hover:bg-[var(--background)]">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--background)]">
                                  {t.deposited ? <Zap className="h-4 w-4 text-[var(--accent)]" aria-hidden /> : <ShoppingBag className="h-4 w-4 text-[var(--muted)]" aria-hidden />}
                                </span>
                                <span className="truncate font-medium">{t.name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-[var(--muted)]">{t.category}</td>
                            <td className="px-5 py-3 font-mono text-[13px] text-[var(--muted)]">{txnDate(t.ts)}</td>
                            <td className="px-5 py-3 text-right font-mono tabular-nums text-[var(--muted)]">{usd(t.amountUsd)}</td>
                            <td className={`px-5 py-3 text-right font-mono tabular-nums ${t.setAside > 0 ? "text-[var(--accent-strong)]" : "text-[var(--faint)]"}`}>
                              {t.setAside > 0 ? `+${usd(t.setAside)}` : "—"}
                            </td>
                            <td className="px-5 py-3 text-right">
                              {t.deposited ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[12px] font-medium text-[var(--accent-strong)]">In vault</span>
                              ) : t.setAside > 0 ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)] px-2 py-0.5 text-[12px] text-[var(--muted)]">Set aside</span>
                              ) : (
                                <span className="text-[12px] text-[var(--faint)]">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>
          )}

          {/* ═══════════ ACCOUNT ═══════════ */}
          {tab === "account" && (
            <div className="space-y-4">
              {/* Profile (Google account) */}
              <section className={`${PANEL} p-6`}>
                <SectionLabel>Profile</SectionLabel>
                {user ? (
                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <Avatar user={user} size="h-14 w-14" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-base font-medium">{user.name}</div>
                      <div className="truncate text-[13px] text-[var(--muted)]">{user.email}</div>
                    </div>
                    <button
                      type="button"
                      onClick={signOut}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--border-strong)] px-3.5 py-2 text-[13px] font-medium transition-colors hover:bg-[var(--background)]"
                    >
                      <LogOut className="h-3.5 w-3.5" aria-hidden /> Sign out
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    <p className="text-[13px] text-[var(--muted)]">Sign in to sync your savings across devices.</p>
                    <button
                      type="button"
                      onClick={signInWithGoogle}
                      className="inline-flex items-center gap-2 rounded-full bg-[var(--contrast)] px-4 py-2.5 text-[13px] font-semibold text-[var(--contrast-fg)] transition-opacity hover:opacity-90"
                    >
                      <LogIn className="h-4 w-4" aria-hidden /> Sign in with Google
                    </button>
                  </div>
                )}
              </section>

              <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
                <section className={`${PANEL} p-6`}>
                  <SectionLabel>Wallet</SectionLabel>
                  <div className="mt-4 flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--background)] ring-1 ring-inset ring-[var(--border)]"><Wallet className="h-5 w-5 text-[var(--foreground)]" aria-hidden /></span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{connected ? "Orbit account" : "No wallet connected"}</div>
                      <div className="mt-0.5 truncate font-mono text-[13px] text-[var(--muted)]">{owner ?? "Open one in Grow"}</div>
                    </div>
                    {connected && <span className="h-2 w-2 rounded-full bg-[var(--accent)]" aria-hidden />}
                  </div>
                  <button type="button" onClick={() => setTab("grow")} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] text-sm font-medium transition-colors hover:bg-[var(--background)]">{connected ? "Manage in Grow" : "Open or connect a wallet"}</button>
                </section>

                <section className={`${PANEL} divide-y divide-[var(--border)]`}>
                  <div className="flex items-center justify-between gap-4 p-5">
                    <div><div className="text-sm font-medium">Appearance</div><div className="mt-0.5 text-[13px] text-[var(--muted)]">Light or dark theme</div></div>
                    <ThemeToggle />
                  </div>
                  <div className="flex items-center justify-between gap-4 p-5">
                    <div><div className="text-sm font-medium">Network</div><div className="mt-0.5 text-[13px] text-[var(--muted)]">Solana devnet</div></div>
                    <ExplorerLink href={solAcct(onchain?.programId ?? "8LEjyrMCKukhxA4q3DRaYGfkappxRayiTPM7saZG2Kgi")}>Program</ExplorerLink>
                  </div>
                  <div className="flex items-center justify-between gap-4 p-5">
                    <div><div className="text-sm font-medium">Backend</div><div className="mt-0.5 text-[13px] text-[var(--muted)]">Detection &amp; deposit service</div></div>
                    <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--muted)]"><span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-[var(--accent)]" : online === false ? "bg-red-500" : "bg-[var(--faint)]"}`} aria-hidden />{online === null ? "…" : online ? "Connected" : "Offline"}</span>
                  </div>
                </section>
              </div>

              <section className={`${PANEL} flex items-center justify-between gap-4 p-5`}>
                <div><div className="text-sm font-medium">Reset demo data</div><div className="mt-0.5 text-[13px] text-[var(--muted)]">Clears set-asides and activity. Your on-chain vault is untouched.</div></div>
                <button type="button" onClick={reset} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--border-strong)] px-3.5 py-2 text-[13px] font-medium transition-colors hover:bg-[var(--background)]"><RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset</button>
              </section>

              <p className="text-[12px] leading-5 text-[var(--faint)]">Live on Solana devnet. Detection, threshold, and the vault deposit are real; the fiat→USDC step (Stripe) is mocked. Not a bank. Not FDIC-insured — principal is not guaranteed.</p>
            </div>
          )}
        </main>
      </div>

      {/* ───────── Mobile bottom nav ───────── */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-md lg:hidden">
        {NAV.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[12px] transition-colors ${tab === t.id ? "text-[var(--accent-strong)]" : "text-[var(--muted)]"}`}
          >
            <t.icon className="h-5 w-5" aria-hidden />
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
