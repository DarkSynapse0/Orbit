"use client";

import { useState } from "react";
import {
  Rocket,
  Percent,
  Landmark,
  ShieldCheck,
  Target,
  TrendingUp,
  Compass,
  ArrowLeft,
  Clock,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

type Block =
  | { t: "p"; text: string }
  | { t: "h"; text: string }
  | { t: "ul"; items: string[] }
  | { t: "steps"; items: string[] }
  | { t: "note"; text: string };

type Article = {
  id: string;
  category: string;
  icon: LucideIcon;
  title: string;
  excerpt: string;
  read: string;
  body: Block[];
};

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
];

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-[var(--background)] px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--muted)] ring-1 ring-inset ring-[var(--border)]">
      {children}
    </span>
  );
}

function ArticleView({ article, onBack }: { article: Article; onBack: () => void }) {
  const Icon = article.icon;
  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> All guides
      </button>

      <article className="rounded-2xl bg-[var(--surface)] p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <Pill>{article.category}</Pill>
          <span className="inline-flex items-center gap-1 text-[12px] text-[var(--faint)]">
            <Clock className="h-3 w-3" aria-hidden /> {article.read} read
          </span>
        </div>
        <div className="mt-4 flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary-strong)]">
            <Icon className="h-6 w-6" aria-hidden />
          </span>
          <h1 className="font-display text-[22px] font-bold leading-tight sm:text-[26px]">{article.title}</h1>
        </div>

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
            return (
              <p key={i} className="rounded-xl bg-[var(--info-soft)] px-4 py-3 text-[13px] leading-6 text-[var(--foreground)]">
                {b.text}
              </p>
            );
          })}
        </div>
      </article>
    </div>
  );
}

export function HelpCenter() {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = ARTICLES.find((a) => a.id === openId) ?? null;

  if (open) return <ArticleView article={open} onBack={() => setOpenId(null)} />;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-[var(--surface)] p-6">
        <h2 className="font-display text-[17px] font-bold">Help Center</h2>
        <p className="mt-1 max-w-xl text-[13px] leading-6 text-[var(--muted)]">
          Short guides for getting set up, finding your way around, and using Orbit well. Pick a
          topic to read.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ARTICLES.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setOpenId(a.id)}
              className="group flex items-start gap-3.5 rounded-2xl bg-[var(--surface)] p-5 text-left transition-colors hover:bg-[var(--background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/30"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary-strong)]">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Pill>{a.category}</Pill>
                  <span className="inline-flex items-center gap-1 text-[11px] text-[var(--faint)]">
                    <Clock className="h-3 w-3" aria-hidden /> {a.read}
                  </span>
                </div>
                <div className="mt-2 text-[15px] font-semibold text-[var(--foreground)]">{a.title}</div>
                <div className="mt-1 text-[13px] leading-5 text-[var(--muted)]">{a.excerpt}</div>
              </div>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[var(--faint)] transition-transform group-hover:translate-x-0.5" aria-hidden />
            </button>
          );
        })}
      </div>
    </div>
  );
}
