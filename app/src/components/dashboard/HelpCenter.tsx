"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Rocket,
  Compass,
  LayoutDashboard,
  Percent,
  Landmark,
  ShieldCheck,
  Target,
  TrendingUp,
  KeyRound,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Clock,
  Check,
  Search,
  BookOpen,
  type LucideIcon,
} from "lucide-react";

type Block =
  | { t: "p"; text: string }
  | { t: "h"; text: string }
  | { t: "ul"; items: string[] }
  | { t: "steps"; items: string[] }
  | { t: "note"; text: string };

type Category = "Basics" | "Saving" | "Vault" | "Goals" | "Growing" | "Security";

type Article = {
  id: string;
  category: Category;
  icon: LucideIcon;
  title: string;
  excerpt: string;
  read: string;
  body: Block[];
};

// Editorial cover palette — one gradient per category, all in the brand's
// black → green family so the covers stay cohesive with the rest of the app.
const COVER: Record<Category, [string, string]> = {
  Basics: ["#0a0a0a", "#2f6e4a"], // black → brand green
  Saving: ["#244f36", "#3f6b50"], // deep green → sage
  Vault: ["#15803d", "#2f6e4a"], // success green → brand green
  Goals: ["#3f6212", "#2f6e4a"], // olive green → brand green
  Growing: ["#2f6e4a", "#15803d"], // brand green → success green
  Security: ["#171717", "#244f36"], // charcoal → deep green
};

// One short blurb per category for the browse view.
const CATEGORY_BLURB: Record<Category, string> = {
  Basics: "Open your account and find your way around.",
  Saving: "How set-asides work and how your bank connects.",
  Vault: "Where your savings live and how to withdraw.",
  Goals: "Split your vault into named pots.",
  Growing: "How your USDC earns on-chain yield.",
  Security: "Self-custody habits and verifying on-chain.",
};

