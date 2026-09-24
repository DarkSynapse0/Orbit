import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  Eye,
  RefreshCw,
  Sparkles,
  Wallet,
  TrendingUp,
  Landmark,
  Coins,
  Check,
  ExternalLink,
} from "lucide-react";
import { Reveal } from "@/components/landing/Reveal";
import { OrbitScene } from "@/components/landing/OrbitScene";
import { LiveYield } from "@/components/landing/LiveYield";
import { OrbitMark } from "@/components/landing/OrbitMark";

const PROGRAM = "8LEjyrMCKukhxA4q3DRaYGfkappxRayiTPM7saZG2Kgi";
const solAcct = (a: string) => `https://solscan.io/account/${a}?cluster=devnet`;

export default function Landing() {
  return (
    <div className="relative flex min-h-full flex-col">
      {/* ───────── Nav ───────── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#08080c]/70 backdrop-blur-md">
        <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60">
            <OrbitMark className="h-8 w-8" title="Orbit" />
            <span className="text-[15px] font-semibold tracking-tight">Orbit</span>
          </Link>
          <div className="hidden items-center gap-8 text-[13px] text-neutral-400 md:flex">
            <a href="#how" className="transition-colors hover:text-neutral-100">How it works</a>
            <a href="#security" className="transition-colors hover:text-neutral-100">Security</a>
            <a href="#proof" className="transition-colors hover:text-neutral-100">On-chain</a>
            <a href="#faq" className="transition-colors hover:text-neutral-100">FAQ</a>
          </div>
          <Link
            href="/app"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.06] px-4 text-[13px] font-medium text-neutral-100 ring-1 ring-inset ring-white/[0.1] transition-[background,transform] duration-150 ease-out hover:bg-white/[0.1] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70"
          >
            Launch app <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </nav>
      </header>

      {/* ───────── Hero ───────── */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 pb-16 pt-14 lg:grid-cols-2 lg:gap-8 lg:pb-28 lg:pt-24">
        <Reveal className="order-2 lg:order-1">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1 text-[12px] text-neutral-300 ring-1 ring-inset ring-white/[0.08]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden /> Live on Solana devnet
          </span>
          <h1 className="mt-5 font-serif text-[clamp(2.6rem,6vw,4.5rem)] font-medium leading-[1.02] tracking-[-0.02em]">
            Money that
            <br />
            saves <span className="italic text-indigo-300">itself.</span>
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-neutral-400">
            Orbit sets aside a little from your everyday spending and grows it with on-chain yield.
            Fully yours, verifiable on Solana, withdraw anytime.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/app"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-indigo-500 px-6 text-[14px] font-semibold text-white shadow-lg shadow-indigo-500/25 transition-[background,transform] duration-150 ease-out hover:bg-indigo-400 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080c]"
            >
              Open your vault <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <a
              href="#how"
              className="inline-flex h-12 items-center gap-2 rounded-full px-5 text-[14px] font-medium text-neutral-300 ring-1 ring-inset ring-white/[0.1] transition-colors hover:text-white hover:ring-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70"
            >
              See how it works
            </a>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-neutral-500">
            {["Self-custodial", "Verifiable on-chain", "Withdraw anytime"].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-indigo-400" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="order-1 lg:order-2" delay={120}>
          <OrbitScene />
        </Reveal>
      </section>

      {/* ───────── Trust strip ───────── */}
      <section className="mx-auto w-full max-w-6xl px-6">
        <Reveal className="grid grid-cols-2 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.06] bg-white/[0.02] sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          {[
            { icon: ShieldCheck, k: "Non-custodial", v: "You hold the keys" },
            { icon: Eye, k: "Transparent", v: "Every dollar on-chain" },
            { icon: RefreshCw, k: "Liquid", v: "Withdraw anytime" },
            { icon: TrendingUp, k: "Productive", v: "Earns real yield" },
          ].map((p) => (
            <div key={p.k} className="flex items-center gap-3 p-5">
              <p.icon className="h-5 w-5 shrink-0 text-indigo-300" aria-hidden />
              <div>
                <div className="text-[13px] font-medium text-neutral-100">{p.k}</div>
                <div className="text-[12px] text-neutral-500">{p.v}</div>
              </div>
            </div>
          ))}
        </Reveal>
      </section>

      {/* ───────── What is Orbit ───────── */}
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-20 md:grid-cols-[0.8fr_1.2fr] lg:py-28">
        <Reveal>
          <h2 className="font-serif text-[clamp(1.9rem,3.5vw,2.75rem)] font-medium leading-tight tracking-[-0.02em]">
            What is Orbit?
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <p className="text-[clamp(1.05rem,1.8vw,1.35rem)] leading-relaxed text-neutral-300">
            Saving is a habit almost nobody can keep, and most crypto &ldquo;savings&rdquo; feels like your money
            leaves and never comes back. Orbit fixes both. It quietly skims a small amount from what you already
            spend, moves it into a vault that stays <span className="text-neutral-100">yours</span>, and grows it
            with on-chain yield. The habit of an automatic saver, the transparency of an open ledger.
          </p>
        </Reveal>
      </section>

      {/* ───────── Capabilities (bento) ───────── */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-8">
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Wide: grows on-chain, with live yield */}
          <Reveal className="lg:col-span-2">
            <div className="flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-7">
              <div>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400/10 ring-1 ring-inset ring-emerald-400/20">
                  <TrendingUp className="h-5 w-5 text-emerald-300" aria-hidden />
                </span>
                <h3 className="mt-5 font-serif text-2xl font-medium tracking-[-0.01em]">It grows while it sits</h3>
                <p className="mt-2 max-w-md text-[14px] leading-relaxed text-neutral-400">
                  Your balance earns yield from an on-chain reserve, paid out in real tokens. Not a number in a
                  database. You withdraw more than you put in.
                </p>
              </div>
              <div className="mt-7 rounded-2xl border border-white/[0.06] bg-[#0a0a10]/60 p-5">
                <div className="text-[11px] uppercase tracking-wide text-neutral-500">A $10,000 vault, right now</div>
                <div className="mt-1.5 text-[clamp(1.6rem,4vw,2.4rem)] font-semibold leading-none">
                  <LiveYield principal={10_000} apy={0.06} />
                </div>
                <div className="mt-2 text-[12px] text-neutral-500">growing every second at ~6% APY</div>
              </div>
            </div>
          </Reveal>

          {/* Tall: saves itself */}
          <Reveal delay={100}>
            <div className="flex h-full flex-col rounded-3xl border border-white/[0.07] bg-white/[0.02] p-7">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/10 ring-1 ring-inset ring-indigo-400/25">
                <Sparkles className="h-5 w-5 text-indigo-300" aria-hidden />
              </span>
              <h3 className="mt-5 font-serif text-2xl font-medium tracking-[-0.01em]">It saves itself</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-neutral-400">
                Orbit watches your spending and sets aside a little on each purchase. When it adds up, it moves
                to your vault automatically. You never have to decide to save.
              </p>
              <div className="mt-auto space-y-2 pt-6 text-[13px]">
                {[
                  { a: "Spent $120", b: "+$5 set aside" },
                  { a: "Spent $640", b: "+$10 set aside" },
                ].map((r) => (
                  <div key={r.a} className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
                    <span className="text-neutral-400">{r.a}</span>
                    <span className="font-mono tabular-nums text-indigo-300">{r.b}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        {/* Wide row: always yours */}
        <Reveal className="mt-4">
          <div className="grid gap-6 rounded-3xl border border-white/[0.07] bg-white/[0.02] p-7 md:grid-cols-[auto_1fr] md:items-center md:gap-8">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-500/10 ring-1 ring-inset ring-indigo-400/25">
              <Lock className="h-6 w-6 text-indigo-300" aria-hidden />
            </span>
            <div>
              <h3 className="font-serif text-2xl font-medium tracking-[-0.01em]">It stays yours</h3>
              <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-neutral-400">
                The vault is program-controlled but owned by you. Orbit can fund it, but only your key can take
                money out. No lock-ups, no gatekeeper, no &ldquo;pending withdrawal.&rdquo; Your savings, one signature away.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ───────── How it works ───────── */}
      <section id="how" className="mx-auto w-full max-w-6xl scroll-mt-20 px-6 py-20 lg:py-28">
        <Reveal>
          <h2 className="max-w-xl font-serif text-[clamp(1.9rem,3.5vw,2.75rem)] font-medium leading-tight tracking-[-0.02em]">
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
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/[0.08] bg-white/[0.03] font-mono text-[13px] text-indigo-300">
                    {s.n}
                  </span>
                  {i < 3 && <span className="mt-2 h-full w-px bg-gradient-to-b from-white/[0.12] to-transparent" aria-hidden />}
                </div>
                <div className="pb-2">
                  <div className="flex items-center gap-2">
                    <s.icon className="h-4 w-4 text-indigo-300" aria-hidden />
                    <h3 className="text-[15px] font-semibold text-neutral-100">{s.t}</h3>
                  </div>
                  <p className="mt-1.5 max-w-sm text-[14px] leading-relaxed text-neutral-400">{s.d}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={120}>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[13px] text-neutral-400">
            <RefreshCw className="h-4 w-4 text-emerald-300" aria-hidden />
            Then it grows, and you withdraw principal plus yield whenever you want.
          </div>
        </Reveal>
      </section>

      {/* ───────── Security / trust ───────── */}
      <section id="security" className="scroll-mt-20 border-y border-white/[0.06] bg-white/[0.015]">
        <div className="mx-auto w-full max-w-6xl px-6 py-20 lg:py-28">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-[12px] text-indigo-200 ring-1 ring-inset ring-indigo-400/20">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Built to be trusted
            </span>
            <h2 className="mt-5 max-w-2xl font-serif text-[clamp(1.9rem,3.5vw,2.75rem)] font-medium leading-tight tracking-[-0.02em]">
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
                  <f.icon className="h-5 w-5 text-indigo-300" aria-hidden />
                  <h3 className="mt-3 text-[15px] font-semibold text-neutral-100">{f.t}</h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-neutral-400">{f.d}</p>
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
            <h2 className="font-serif text-[clamp(1.9rem,3.5vw,2.75rem)] font-medium leading-tight tracking-[-0.02em]">
              Don&rsquo;t trust it. Verify it.
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-neutral-400">
              Orbit runs on a live Solana program. The vault, the deposits, and the yield are all on-chain and
              open to inspect. This isn&rsquo;t a mockup of DeFi, it is DeFi.
            </p>
            <div className="mt-7 space-y-3">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="text-[11px] uppercase tracking-wide text-neutral-500">Vault program (devnet)</div>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <code className="truncate font-mono text-[13px] text-neutral-200">{PROGRAM}</code>
                  <a
                    href={solAcct(PROGRAM)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 text-[12px] text-indigo-300 transition-colors hover:text-indigo-200"
                  >
                    Solscan <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="rounded-3xl border border-white/[0.07] bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-7">
              <div className="text-[13px] font-medium text-neutral-300">Proven on-chain</div>
              <p className="mt-1 text-[13px] text-neutral-500">A real deposit, then a real withdrawal:</p>
              <div className="mt-5 space-y-3 font-mono text-[14px] tabular-nums">
                <div className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-4 py-3">
                  <span className="text-neutral-400">deposited</span>
                  <span className="text-neutral-200">1,000,000.00</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-emerald-400/15 bg-emerald-400/[0.06] px-4 py-3">
                  <span className="text-emerald-200/80">withdrew</span>
                  <span className="text-emerald-300">1,000,000.03</span>
                </div>
              </div>
              <p className="mt-4 flex items-center gap-1.5 text-[12px] text-neutral-500">
                <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
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
            <div className="flex h-full flex-col rounded-3xl border border-white/[0.07] bg-white/[0.02] p-7">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/10 ring-1 ring-inset ring-indigo-400/25">
                <Sparkles className="h-5 w-5 text-indigo-300" aria-hidden />
              </span>
              <h3 className="mt-5 font-serif text-xl font-medium">New to crypto</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-neutral-400">
                Tap once to create an account. No wallet, no seed phrase, no jargon. Orbit handles the chain so
                you just watch your savings grow.
              </p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="flex h-full flex-col rounded-3xl border border-white/[0.07] bg-white/[0.02] p-7">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/10 ring-1 ring-inset ring-indigo-400/25">
                <Wallet className="h-5 w-5 text-indigo-300" aria-hidden />
              </span>
              <h3 className="mt-5 font-serif text-xl font-medium">Already on-chain</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-neutral-400">
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
          <h2 className="text-center font-serif text-[clamp(1.9rem,3.5vw,2.75rem)] font-medium tracking-[-0.02em]">
            Questions, answered
          </h2>
        </Reveal>
        <Reveal delay={80} className="mt-10 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          {[
            { q: "Can Orbit take my money?", a: "No. The vault is self-custodial. The program is written so only your key can withdraw. Orbit can add funds, it can never remove them." },
            { q: "Can I withdraw anytime?", a: "Yes. There are no lock-ups or penalties. One click returns your full balance, principal plus the yield it earned, to your wallet." },
            { q: "Do I need a crypto wallet?", a: "No. You can create an account in one tap, with no seed phrase or extension. If you already use Phantom or Solflare, you can connect that instead." },
            { q: "Where does the yield come from?", a: "Your deposit is placed in an on-chain yield reserve that pays interest in real tokens. On mainnet this routes to an audited lending market like Kamino." },
            { q: "Is this real money?", a: "Today Orbit runs on Solana devnet with test USDC so you can try everything risk-free. The same code moves to mainnet with real USDC and a live bank on-ramp." },
          ].map((f) => (
            <details key={f.q} className="group px-5">
              <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-[15px] font-medium text-neutral-100 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40">
                {f.q}
                <span className="ml-4 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/[0.1] text-neutral-400 transition-transform duration-200 group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="pb-5 pr-10 text-[14px] leading-relaxed text-neutral-400">{f.a}</p>
            </details>
          ))}
        </Reveal>
      </section>

      {/* ───────── Final CTA ───────── */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-gradient-to-b from-indigo-500/[0.12] to-white/[0.01] px-6 py-16 text-center">
            <div
              className="pointer-events-none absolute inset-x-0 -top-1/2 h-full blur-3xl"
              style={{ background: "radial-gradient(40rem 20rem at 50% 100%, rgba(99,102,241,0.25), transparent 70%)" }}
              aria-hidden
            />
            <div className="relative">
              <h2 className="mx-auto max-w-xl font-serif text-[clamp(2rem,4.5vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.02em]">
                Put your money in orbit
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[15px] text-neutral-400">
                Start saving in under a minute. No wallet needed, nothing locked up, everything verifiable.
              </p>
              <Link
                href="/app"
                className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-indigo-500 px-7 text-[14px] font-semibold text-white shadow-lg shadow-indigo-500/25 transition-[background,transform] duration-150 ease-out hover:bg-indigo-400 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080c]"
              >
                Open your vault <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ───────── Footer ───────── */}
      <footer className="mt-auto border-t border-white/[0.06]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <OrbitMark className="h-8 w-8" title="Orbit" />
            <div>
              <div className="text-[14px] font-semibold">Orbit</div>
              <div className="text-[12px] text-neutral-500">Self-driving savings on Solana</div>
            </div>
          </div>
          <div className="flex items-center gap-6 text-[13px] text-neutral-400">
            <a href="#how" className="transition-colors hover:text-neutral-100">How it works</a>
            <a href="#security" className="transition-colors hover:text-neutral-100">Security</a>
            <Link href="/app" className="transition-colors hover:text-neutral-100">Launch app</Link>
          </div>
        </div>
        <div className="mx-auto w-full max-w-6xl px-6 pb-10">
          <p className="text-[11px] leading-5 text-neutral-600">
            Live on Solana devnet for demonstration. Detection, the on-chain vault, and yield are real; the
            fiat-to-USDC step is simulated. Not a bank. Not FDIC-insured. Principal is not guaranteed. Nothing
            here is financial advice. Built for the Colosseum Crypto World&rsquo;s Fair.
          </p>
        </div>
      </footer>
    </div>
  );
}
