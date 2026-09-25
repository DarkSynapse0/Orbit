import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Orbit as OrbitIcon,
  ShieldCheck,
  Lock,
  Eye,
  RefreshCw,
  Sparkles,
  Wallet,
  TrendingUp,
  Landmark,
  CreditCard,
  Coins,
  Check,
  ExternalLink,
} from "lucide-react";
import { Reveal } from "@/components/landing/Reveal";
import { LiveYield } from "@/components/landing/LiveYield";
import { Underline } from "@/components/landing/Underline";
import { GrowthChart } from "@/components/landing/GrowthChart";
import { SolanaMark, UsdcMark, AaveMark } from "@/components/landing/BrandMarks";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PROGRAM = "8LEjyrMCKukhxA4q3DRaYGfkappxRayiTPM7saZG2Kgi";
const solAcct = (a: string) => `https://solscan.io/account/${a}?cluster=devnet`;

// Shared surface treatment for the light theme: flat, border-only cards.
const CARD = "rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-white/[0.02]";

export default function Landing() {
  return (
    <div className="relative flex min-h-full flex-col">
      {/* ───────── Nav ───────── */}
      <SiteHeader />

      {/* ───────── Hero ───────── */}
      <section className="relative -mt-20 flex min-h-[82vh] flex-col items-center justify-center overflow-hidden px-6 pb-24 pt-32 text-center">
        {/* Soft light backdrop: a single indigo glow, no dark WebGL rays. */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute left-1/2 top-[-8%] h-[38rem] w-[66rem] -translate-x-1/2 rounded-full blur-3xl"
            style={{ background: "radial-gradient(ellipse at center, rgba(99,102,241,0.18), transparent 68%)" }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-40"
            style={{ background: "linear-gradient(180deg, transparent, var(--background))" }}
          />
        </div>

        <Reveal>
          <Badge variant="accent">
            <Sparkles aria-hidden /> Early access · Solana devnet
          </Badge>
        </Reveal>

        <Reveal delay={80}>
          <h1 className="mx-auto mt-6 max-w-3xl text-[clamp(2.2rem,5vw,4rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-neutral-900 dark:text-neutral-100">
            Sit back while your money
            <br />
            saves, invests, and <Underline>grows</Underline>.
          </h1>
        </Reveal>

        <Reveal delay={160}>
          <p className="mx-auto mt-6 max-w-xl text-[clamp(0.95rem,1.55vw,1.1rem)] leading-relaxed text-neutral-600 dark:text-neutral-400">
            Most of us mean to save and never get around to it. Orbit sets aside a little from
            your everyday spending and grows it, so your money builds up on its own.
          </p>
        </Reveal>

        <Reveal delay={240}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/app">
                Open your vault <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#how">
                See how it works <ChevronRight aria-hidden />
              </a>
            </Button>
          </div>
        </Reveal>
      </section>

      {/* ───────── Live vault counter ───────── */}
      <section className="mx-auto w-full max-w-5xl overflow-hidden px-6 pb-12 text-center">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-black/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-neutral-600 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-400">
            Vault · Devnet
          </span>
          <div className="mt-6 text-[clamp(1.8rem,4.2vw,3.25rem)] font-semibold leading-none tracking-[-0.03em]">
            <LiveYield principal={48920} apy={0.06} />
          </div>
          <p className="mt-5 text-[14px] text-neutral-500">A live vault balance, growing every second at 6% APY.</p>
        </Reveal>
      </section>

      {/* ───────── Trust strip (separate cards, blends into the hero) ───────── */}
      <section className="mx-auto w-full max-w-6xl px-6">
        <Reveal className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: ShieldCheck, k: "Non-custodial", v: "You hold the keys" },
            { icon: Eye, k: "Transparent", v: "Every dollar on-chain" },
            { icon: RefreshCw, k: "Liquid", v: "Withdraw anytime" },
            { icon: TrendingUp, k: "Productive", v: "Earns real yield" },
          ].map((p) => (
            <div
              key={p.k}
              className="flex items-center gap-3 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] p-5 backdrop-blur-sm"
            >
              <p.icon className="h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-300" aria-hidden />
              <div>
                <div className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">{p.k}</div>
                <div className="text-[12px] text-neutral-500">{p.v}</div>
              </div>
            </div>
          ))}
        </Reveal>
      </section>

      {/* ───────── Data bento (Chronicle-style) ───────── */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16 lg:py-24">
        {/* Row 1: intro + big growth chart */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Reveal>
            <div className={`flex h-full flex-col justify-center p-8 lg:p-10 ${CARD}`}>
              <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">Why Orbit</span>
              <h2 className="mt-4 font-sans text-[clamp(1.8rem,3vw,2.6rem)] font-medium leading-tight tracking-[-0.02em] text-neutral-900 dark:text-neutral-100">
                Your money should be growing right now
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                Cash sitting still quietly loses to inflation. Orbit puts your savings to work the moment they
                land, in a vault only you can touch.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-4 border-t border-black/[0.08] dark:border-white/[0.08] pt-6">
                {[
                  { v: "6%", l: "APY, on-chain" },
                  { v: "$0", l: "lock-ups" },
                  { v: "1-tap", l: "withdrawals" },
                ].map((s) => (
                  <div key={s.l}>
                    <div className="text-[clamp(1.3rem,2.5vw,1.9rem)] font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">{s.v}</div>
                    <div className="mt-1 text-[12px] text-neutral-500">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className={`flex h-full flex-col overflow-hidden p-6 sm:p-7 ${CARD}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                    Vault · Devnet
                  </span>
                  <div className="mt-3 flex items-end gap-2.5">
                    <span className="text-[clamp(2rem,5vw,3rem)] font-semibold leading-none tabular-nums text-neutral-900 dark:text-neutral-100">
                      <LiveYield principal={5980} apy={0.06} />
                    </span>
                    <span className="mb-1 inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[12px] font-medium text-emerald-700 dark:text-emerald-300">
                      <TrendingUp className="h-3.5 w-3.5" aria-hidden /> 6.0% APY
                    </span>
                  </div>
                  <div className="mt-1.5 text-[12px] text-neutral-500">Balance, growing every second</div>
                </div>
                <div className="hidden gap-2 sm:flex">
                  {["Balance", "12 months"].map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1 rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] px-2.5 py-1.5 text-[12px] text-neutral-600 dark:text-neutral-400"
                    >
                      {c} <ChevronDown className="h-3 w-3" aria-hidden />
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <GrowthChart />
              </div>

              <div className="mt-4 flex items-center gap-5 text-[12px] text-neutral-600 dark:text-neutral-400">
                <span className="flex items-center gap-2">
                  <span className="h-[3px] w-4 rounded-full bg-indigo-500" /> Your vault
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-0 w-4 border-t-2 border-dashed border-black/35 dark:border-white/35" /> Cash left idle
                </span>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Row 2: set-aside dashboard + built-on grid */}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {/* Automatic set-aside */}
          <Reveal>
            <div className={`flex h-full flex-col p-6 sm:p-7 ${CARD}`}>
              <div className="rounded-2xl border border-black/[0.07] dark:border-white/[0.07] bg-black/[0.03] dark:bg-white/[0.03] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">Set aside</span>
                  <span className="inline-flex items-center gap-1 rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-white/[0.02] px-2 py-1 text-[11px] text-neutral-600 dark:text-neutral-400">
                    This year
                  </span>
                </div>
                <div className="mt-5 flex h-28 items-end gap-1.5">
                  {[45, 62, 38, 78, 52, 100, 46, 68, 58, 72, 84, 64].map((v, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-t-[3px] ${
                        v === 100 ? "bg-indigo-500" : "bg-gradient-to-t from-indigo-200 to-indigo-400"
                      }`}
                      style={{ height: `${v}%` }}
                    />
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-black/[0.08] dark:border-white/[0.08] pt-4">
                  {[
                    { v: "$620", l: "set aside" },
                    { v: "48", l: "auto-saves" },
                    { v: "+18%", l: "vs last month" },
                  ].map((s) => (
                    <div key={s.l}>
                      <div className="text-[clamp(1.1rem,2.2vw,1.5rem)] font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">{s.v}</div>
                      <div className="mt-0.5 text-[11px] text-neutral-500">{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6">
                <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">Automatic</span>
                <h3 className="mt-3 font-sans text-2xl font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">It saves itself, on every purchase</h3>
                <p className="mt-2 max-w-md text-[14px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                  Orbit sets aside a little whenever you spend: $5 over $100, $10 over $500. It adds up before you
                  notice, then moves to your vault on its own.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Built on */}
          <Reveal delay={100}>
            <div className={`flex h-full flex-col p-6 sm:p-7 ${CARD}`}>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { mark: <SolanaMark className="h-7 w-7" />, name: "Solana" },
                  { mark: <UsdcMark className="h-7 w-7" />, name: "USDC" },
                  { mark: <AaveMark className="h-7 w-7" />, name: "Aave" },
                  { mark: <Landmark className="h-6 w-6 text-neutral-700 dark:text-neutral-300" aria-hidden />, name: "Plaid" },
                  { mark: <CreditCard className="h-6 w-6 text-neutral-700 dark:text-neutral-300" aria-hidden />, name: "Stripe" },
                  { mark: <Wallet className="h-6 w-6 text-neutral-700 dark:text-neutral-300" aria-hidden />, name: "Phantom" },
                ].map((t) => (
                  <div
                    key={t.name}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-black/[0.07] dark:border-white/[0.07] bg-black/[0.02] dark:bg-white/[0.02] py-5 transition-colors hover:border-black/[0.14] dark:hover:border-white/[0.14]"
                  >
                    <span className="grid h-11 w-11 place-items-center">{t.mark}</span>
                    <span className="text-[11px] text-neutral-500">{t.name}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">Built on</span>
                <h3 className="mt-3 font-sans text-2xl font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">Rails the rest of finance runs on</h3>
                <p className="mt-2 max-w-md text-[14px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                  Bank detection through Plaid, fiat on-ramp through Stripe, custody and yield on Solana with USDC
                  and Aave. Proven infrastructure, not a black box.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────── How it works ───────── */}
      <section id="how" className="mx-auto w-full max-w-6xl scroll-mt-20 px-6 py-20 lg:py-28">
        <Reveal>
          <h2 className="max-w-xl font-sans text-[clamp(1.9rem,3.5vw,2.75rem)] font-medium leading-tight tracking-[-0.02em] text-neutral-900 dark:text-neutral-100">
            From a coffee to a growing vault, without lifting a finger
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-x-10 gap-y-8 md:grid-cols-2">
          {[
            { n: "01", icon: Landmark, t: "You spend, like normal", d: "Connect your bank. Orbit watches transactions through Plaid. It never moves your money, it only notices." },
            { n: "02", icon: Coins, t: "Orbit sets a little aside", d: "Each qualifying purchase earmarks a small amount. Over $100 sets aside $5, over $500 sets aside $10. The dollars stay in your bank until they add up." },
            { n: "03", icon: RefreshCw, t: "At the threshold, it converts", d: "Once the set-asides reach the threshold, Orbit pulls the batch and converts it to USDC, ready to work." },
            { n: "04", icon: ShieldCheck, t: "It lands in your vault", d: "The USDC is deposited into your own on-chain vault, deployed into a yield reserve. Public, verifiable, yours." },
          ].map((s, i) => (
            <Reveal key={s.n} delay={i * 80}>
              <div className="flex gap-5">
                <div className="flex flex-col items-center">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-black/[0.1] dark:border-white/[0.1] bg-black/[0.03] dark:bg-white/[0.03] font-mono text-[13px] text-indigo-600 dark:text-indigo-300">
                    {s.n}
                  </span>
                  {i < 3 && <span className="mt-2 h-full w-px bg-gradient-to-b from-black/[0.14] dark:from-white/[0.14] to-transparent" aria-hidden />}
                </div>
                <div className="pb-2">
                  <div className="flex items-center gap-2">
                    <s.icon className="h-4 w-4 text-indigo-600 dark:text-indigo-300" aria-hidden />
                    <h3 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">{s.t}</h3>
                  </div>
                  <p className="mt-1.5 max-w-sm text-[14px] leading-relaxed text-neutral-600 dark:text-neutral-400">{s.d}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={120}>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] px-4 py-3 text-[13px] text-neutral-600 dark:text-neutral-400">
            <RefreshCw className="h-4 w-4 text-emerald-600 dark:text-emerald-300" aria-hidden />
            Then it grows, and you withdraw principal plus yield whenever you want.
          </div>
        </Reveal>
      </section>

      {/* ───────── Security / trust ───────── */}
      <section id="security" className="scroll-mt-20 border-y border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02]">
        <div className="mx-auto w-full max-w-6xl px-6 py-20 lg:py-28">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-[12px] text-indigo-700 dark:text-indigo-200 ring-1 ring-inset ring-indigo-500/20">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Built to be trusted
            </span>
            <h2 className="mt-5 max-w-2xl font-sans text-[clamp(1.9rem,3.5vw,2.75rem)] font-medium leading-tight tracking-[-0.02em] text-neutral-900 dark:text-neutral-100">
              The money going in is money you can always get back
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Lock, t: "Only your key withdraws", d: "The vault is self-custodial. Orbit funds it, but the program only lets the owner, you, move money out." },
              { icon: Eye, t: "Verifiable, not trusted", d: "Every deposit and the balance itself live on Solana. Check the vault on Solscan any time. No black box." },
              { icon: RefreshCw, t: "Nothing is locked", d: "No lock-up periods, no penalties. Withdraw your full balance plus yield in a single click." },
              { icon: Sparkles, t: "No wallet required", d: "New to crypto? Orbit creates a wallet for you in one tap. No seed phrase, no extension to install." },
              { icon: TrendingUp, t: "Yield you can see", d: "Interest is paid out in real tokens from an on-chain reserve. You receive more than you deposited." },
              { icon: ShieldCheck, t: "Honest by design", d: "Detection, the vault, and the yield are all real on-chain. The only simulated step is the bank-to-USDC conversion." },
            ].map((f, i) => (
              <Reveal key={f.t} delay={(i % 3) * 80}>
                <div>
                  <f.icon className="h-5 w-5 text-indigo-600 dark:text-indigo-300" aria-hidden />
                  <h3 className="mt-3 text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">{f.t}</h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-neutral-600 dark:text-neutral-400">{f.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── On-chain proof ───────── */}
      <section id="proof" className="mx-auto w-full max-w-6xl scroll-mt-20 px-6 py-20 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <Reveal>
            <h2 className="font-sans text-[clamp(1.9rem,3.5vw,2.75rem)] font-medium leading-tight tracking-[-0.02em] text-neutral-900 dark:text-neutral-100">
              Don&rsquo;t trust it. Verify it.
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-400">
              Orbit runs on a live Solana program. The vault, the deposits, and the yield are all on-chain and
              open to inspect. This isn&rsquo;t a mockup of DeFi, it is DeFi.
            </p>
            <div className="mt-7 space-y-3">
              <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] p-4">
                <div className="text-[11px] uppercase tracking-wide text-neutral-500">Vault program (devnet)</div>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <code className="truncate font-mono text-[13px] text-neutral-800 dark:text-neutral-200">{PROGRAM}</code>
                  <a
                    href={solAcct(PROGRAM)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 text-[12px] text-indigo-600 dark:text-indigo-300 transition-colors hover:text-indigo-500"
                  >
                    Solscan <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className={`p-7 ${CARD}`}>
              <div className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300">Proven on-chain</div>
              <p className="mt-1 text-[13px] text-neutral-500">A real deposit, then a real withdrawal:</p>
              <div className="mt-5 space-y-3 font-mono text-[14px] tabular-nums">
                <div className="flex items-center justify-between rounded-lg border border-black/[0.07] dark:border-white/[0.07] bg-black/[0.02] dark:bg-white/[0.02] px-4 py-3">
                  <span className="text-neutral-500">deposited</span>
                  <span className="text-neutral-800 dark:text-neutral-200">1,000,000.00</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-3">
                  <span className="text-emerald-700/80 dark:text-emerald-300/80">withdrew</span>
                  <span className="text-emerald-700 dark:text-emerald-300">1,000,000.03</span>
                </div>
              </div>
              <p className="mt-4 flex items-center gap-1.5 text-[12px] text-neutral-500">
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" aria-hidden />
                Real interest, paid out in tokens. Withdrew more than deposited.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────── Use cases ───────── */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-8">
        <div className="grid gap-4 md:grid-cols-2">
          <Reveal>
            <div className={`flex h-full flex-col p-7 ${CARD}`}>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/10 ring-1 ring-inset ring-indigo-500/20">
                <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-300" aria-hidden />
              </span>
              <h3 className="mt-5 font-sans text-xl font-medium text-neutral-900 dark:text-neutral-100">New to crypto</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                Tap once to create an account. No wallet, no seed phrase, no jargon. Orbit handles the chain so
                you just watch your savings grow.
              </p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className={`flex h-full flex-col p-7 ${CARD}`}>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/10 ring-1 ring-inset ring-indigo-500/20">
                <Wallet className="h-5 w-5 text-indigo-600 dark:text-indigo-300" aria-hidden />
              </span>
              <h3 className="mt-5 font-sans text-xl font-medium text-neutral-900 dark:text-neutral-100">Already on-chain</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                Connect Phantom or Solflare and keep full self-custody. Put idle USDC to work without handing it
                to anyone. Your keys, your vault.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section id="faq" className="mx-auto w-full max-w-3xl scroll-mt-20 px-6 py-20 lg:py-28">
        <Reveal>
          <h2 className="text-center font-sans text-[clamp(1.9rem,3.5vw,2.75rem)] font-medium tracking-[-0.02em] text-neutral-900 dark:text-neutral-100">
            Questions, answered
          </h2>
        </Reveal>
        <Reveal delay={80} className={`mt-10 divide-y divide-black/[0.08] dark:divide-white/[0.08] ${CARD}`}>
          {[
            { q: "Can Orbit take my money?", a: "No. The vault is self-custodial. The program is written so only your key can withdraw. Orbit can add funds, it can never remove them." },
            { q: "Can I withdraw anytime?", a: "Yes. There are no lock-ups or penalties. One click returns your full balance, principal plus the yield it earned, to your wallet." },
            { q: "Do I need a crypto wallet?", a: "No. You can create an account in one tap, with no seed phrase or extension. If you already use Phantom or Solflare, you can connect that instead." },
            { q: "Where does the yield come from?", a: "Your deposit is placed in an on-chain yield reserve that pays interest in real tokens. On mainnet this routes to a battle-tested lending market such as Aave, the largest lending protocol in DeFi, now live on Solana." },
            { q: "Is this real money?", a: "Today Orbit runs on Solana devnet with test USDC so you can try everything risk-free. The same code moves to mainnet with real USDC and a live bank on-ramp." },
          ].map((f) => (
            <details key={f.q} className="group px-5">
              <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-[15px] font-medium text-neutral-900 dark:text-neutral-100 transition-colors hover:text-black dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40">
                {f.q}
                <span className="ml-4 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-black/[0.12] dark:border-white/[0.12] text-neutral-500 transition-transform duration-200 group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="pb-5 pr-10 text-[14px] leading-relaxed text-neutral-600 dark:text-neutral-400">{f.a}</p>
            </details>
          ))}
        </Reveal>
      </section>

      {/* ───────── Final CTA ───────── */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-black/[0.08] dark:border-white/[0.08] bg-gradient-to-b from-indigo-500/[0.10] to-transparent px-6 py-16 text-center">
            <div
              className="pointer-events-none absolute inset-x-0 -top-1/2 h-full blur-3xl"
              style={{ background: "radial-gradient(40rem 20rem at 50% 100%, rgba(99,102,241,0.22), transparent 70%)" }}
              aria-hidden
            />
            <div className="relative">
              <h2 className="mx-auto max-w-xl font-sans text-[clamp(2rem,4.5vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.02em] text-neutral-900 dark:text-neutral-100">
                Put your money in orbit
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[15px] text-neutral-600 dark:text-neutral-400">
                Start saving in under a minute. No wallet needed, nothing locked up, everything verifiable.
              </p>
              <Link
                href="/app"
                className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-indigo-600 px-7 text-[14px] font-semibold text-white shadow-lg shadow-indigo-600/25 transition-[background,transform] duration-150 ease-out hover:bg-indigo-500 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f6fa]"
              >
                Open your vault <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ───────── Footer ───────── */}
      <footer className="mt-auto border-t border-black/[0.08] dark:border-white/[0.08]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <OrbitIcon className="h-5 w-5 text-neutral-900 dark:text-neutral-100" aria-hidden />
            <div>
              <div className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">Orbit</div>
              <div className="text-[12px] text-neutral-500">Self-driving savings on Solana</div>
            </div>
          </div>
          <div className="flex items-center gap-6 text-[13px] text-neutral-600 dark:text-neutral-400">
            <a href="#how" className="transition-colors hover:text-neutral-900 dark:hover:text-white">How it works</a>
            <a href="#security" className="transition-colors hover:text-neutral-900 dark:hover:text-white">Security</a>
            <Link href="/app" className="transition-colors hover:text-neutral-900 dark:hover:text-white">Launch app</Link>
          </div>
        </div>
        <div className="mx-auto w-full max-w-6xl px-6 pb-10">
          <p className="text-[11px] leading-5 text-neutral-500">
            Live on Solana devnet for demonstration. Detection, the on-chain vault, and yield are real; the
            fiat-to-USDC step is simulated. Not a bank. Not FDIC-insured. Principal is not guaranteed. Nothing
            here is financial advice. Built for the Colosseum Crypto World&rsquo;s Fair.
          </p>
        </div>
      </footer>
    </div>
  );
}