// Ordered as a learning path: each guide builds on the one before it.
const ARTICLES: Article[] = [
  {
    id: "getting-started",
    category: "Basics",
    icon: Rocket,
    title: "Getting started with Orbit",
    excerpt: "What Orbit does, and how to open your account in under a minute.",
    read: "2 min",
    body: [
      { t: "p", text: "Orbit is a self-driving savings app. It watches your everyday spending, sets aside a small slice of each purchase, and grows that money as USDC in an on-chain vault you fully own." },
      { t: "h", text: "The one-minute setup" },
      { t: "steps", items: [
        "Open or connect a wallet from the Wallet tab. The built-in wallet takes one tap, or connect Phantom or Solflare.",
        "Connect your bank in Budget so Orbit can detect spending. This link is read-only.",
        "Pick your set-aside rate. The default is 2% of every purchase.",
      ] },
      { t: "p", text: "That's it. From here Orbit runs on its own, earmarking a little from each purchase and moving it to your vault when you cross your threshold." },
      { t: "note", text: "Nothing leaves your bank until you cross your threshold. Before that, a set-aside is just a number." },
    ],
  },
  {
    id: "navigation",
    category: "Basics",
    icon: Compass,
    title: "Finding your way around",
    excerpt: "A quick tour of every tab and what it's for.",
    read: "2 min",
    body: [
      { t: "h", text: "The main tabs" },
      { t: "ul", items: [
        "Dashboard: your money at a glance, recent transactions, and savings health.",
        "Activity: every transaction and event, filterable by type, with search.",
        "Wallet: your vault balance, withdraw and invest controls, and yield venues.",
        "Budget: connect your bank and set your set-aside rate.",
        "Savings Goals: split your vault into named pots.",
      ] },
      { t: "h", text: "Settings, Security, and Help" },
      { t: "p", text: "Down in the sidebar, Settings holds your profile and app preferences, Security explains what protects your money and gives you the controls, and Help is where you are now." },
      { t: "note", text: "Your last tab is remembered, so a refresh drops you right back where you were." },
    ],
  },
  {
    id: "dashboard",
    category: "Basics",
    icon: LayoutDashboard,
    title: "Reading your dashboard",
    excerpt: "Make sense of your balance, savings health, and recent activity.",
    read: "2 min",
    body: [
      { t: "p", text: "The Dashboard is your money at a glance. The top shows your total saved and how it's growing; below sit your savings health and recent transactions." },
      { t: "h", text: "Savings health" },
      { t: "p", text: "This is a quick read on how well your setup is working: whether a bank is connected, whether a rate is set, and whether money is reaching your vault. A full bar means Orbit is running smoothly." },
      { t: "h", text: "Recent transactions" },
      { t: "p", text: "Every purchase Orbit sees, with the slice it set aside. Tap through to Activity for the full, filterable history." },
    ],
  },
  {
    id: "set-aside",
    category: "Saving",
    icon: Percent,
    title: "How your set-aside works",
    excerpt: "The percentage rule behind every purchase, and how to choose your rate.",
    read: "3 min",
    body: [
      { t: "p", text: "Every time you spend, Orbit earmarks a percentage of that purchase to save. Spend $40 on groceries at a 2% rate and Orbit sets aside $0.80." },
      { t: "h", text: "Choosing your rate" },
      { t: "p", text: "In Budget you can pick a fixed rate between 0.5% and 5%. A higher rate saves faster but takes a bigger bite from each purchase. 2% is a comfortable default for most people." },
      { t: "h", text: "When the money actually moves" },
      { t: "p", text: "Set-asides pile up as a pending number. Once they reach your threshold, Orbit pulls the total from your bank in one transfer, converts it to USDC, and deposits it into your vault. Fewer, larger transfers keep things clean." },
      { t: "note", text: "Change your rate anytime. It only affects future purchases, never money already saved." },
    ],
  },
  {
    id: "connect-bank",
    category: "Saving",
    icon: Landmark,
    title: "Connecting your bank safely",
    excerpt: "How the Plaid link works, why it's read-only, and how to disconnect.",
    read: "2 min",
    body: [
      { t: "p", text: "Orbit connects to your bank through Plaid, the same service used by most major finance apps. The connection exists for one reason: to notice when you spend." },
      { t: "h", text: "What Orbit can and can't do" },
      { t: "ul", items: [
        "Can: see transactions so it knows when to set money aside.",
        "Can't: move, hold, or withdraw money from your bank.",
        "Can't: see or store your bank password. Plaid handles the login.",
      ] },
      { t: "h", text: "Disconnecting" },
      { t: "p", text: "Open Budget and use Disconnect on your bank card, or go to Security. Revoking access stops detection immediately and never affects money already in your vault." },
    ],
  },
  {
    id: "vault",
    category: "Vault",
    icon: ShieldCheck,
    title: "Your vault, and withdrawing anytime",
    excerpt: "Where your savings live, why it's non-custodial, and how to take money out.",
    read: "3 min",
    body: [
      { t: "p", text: "Your savings live in an on-chain vault, a Solana program account tied to your wallet. It's often called the chamber. You own it, and its balance is public and verifiable at any time." },
      { t: "h", text: "Non-custodial means yours" },
      { t: "p", text: "Orbit never holds your keys and can't spend your funds. Only your wallet can approve a withdrawal. A company going away does not put your money at risk." },
      { t: "h", text: "Taking money out" },
      { t: "steps", items: [
        "Go to the Wallet tab.",
        "Choose Withdraw and enter an amount, or withdraw everything.",
        "Approve the transaction in your wallet. Funds land back in your wallet in seconds.",
      ] },
      { t: "note", text: "No lockups, no waiting periods. You can withdraw your full balance whenever you like." },
    ],
  },
  {
    id: "goals",
    category: "Goals",
    icon: Target,
    title: "Creating and funding savings goals",
    excerpt: "Split your vault into pots like Travel or a Rainy day fund.",
    read: "2 min",
    body: [
      { t: "p", text: "Goals let you earmark parts of your vault for specific things without moving money out. A goal is a label on top of your existing balance." },
      { t: "h", text: "Make one" },
      { t: "steps", items: [
        "Open the Savings Goals tab and press New goal.",
        "Pick an icon, name it, and set a target amount.",
        "Allocate some of your unallocated vault balance to fund it.",
      ] },
      { t: "p", text: "Each goal earns its share of the vault's yield. When a goal's balance reaches its target, it's marked Reached, and it keeps earning until you spend it or reallocate." },
      { t: "note", text: "If your vault empties out, goals stay defined but show as unfunded. Add money to your vault and they refill automatically." },
    ],
  },
  {
    id: "yield",
    category: "Growing",
    icon: TrendingUp,
    title: "How your savings earn yield",
    excerpt: "Where the yield comes from, and choosing a venue.",
    read: "3 min",
    body: [
      { t: "p", text: "Once USDC is in your vault, Orbit puts it to work in an on-chain lending venue so it earns yield instead of sitting idle." },
      { t: "h", text: "Choosing a venue" },
      { t: "p", text: "In the Wallet tab you can see available venues with their live APY. Orbit favors the most-audited options. Each shows its current rate so you can compare before you invest." },
      { t: "h", text: "How yield adds up" },
      { t: "p", text: "Yield accrues continuously and compounds into your balance. Because it's on-chain, the rate you see is the real rate the protocol is paying, not a marketing number." },
      { t: "note", text: "Yield is variable and never guaranteed. Rates move with the market." },
    ],
  },
  {
    id: "self-custody",
    category: "Security",
    icon: KeyRound,
    title: "Staying safe and self-custody basics",
    excerpt: "Recovery phrases, verifying on-chain, and keeping control of your money.",
    read: "3 min",
    body: [
      { t: "p", text: "Self-custody means you, and only you, control your money. It's powerful, and it comes with a few habits worth building." },
      { t: "h", text: "Protect your recovery phrase" },
      { t: "ul", items: [
        "Write it down offline and store it somewhere safe. Never type it into a website or share it.",
        "No one from Orbit will ever ask for it. Anyone who does is trying to steal from you.",
        "If you lose it, no one can recover your wallet for you.",
      ] },
      { t: "h", text: "Don't trust, verify" },
      { t: "p", text: "Your vault balance is public on Solana. From the Security page you can open the vault program and your vault account on the explorer to confirm everything yourself." },
      { t: "note", text: "Orbit is non-custodial. Even if the app disappeared, your funds stay in your on-chain vault." },
    ],
  },
];

