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
  from: string;
  to: string;
};

const STEPS: Step[] = [
  {
    n: "01",
    word: "Spend",
    title: "You spend as usual",
    desc: "Connect your bank and go about your day. Orbit watches purchases through Plaid — it can see, but never touch your money.",
    icon: CreditCard,
    from: "#0b3b2e",
    to: "#06120d",
  },
  {
    n: "02",
    word: "Save",
    title: "Orbit sets aside",
    desc: "A small slice of each purchase gets earmarked. The dollars stay in your bank until they add up to a batch.",
    icon: Coins,
    from: "#123149",
    to: "#081521",
  },
  {
    n: "03",
    word: "Move",
    title: "On-chain at the threshold",
    desc: "At the batch point, funds convert to USDC and land in a vault that's yours alone — self-custodial, verifiable.",
    icon: Lock,
    from: "#39234a",
    to: "#170e1f",
  },
  {
    n: "04",
    word: "Grow",
    title: "It earns yield",
    desc: "Your USDC earns real on-chain yield around the clock. Withdraw everything you saved, plus what it earned — anytime.",
    icon: TrendingUp,
    from: "#0b3b2e",
    to: "#06120d",
  },
];

// Skiper "StickyCard_002" stacking mechanic, rebuilt on the gsap/ScrollTrigger we
// already ship: each card starts below the viewport and rises to cover the stack
// while the card beneath it scales to 0.7 and tilts 5°. Driven by a scrubbed
// timeline over a sticky track (robust inside the page's flex column — no pin).
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
      <section className="dark border-y border-white/10 bg-[#06120d] text-white">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <p className="font-mono text-[12px] uppercase tracking-[0.24em] text-white/45">How it works</p>
          <div className="mt-10 grid gap-6">
            {STEPS.map((s) => (
              <div key={s.n} className="flex items-start gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--accent)] text-[var(--on-accent)]">
                  <s.icon className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <div className="font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--accent-strong)]">Step {s.n} · {s.word}</div>
                  <h3 className="mt-2 font-display text-2xl font-semibold">{s.title}</h3>
                  <p className="mt-2 max-w-xl text-white/70">{s.desc}</p>
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
      className="dark relative w-full bg-[#06120d]"
      style={
        {
          height: `${STEPS.length * 100}vh`,
          "--accent": "#35f0c6",
          "--accent-strong": "#5cf5d2",
          "--on-accent": "#06251c",
        } as React.CSSProperties
      }
      aria-label="How Orbit works"
    >
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden p-4 text-white sm:p-8">
        {/* persistent overlay: section label + step counter */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-50 flex items-center justify-between px-6 pt-8 sm:px-10">
          <p className="font-mono text-[12px] uppercase tracking-[0.24em] text-white/50">How it works</p>
          <p className="font-mono text-[13px] tracking-[0.2em] text-white/70">
            0<span ref={countRef}>1</span> <span className="text-white/30">/ 0{STEPS.length}</span>
          </p>
        </div>

        {/* card stack */}
        <div className="relative h-[82vh] w-full max-w-5xl">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              ref={(node) => {
                cardRefs.current[i] = node;
              }}
              className="absolute inset-0 overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl"
              style={{
                zIndex: i,
                background: `radial-gradient(120% 120% at 20% 0%, ${s.from} 0%, ${s.to} 62%)`,
              }}
            >
              {/* oversized ghost numeral */}
              <span
                aria-hidden
                className="pointer-events-none absolute -right-4 -top-16 select-none font-display text-[14rem] font-bold leading-none tracking-tighter text-white opacity-[0.05] sm:text-[20rem]"
              >
                {s.n}
              </span>

              <div className="relative grid h-full w-full items-center gap-10 p-8 sm:p-14 lg:grid-cols-2 lg:gap-16">
                <div>
                  <div className="font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--accent-strong)]">
                    Step {s.n}
                  </div>
                  <h2 className="mt-3 font-display text-[clamp(2.6rem,7vw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.03em]">
                    {s.word}
                  </h2>
                  <h3 className="mt-4 font-display text-[clamp(1.2rem,2.2vw,1.8rem)] font-medium">
                    {s.title}
                  </h3>
                  <p className="mt-4 max-w-md text-[16px] leading-relaxed text-white/75 sm:text-[17px]">
                    {s.desc}
                  </p>
                </div>

                {/* icon tile */}
                <div className="hidden place-items-center lg:grid">
                  <div className="grid h-28 w-28 place-items-center rounded-[1.75rem] bg-[var(--accent)] text-[var(--on-accent)] shadow-2xl">
                    <s.icon className="h-12 w-12" aria-hidden />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
