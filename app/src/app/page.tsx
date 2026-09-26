import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Landmark,
  Coins,
  TrendingUp,
  ShieldCheck,
  Eye,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Reveal } from "@/components/landing/Reveal";
import { LiveYield } from "@/components/landing/LiveYield";
import { Underline } from "@/components/landing/Underline";
import { GrowthChart } from "@/components/landing/GrowthChart";
import { OrbitRings } from "@/components/landing/OrbitRings";
import { SolanaMark, UsdcMark, AaveMark, StripeMark, PlaidMark, PhantomMark } from "@/components/landing/BrandMarks";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { OrbitLogo } from "@/components/OrbitLogo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PROGRAM = "8LEjyrMCKukhxA4q3DRaYGfkappxRayiTPM7saZG2Kgi";
const solAcct = (a: string) => `https://solscan.io/account/${a}?cluster=devnet`;

const eyebrow = "text-[12px] font-medium uppercase tracking-[0.22em]";

export default function Landing() {
  return (
    <div className="relative flex min-h-full flex-col">
      <SiteHeader />

      {/* ───────── Hero ───────── */}
      <section className="relative -mt-20 flex min-h-[94vh] flex-col items-center justify-center overflow-hidden px-6 pb-16 pt-32 text-center">
        <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
          <OrbitRings className="h-[135vh] w-[135vh] max-w-none text-[var(--foreground)] opacity-[0.05]" />
          <div
            className="absolute inset-x-0 bottom-0 h-40"
            style={{ background: "linear-gradient(180deg, transparent, var(--background))" }}
          />
        </div>

        <Reveal>
          <Badge variant="accent">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" aria-hidden /> Live on Solana devnet
          </Badge>
        </Reveal>

        <Reveal delay={80}>
          <h1 className="mt-7 max-w-4xl font-display text-[clamp(2.6rem,7vw,5.5rem)] font-semibold leading-[0.96] tracking-[-0.04em]">
            Money that saves,
            <br />
            invests, and <Underline>grows</Underline> itself.
          </h1>
        </Reveal>

        <Reveal delay={160}>
          <p className="mt-6 max-w-md text-[16px] leading-relaxed text-[var(--muted)]">
            Orbit sets aside a little from everyday spending, invests it on-chain, and grows it. Hands-free.
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
              <a href="#how">See how it works</a>
            </Button>
          </div>
        </Reveal>
      </section>

      {/* ───────── Live vault number ───────── */}
      <section className="mx-auto w-full max-w-5xl overflow-hidden px-6 pb-24 text-center">
        <Reveal>
          <div className={`${eyebrow} text-[var(--faint)]`}>Vault · Devnet · live</div>
          <div className="mt-5 font-mono text-[clamp(2rem,7vw,4.5rem)] font-semibold tracking-[-0.02em]">
            <LiveYield principal={5980} apy={0.06} />
          </div>
          <div className="mt-4 text-[14px] text-[var(--muted)]">
            A real on-chain balance, compounding every second at 6% APY.
          </div>
        </Reveal>
      </section>

      {/* ───────── Trust band (hairline, seamless) ───────── */}
      <section className="border-y border-[var(--border)]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-y divide-[var(--border)] sm:grid-cols-4 sm:divide-y-0">
          {[
            { icon: ShieldCheck, k: "Non-custodial", v: "You hold the keys" },
            { icon: Eye, k: "Transparent", v: "Every dollar on-chain" },
            { icon: RefreshCw, k: "Liquid", v: "Withdraw anytime" },
            { icon: TrendingUp, k: "Productive", v: "Earns real yield" },
          ].map((p) => (
            <div key={p.k} className="flex items-center gap-3 px-6 py-6">
              <p.icon className="h-5 w-5 shrink-0 text-[var(--foreground)]" aria-hidden />
              <div>
                <div className="text-[14px] font-medium">{p.k}</div>
                <div className="text-[13px] text-[var(--muted)]">{p.v}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── How it works ───────── */}
      <section id="how" className="mx-auto w-full max-w-6xl scroll-mt-20 px-6 py-24 lg:py-32">
        <Reveal>
          <div className={`${eyebrow} text-[var(--faint)]`}>How it works</div>
          <h2 className="mt-4 max-w-2xl font-display text-[clamp(1.9rem,4vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
            Three steps. Then nothing.
          </h2>
        </Reveal>
        <div className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-3">
          {[
            { n: "01", icon: Landmark, t: "You spend", d: "Connect your bank. Orbit watches through Plaid. It never touches your money." },
            { n: "02", icon: Coins, t: "Orbit invests", d: "A little per purchase, converted to USDC and deposited into your on-chain vault." },
            { n: "03", icon: TrendingUp, t: "It grows", d: "Real yield, paid in tokens. Withdraw principal plus interest in one tap, anytime." },
          ].map((s, i) => (
            <Reveal key={s.n} delay={i * 90}>
              <div className="border-t border-[var(--border-strong)] pt-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[14px] text-[var(--muted)]">{s.n}</span>
                  <s.icon className="h-5 w-5 text-[var(--accent)]" aria-hidden />
                </div>
                <h3 className="mt-8 font-display text-xl font-semibold tracking-tight">{s.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── The output: growth chart ───────── */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-24 lg:pb-32">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <Reveal>
            <div className={`${eyebrow} text-[var(--accent-strong)]`}>The output</div>
            <h2 className="mt-4 font-display text-[clamp(1.9rem,4vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
              Idle cash loses.
              <br />
              Yours grows.
            </h2>
            <p className="mt-5 max-w-sm text-[16px] leading-relaxed text-[var(--muted)]">
              The same money, left in a bank versus working in Orbit. Real on-chain yield, compounding every second.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-6">
              {[
                { v: "6%", l: "APY" },
                { v: "$0", l: "lock-ups" },
                { v: "1-tap", l: "exit" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="font-mono text-[clamp(1.4rem,3vw,2rem)] font-semibold">{s.v}</div>
                  <div className={`mt-1 ${eyebrow} text-[var(--faint)]`}>{s.l}</div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-7">
              <div className="flex items-end justify-between">
                <div>
                  <div className={`${eyebrow} text-[var(--faint)]`}>Vault balance</div>
                  <div className="mt-2 font-mono text-[clamp(1.6rem,4vw,2.4rem)] font-semibold leading-none">
                    <LiveYield principal={5980} apy={0.06} />
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2 py-1 text-[13px] font-medium text-[var(--accent-strong)]">
                  <TrendingUp className="h-3.5 w-3.5" aria-hidden /> 6.0%
                </span>
              </div>
              <div className="mt-6">
                <GrowthChart />
              </div>
              <div className="mt-4 flex items-center gap-5 text-[13px] text-[var(--muted)]">
                <span className="flex items-center gap-2">
                  <span className="h-[3px] w-4 rounded-full bg-[var(--accent)]" /> Your vault
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-0 w-4 border-t-2 border-dashed border-[var(--border-strong)]" /> Cash left idle
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────── Inverted band: the set-aside rule ───────── */}
      <section className="bg-[var(--contrast)] text-[var(--contrast-fg)]">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 lg:grid-cols-2 lg:items-center lg:py-28">
          <Reveal>
            <div className={`${eyebrow}`} style={{ color: "var(--accent)" }}>Automatic</div>
            <h2 className="mt-4 font-display text-[clamp(1.9rem,4vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
              It saves on every purchase.
            </h2>
            <p className="mt-5 max-w-sm text-[16px] leading-relaxed" style={{ color: "var(--contrast-muted)" }}>
              A small set-aside scales with what you spend. You never decide to save; it just happens.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border" style={{ borderColor: "var(--contrast-border)", backgroundColor: "var(--contrast-border)" }}>
              {[
                { spend: "Over $100", set: "$5" },
                { spend: "Over $500", set: "$10" },
              ].map((t) => (
                <div key={t.spend} className="p-8" style={{ backgroundColor: "var(--contrast)" }}>
                  <div className={`${eyebrow}`} style={{ color: "var(--contrast-muted)" }}>{t.spend}</div>
                  <div className="mt-3 font-mono text-[clamp(2.4rem,6vw,4rem)] font-semibold leading-none text-[var(--accent)]">
                    {t.set}
                  </div>
                  <div className="mt-2 text-[13px]" style={{ color: "var(--contrast-muted)" }}>set aside</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────── Built on ───────── */}
      <section className="mx-auto w-full max-w-6xl px-6 py-24 lg:py-28">
        <Reveal>
          <div className={`${eyebrow} text-[var(--faint)]`}>Built on</div>
          <h2 className="mt-4 max-w-2xl font-display text-[clamp(1.7rem,3.5vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
            The rails the rest of finance runs on.
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <div className="mt-12 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--border)] md:grid-cols-6">
            {[
              { mark: <SolanaMark className="h-11 w-11" />, name: "Solana" },
              { mark: <UsdcMark className="h-11 w-11" />, name: "USDC" },
              { mark: <AaveMark className="h-11 w-11" />, name: "Aave" },
              { mark: <PlaidMark className="h-10 w-10 text-[var(--foreground)]" />, name: "Plaid" },
              { mark: <StripeMark className="h-11 w-11" />, name: "Stripe" },
              { mark: <PhantomMark className="h-10 w-10 text-[#ab9ff2]" />, name: "Phantom" },
            ].map((t) => (
              <div key={t.name} className="flex flex-col items-center gap-3 bg-[var(--background)] py-8">
                <span className="grid h-12 w-12 place-items-center">{t.mark}</span>
                <span className="text-[14px] text-[var(--muted)]">{t.name}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ───────── On-chain proof ───────── */}
      <section id="proof" className="border-t border-[var(--border)]">
        <div className="mx-auto grid w-full max-w-6xl scroll-mt-20 gap-12 px-6 py-24 lg:grid-cols-2 lg:items-center lg:py-32">
          <Reveal>
            <div className={`${eyebrow} text-[var(--accent-strong)]`}>Verifiable</div>
            <h2 className="mt-4 font-display text-[clamp(1.9rem,4vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
              Don&rsquo;t trust it. Check it.
            </h2>
            <p className="mt-5 max-w-sm text-[16px] leading-relaxed text-[var(--muted)]">
              A live Solana program. The vault, deposits, and yield are all on-chain and open to inspect.
            </p>
            <a
              href={solAcct(PROGRAM)}
              target="_blank"
              rel="noreferrer"
              className="mt-7 inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 transition-colors hover:border-[var(--border-strong)]"
            >
              <span className="min-w-0">
                <span className={`block ${eyebrow} text-[var(--faint)]`}>Vault program</span>
                <code className="mt-1 block truncate font-mono text-[14px]">{PROGRAM}</code>
              </span>
              <ExternalLink className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden />
            </a>
          </Reveal>

          <Reveal delay={100}>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7">
              <div className={`${eyebrow} text-[var(--faint)]`}>Proven on-chain</div>
              <div className="mt-5 space-y-3 font-mono text-[15px] tabular-nums">
                <div className="flex items-center justify-between rounded-lg border border-[var(--border)] px-4 py-3">
                  <span className="text-[var(--muted)]">deposited</span>
                  <span>1,000,000.00</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[var(--accent-soft)] bg-[var(--accent-soft)] px-4 py-3">
                  <span className="text-[var(--accent-strong)]">withdrew</span>
                  <span className="text-[var(--accent-strong)]">1,000,000.03</span>
                </div>
              </div>
              <p className="mt-4 text-[13px] text-[var(--muted)]">
                Real interest, paid in tokens. Withdrew more than deposited.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section id="faq" className="mx-auto w-full max-w-3xl scroll-mt-20 px-6 py-24 lg:py-32">
        <Reveal>
          <h2 className="font-display text-[clamp(1.9rem,4vw,3rem)] font-semibold tracking-[-0.03em]">Questions</h2>
        </Reveal>
        <Reveal delay={80} className="mt-10 divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {[
            { q: "Can Orbit take my money?", a: "No. The vault is self-custodial; only your key can withdraw. Orbit can add funds, never remove them." },
            { q: "Can I withdraw anytime?", a: "Yes. No lock-ups or penalties. One tap returns your full balance plus yield." },
            { q: "Do I need a crypto wallet?", a: "No. Create an account in one tap, no seed phrase. Or connect Phantom or Solflare." },
            { q: "Where does the yield come from?", a: "An on-chain reserve paying interest in real tokens. On mainnet this routes to Aave, the largest lending market in DeFi." },
          ].map((f) => (
            <details key={f.q} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-[16px] font-medium transition-colors hover:text-[var(--accent-strong)] focus-visible:outline-none">
                {f.q}
                <span className="ml-4 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[var(--border-strong)] text-[var(--muted)] transition-transform duration-200 group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="pb-6 pr-10 text-[15px] leading-relaxed text-[var(--muted)]">{f.a}</p>
            </details>
          ))}
        </Reveal>
      </section>

      {/* ───────── CTA (inverted band) ───────── */}
      <section className="relative overflow-hidden bg-[var(--contrast)] text-[var(--contrast-fg)]">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <OrbitRings className="h-[120vh] w-[120vh] max-w-none opacity-[0.06]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-6 py-28 text-center lg:py-36">
          <Reveal>
            <h2 className="mx-auto max-w-xl font-display text-[clamp(2.2rem,5vw,4rem)] font-semibold leading-[1.0] tracking-[-0.03em]">
              Put your money in orbit.
            </h2>
            <p className="mx-auto mt-5 max-w-md text-[16px]" style={{ color: "var(--contrast-muted)" }}>
              Under a minute to start. No wallet needed, nothing locked, everything verifiable.
            </p>
            <Link
              href="/app"
              className="mt-9 inline-flex h-12 items-center gap-2 rounded-full bg-[var(--accent)] px-7 text-[16px] font-semibold text-white transition-opacity duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--contrast)]"
            >
              Open your vault <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ───────── Footer ───────── */}
      <footer className="mt-auto border-t border-[var(--border)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <OrbitLogo className="h-7" />
            <div className="text-[13px] text-[var(--muted)]">Self-driving savings on Solana</div>
          </div>
          <div className="flex items-center gap-6 text-[14px] text-[var(--muted)]">
            <a href="#how" className="transition-colors hover:text-[var(--foreground)]">How it works</a>
            <a href="#proof" className="transition-colors hover:text-[var(--foreground)]">On-chain</a>
            <Link href="/app" className="transition-colors hover:text-[var(--foreground)]">Launch app</Link>
          </div>
        </div>
        <div className="mx-auto w-full max-w-6xl px-6 pb-10">
          <p className="text-[12px] leading-5 text-[var(--faint)]">
            Live on Solana devnet for demonstration. Detection, the on-chain vault, and yield are real; the
            fiat-to-USDC step is simulated. Not a bank. Not FDIC-insured. Principal is not guaranteed. Built for
            the Colosseum Crypto World&rsquo;s Fair.
          </p>
        </div>
      </footer>
    </div>
  );
}
