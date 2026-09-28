"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  PiggyBank,
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
  Plus,
  Search,
  Gift,
  Settings,
  HelpCircle,
  Info,
  X,
  MoreHorizontal,
  LayoutDashboard,
  ArrowLeftRight,
  Target,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { AuthScreen } from "@/components/AuthScreen";
import { UserMenu, Avatar } from "@/components/UserMenu";
import { LineArea } from "@/components/dashboard/Charts";
import { SavingsGoals } from "@/components/dashboard/SavingsGoals";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletVault } from "@/components/WalletVault";
import { OrbitLogo } from "@/components/OrbitLogo";
import { AaveMark, KaminoMark, SaveMark, MarginfiMark } from "@/components/landing/BrandMarks";
import { ThemeToggle } from "@/components/ThemeToggle";
import { InfoDot } from "@/components/ui/InfoDot";
import { txnIcon } from "@/lib/visuals";

const THRESHOLD = 10;
const APY = 0.06;
const SECONDS_PER_YEAR = 31_536_000;
// Set-aside rate band (mirrors @orbit/shared). Orbit sets aside this % of each purchase.
const MIN_PCT = 0.5;
const MAX_PCT = 5;
const DEFAULT_PCT = 1;

type SavingsState = {
  userId: string;
  pendingUsd: number;
  investedUsd: number;
  setAsidePct?: number;
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

// Soft, elevated card (Finora-style): hairline border for dark mode + gentle shadow, no hard box lines.
const CARD = "rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_1px_2px_rgba(2,6,23,0.03),0_18px_40px_-24px_rgba(2,6,23,0.22)]";
// Every dashboard section uses the same soft card so the whole app reads as one system.
const PANEL = CARD;

// Placeholder shown only until there are real transactions (fresh account).
const SAMPLE_LINE = [15, 25, 30, 45, 55, 75, 90, 110, 130, 160];
const SAMPLE_LINE_LABELS = ["", "", "", "", "", "", "", "", "", "now"];
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
// Square Orbit app-icon so the reserve tile fills 1:1 like the other venue logos.
const OrbitVenueMark = ({ className }: { className?: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src="/icon.png" alt="Orbit Reserve" className={`${className ?? ""} rounded-lg object-cover`} draggable={false} />
);
const VENUES: Venue[] = [
  { id: "reserve", name: "Orbit Reserve", mono: "O", apy: 6.0, tvl: "devnet", blurb: "Audited program vault. Live now.", live: true, Mark: OrbitVenueMark },
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

// Finora-style sidebar. Each label maps to one of Orbit's real views (`tab`); a few
// Finora labels point at the same underlying view (Orbit has fewer sections).
type NavItem = { id: string; label: string; icon: typeof Wallet; hint: string; tab?: TabId; href?: string };
const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, hint: "Your money at a glance", tab: "home" },
  { id: "transactions", label: "Transactions", icon: ArrowLeftRight, hint: "Every transaction", tab: "activity" },
  { id: "wallet", label: "Wallet", icon: Wallet, hint: "Your vault & yield", tab: "grow" },
  { id: "budget", label: "Budget", icon: PiggyBank, hint: "How money is set aside", tab: "save" },
  { id: "goals", label: "Savings Goals", icon: Target, hint: "Your vault & yield", tab: "grow" },
];
const NAV_SECONDARY: NavItem[] = [
  { id: "settings", label: "Settings", icon: Settings, hint: "Wallet & settings", tab: "account" },
  { id: "security", label: "Security", icon: ShieldCheck, hint: "Wallet & settings", tab: "account" },
  { id: "help", label: "Help Center", icon: HelpCircle, hint: "Wallet & settings", href: "/" },
];
// Mobile bottom bar: one entry per real view.
const MOBILE_NAV: NavItem[] = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard, hint: "", tab: "home" },
  { id: "transactions", label: "Activity", icon: ArrowLeftRight, hint: "", tab: "activity" },
  { id: "wallet", label: "Wallet", icon: Wallet, hint: "", tab: "grow" },
  { id: "budget", label: "Budget", icon: PiggyBank, hint: "", tab: "save" },
  { id: "settings", label: "Account", icon: UserIcon, hint: "", tab: "account" },
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
  const [navId, setNavId] = useState<string>("dashboard");
  const [invited, setInvited] = useState(false);
  const [query, setQuery] = useState("");
  const firstNavPersist = useRef(true);

  // "Invite & Earn" (Finora parity): copy an invite link to the clipboard for now.
  const invite = () => {
    try {
      navigator.clipboard?.writeText(typeof window !== "undefined" ? window.location.origin : "https://orbit.app");
      setInvited(true);
      setTimeout(() => setInvited(false), 1800);
    } catch {}
  };

  // Navigate via a sidebar item: highlight it and show its underlying view.
  const selectNav = (item: NavItem) => {
    if (item.href) return;
    setNavId(item.id);
    if (item.tab) setTab(item.tab);
  };

  // Restore the last view after a refresh (client-only, avoids SSR mismatch).
  useEffect(() => {
    try {
      const saved = localStorage.getItem("orbit.nav.v1");
      const item = [...NAV, ...NAV_SECONDARY].find((n) => n.id === saved);
      if (item?.tab) {
        setNavId(item.id);
        setTab(item.tab);
      }
    } catch {}
  }, []);

  // Remember the active view. Skip the first run so the default never overwrites a
  // restored selection before the restore effect applies it.
  useEffect(() => {
    if (firstNavPersist.current) {
      firstNavPersist.current = false;
      return;
    }
    try {
      localStorage.setItem("orbit.nav.v1", navId);
    } catch {}
  }, [navId]);

  // Keep the sidebar highlight in sync when an in-content button switches tabs.
  useEffect(() => {
    const cur = [...NAV, ...NAV_SECONDARY].find((n) => n.id === navId);
    if (!cur || cur.tab !== tab) {
      const match = NAV.find((n) => n.tab === tab) ?? NAV_SECONDARY.find((n) => n.tab === tab);
      if (match) setNavId(match.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

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

  // Set-aside rate: % of each purchase (server-backed, 0.5–5%).
  const [rate, setRate] = useState<number>(DEFAULT_PCT);
  const rateSynced = useRef(false);
  const rateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Adopt the server's saved rate once, then let the slider drive it.
  useEffect(() => {
    if (!rateSynced.current && typeof state.setAsidePct === "number") {
      setRate(state.setAsidePct);
      rateSynced.current = true;
    }
  }, [state.setAsidePct]);
  // Update the rate locally now, persist (debounced) so dragging doesn't spam the server.
  const changeRate = (next: number) => {
    const p = Math.min(MAX_PCT, Math.max(MIN_PCT, Math.round(next * 10) / 10));
    setRate(p);
    if (rateTimer.current) clearTimeout(rateTimer.current);
    rateTimer.current = setTimeout(() => {
      apiFetch(`/plaid/set-aside-pct`, { method: "POST", body: JSON.stringify({ pct: p }) })
        .then((r) => r.json())
        .then((d) => { if (d.state) setState(d.state); })
        .catch(() => {});
    }, 400);
  };

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

  const activeNav = [...NAV, ...NAV_SECONDARY, ...MOBILE_NAV].find((n) => n.id === navId) ?? NAV[0];
  // Setup status for the Home checklist.
  const setup = {
    bank: !!plaid?.connected,
    vault: connected,
    saving: state.pendingUsd > 0 || principalUsd > 0,
  };
  // Savings health = three steps to fully automatic saving.
  const healthSteps = [
    { done: setup.vault, label: "Open your vault", desc: "One tap, no seed phrase", go: "grow" as TabId },
    { done: setup.bank, label: "Connect your bank", desc: "So Orbit can watch your spending", go: "save" as TabId },
    { done: setup.saving, label: "Start saving", desc: "Set aside from your spending", go: "save" as TabId },
  ];
  // Friendly transaction row helper.
  const txnDate = (ts: number) => new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  // Header search filters your history by merchant or category.
  const q = query.trim().toLowerCase();
  const filteredTxns = q ? txns.filter((t) => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)) : txns;

  // Gate the dashboard behind sign-in. Wait for the stored session to load to
  // avoid flashing the login screen for an already-signed-in user.
  if (!authReady) return <div className="min-h-dvh bg-[var(--background)]" />;
  if (!user) return <AuthScreen />;

  return (
    <div className="flex min-h-full flex-1 lg:h-dvh lg:min-h-0 lg:flex-none lg:overflow-hidden">
      {/* ───────── Sidebar (desktop) ───────── */}
      <aside className="sticky top-0 hidden h-screen w-[18rem] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] px-4 py-6 lg:flex">
        <div className="flex items-start justify-between gap-2 border-b border-[var(--border)] px-2 pb-5">
          <Link href="/" className="flex flex-col items-start gap-1" aria-label="Orbit home">
            <OrbitLogo className="h-7" />
            <div className="text-[12px] leading-none text-[var(--muted)]">self-driving savings</div>
          </Link>
          <span className="mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--background)] px-2 py-1 text-[11px] font-medium text-[var(--muted)]">
            <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-[var(--accent)]" : online === false ? "bg-red-500" : "bg-[var(--faint)]"}`} aria-hidden />
            {online === null ? "…" : online ? "Devnet · live" : "offline"}
          </span>
        </div>

        <nav className="mt-8 flex-1 space-y-1">
          <div className="px-3 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--faint)]">Menu</div>
          {NAV.map((t) => {
            const on = navId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => selectNav(t)}
                className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${
                  on
                    ? "bg-[var(--background)] font-medium text-[var(--foreground)] shadow-[0_1px_2px_rgba(2,6,23,0.06)]"
                    : "text-[var(--muted)] hover:bg-[var(--background)]/60 hover:text-[var(--foreground)]"
                }`}
              >
                {on && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[var(--accent)]" aria-hidden />}
                <t.icon className={`h-[18px] w-[18px] ${on ? "text-[var(--accent-strong)]" : ""}`} aria-hidden />
                {t.label}
              </button>
            );
          })}

        </nav>

        {/* Secondary nav pinned to the bottom */}
        <div className="space-y-1 border-t border-[var(--border)] pt-4">
          {NAV_SECONDARY.map((t) => {
            const on = navId === t.id;
            const cls = `relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${
              on
                ? "bg-[var(--background)] font-medium text-[var(--foreground)] shadow-[0_1px_2px_rgba(2,6,23,0.06)]"
                : "text-[var(--muted)] hover:bg-[var(--background)]/60 hover:text-[var(--foreground)]"
            }`;
            return t.href ? (
              <a key={t.id} href={t.href} className={cls}>
                <t.icon className="h-[18px] w-[18px]" aria-hidden /> {t.label}
              </a>
            ) : (
              <button key={t.id} type="button" onClick={() => selectNav(t)} className={cls}>
                {on && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[var(--accent)]" aria-hidden />}
                <t.icon className={`h-[18px] w-[18px] ${on ? "text-[var(--accent-strong)]" : ""}`} aria-hidden /> {t.label}
              </button>
            );
          })}
        </div>
      </aside>

      {/* ───────── Main ───────── */}
      <div className="flex min-w-0 flex-1 flex-col pb-20 lg:min-h-0 lg:overflow-hidden lg:pb-0">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[var(--background)]/80 px-5 backdrop-blur-md lg:px-8">
          <div className="flex shrink-0 items-center gap-2.5">
            <Link href="/" className="flex items-center lg:hidden" aria-label="Orbit home">
              <OrbitLogo mark className="h-7" />
            </Link>
            <div>
              <h1 className="font-display text-lg font-semibold leading-none tracking-tight">{activeNav.label}</h1>
              <p className="mt-1 hidden text-[14px] leading-none text-[var(--muted)] sm:block">{activeNav.hint}</p>
            </div>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            {/* Search (Finora parity) — sits beside the actions */}
            <div className="hidden w-56 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[var(--muted)] transition-colors focus-within:border-[var(--border-strong)] md:flex lg:w-72">
              <Search className="h-4 w-4 shrink-0 text-[var(--faint)]" aria-hidden />
              <input
                type="text"
                placeholder="Search transactions…"
                aria-label="Search transactions"
                value={query}
                onChange={(e) => {
                  const v = e.target.value;
                  setQuery(v);
                  // Typing sends you to your history, filtered live.
                  if (v.trim() && tab !== "activity") selectNav({ id: "transactions", tab: "activity" } as NavItem);
                }}
                className="w-full min-w-0 bg-transparent text-[14px] text-[var(--foreground)] placeholder:text-[var(--faint)] focus:outline-none"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="text-[var(--faint)] transition-colors hover:text-[var(--foreground)]">
                  <X className="h-4 w-4" aria-hidden />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={invite}
              className="hidden items-center gap-1.5 rounded-full border border-[var(--border-strong)] px-3.5 py-2 text-[13px] font-medium transition-colors hover:bg-[var(--surface)] sm:inline-flex"
            >
              {invited ? <Check className="h-4 w-4 text-[var(--accent-strong)]" aria-hidden /> : <Gift className="h-4 w-4" aria-hidden />}
              {invited ? "Link copied" : "Invite & Earn"}
            </button>
            <UserMenu />
          </div>
        </header>

        <main className="w-full flex-1 px-5 py-6 lg:min-h-0 lg:overflow-y-auto lg:px-8 lg:py-6">
          {/* ═══════════ HOME ═══════════ */}
          {tab === "home" && (
            <div className="lg:grid lg:h-full lg:grid-cols-[0.85fr_1.15fr] lg:gap-10">
              {/* LEFT — balance, stats, recent activity */}
              <div className="flex flex-col">
                {/* Balance — the one moment of emphasis */}
                <section>
                  <div className="flex items-center gap-1.5">
                    <span className="font-display text-[16px] font-bold">Total saved</span>
                    <InfoDot label="Everything you've set aside plus the yield it's earning on-chain." />
                  </div>
                  <div
                    className={`mt-2 font-mono text-[clamp(2.25rem,5vw,3.25rem)] font-semibold leading-none tabular-nums transition-colors duration-700 ${
                      flash ? "text-[var(--primary)]" : "text-[var(--foreground)]"
                    }`}
                  >
                    {usd(total)}
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-[14px]">
                    <TrendingUp className="h-4 w-4 text-[var(--primary-strong)]" aria-hidden />
                    <span className="font-mono font-medium text-[var(--primary-strong)]">{liveYield > 0 ? "+" : ""}{fmtYield(liveYield)}</span>
                    <span className="text-[var(--muted)]">earned · 6% a year</span>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2.5">
                    <button type="button" onClick={() => setTab("grow")} className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-[14px] font-semibold text-[var(--primary-fg)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40">
                      <ArrowDownToLine className="h-4 w-4" aria-hidden /> Add money
                    </button>
                    <button type="button" onClick={() => setTab("grow")} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-strong)] px-4 py-2.5 text-[14px] font-medium text-[var(--secondary-fg)] transition-colors hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30">
                      <ArrowUpFromLine className="h-4 w-4" aria-hidden /> Withdraw to bank
                    </button>
                  </div>
                </section>

                {/* In vault | Set aside */}
                <div className="mt-6 grid grid-cols-2 gap-6 border-t border-[var(--line)] pt-6">
                  <div>
                    <div className="flex items-center gap-1.5 font-display text-[16px] font-bold">
                      <Coins className="h-4 w-4" aria-hidden /> In vault
                      <InfoDot label="Invested on-chain and earning yield. Only you can withdraw it." />
                    </div>
                    <div className="mt-1.5 font-mono text-2xl font-semibold tabular-nums text-[var(--primary-strong)]">{usd(principalUsd)}</div>
                  </div>
                  <div className="border-l border-[var(--line)] pl-6">
                    <div className="flex items-center gap-1.5 font-display text-[16px] font-bold">
                      <Landmark className="h-4 w-4" aria-hidden /> Set aside
                      <InfoDot label={`Waiting in your bank. It moves to your vault once it reaches ${usd(THRESHOLD)}.`} />
                    </div>
                    <div className="mt-1.5 font-mono text-2xl font-semibold tabular-nums">{usd(state.pendingUsd)}</div>
                    <div className="mt-2 h-1.5 w-full max-w-[10rem] overflow-hidden rounded-full bg-[var(--border)]">
                      <div className={`h-full rounded-full transition-[width] duration-300 ${state.pendingUsd >= THRESHOLD ? "bg-[var(--primary)]" : "bg-[var(--disabled)]"}`} style={{ width: `${pct}%` }} />
                    </div>
                    {state.pendingUsd >= THRESHOLD && connected && investing && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[var(--primary-strong)]"><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Investing…</div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex min-h-0 flex-1 flex-col border-t border-[var(--line)] pt-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-[16px] font-bold">Recent transactions</h2>
                    {txns.length > 0 && (
                      <button type="button" onClick={() => setTab("activity")} className="inline-flex items-center gap-1 text-[13px] text-[var(--muted)] transition-colors hover:text-[var(--foreground)]">
                        See all <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    )}
                  </div>
                  {txns.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
                      <ShoppingBag className="h-6 w-6 text-[var(--muted)]" aria-hidden />
                      <p className="mt-2 text-[15px] text-[var(--muted)]">No transactions yet</p>
                      <p className="mt-0.5 text-[13px] text-[var(--faint)]">Simulate a purchase in Budget to see it here.</p>
                    </div>
                  ) : (
                    <ul className="mt-1 min-h-0 flex-1 divide-y divide-[var(--border)] overflow-y-auto">
                      {txns.slice(0, 10).map((t) => {
                        const Icon = txnIcon(t);
                        return (
                          <li key={t.id} className="flex items-center gap-3.5 py-3">
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--surface)] text-[var(--muted)]">
                              <Icon className="h-[18px] w-[18px]" aria-hidden />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[15px] font-medium">{t.name}</div>
                              <div className="text-[12px] text-[var(--muted)]">{t.category} · {txnDate(t.ts)}</div>
                            </div>
                            <div className="shrink-0 text-right">
                              <div className="font-mono text-[15px] tabular-nums text-[var(--foreground)]">{usd(t.amountUsd)}</div>
                              {t.setAside > 0 ? (
                                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--primary-strong)]">
                                  {t.deposited ? <Zap className="h-3 w-3" aria-hidden /> : <Coins className="h-3 w-3" aria-hidden />}
                                  +{usd(t.setAside)} {t.deposited ? "invested" : "saved"}
                                </div>
                              ) : (
                                <div className="mt-1 text-[11px] text-[var(--faint)]">not saved</div>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>

              {/* RIGHT — growth chart + savings health */}
              <div className="mt-6 flex min-h-0 flex-col border-t border-[var(--line)] pt-6 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
                <div className="shrink-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-display text-[16px] font-bold">Savings over time</h2>
                    <InfoDot label={analytics.hasData ? "Your set-aside balance building up over time." : "Sample data. Your real curve appears once you start saving."} />
                  </div>
                  <div className="mt-3 h-[280px] lg:h-[360px]">
                    <LineArea
                      fill
                      series={[{ label: "Saved", points: analytics.hasData ? analytics.savingsLine : SAMPLE_LINE }]}
                      xLabels={analytics.hasData ? analytics.savingsLabels : SAMPLE_LINE_LABELS}
                      fmtY={(v) => `$${v >= 1000 ? `${Math.round(v / 1000)}k` : Math.round(v)}`}
                    />
                  </div>
                </div>

                {/* Savings health */}
                <div className="mt-6 border-t border-[var(--line)] pt-6">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-center gap-1.5 font-display text-[16px] font-bold">
                      Savings health
                      <InfoDot label="Three steps to fully automatic saving: open a vault, connect a bank, start saving." />
                    </div>
                    <span className="text-[13px] font-medium text-[var(--muted)]">
                      {healthSteps.filter((s) => s.done).length === 3 ? "All set" : `${healthSteps.filter((s) => s.done).length} of 3`}
                    </span>
                  </div>
                  {/* progress: fill one segment per completed step, left to right */}
                  <div className="mt-3 flex gap-1.5" aria-hidden>
                    {healthSteps.map((_, i) => (
                      <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${i < healthSteps.filter((s) => s.done).length ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`} />
                    ))}
                  </div>
                  {/* the three steps as a clean checklist */}
                  <div className="mt-4 space-y-0.5">
                    {healthSteps.map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => setTab(s.go)}
                        className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-[var(--surface)]"
                      >
                        <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full transition-colors ${s.done ? "bg-[var(--primary)] text-[var(--primary-fg)]" : "border-2 border-[var(--border-strong)]"}`}>
                          {s.done && <Check className="h-3.5 w-3.5" aria-hidden />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-[14px] font-medium ${s.done ? "text-[var(--muted)] line-through" : ""}`}>{s.label}</span>
                          <span className="block text-[12px] text-[var(--muted)]">{s.desc}</span>
                        </span>
                        {!s.done && <ChevronRight className="h-4 w-4 shrink-0 text-[var(--faint)]" aria-hidden />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ SAVE ═══════════ */}
          {tab === "save" && (
            <div className="lg:grid lg:grid-cols-2 lg:gap-10">
              {/* LEFT — the rule + your bank */}
              <div className="flex flex-col">
                {/* Set-aside rate (the rule) */}
                <section>
                  <div className="flex items-center gap-1.5 font-display text-[16px] font-bold">
                    Set-aside rate
                    <InfoDot label="Orbit sets aside this share of every purchase. Pick anywhere from 0.5% to 5%." />
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-4">
                    <div className="font-mono text-[clamp(2.5rem,6vw,3.5rem)] font-semibold leading-none tabular-nums text-[var(--primary-strong)]">{rate.toFixed(1)}%</div>
                    <div className="text-right text-[13px] text-[var(--muted)]">
                      On a <span className="font-mono text-[var(--foreground)]">$50</span> purchase<br />
                      you&apos;d save <span className="font-mono font-medium text-[var(--primary-strong)]">{usd((50 * rate) / 100)}</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={MIN_PCT}
                    max={MAX_PCT}
                    step={0.1}
                    value={rate}
                    onChange={(e) => changeRate(Number(e.target.value))}
                    aria-label="Set-aside rate"
                    className="mt-5 w-full accent-[var(--primary)]"
                  />
                  <div className="mt-1 flex justify-between font-mono text-[12px] text-[var(--faint)]">
                    <span>{MIN_PCT}%</span>
                    <span>{MAX_PCT}%</span>
                  </div>
                  <div className="mt-5 flex items-center justify-between text-[14px]">
                    <span className="flex items-center gap-1.5 text-[var(--muted)]">
                      Moves to vault at
                      <InfoDot label="Set-asides wait in your bank and batch up. Once they reach this amount, they convert to USDC and move into your vault." />
                    </span>
                    <span className="font-mono font-medium">{usd(THRESHOLD)}</span>
                  </div>
                </section>

                {/* Your bank */}
                <div className="mt-6 border-t border-[var(--line)] pt-6">
                  <div className="font-display text-[16px] font-bold">Your bank</div>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--surface)] text-[var(--muted)]"><Landmark className="h-5 w-5" aria-hidden /></span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-medium">{plaid?.connected ? "First Platypus Bank" : "No bank connected"}</div>
                      <div className="text-[13px] text-[var(--muted)]">{plaid?.connected ? "Plaid sandbox · detection only" : "Connect to detect spending"}</div>
                    </div>
                    {plaid?.connected && <span className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--primary-strong)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" aria-hidden /> Connected</span>}
                  </div>
                  {plaid && !plaid.configured && (
                    <p className="mt-3 text-[13px] text-[var(--muted)]">Set <code className="font-mono text-[12px]">PLAID_CLIENT_ID</code> and <code className="font-mono text-[12px]">PLAID_SECRET</code> in the server to detect real spending.</p>
                  )}
                  {plaid?.configured && !plaid.connected && (
                    <button type="button" onClick={connectBank} disabled={busy} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] text-[14px] font-medium transition-colors hover:bg-[var(--surface)] disabled:pointer-events-none disabled:opacity-50">
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Landmark className="h-4 w-4" aria-hidden />} Connect a test bank
                    </button>
                  )}
                  {plaid?.connected && (
                    <button type="button" onClick={syncSpending} disabled={syncing} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] text-[14px] font-semibold text-[var(--primary-fg)] transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-60">
                      <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} aria-hidden /> {syncing ? "Pulling transactions…" : "Sync spending"}
                    </button>
                  )}
                </div>
              </div>

              {/* RIGHT — try it + automation */}
              <div className="mt-6 border-t border-[var(--line)] pt-6 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
                <div>
                  <div className="font-display text-[16px] font-bold">Try it</div>
                  <p className="mt-1 text-[14px] text-[var(--muted)]">Simulate a purchase and watch a slice get set aside.</p>
                  {!connected && (
                    <p className="mt-3 rounded-lg bg-[var(--primary-soft)] px-3 py-2 text-[13px] text-[var(--primary-strong)]">Open your vault in Wallet first, that&apos;s where set-asides land.</p>
                  )}
                  <div className="mt-4 flex gap-2">
                    {[45, 120, 600].map((v) => (
                      <button key={v} type="button" onClick={() => spend(v)} disabled={busy || !online || !connected} className="h-11 flex-1 rounded-xl border border-[var(--border-strong)] text-[14px] font-medium tabular-nums transition-colors hover:bg-[var(--surface)] disabled:pointer-events-none disabled:opacity-40">${v}</button>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <label htmlFor="amount" className="sr-only">Purchase amount</label>
                    <input id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="Custom amount" className="h-11 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 text-[14px] tabular-nums text-[var(--foreground)] placeholder:text-[var(--faint)] focus:border-[var(--border-strong)] focus:outline-none" />
                    <button type="button" onClick={() => spend(Number(amount))} disabled={busy || !online || !connected} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-[14px] font-semibold text-[var(--primary-fg)] transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40">{busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null} Spend</button>
                  </div>
                </div>

                <div className="mt-6 border-t border-[var(--line)] pt-6">
                  <div className="font-display text-[16px] font-bold">Automation</div>
                  <div className="mt-2 divide-y divide-[var(--border)]">
                    <div className="flex items-center justify-between gap-4 py-4">
                      <div className="pr-2">
                        <div className="flex items-center gap-1.5 text-[15px] font-medium">Auto-invest at threshold <InfoDot label={`When your set-aside reaches ${usd(THRESHOLD)}, Orbit moves it into your vault on its own.`} /></div>
                        <div className="mt-0.5 text-[13px] text-[var(--muted)]">Moves money into your vault without you lifting a finger.</div>
                      </div>
                      <Toggle on={autoInvest} onClick={() => setAutoInvest((v) => !v)} label="Auto-invest" />
                    </div>
                    <div className="flex items-center justify-between gap-4 py-4">
                      <div className="pr-2">
                        <div className="text-[15px] font-medium">Pause saving</div>
                        <div className="mt-0.5 text-[13px] text-[var(--muted)]">Keep watching your spending, but stop setting money aside for now.</div>
                      </div>
                      <Toggle on={paused} onClick={() => setPaused((v) => !v)} label="Pause" />
                    </div>
                  </div>
                  <p className="mt-4 text-[12px] text-[var(--faint)]">Auto-invest and pause are a demo preview; the set-aside rate is live and used for every purchase.</p>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ GROW ═══════════ */}
          {tab === "grow" && (
            <div className="lg:grid lg:grid-cols-2 lg:gap-10">
              {/* LEFT — the vault + how it earns */}
              <div className="flex flex-col">
                {/* Earning + where it's invested */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 font-display text-[16px] font-bold">
                        Earning
                        <InfoDot label="The yearly rate your vault earns, paid in real tokens on-chain. Rates move with the market." />
                      </div>
                      <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="font-mono text-4xl font-semibold text-[var(--primary-strong)]">{selectedVenue.apy.toFixed(1)}%</span>
                        <span className="text-[14px] text-[var(--muted)]">APY</span>
                      </div>
                    </div>
                    {/* Mobile: pick venue from a dropdown */}
                    <div className="relative lg:hidden">
                      <button
                        type="button"
                        onClick={() => setVenueOpen((o) => !o)}
                        aria-expanded={venueOpen}
                        className="flex items-center gap-2 rounded-xl border border-[var(--border-strong)] px-3 py-2 transition-colors hover:bg-[var(--surface)]"
                      >
                        <VenueMark venue={selectedVenue} className="h-6 w-6" />
                        <span className="max-w-[7rem] truncate text-[14px] font-medium">{selectedVenue.name}</span>
                        <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--muted)] transition-transform ${venueOpen ? "rotate-180" : ""}`} aria-hidden />
                      </button>
                      {venueOpen && (
                        <>
                          <button type="button" aria-hidden tabIndex={-1} className="fixed inset-0 z-10 cursor-default" onClick={() => setVenueOpen(false)} />
                          <div className="absolute right-0 z-20 mt-2 w-[min(20rem,calc(100vw-3rem))] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[0_16px_44px_-14px_rgba(2,6,23,0.4)]">
                            {venues.map((v) => {
                              const on = v.id === venueId;
                              return (
                                <button key={v.id} type="button" onClick={() => selectVenue(v.id)} className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors ${on ? "bg-[var(--primary-soft)]" : "hover:bg-[var(--background)]"}`}>
                                  <VenueMark venue={v} className="h-8 w-8" />
                                  <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-1.5">
                                      <span className="truncate text-[15px] font-medium">{v.name}</span>
                                      {v.live ? <span className="rounded-full bg-[var(--primary-soft)] px-1.5 py-0.5 text-[9px] font-medium text-[var(--primary-strong)]">Live</span> : <span className="rounded-full bg-[var(--background)] px-1.5 py-0.5 text-[9px] text-[var(--muted)]">Mainnet</span>}
                                    </span>
                                    <span className="block truncate text-[12px] text-[var(--muted)]">{v.apy.toFixed(1)}% APY · {v.tvl}</span>
                                  </span>
                                  {on && <Check className="h-4 w-4 shrink-0 text-[var(--primary-strong)]" aria-hidden />}
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
                      <span key={c.l} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary-soft)] px-3 py-1.5 text-[12px] font-medium text-[var(--primary-strong)]">
                        <c.icon className="h-3.5 w-3.5" aria-hidden /> {c.l}
                      </span>
                    ))}
                  </div>

                  {/* Desktop: pick venue from a list */}
                  <div className="mt-6 hidden lg:block">
                    <div className="mb-1 text-[13px] font-medium text-[var(--muted)]">Where your USDC earns</div>
                    <div className="divide-y divide-[var(--border)]">
                      {venues.map((v) => {
                        const on = v.id === venueId;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => selectVenue(v.id)}
                            className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-[var(--surface)]"
                          >
                            <VenueMark venue={v} className="h-9 w-9" />
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-1.5">
                                <span className="truncate text-[15px] font-medium">{v.name}</span>
                                {v.live ? (
                                  <span className="rounded-full bg-[var(--primary-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--primary-strong)]">Live</span>
                                ) : (
                                  <span className="rounded-full bg-[var(--surface)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]">Mainnet</span>
                                )}
                              </span>
                              <span className="block truncate text-[12px] text-[var(--muted)]">{v.tvl} TVL</span>
                            </span>
                            <span className="shrink-0 text-right">
                              <span className="block font-mono text-[15px] font-semibold tabular-nums text-[var(--primary-strong)]">{v.apy.toFixed(1)}%</span>
                              <span className="block text-[11px] text-[var(--faint)]">APY</span>
                            </span>
                            <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${on ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-fg)]" : "border-[var(--border-strong)]"}`}>
                              {on && <Check className="h-3 w-3" aria-hidden />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-5">
                    {connected && onchain ? (
                      <a href={solAcct(onchain.vaultAccount)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--primary-strong)] hover:underline">
                        View your vault on Solscan <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      </a>
                    ) : (
                      <p className="text-[12px] text-[var(--faint)]">Open your vault to see it live on Solana.</p>
                    )}
                  </div>
                </div>

                {/* The vault */}
                <div className="mt-6 border-t border-[var(--line)] pt-6 [&>section]:mt-0">
                  <WalletVault onChanged={refreshVault} />
                </div>
              </div>

              {/* RIGHT — savings pots + projection */}
              <div className="mt-6 border-t border-[var(--line)] pt-6 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
                <SavingsGoals saved={principalUsd} apy={selectedVenue.apy / 100} />

                <div className="mt-6 border-t border-[var(--line)] pt-6">
                  <div className="flex items-center gap-1.5 font-display text-[16px] font-bold">
                    If you saved
                    <InfoDot label="A rough projection of what a one-time amount could grow to at this rate, compounded yearly. Not a guarantee." />
                  </div>
                  <div className="mt-3 flex items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3">
                    <span className="text-[var(--muted)]">$</span>
                    <input id="proj" value={projAmt} onChange={(e) => setProjAmt(e.target.value)} inputMode="decimal" className="h-11 w-full min-w-0 bg-transparent px-1.5 font-mono text-[16px] tabular-nums focus:outline-none" />
                  </div>
                  <label htmlFor="years" className="mt-4 block text-[15px] text-[var(--muted)]">for <span className="font-mono text-[var(--foreground)]">{projYears} {projYears === 1 ? "year" : "years"}</span></label>
                  <input id="years" type="range" min={1} max={30} value={projYears} onChange={(e) => setProjYears(Number(e.target.value))} className="mt-3 w-full accent-[var(--primary)]" />
                  <div className="mt-5">
                    <div className="text-[14px] text-[var(--muted)]">Could become</div>
                    <div className="mt-1 font-mono text-[clamp(2.25rem,8vw,3rem)] font-semibold leading-none tabular-nums text-[var(--primary-strong)]">${projected.toLocaleString("en-US", { maximumFractionDigits: 0 })}</div>
                    <div className="mt-2 text-[15px] text-[var(--muted)]">+${(projected - (Number(projAmt) || 0)).toLocaleString("en-US", { maximumFractionDigits: 0 })} earned at {selectedVenue.apy.toFixed(1)}% APY</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ ACTIVITY ═══════════ */}
          {tab === "activity" && (
            <div>
              {/* Transactions */}
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-[16px] font-bold">{q ? `Results for “${query}”` : "Transactions"}</h2>
                <button type="button" onClick={reset} className="inline-flex items-center gap-1 rounded text-[13px] text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"><RotateCcw className="h-3.5 w-3.5" aria-hidden /> reset</button>
              </div>
              {q && <p className="mt-1 text-[13px] text-[var(--muted)]">{filteredTxns.length} {filteredTxns.length === 1 ? "match" : "matches"}</p>}

              {filteredTxns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <ShoppingBag className="h-6 w-6 text-[var(--muted)]" aria-hidden />
                  <p className="mt-2 text-[15px] text-[var(--muted)]">{q ? `No transactions match “${query}”` : "No transactions yet"}</p>
                  <p className="mt-0.5 text-[13px] text-[var(--faint)]">{q ? "Try a merchant or category." : "Simulate a purchase or sync a bank in Budget."}</p>
                </div>
              ) : (
                <ul className="mt-3 divide-y divide-[var(--border)]">
                  {filteredTxns.map((t) => {
                    const Icon = txnIcon(t);
                    return (
                      <li key={t.id} className="flex items-center gap-3.5 py-3.5">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--surface)] text-[var(--muted)]">
                          <Icon className="h-[18px] w-[18px]" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[15px] font-medium">{t.name}</div>
                          <div className="text-[12px] text-[var(--muted)]">{t.category} · {txnDate(t.ts)}</div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="font-mono text-[15px] tabular-nums text-[var(--foreground)]">{usd(t.amountUsd)}</div>
                          {t.setAside > 0 ? (
                            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--primary-strong)]">
                              {t.deposited ? <Zap className="h-3 w-3" aria-hidden /> : <Coins className="h-3 w-3" aria-hidden />}
                              +{usd(t.setAside)} {t.deposited ? "invested" : "saved"}
                            </div>
                          ) : (
                            <div className="mt-1 text-[11px] text-[var(--faint)]">not saved</div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* App activity (goals, deposits, withdrawals…) — hidden while searching transactions */}
              {!q && (
                <div className="mt-8 border-t border-[var(--line)] pt-6">
                  <ActivityFeed />
                </div>
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
                      <div className="truncate text-[14px] text-[var(--muted)]">{user.email}</div>
                    </div>
                    <button
                      type="button"
                      onClick={signOut}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--border-strong)] px-3.5 py-2 text-[14px] font-medium transition-colors hover:bg-[var(--background)]"
                    >
                      <LogOut className="h-3.5 w-3.5" aria-hidden /> Sign out
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    <p className="text-[14px] text-[var(--muted)]">Sign in to sync your savings across devices.</p>
                    <button
                      type="button"
                      onClick={signInWithGoogle}
                      className="inline-flex items-center gap-2 rounded-full bg-[var(--contrast)] px-4 py-2.5 text-[14px] font-semibold text-[var(--contrast-fg)] transition-opacity hover:opacity-90"
                    >
                      <LogIn className="h-4 w-4" aria-hidden /> Sign in with Google
                    </button>
                  </div>
                )}
              </section>

              <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                <section className={`${PANEL} p-6`}>
                  <SectionLabel>Wallet</SectionLabel>
                  <div className="mt-4 flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--background)] ring-1 ring-inset ring-[var(--border)]"><Wallet className="h-5 w-5 text-[var(--foreground)]" aria-hidden /></span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{connected ? "Orbit account" : "No wallet connected"}</div>
                      <div className="mt-0.5 truncate font-mono text-[14px] text-[var(--muted)]">{owner ?? "Open one in Grow"}</div>
                    </div>
                    {connected && <span className="h-2 w-2 rounded-full bg-[var(--accent)]" aria-hidden />}
                  </div>
                  <button type="button" onClick={() => setTab("grow")} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] text-sm font-medium transition-colors hover:bg-[var(--background)]">{connected ? "Manage in Grow" : "Open or connect a wallet"}</button>
                </section>
                <section className={`${PANEL} flex items-center justify-between gap-4 p-5`}>
                  <div><div className="text-sm font-medium">Reset demo data</div><div className="mt-0.5 text-[14px] text-[var(--muted)]">Clears set-asides and activity. Your on-chain vault is untouched.</div></div>
                  <button type="button" onClick={reset} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--border-strong)] px-3.5 py-2 text-[14px] font-medium transition-colors hover:bg-[var(--background)]"><RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset</button>
                </section>
                </div>

                <section className={`${PANEL} divide-y divide-[var(--border)]`}>
                  <div className="flex items-center justify-between gap-4 p-5">
                    <div><div className="text-sm font-medium">Appearance</div><div className="mt-0.5 text-[14px] text-[var(--muted)]">Light or dark theme</div></div>
                    <ThemeToggle />
                  </div>
                  <div className="flex items-center justify-between gap-4 p-5">
                    <div><div className="text-sm font-medium">Network</div><div className="mt-0.5 text-[14px] text-[var(--muted)]">Solana devnet</div></div>
                    <ExplorerLink href={solAcct(onchain?.programId ?? "8LEjyrMCKukhxA4q3DRaYGfkappxRayiTPM7saZG2Kgi")}>Program</ExplorerLink>
                  </div>
                  <div className="flex items-center justify-between gap-4 p-5">
                    <div><div className="text-sm font-medium">Backend</div><div className="mt-0.5 text-[14px] text-[var(--muted)]">Detection &amp; deposit service</div></div>
                    <span className="inline-flex items-center gap-1.5 text-[14px] text-[var(--muted)]"><span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-[var(--accent)]" : online === false ? "bg-red-500" : "bg-[var(--faint)]"}`} aria-hidden />{online === null ? "…" : online ? "Connected" : "Offline"}</span>
                  </div>
                </section>
              </div>

              <p className="text-[12px] leading-5 text-[var(--faint)]">Live on Solana devnet. Detection, threshold, and the vault deposit are real; the fiat→USDC step (Stripe) is mocked. Not a bank. Not FDIC-insured — principal is not guaranteed.</p>
            </div>
          )}
        </main>
      </div>

      {/* ───────── Mobile bottom nav ───────── */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-md lg:hidden">
        {MOBILE_NAV.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => selectNav(t)}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[12px] transition-colors ${navId === t.id ? "text-[var(--accent-strong)]" : "text-[var(--muted)]"}`}
          >
            <t.icon className="h-5 w-5" aria-hidden />
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
