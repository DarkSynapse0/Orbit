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

// Stacking cards via per-card CSS `sticky` (the mechanic that works reliably in
// this page) — each card pins near the top and the one beneath scales down + tilts
// as the next rises over it. Contained, not full-viewport: label sticky on the
// left, smaller cards stacking on the right.
export function StepsFlow() {
  const root = useRef<HTMLDivElement>(null);
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

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".sf-card");
      const last = cards.length - 1;

      const inners = gsap.utils.toArray<HTMLElement>(".sf-inner");

      cards.forEach((card, i) => {
        // each card rises up + fades in as it scrolls into view
        gsap.fromTo(
          inners[i],
          { autoAlpha: i === 0 ? 1 : 0, yPercent: i === 0 ? 0 : 24 },
          {
            autoAlpha: 1,
            yPercent: 0,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              start: "top 95%",
              end: "top 60%",
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        );

        // scale + tilt the card as the NEXT card rises to cover it
        if (i < last) {
          gsap.to(card, {
            scale: 0.9,
            rotation: 4,
            transformOrigin: "50% 0%",
            ease: "none",
            scrollTrigger: {
              trigger: cards[i + 1],
              start: "top 80%",
              end: "top 24%",
              scrub: true,
              invalidateOnRefresh: true,
            },
          });
        }
        // keep the step counter in sync with the active card
        ScrollTrigger.create({
          trigger: card,
          start: "top 40%",
          end: "bottom 40%",
          onToggle: (self) => {
            if (self.isActive && countRef.current) {
              countRef.current.textContent = String(i + 1);
            }
          },
        });
      });
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={root}
      id="how"
      className="border-y border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
      aria-label="How Orbit works"
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[0.8fr_1fr] lg:gap-16 lg:py-28">
        {/* left: sticky label */}
        <div className="lg:sticky lg:top-28 lg:self-start">
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

        {/* right: stacking cards */}
        <div className="relative">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className="sf-card sticky mx-auto max-w-md"
              style={{ top: `calc(7rem + ${i} * 0.75rem)`, zIndex: i + 1, marginBottom: i < STEPS.length - 1 ? "2.5rem" : 0 }}
            >
              <div className="sf-inner relative overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] shadow-float">
                {/* top bar */}
                <div aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-[var(--foreground)]" />
                {/* oversized ghost numeral */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-3 -top-10 select-none font-display text-[9rem] font-bold leading-none tracking-tighter text-[var(--foreground)] opacity-[0.04] sm:text-[11rem]"
                >
                  {s.n}
                </span>

                <div className="relative p-7 sm:p-9">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--foreground)] text-[var(--background)] shadow-soft">
                    <s.icon className="h-6 w-6" aria-hidden />
                  </div>
                  <div className="mt-7 font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--foreground)]">
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
    </section>
  );
}
