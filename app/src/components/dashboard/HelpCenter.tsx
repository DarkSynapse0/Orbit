"use client";

import { useEffect, useState } from "react";
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
  Clock,
  Check,
  Lock,
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

// Editorial cover palette — one gradient per category.
const COVER: Record<Category, [string, string]> = {
  Basics: ["#15803d", "#0e7490"],
  Saving: ["#0d9488", "#0369a1"],
  Vault: ["#4f46e5", "#0891b2"],
  Goals: ["#b45309", "#be123c"],
  Growing: ["#7c3aed", "#2563eb"],
  Security: ["#0f766e", "#1e3a8a"],
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

const PROGRESS_KEY = "orbit.help.progress.v1";

function Pill({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.12em] ${
        dark ? "bg-white/15 text-white ring-1 ring-inset ring-white/20" : "bg-[var(--background)] text-[var(--muted)] ring-1 ring-inset ring-[var(--border)]"
      }`}
    >
      {children}
    </span>
  );
}

// Gradient cover art with a large translucent icon watermark.
function Cover({ article, className = "", big = false }: { article: Article; className?: string; big?: boolean }) {
  const [from, to] = COVER[article.category];
  const Icon = article.icon;
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}>
      <Icon className={`absolute -bottom-4 -right-3 text-white/15 ${big ? "h-44 w-44" : "h-24 w-24"}`} aria-hidden />
      <div className={`relative flex h-full items-center justify-center ${big ? "p-6" : "p-3"}`}>
        <span className={`grid place-items-center rounded-xl bg-white/15 ring-1 ring-inset ring-white/25 ${big ? "h-12 w-12" : "h-10 w-10"}`}>
          <Icon className={big ? "h-6 w-6 text-white" : "h-5 w-5 text-white"} aria-hidden />
        </span>
      </div>
    </div>
  );
}

function ArticleView({
  article,
  index,
  total,
  isDone,
  nextTitle,
  onBack,
  onComplete,
}: {
  article: Article;
  index: number;
  total: number;
  isDone: boolean;
  nextTitle: string | null;
  onBack: () => void;
  onComplete: () => void;
}) {
  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to path
      </button>

      <article className="overflow-hidden rounded-2xl bg-[var(--surface)]">
        <Cover article={article} className="h-44 sm:h-52" big />
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--primary-strong)]">Step {index + 1} of {total}</span>
            <span className="text-[var(--faint)]">·</span>
            <Pill>{article.category}</Pill>
            <span className="inline-flex items-center gap-1 text-[12px] text-[var(--faint)]"><Clock className="h-3 w-3" aria-hidden /> {article.read} read</span>
          </div>
          <h1 className="mt-4 font-display text-[22px] font-bold leading-tight sm:text-[26px]">{article.title}</h1>

          <div className="mt-6 max-w-2xl space-y-4">
            {article.body.map((b, i) => {
              if (b.t === "h") return <h2 key={i} className="pt-2 font-display text-[16px] font-bold">{b.text}</h2>;
              if (b.t === "p") return <p key={i} className="text-[14px] leading-7 text-[var(--secondary-fg)]">{b.text}</p>;
              if (b.t === "ul")
                return (
                  <ul key={i} className="space-y-2">
                    {b.items.map((it, j) => (
                      <li key={j} className="flex gap-2.5 text-[14px] leading-6 text-[var(--secondary-fg)]">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" aria-hidden />
                        {it}
                      </li>
                    ))}
                  </ul>
                );
              if (b.t === "steps")
                return (
                  <ol key={i} className="space-y-2.5">
                    {b.items.map((it, j) => (
                      <li key={j} className="flex gap-3 text-[14px] leading-6 text-[var(--secondary-fg)]">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--primary-soft)] text-[12px] font-bold text-[var(--primary-strong)]">{j + 1}</span>
                        <span className="pt-0.5">{it}</span>
                      </li>
                    ))}
                  </ol>
                );
              return <p key={i} className="rounded-xl bg-[var(--info-soft)] px-4 py-3 text-[13px] leading-6 text-[var(--foreground)]">{b.text}</p>;
            })}
          </div>

          {/* Completion / continue */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
            <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--muted)]">
              {isDone ? (<><Check className="h-4 w-4 text-[var(--success)]" aria-hidden /> Completed</>) : nextTitle ? "Finish to unlock the next guide" : "Last guide in the path"}
            </span>
            <button
              type="button"
              onClick={onComplete}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-[14px] font-semibold text-[var(--primary-fg)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40"
            >
              {nextTitle ? (isDone ? "Next guide" : "Mark as read & continue") : isDone ? "Back to path" : "Mark as read & finish"}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}

export function HelpCenter() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (raw) setCompleted(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  const persist = (next: string[]) => {
    setCompleted(next);
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
    } catch {}
  };

  const isDone = (id: string) => completed.includes(id);
  // A step is unlocked if it's the first, or the previous step is completed.
  const isUnlocked = (i: number) => i === 0 || isDone(ARTICLES[i - 1].id);
  const doneCount = ARTICLES.filter((a) => isDone(a.id)).length;
  const pct = Math.round((doneCount / ARTICLES.length) * 100);
  // First unlocked, not-yet-completed step = where to continue.
  const nextIdx = ARTICLES.findIndex((a, i) => isUnlocked(i) && !isDone(a.id));
  const nextStep = nextIdx >= 0 ? ARTICLES[nextIdx] : null;

  if (openId) {
    const idx = ARTICLES.findIndex((a) => a.id === openId);
    if (idx >= 0) {
      const article = ARTICLES[idx];
      const next = ARTICLES[idx + 1] ?? null;
      return (
        <ArticleView
          article={article}
          index={idx}
          total={ARTICLES.length}
          isDone={isDone(article.id)}
          nextTitle={next?.title ?? null}
          onBack={() => setOpenId(null)}
          onComplete={() => {
            if (!isDone(article.id)) persist([...completed, article.id]);
            setOpenId(next ? next.id : null);
          }}
        />
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero — learning path progress */}
      <section className="overflow-hidden rounded-3xl bg-[var(--surface)] p-7 sm:p-9">
        <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--primary-strong)]">Orbit learning path</span>
        <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-lg">
            <h1 className="font-display text-[26px] font-extrabold leading-[1.15] sm:text-[30px]">Learn Orbit, one step at a time</h1>
            <p className="mt-2 text-[14px] leading-6 text-[var(--muted)]">Work through the guides in order. Finish each one to unlock the next, from opening your account to keeping full control of your savings.</p>
          </div>
          {nextStep && (
            <button
              type="button"
              onClick={() => setOpenId(nextStep.id)}
              className="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-[14px] font-semibold text-[var(--primary-fg)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40"
            >
              {doneCount === 0 ? "Start learning" : "Continue"} <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
        <div className="mt-6">
          <div className="flex items-center justify-between text-[12px] font-medium text-[var(--muted)]">
            <span>{doneCount} of {ARTICLES.length} completed</span>
            <div className="flex items-center gap-3">
              <span>{pct}%</span>
              {doneCount > 0 && (
                <button type="button" onClick={() => persist([])} className="text-[var(--faint)] underline-offset-2 transition-colors hover:text-[var(--foreground)] hover:underline">Reset</button>
              )}
            </div>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--background)]">
            <div className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-500" style={{ width: `${loaded ? pct : 0}%` }} />
          </div>
        </div>
      </section>

      {/* Stepped path */}
      <ol className="space-y-3">
        {ARTICLES.map((a, i) => {
          const done = isDone(a.id);
          const unlocked = isUnlocked(i);
          const isNext = nextStep?.id === a.id;
          const last = i === ARTICLES.length - 1;
          return (
            <li key={a.id} className="relative flex gap-4">
              {/* Rail: node + connector */}
              <div className="flex flex-col items-center pt-6">
                <span
                  className={`z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-bold ring-4 ring-[var(--background)] ${
                    done
                      ? "bg-[var(--primary)] text-[var(--primary-fg)]"
                      : unlocked
                        ? "bg-[var(--primary-soft)] text-[var(--primary-strong)]"
                        : "bg-[var(--surface)] text-[var(--faint)] ring-1 ring-[var(--border)]"
                  }`}
                >
                  {done ? <Check className="h-4.5 w-4.5" aria-hidden /> : unlocked ? i + 1 : <Lock className="h-4 w-4" aria-hidden />}
                </span>
                {!last && <span className={`w-0.5 flex-1 ${done ? "bg-[var(--primary)]/40" : "bg-[var(--border)]"}`} aria-hidden />}
              </div>

              {/* Card */}
              <div className="flex-1 pb-1">
                <button
                  type="button"
                  disabled={!unlocked}
                  onClick={() => unlocked && setOpenId(a.id)}
                  className={`flex w-full items-stretch gap-4 overflow-hidden rounded-2xl bg-[var(--surface)] text-left transition-all ${
                    unlocked
                      ? "hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-16px_rgba(2,6,23,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/30"
                      : "cursor-not-allowed opacity-70"
                  } ${isNext ? "ring-2 ring-[var(--primary)]/40" : ""}`}
                >
                  <div className="relative w-24 shrink-0 sm:w-32">
                    <Cover article={a} className="h-full w-full" />
                    {!unlocked && (
                      <div className="absolute inset-0 grid place-items-center bg-[var(--surface)]/70 backdrop-grayscale">
                        <Lock className="h-5 w-5 text-[var(--muted)]" aria-hidden />
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center py-4 pr-4">
                    <div className="flex items-center gap-2">
                      <Pill>{a.category}</Pill>
                      {done && <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--success)]"><Check className="h-3 w-3" aria-hidden /> Done</span>}
                      {isNext && !done && <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--primary-strong)]">Up next</span>}
                      {!unlocked && <span className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--faint)]"><Lock className="h-3 w-3" aria-hidden /> Locked</span>}
                    </div>
                    <div className="mt-1.5 text-[15px] font-semibold leading-snug text-[var(--foreground)]">{a.title}</div>
                    <div className="mt-1 line-clamp-2 text-[13px] leading-5 text-[var(--muted)]">
                      {unlocked ? a.excerpt : `Finish "${ARTICLES[i - 1].title}" to unlock this guide.`}
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1 text-[12px] text-[var(--faint)]"><Clock className="h-3 w-3" aria-hidden /> {a.read} read</div>
                  </div>
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      {doneCount === ARTICLES.length && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-[var(--success-soft)] px-5 py-4 text-[14px] font-medium text-[var(--success)]">
          <Check className="h-5 w-5" aria-hidden /> You've completed the Orbit learning path. Nicely done.
        </div>
      )}
    </div>
  );
}
