import { CreditCard, Coins, Lock, TrendingUp, type LucideIcon } from "lucide-react";
import { LottieBox } from "@/components/landing/LottieBox";

type Step = {
  n: string;
  word: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  lottie?: string;
};

const STEPS: Step[] = [
  {
    n: "01",
    word: "Spend",
    title: "You spend as usual",
    desc: "Orbit watches purchases through Plaid — it can see, but never touch your money.",
    icon: CreditCard,
    lottie: "/lottie/step-1.json",
  },
  {
    n: "02",
    word: "Save",
    title: "Orbit sets aside",
    desc: "A small slice of each purchase is earmarked. The dollars stay in your bank until they batch.",
    icon: Coins,
    lottie: "/lottie/step-2.json",
  },
  {
    n: "03",
    word: "Move",
    title: "On-chain at the threshold",
    desc: "Funds convert to USDC and land in a vault that's yours alone — self-custodial, verifiable.",
    icon: Lock,
    lottie: "/lottie/step-3.lottie",
  },
  {
    n: "04",
    word: "Grow",
    title: "It earns yield",
    desc: "Your USDC earns real on-chain yield around the clock. Withdraw anytime.",
    icon: TrendingUp,
    lottie: "/lottie/step-4.json",
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
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <p className="font-mono text-[12px] uppercase tracking-[0.24em] text-[var(--faint)]">How it works</p>
        <h2 className="mt-4 max-w-2xl font-display text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.02em]">
          From a swipe to on-chain yield.
        </h2>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]"
            >
              {/* Lottie slot — animation if provided, else step icon */}
              <div className="relative grid aspect-square place-items-center border-b border-[var(--border)] bg-[var(--background)]">
                <span className="absolute left-5 top-5 z-10 font-mono text-[14px] tracking-[0.2em] text-[var(--faint)]">{s.n}</span>
                {s.lottie ? (
                  <LottieBox src={s.lottie} className="h-full w-full" />
                ) : (
                  <s.icon className="h-14 w-14 text-[var(--muted)]" aria-hidden />
                )}
              </div>

              <div className="p-7 sm:p-8">
                <h3 className="font-display text-xl font-semibold">{s.title}</h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-[var(--muted)]">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
