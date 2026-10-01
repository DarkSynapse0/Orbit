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

// A landing-friendly take on the GreenSock full-screen slide slider (Observer demo):
// instead of permanently hijacking the wheel, the section PINS while in view and a
// scrubbed, snapped timeline plays the same slide-in / heading-morph / image-scale
// transitions as you scroll — then releases back to the page at the ends.
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
    const n = STEPS.length;

    const ctx = gsap.context(() => {
      const sections = gsap.utils.toArray<HTMLElement>(".sf-slide");
      const outers = gsap.utils.toArray<HTMLElement>(".sf-outer");
      const inners = gsap.utils.toArray<HTMLElement>(".sf-inner");
      const imgs = gsap.utils.toArray<HTMLElement>(".sf-img");
      const headings = gsap.utils.toArray<HTMLElement>(".sf-heading");

      // Stack order: later slides sit above and slide over the earlier ones.
      sections.forEach((s, i) => gsap.set(s, { zIndex: i, autoAlpha: 1 }));

      // Everything but the first slide starts masked off to the right.
      gsap.set(outers, { xPercent: 100 });
      gsap.set(inners, { xPercent: -100 });
      gsap.set(outers[0], { xPercent: 0 });
      gsap.set(inners[0], { xPercent: 0 });

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: () => "+=" + window.innerHeight * (n - 1),
          pin: true,
          scrub: 1,
          snap: {
            snapTo: 1 / (n - 1),
            duration: { min: 0.2, max: 0.5 },
            ease: "power1.inOut",
          },
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const idx = Math.round(self.progress * (n - 1));
            if (countRef.current) countRef.current.textContent = String(idx + 1);
          },
        },
      });

      for (let i = 1; i < n; i++) {
        const at = i - 1;
        tl.fromTo(outers[i], { xPercent: 100 }, { xPercent: 0 }, at)
          .fromTo(inners[i], { xPercent: -100 }, { xPercent: 0 }, at)
          .fromTo(imgs[i], { scale: 1.6 }, { scale: 1 }, at)
          .fromTo(
            headings[i],
            { xPercent: -16, autoAlpha: 0.2 },
            { xPercent: 0, autoAlpha: 1 },
            at,
          )
          // nudge the outgoing heading for a touch of parallax depth
          .to(headings[i - 1], { xPercent: 16 }, at);
      }
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  // Reduced-motion / no-JS friendly: a simple vertical list, no pinning.
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
    <section
      ref={root}
      id="how"
      className="dark relative h-screen w-full overflow-hidden bg-[#06120d] text-white"
      style={{ "--accent": "#35f0c6", "--accent-strong": "#5cf5d2", "--on-accent": "#06251c" } as React.CSSProperties}
      aria-label="How Orbit works"
    >
      {/* persistent overlay: section label + step counter */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-center justify-between px-6 pt-8 sm:px-10">
        <p className="font-mono text-[12px] uppercase tracking-[0.24em] text-white/50">How it works</p>
        <p className="font-mono text-[13px] tracking-[0.2em] text-white/70">
          0<span ref={countRef}>1</span> <span className="text-white/30">/ 0{STEPS.length}</span>
        </p>
      </div>

      {STEPS.map((s) => (
        <div key={s.n} className="sf-slide absolute inset-0">
          <div className="sf-outer h-full w-full overflow-hidden">
            <div className="sf-inner h-full w-full overflow-hidden">
              <div
                className="flex h-full w-full items-center"
                style={{ background: `radial-gradient(120% 120% at 15% 10%, ${s.from} 0%, ${s.to} 60%)` }}
              >
                <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 sm:px-10 lg:grid-cols-2 lg:gap-16">
                  {/* copy */}
                  <div className="order-2 lg:order-1">
                    <div className="font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--accent-strong)]">
                      Step {s.n}
                    </div>
                    <h2 className="sf-heading mt-3 font-display text-[clamp(3rem,9vw,7rem)] font-semibold leading-[0.95] tracking-[-0.03em]">
                      {s.word}
                    </h2>
                    <h3 className="mt-4 font-display text-[clamp(1.25rem,2.4vw,1.9rem)] font-medium">
                      {s.title}
                    </h3>
                    <p className="mt-4 max-w-md text-[17px] leading-relaxed text-white/75">
                      {s.desc}
                    </p>
                  </div>

                  {/* visual panel */}
                  <figure className="order-1 m-0 overflow-hidden rounded-[2rem] border border-white/10 lg:order-2">
                    <div
                      className="sf-img grid aspect-[4/3] w-full place-items-center"
                      style={{ background: `linear-gradient(135deg, ${s.from} 0%, ${s.to} 100%)` }}
                    >
                      <div className="grid h-24 w-24 place-items-center rounded-3xl bg-[var(--accent)] text-[var(--on-accent)] shadow-2xl">
                        <s.icon className="h-11 w-11" aria-hidden />
                      </div>
                    </div>
                  </figure>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
