/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  TrendingUp,
  Zap,
  Check,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Reveal } from "@/components/landing/Reveal";
import { LiveYield } from "@/components/landing/LiveYield";
import { GrowthChart } from "@/components/landing/GrowthChart";
import { CountUp } from "@/components/landing/CountUp";
import { LiveChain } from "@/components/landing/LiveChain";
import { StepsFlow } from "@/components/landing/StepsFlow";
import { OrbitLogo } from "@/components/OrbitLogo";

const PROGRAM = "8LEjyrMCKukhxA4q3DRaYGfkappxRayiTPM7saZG2Kgi";
const solAcct = (a: string) => `https://solscan.io/account/${a}?cluster=devnet`;
const eyebrow = "font-mono text-[12px] font-medium uppercase tracking-[0.24em]";

const tile ="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 transition-colors duration-300 hover:border-[var(--border-strong)]";

// Each logo ships a light-strip (dark ink) and a dark-strip (white) variant;
// the render swaps on the `dark` theme class.
const LOGOS = [
  { name: "Solana", src: "/solana.svg", srcDark: "/solana-white.svg", className: "h-5 w-auto", href: "https://solana.com" },
  { name: "USDC", src: "/usdc.svg", srcDark: "/usdc-white.svg", className: "h-6 w-auto", href: "https://www.circle.com/usdc" },
  { name: "Aave", src: "/aave.svg", srcDark: "/aave-white.svg", className: "h-5 w-auto", href: "https://aave.com" },
  { name: "Plaid", src: "/plaid.svg", srcDark: "/plaid-white.svg", className: "h-7 w-auto", href: "https://plaid.com" },
  { name: "Stripe", src: "/stripe.svg", srcDark: "/stripe-white.svg", className: "h-6 w-auto", href: "https://stripe.com" },
  { name: "Phantom", src: "/phantom.svg", srcDark: "/phantom-white.svg", className: "h-6 w-auto", href: "https://phantom.app" },
];

