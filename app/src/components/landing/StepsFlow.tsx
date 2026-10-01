"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
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
    desc: "Connect your bank and go about your day. Orbit watches purchases through Plaid — it can see, but never touch your money.",
    icon: CreditCard,
  },
  {
    n: "02",
    word: "Save",
    title: "Orbit sets aside",
    desc: "A small slice of each purchase gets earmarked. The dollars stay in your bank until they add up to a batch.",
    icon: Coins,
  },
  {
    n: "03",
    word: "Move",
    title: "On-chain at the threshold",
    desc: "At the batch point, funds convert to USDC and land in a vault that's yours alone — self-custodial, verifiable.",
    icon: Lock,
  },
  {
    n: "04",
    word: "Grow",
    title: "It earns yield",
    desc: "Your USDC earns real on-chain yield around the clock. Withdraw everything you saved, plus what it earned — anytime.",
    icon: TrendingUp,
  },
];

// Stacking cards (Skiper StickyCard_002 mechanic) on our gsap/ScrollTrigger:
// each card rises from the bottom while the one beneath scales to 0.7 and tilts
// 5°. Two-column: a sticky label on the left, the card stack on the right.
export function StepsFlow() {
  const root = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const countRef = useRef<HTMLSpanElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
    }
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el || reduced) return;

    gsap.registerPlugin(ScrollTrigger);
    const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
    const total = cards.length;
    if (total === 0) return;

    const ctx = gsap.context(() => {
      gsap.set(cards[0], { yPercent: 0, scale: 1, rotation: 0 });
      for (let i = 1; i < total; i++) {
        gsap.set(cards[i], { yPercent: 100, scale: 1, rotation: 0 });
      }

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5,
          snap: {
            snapTo: 1 / (total - 1),
            duration: { min: 0.2, max: 0.5 },
            ease: "power1.inOut",
          },
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const idx = Math.round(self.progress * (total - 1));
            if (countRef.current) countRef.current.textContent = String(idx + 1);
          },
        },
      });

      for (let i = 0; i < total - 1; i++) {
        tl.to(cards[i], { scale: 0.7, rotation: 5, duration: 1 }, i);
        tl.to(cards[i + 1], { yPercent: 0, duration: 1 }, i);
      }
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  // Reduced-motion / no-JS friendly: a simple vertical list, no scroll effect.
  if (reduced) {
    return (
      <section className="border-y border-[var(--border)] bg-[var(--background)]">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <p className="font-mono text-[12px] uppercase tracking-[0.24em] text-[var(--faint)]">How it works</p>
          <div className="mt-10 grid gap-6">
            {STEPS.map((s) => (
              <div key={s.n} className="flex items-start gap-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--accent)] text-[var(--on-accent)]">
                  <s.icon className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <div className="font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--accent-strong)]">Step {s.n} · {s.word}</div>
                  <h3 className="mt-2 font-display text-2xl font-semibold">{s.title}</h3>
                  <p className="mt-2 max-w-xl text-[var(--muted)]">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    // Tall track gives the sticky viewport room to scrub through every card.
    <section
      ref={root}
      id="how"
      className="relative w-full bg-[var(--background)] text-[var(--foreground)]"
      style={{ height: `${STEPS.length * 100}vh` }}
      aria-label="How Orbit works"
    >
      <div className="sticky top-0 flex h-screen w-full items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 lg:grid-cols-[0.8fr_1fr] lg:gap-16">
          {/* left: sticky label */}
          <div>
            <p className="font-mono text-[12px] uppercase tracking-[0.24em] text-[var(--faint)]">How it works</p>
            <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.02em]">
              From a swipe to on-chain yield.
            </h2>
            <p className="mt-4 max-w-sm text-[var(--muted)]">
              Four quiet steps run every time you spend — you never lift a finger.
            </p>
            <p className="mt-8 font-mono text-[13px] tracking-[0.2em] text-[var(--muted)]">
              0<span ref={countRef}>1</span> <span className="text-[var(--faint)]">/ 0{STEPS.length}</span>
            </p>
          </div>

          {/* right: card stack */}
          <div className="relative mx-auto h-[52vh] w-full max-w-md">
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                ref={(node) => {
                  cardRefs.current[i] = node;
                }}
                className="absolute inset-0 overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] shadow-float"
                style={{ zIndex: i }}
              >
                {/* accent top bar */}
                <div aria-hidden className="absolute inset-x-0 top-0 h-1.5" style={{ background: "var(--gradient-accent)" }} />
                {/* oversized ghost numeral */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-3 -top-10 select-none font-display text-[9rem] font-bold leading-none tracking-tighter text-[var(--foreground)] opacity-[0.04] sm:text-[11rem]"
                >
                  {s.n}
                </span>

                <div className="relative flex h-full flex-col justify-between p-7 sm:p-9">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--accent)] text-[var(--on-accent)] shadow-soft">
                    <s.icon className="h-6 w-6" aria-hidden />
                  </div>
                  <div>
                    <div className="font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--accent-strong)]">
                      Step {s.n} · {s.word}
                    </div>
                    <h3 className="mt-3 font-display text-[clamp(1.5rem,3vw,2.1rem)] font-semibold leading-[1.05] tracking-[-0.02em]">
                      {s.title}
                    </h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
                      {s.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