const CATEGORY_ORDER: Category[] = ["Basics", "Saving", "Vault", "Goals", "Growing", "Security"];

const eyebrow = "font-mono text-[12px] font-medium uppercase tracking-[0.24em] text-[var(--faint)]";
const CARD = "rounded-2xl border border-[var(--border)] bg-[var(--surface)]";

// Small gradient icon tile in the brand's black → green family, sized to taste.
function CoverTile({ category, icon: Icon, size = "md" }: { category: Category; icon: LucideIcon; size?: "sm" | "md" | "lg" }) {
  const [from, to] = COVER[category];
  const box = size === "lg" ? "h-12 w-12 rounded-2xl" : size === "sm" ? "h-9 w-9 rounded-xl" : "h-11 w-11 rounded-xl";
  const glyph = size === "lg" ? "h-6 w-6" : size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <span
      className={`grid shrink-0 place-items-center text-white ${box}`}
      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
      aria-hidden
    >
      <Icon className={glyph} />
    </span>
  );
}

function CategoryChip({ category }: { category: Category }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--accent-strong)]">
      {category}
    </span>
  );
}

function ReadTime({ read }: { read: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[12px] text-[var(--faint)]">
      <Clock className="h-3 w-3" aria-hidden /> {read}
    </span>
  );
}

function ArticleView({
  article,
  prev,
  next,
  onBack,
  onOpen,
}: {
  article: Article;
  prev: Article | null;
  next: Article | null;
  onBack: () => void;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> All guides
      </button>

      {/* Article header */}
      <header className="flex items-start gap-4">
        <CoverTile category={article.category} icon={article.icon} size="lg" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryChip category={article.category} />
            <ReadTime read={article.read} />
          </div>
          <h1 className="mt-3 font-display text-[clamp(1.5rem,3.5vw,2rem)] font-semibold leading-tight tracking-[-0.02em]">
            {article.title}
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">{article.excerpt}</p>
        </div>
      </header>

      {/* Article body */}
      <article className={`${CARD} space-y-4 p-6 sm:p-8`}>
        {article.body.map((b, i) => {
          if (b.t === "h") return <h2 key={i} className="pt-2 font-display text-[16px] font-semibold tracking-[-0.01em]">{b.text}</h2>;
          if (b.t === "p") return <p key={i} className="text-[14px] leading-7 text-[var(--secondary-fg)]">{b.text}</p>;
          if (b.t === "ul")
            return (
              <ul key={i} className="space-y-2.5">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-3 text-[14px] leading-6 text-[var(--secondary-fg)]">
                    <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            );
          if (b.t === "steps")
            return (
              <ol key={i} className="space-y-3">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-3 text-[14px] leading-6 text-[var(--secondary-fg)]">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-[12px] font-semibold text-[var(--on-accent)]">{j + 1}</span>
                    <span className="pt-0.5">{it}</span>
                  </li>
                ))}
              </ol>
            );
          return (
            <div key={i} className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--accent-soft)] px-4 py-3">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-[var(--on-accent)]"><Check className="h-3.5 w-3.5" aria-hidden /></span>
              <p className="text-[13px] leading-6 text-[var(--foreground)]">{b.text}</p>
            </div>
          );
        })}
      </article>

      {/* Prev / next */}
      {(prev || next) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {prev ? (
            <button
              type="button"
              onClick={() => onOpen(prev.id)}
              className={`${CARD} group flex items-center gap-3 p-4 text-left transition-colors hover:border-[var(--border-strong)]`}
            >
              <ArrowLeft className="h-4 w-4 shrink-0 text-[var(--muted)] transition-colors group-hover:text-[var(--foreground)]" aria-hidden />
              <span className="min-w-0">
                <span className={`${eyebrow} block`}>Previous</span>
                <span className="mt-1 block truncate text-[14px] font-medium">{prev.title}</span>
              </span>
            </button>
          ) : (
            <span />
          )}
          {next && (
            <button
              type="button"
              onClick={() => onOpen(next.id)}
              className={`${CARD} group flex items-center justify-end gap-3 p-4 text-right transition-colors hover:border-[var(--border-strong)] sm:col-start-2`}
            >
              <span className="min-w-0">
                <span className={`${eyebrow} block`}>Next</span>
                <span className="mt-1 block truncate text-[14px] font-medium">{next.title}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-[var(--muted)] transition-colors group-hover:text-[var(--foreground)]" aria-hidden />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ArticleRow({ article, onOpen }: { article: Article; onOpen: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(article.id)}
      className="group flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-colors hover:bg-[var(--background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30"
    >
      <CoverTile category={article.category} icon={article.icon} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium leading-snug text-[var(--foreground)]">{article.title}</span>
        <span className="mt-0.5 line-clamp-1 text-[13px] leading-5 text-[var(--muted)]">{article.excerpt}</span>
      </span>
      <ReadTime read={article.read} />
      <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--faint)] transition-colors group-hover:text-[var(--accent-strong)]" aria-hidden />
    </button>
  );
}

