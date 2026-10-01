"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Landmark, Coins, TrendingUp, type LucideIcon } from "lucide-react";

type Step = {
  n: string;
  icon: LucideIcon;
  t: string;
  d: string;
};

const STEPS: Step[] = [
  {
    n: "01",
    icon: Landmark,
    t: "You spend",
    d: "Connect your bank and go about your day. Orbit notices your spending through Plaid — it can look, but never touch your money.",
  },
  {
    n: "02",
    icon: Coins,
    t: "Orbit saves",
    d: "It quietly tucks away a little from each purchase and moves it into a savings vault that’s yours alone.",
  },
  {
    n: "03",
    icon: TrendingUp,
    t: "It grows",
    d: "Your savings earn interest around the clock. Take out everything you saved, plus what it earned, in one tap — anytime.",
  },
];

// The GreenSock stacking-cards mechanic (pen MWmVwpX): each card is position:sticky
// so it pins near the top as you scroll; ScrollTrigger scrubs the outgoing card down
// in scale as the next card rises to stack on top of it.
export function StackingSteps() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".stack-card");
      const last = cards.length - 1;

      cards.forEach((card, i) => {
        if (i === last) return; // the top card of the finished stack never shrinks
        gsap.to(card, {
          scale: 1 - (last - i) * 0.045,
          transformOrigin: "50% 0%",
          ease: "none",
          scrollTrigger: {
            trigger: cards[i + 1],
            start: "top 85%",
            end: "top top",
            scrub: true,
            invalidateOnRefresh: true,
          },
        });
      });

      // Each card slowly emerges from transparent to opaque as it rises up
      // from the bottom of the viewport (scrubbed to scroll position).
      gsap.utils.toArray<HTMLElement>(".stack-inner").forEach((inner) => {
        gsap.fromTo(
          inner,
          { autoAlpha: 0, yPercent: 16 },
          {
            autoAlpha: 1,
            yPercent: 0,
            ease: "none",
            scrollTrigger: {
              trigger: inner,
              start: "top 95%",
              end: "top 55%",
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        );
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="mt-16">
      {STEPS.map((s, i) => (
        <div
          key={s.n}
          className="stack-card sticky top-[calc(var(--stack-top)+var(--i)*0.9rem)] pb-6"
          style={
            {
              "--i": i,
              "--stack-top": "7rem",
              zIndex: i + 1,
            } as React.CSSProperties
          }
        >
          <div className="stack-inner relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] shadow-float">
            {/* green accent top bar */}
            <div aria-hidden className="absolute inset-x-0 top-0 h-1.5" style={{ background: "var(--gradient-accent)" }} />
            {/* oversized ghost numeral */}
            <span
              aria-hidden
              className="pointer-events-none absolute -right-5 -top-14 select-none font-display text-[11rem] font-bold leading-none tracking-tighter text-[var(--foreground)] opacity-[0.04] sm:text-[16rem]"
            >
              {s.n}
            </span>

            <div className="relative p-8 sm:p-14">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[var(--accent)] text-[var(--on-accent)] shadow-soft">
                  <s.icon className="h-6 w-6" aria-hidden />
                </div>
                <div>
                  <div className="font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--accent-strong)]">Step {s.n}</div>
                  <div className="mt-1.5 h-0.5 w-10 rounded-full bg-[var(--accent)]" />
                </div>
              </div>
              <h3 className="mt-8 max-w-xl font-display text-[clamp(1.7rem,3.6vw,2.75rem)] font-semibold leading-[1.03] tracking-[-0.02em]">
                {s.t}
              </h3>
              <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-[var(--muted)]">
                {s.d}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
