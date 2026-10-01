import { CreditCard, Coins, Lock, TrendingUp, type LucideIcon } from "lucide-react";

type Step = {
  n: string;
  word: string;
  title: string;
  desc: string;
  icon: LucideIcon;
};

const STEPS: Step[] = [
  {
    n: "01",
    word: "Spend",
    title: "You spend as usual",
    desc: "Orbit watches purchases through Plaid — it can see, but never touch your money.",
    icon: CreditCard,
  },
  {
    n: "02",
    word: "Save",
    title: "Orbit sets aside",
    desc: "A small slice of each purchase is earmarked. The dollars stay in your bank until they batch.",
    icon: Coins,
  },
  {
    n: "03",
    word: "Move",
    title: "On-chain at the threshold",
    desc: "Funds convert to USDC and land in a vault that's yours alone — self-custodial, verifiable.",
    icon: Lock,
  },
  {
    n: "04",
    word: "Grow",
    title: "It earns yield",
    desc: "Your USDC earns real on-chain yield around the clock. Withdraw anytime.",
    icon: TrendingUp,
  },
];

// Minimal, static: the four steps in a row of plain cards.
export function StepsFlow() {
  return (
    <section
      id="how"
      className="border-y border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
      aria-label="How Orbit works"
    >
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
        <p className="font-mono text-[12px] uppercase tracking-[0.24em] text-[var(--faint)]">How it works</p>
        <h2 className="mt-4 max-w-2xl font-display text-[clamp(1.8rem,3.5vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.02em]">
          From a swipe to on-chain yield.
        </h2>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
            >
              {/* Lottie slot — drop the animation here (placeholder: step icon) */}
              <div className="relative grid aspect-[4/3] place-items-center border-b border-[var(--border)] bg-[var(--background)]">
                <span className="absolute left-4 top-4 font-mono text-[13px] tracking-[0.2em] text-[var(--faint)]">{s.n}</span>
                <s.icon className="h-10 w-10 text-[var(--muted)]" aria-hidden />
              </div>

              <div className="p-6">
                <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[var(--muted)]">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