export function HelpCenter() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Category | "All">("All");

  // Scroll to top whenever the open article changes.
  useEffect(() => {
    if (openId) window.scrollTo?.({ top: 0, behavior: "smooth" });
  }, [openId]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      ARTICLES.filter((a) => {
        const inCat = active === "All" || a.category === active;
        if (!inCat) return false;
        if (!q) return true;
        return (
          a.title.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
        );
      }),
    [active, q],
  );

  // Group filtered results by category, preserving the canonical order.
  const grouped = useMemo(
    () =>
      CATEGORY_ORDER.map((cat) => ({ cat, items: filtered.filter((a) => a.category === cat) })).filter(
        (g) => g.items.length > 0,
      ),
    [filtered],
  );

  if (openId) {
    const idx = ARTICLES.findIndex((a) => a.id === openId);
    if (idx >= 0) {
      return (
        <ArticleView
          article={ARTICLES[idx]}
          prev={ARTICLES[idx - 1] ?? null}
          next={ARTICLES[idx + 1] ?? null}
          onBack={() => setOpenId(null)}
          onOpen={(id) => setOpenId(id)}
        />
      );
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <span className={eyebrow}>Help center</span>
        <h1 className="mt-1 font-display text-[clamp(1.4rem,3vw,1.9rem)] font-semibold leading-none tracking-[-0.02em]">
          Guides &amp; answers
        </h1>
        <p className="mt-2 max-w-xl text-[14px] leading-6 text-[var(--muted)]">
          Short, plain-language guides to everything Orbit does, from opening your account to keeping full control of your savings.
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 focus-within:border-[var(--border-strong)]">
        <Search className="h-4 w-4 shrink-0 text-[var(--faint)]" aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search guides…"
          aria-label="Search guides"
          className="h-6 w-full min-w-0 bg-transparent text-[14px] text-[var(--foreground)] placeholder:text-[var(--faint)] focus:outline-none"
        />
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2">
        {(["All", ...CATEGORY_ORDER] as const).map((cat) => {
          const on = active === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActive(cat)}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                on
                  ? "bg-[var(--foreground)] text-[var(--background)]"
                  : "border border-[var(--border)] text-[var(--muted)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Category browse — one soft card per category, each listing its articles */}
      {grouped.length > 0 ? (
        <div className="space-y-5">
          {grouped.map(({ cat, items }) => (
            <section key={cat} className={`${CARD} overflow-hidden`}>
              <div className="flex items-center gap-3 border-b border-[var(--border)] p-5 sm:p-6">
                <CoverTile category={cat} icon={items[0].icon} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-[16px] font-semibold tracking-[-0.01em]">{cat}</h2>
                    <span className="font-mono text-[12px] text-[var(--faint)]">
                      {items.length} {items.length === 1 ? "guide" : "guides"}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[13px] text-[var(--muted)]">{CATEGORY_BLURB[cat]}</p>
                </div>
              </div>
              <div className="divide-y divide-[var(--border)] p-2">
                {items.map((a) => (
                  <ArticleRow key={a.id} article={a} onOpen={(id) => setOpenId(id)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className={`${CARD} flex flex-col items-center gap-3 p-10 text-center`}>
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)]">
            <BookOpen className="h-5 w-5" aria-hidden />
          </span>
          <p className="text-[14px] font-medium">No guides match &ldquo;{query}&rdquo;</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActive("All");
            }}
            className="rounded-full bg-[var(--foreground)] px-4 py-2 text-[13px] font-semibold text-[var(--background)] transition-opacity hover:opacity-90"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}