export default function Landing() {
  // `dark` forces the dark token set on the landing (black canvas, lime accent).
  return (
    <div className="relative flex min-h-full flex-col bg-[var(--background)] text-[var(--foreground)]">
      {/* ───────── First screen: hero + logos fill one viewport ───────── */}
      <div className="flex min-h-[100svh] flex-col">
      {/* ───────── Hero (Helium-style sky gradient) — dark-scoped for light text ───────── */}
      <section
        className="dark relative isolate mx-2 mt-3 flex flex-1 flex-col overflow-hidden rounded-[2rem] text-white sm:mx-3"
        style={{ "--accent": "#35f0c6", "--accent-strong": "#5cf5d2", "--on-accent": "#06251c" } as React.CSSProperties}
      >
        {/* background image, fading into the page background at the bottom */}
        {/* full-area background image, scaled to cover the whole hero */}
        <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: "url('/hero.png')" }} aria-hidden />
        {/* even darken for centered-content legibility + fade the bottom into the page bg */}
        <div
          className="absolute inset-0 z-0"
          style={{ background: "radial-gradient(120% 90% at 50% 45%, rgba(6,9,14,0.35) 0%, rgba(6,9,14,0.62) 55%, rgba(6,9,14,0.82) 100%), linear-gradient(180deg, rgba(6,9,14,0) 72%, var(--background) 100%)" }}
          aria-hidden
        />

        {/* floating pill nav */}
        <header className="relative z-40 px-4 pt-5 sm:px-6 sm:pt-6">
          <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-3 md:grid-cols-[1fr_auto_1fr] md:gap-4">
            <div className="flex items-center gap-2 justify-self-start sm:gap-3">
              <Link href="/" aria-label="Orbit home">
                <OrbitLogo className="h-6 sm:h-7" />
              </Link>
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2.5 py-1 backdrop-blur">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/90 sm:text-[11px]">devnet</span>
              </span>
            </div>
            <nav className="hidden items-center gap-8 md:flex md:justify-self-center">
              <a href="#deck" className="text-[14px] text-white/80 transition-colors hover:text-white">Product</a>
              <a href="#proof" className="text-[14px] text-white/80 transition-colors hover:text-white">On-chain</a>
              <a href="#faq" className="text-[14px] text-white/80 transition-colors hover:text-white">FAQ</a>
            </nav>
            <Link href="/app" className="inline-flex items-center gap-1.5 justify-self-end rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-[#0a0a0a] transition-opacity hover:opacity-90 sm:px-5 sm:text-[14px]">
              Get started <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </header>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-6 sm:py-6">
        {/* centered copy */}
        <div className="mx-auto max-w-5xl text-center">
          <Reveal delay={80}>
            <h1 className="mx-auto mt-5 max-w-5xl font-display text-[clamp(2.4rem,9vw,7rem)] font-semibold leading-[1.08] tracking-[-0.03em] sm:tracking-[-0.04em]">
              Money that grows itself.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mx-auto mt-5 max-w-lg text-[clamp(1rem,2.4vw,1.2rem)] leading-relaxed text-white/80">
              Orbit saves a slice of everyday spending and grows it with on-chain USDC yield — self-custodial, withdraw anytime.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link href="/app" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-7 text-[16px] font-semibold text-[#0a0a0a] transition-opacity hover:opacity-90 sm:w-auto">
                Open your vault <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <a href="#proof" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/30 px-6 text-[16px] font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto">
                See it on-chain
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-mono uppercase">live</span>
              </a>
            </div>
          </Reveal>
        </div>

        </div>
      </section>

      {/* ───────── Partner logos — centered, static ───────── */}
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-5xl px-5 py-8 text-center sm:px-6">
          <p className="font-mono text-[12px] uppercase tracking-[0.24em] text-[var(--faint)]">Built on</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-6 sm:mt-8 sm:gap-x-12 md:flex-nowrap md:justify-between md:gap-x-6">
            {LOGOS.map((t) => (
              <a
                key={t.name}
                href={t.href}
                target="_blank"
                rel="noreferrer"
                aria-label={t.name}
                title={t.name}
                className="inline-flex items-center opacity-80 transition-opacity hover:opacity-100"
              >
                <img src={t.src} alt={t.name} className={`${t.className} block dark:hidden`} />
                <img src={t.srcDark} alt="" aria-hidden className={`${t.className} hidden dark:block`} />
              </a>
            ))}
          </div>
        </div>
      </section>
      </div>

      {/* ───────── How it works: pinned slide flow ───────── */}
      <StepsFlow />

      {/* ───────── Charts & APY ───────── */}
      <section id="deck" className="mx-auto w-full max-w-7xl scroll-mt-20 px-6 py-14 lg:py-16">
        <Reveal>
          <div className={`${eyebrow} text-[var(--faint)]`}>Your money at work</div>
          <h2 className="mt-4 max-w-2xl font-display text-[clamp(1.8rem,3.5vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.02em]">
            Idle cash falls behind.
          </h2>
        </Reveal>
        {/* Chart + APY combined into one Statistics-style card */}
        <Reveal className="mt-10 block">
          <div className={tile}>
            {/* top bar: title + period selector */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="font-display text-[clamp(1.4rem,2.6vw,2rem)] font-semibold tracking-[-0.02em]">Your money, working</h3>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3.5 py-1.5 text-[13px] text-[var(--muted)]">
                  <ChevronLeft className="h-3.5 w-3.5" aria-hidden /> 5 years <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--foreground)] text-[var(--background)]">
                  <TrendingUp className="h-4 w-4" aria-hidden />
                </span>
              </div>
            </div>

            {/* projected-balance callout (the reference's value tooltip) */}
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--foreground)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--background)]">
              <span className="h-2 w-2 rounded-full bg-[var(--accent)]" aria-hidden />
              Projected <span className="font-mono tabular-nums"><LiveYield principal={5980} apy={0.06} /></span>
            </div>

            {/* chart */}
            <div className="mt-5" style={{ "--chart-line": "var(--foreground)", "--chart-ring": "var(--surface)" } as React.CSSProperties}>
              <GrowthChart />
            </div>

            {/* legend */}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-[var(--muted)]">
              <span className="flex items-center gap-2"><span className="h-[3px] w-4 rounded-full bg-[var(--foreground)]" /> Your vault</span>
              <span className="flex items-center gap-2"><span className="h-0 w-4 border-t-2 border-dashed border-[var(--border-strong)]" /> Cash left idle</span>
            </div>

            {/* divider + bottom stats (the APY, income/expenses style) */}
            <div className="mt-7 grid grid-cols-1 gap-6 border-t border-[var(--border)] pt-6 sm:grid-cols-2">
              <div>
                <div className="text-[14px] text-[var(--muted)]">Orbit vault · APY</div>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="font-display text-[clamp(1.9rem,4.5vw,2.75rem)] font-semibold leading-none">
                    <CountUp value={6} decimals={1} suffix="%" />
                  </span>
                  <span className="inline-flex items-center gap-1 text-[14px] font-medium text-[var(--success)]"><ArrowUp className="h-4 w-4" aria-hidden /> grows</span>
                </div>
              </div>
              <div>
                <div className="text-[14px] text-[var(--muted)]">Cash left idle</div>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="font-display text-[clamp(1.9rem,4.5vw,2.75rem)] font-semibold leading-none tabular-nums">0.01%</span>
                  <span className="inline-flex items-center gap-1 text-[14px] font-medium text-[var(--destructive)]"><ArrowDown className="h-4 w-4" aria-hidden /> falls behind</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ───────── Features ───────── */}
      <section id="features" className="mx-auto w-full max-w-7xl scroll-mt-20 border-t border-[var(--border)] px-6 py-20 lg:py-24">
        <Reveal>
          <div className={`${eyebrow} text-[var(--faint)]`}>Why Orbit</div>
          <h2 className="mt-4 max-w-2xl font-display text-[clamp(1.8rem,3.5vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.02em]">
            Saving that runs itself.
          </h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* three feature tiles */}
          {[
            { icon: Zap, t: "Automatic", d: "Set a rate once; Orbit saves from every purchase and moves it on-chain at your threshold.", img: "/illustrations/automatic.svg" },
            { icon: ShieldCheck, t: "Self-custody", d: "Orbit can add to your vault but never move or freeze it. Only your wallet signs.", img: "/illustrations/self-custody.svg" },
            { icon: RefreshCw, t: "Withdraw anytime", d: "No lock-ups, no fees, no minimums. One tap returns your balance plus earnings.", img: "/illustrations/withdraw.svg" },
          ].map((f) => (
            <Reveal key={f.t}>
              <div className="h-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                {/* media panel — illustration, or icon fallback */}
                <div className="grid aspect-[4/3] place-items-center border-b border-[var(--border)] bg-[var(--background)]">
                  {f.img ? (
                    <img src={f.img} alt="" aria-hidden className="h-full w-full object-contain p-3" />
                  ) : (
                    <f.icon className="h-12 w-12 text-[var(--muted)]" aria-hidden />
                  )}
                </div>
                <div className="p-6">
                  <h3 className="font-display text-lg font-semibold">{f.t}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-[var(--muted)]">{f.d}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── On-chain vault ───────── */}
      <section className="mx-auto w-full max-w-7xl scroll-mt-20 border-t border-[var(--border)] px-6 py-20 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
          <Reveal>
            <div className={`${eyebrow} text-[var(--faint)]`}>On-chain</div>
            <h2 className="mt-4 max-w-md font-display text-[clamp(1.8rem,3.5vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.02em]">
              Every move is verifiable.
            </h2>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-[var(--muted)]">
              Your savings live in a USDC vault on Solana that only you can open. Every deposit, yield payment, and withdrawal is public and provable.
            </p>
          </Reveal>
          <Reveal delay={80}>
            <img
              src="/illustrations/secure-payment.jpg"
              alt="Isometric illustration of a secure on-chain vault — servers, locks, and keys protecting payments"
              className="mx-auto w-full max-w-lg"
              loading="lazy"
            />
          </Reveal>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* on-chain proof */}
          <Reveal className="lg:col-span-8">
            <div id="proof" className={`${tile} h-full scroll-mt-20`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[14px] font-medium text-[var(--accent)]">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--accent)] text-[var(--on-accent)]"><Check className="h-3 w-3" aria-hidden /></span>
                  Verified on-chain
                </div>
                <a href={solAcct(PROGRAM)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--accent)] hover:underline">
                  Solscan <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              </div>
              <div className="mt-4 rounded-lg bg-[var(--background)] px-4 py-3">
                <LiveChain />
              </div>
              <div className="mt-4 grid gap-3 font-mono text-[15px] tabular-nums sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border border-[var(--border)] px-4 py-3">
                  <span className="text-[var(--muted)]">deposited</span><span>1,000,000.00</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[var(--accent-soft)] bg-[var(--accent-soft)] px-4 py-3">
                  <span className="text-[var(--accent)]">withdrew</span><span className="text-[var(--accent)]">1,000,000.03</span>
                </div>
              </div>
              <div className="mt-4 truncate rounded-lg bg-[var(--background)] px-4 py-3 font-mono text-[13px] text-[var(--muted)]">
                program <span className="text-[var(--foreground)]">{PROGRAM}</span>
              </div>
            </div>
          </Reveal>

          {/* set-aside rule */}
          <Reveal className="lg:col-span-4">
            <div className={`${tile} flex h-full flex-col justify-between`}>
              <div className={`${eyebrow} text-[var(--faint)]`}>The rule</div>
              <div className="mt-6">
                <div className="font-mono text-[clamp(2rem,6vw,3rem)] font-semibold leading-none text-[var(--accent)]">0.5–5%</div>
                <p className="mt-3 text-[14px] leading-relaxed text-[var(--muted)]">of every purchase, your pick. Spend $50 at 1% → <span className="font-mono text-[var(--foreground)]">$0.50</span> set aside.</p>
              </div>
            </div>
          </Reveal>

        </div>
      </section>

      {/* ───────── FAQ (two-column) ───────── */}
      <section id="faq" className="mx-auto w-full max-w-6xl scroll-mt-20 px-6 py-24 lg:py-28">
        <Reveal>
          <div className={`${eyebrow} text-[var(--accent)]`}>FAQ</div>
          <h2 className="mt-4 font-display text-[clamp(1.9rem,4vw,3rem)] font-medium tracking-[-0.03em]">Good questions</h2>
        </Reveal>
        <Reveal delay={80} className="mt-10 grid grid-cols-1 gap-x-10 md:grid-cols-2">
          {[
            { q: "Is my money safe?", a: "Your savings live in a vault only you can open — Orbit can add to it, but can never take anything out. It all sits on Solana, so you can check your balance yourself anytime." },
            { q: "How much does Orbit set aside?", a: "A small percentage of each purchase — you pick the rate, 0.5% to 5%. Spend $50 at 1% and 50 cents gets set aside. Nothing leaves your bank until it adds up to a small batch." },
            { q: "Can I take my money out anytime?", a: "Anytime, instantly. No lock-ups, no penalties. One tap sends your full balance back, plus whatever it has earned." },
            { q: "Do I need to know crypto?", a: "Not a thing. Sign in and Orbit sets up your account — no wallet to install, no seed phrase. Prefer Phantom or Solflare? Connect those instead." },
            { q: "How does my money grow?", a: "It earns interest on-chain, paid in real tokens. On mainnet that runs through Aave, one of the most-audited lending markets in crypto. Rates move with the market." },
            { q: "Is Orbit a bank?", a: "No — not a bank, not FDIC-insured. Your money is USDC in your own on-chain vault. Because it's a real investment, your balance can move and returns aren't guaranteed." },
          ].map((f) => (
            <details key={f.q} className="group border-b border-[var(--border)] py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-[16px] font-medium transition-colors hover:text-[var(--accent)] focus-visible:outline-none">
                {f.q}
                <span className="ml-4 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[var(--border-strong)] text-[var(--muted)] transition-transform duration-200 group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="pb-6 pr-6 text-[15px] leading-relaxed text-[var(--muted)]">{f.a}</p>
            </details>
          ))}
        </Reveal>
      </section>

      {/* ───────── CTA + Footer: one floating panel over the hero bg ───────── */}
      <section
        className="dark relative isolate mx-2 mb-3 mt-6 flex flex-col overflow-hidden rounded-[2rem] text-white sm:mx-3"
        style={{ "--accent": "#35f0c6", "--on-accent": "#06251c" } as React.CSSProperties}
      >
        {/* cosmic background (same as the hero) + legibility scrim */}
        <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: "url('/hero.png')" }} aria-hidden />
        <div
          className="absolute inset-0 z-0"
          style={{ background: "radial-gradient(120% 90% at 50% 25%, rgba(6,9,14,0.55) 0%, rgba(6,9,14,0.8) 62%, rgba(6,9,14,0.92) 100%)" }}
          aria-hidden
        />

        {/* CTA */}
        <div className="relative z-10 mx-auto max-w-3xl px-6 py-14 text-center lg:py-16">
          <Reveal>
            <h2 className="mx-auto max-w-xl font-display text-[clamp(2rem,4.2vw,3.25rem)] font-medium leading-[1.0] tracking-[-0.03em]">
              Put your money in orbit.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[16px] text-white/75">
              Under a minute to start. No wallet needed, nothing locked, everything verifiable.
            </p>
            <Link href="/app" className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-[var(--accent)] px-7 text-[16px] font-semibold text-[var(--on-accent)] transition-opacity hover:opacity-90">
              Open your vault <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </Reveal>
        </div>

        {/* footer */}
        <div className="relative z-10 border-t border-white/10">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-7 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <OrbitLogo className="h-7" />
              <div className="text-[14px] text-white/70">Self-driving savings on Solana</div>
            </div>
            <div className="flex items-center gap-6 text-[15px] text-white/70">
              <a href="#deck" className="transition-colors hover:text-white">Product</a>
              <a href="#proof" className="transition-colors hover:text-white">On-chain</a>
              <Link href="/app" className="transition-colors hover:text-white">Launch app</Link>
            </div>
          </div>
          <div className="mx-auto w-full max-w-7xl px-6 pb-7">
            <p className="text-[12px] leading-5 text-white/45">
              Live on Solana devnet for demonstration. Detection, the on-chain vault, and yield are real; the
              fiat-to-USDC step is simulated. Not a bank. Not FDIC-insured. Principal is not guaranteed. Built for
              the Colosseum Crypto World&rsquo;s Fair.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
