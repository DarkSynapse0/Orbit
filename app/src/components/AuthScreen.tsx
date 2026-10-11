"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, TrendingUp, Landmark } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { OrbitLogo } from "@/components/common/OrbitLogo";
import { DemoBanner } from "@/components/landing/DemoBanner";

const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition-colors focus:border-white/40";

// Full-screen sign-in / sign-up gate for the dashboard, set on the same floating
// cosmic panel as the landing hero (hero.webp + scrim + aurora glows), dark-scoped
// so the copy and the frosted auth card read as light-on-dark. Google OAuth covers
// both sign-in and sign-up (Google creates the account on first continue), so there
// is one flow, not two forms.
export function AuthScreen() {
  const { googleReady, hasApple, error, renderGoogleButton, signInWithGoogle, signInWithApple, signInEmail, signUpEmail, signInDemo } = useAuth();
  const btnRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (googleReady && btnRef.current) renderGoogleButton(btnRef.current);
  }, [googleReady, renderGoogleButton]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    if (mode === "signin") await signInEmail(email.trim(), password);
    else await signUpEmail(email.trim(), password, name.trim() || undefined);
    setSubmitting(false);
  }

  return (
    <div className="flex min-h-[100svh] flex-col bg-[var(--background)]">
      <DemoBanner />
      <section
        className="dark relative isolate mx-2 mb-3 mt-3 flex flex-1 flex-col overflow-hidden rounded-[2rem] text-white sm:mx-3"
        style={{ "--accent": "#35f0c6", "--accent-strong": "#5cf5d2", "--on-accent": "#06251c" } as React.CSSProperties}
      >
        {/* same floating cosmic image as the hero — static, no motion */}
        <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: "url('/hero.webp')" }} aria-hidden />
        {/* darken for legibility */}
        <div
          className="absolute inset-0 z-0"
          style={{ background: "radial-gradient(120% 90% at 50% 40%, rgba(6,9,14,0.42) 0%, rgba(6,9,14,0.72) 55%, rgba(6,9,14,0.9) 100%)" }}
          aria-hidden
        />
        {/* static aurora glows (no animation) */}
        <div className="pointer-events-none absolute -left-24 top-1/4 z-0 h-72 w-72 rounded-full bg-[var(--accent)] opacity-30 blur-[90px]" aria-hidden />
        <div className="pointer-events-none absolute -right-20 bottom-1/4 z-0 h-80 w-80 rounded-full bg-[#5b93ef] opacity-25 blur-[100px]" aria-hidden />

        {/* header */}
        <header className="relative z-20 flex items-center justify-between px-6 py-5 sm:px-10">
          <Link href="/" className="flex items-center gap-2" aria-label="Orbit home">
            <OrbitLogo className="h-8 sm:h-9" onDark />
            <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#0a0a0a]">
              beta
            </span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-white/70 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
        </header>

        {/* content */}
        <main className="relative z-10 flex flex-1 items-center px-6 py-10 sm:px-10">
          <div className="mx-auto grid w-full max-w-5xl items-center gap-12 md:grid-cols-2">
            {/* Left: the pitch, so the screen isn't a bare form */}
            <div className="hidden md:block">
              <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight lg:text-5xl">
                Money that saves,
                <br /> invests, and grows
                <br /> itself.
              </h1>
              <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/70">
                Orbit sets aside a slice of your everyday spending and puts it to work in on-chain USDC yield. You keep the keys.
              </p>
              <ul className="mt-8 space-y-4 text-sm">
                <Feature icon={Landmark} title="Bank-connected">
                  Detects spending through Plaid. Your money stays in your bank until it&apos;s ready to move.
                </Feature>
                <Feature icon={ShieldCheck} title="Self-custody">
                  Savings live in a vault only you can withdraw from. Transparent and on-chain.
                </Feature>
                <Feature icon={TrendingUp} title="Real yield">
                  Earns through audited Solana lending venues, with live rates you can see.
                </Feature>
              </ul>
            </div>

            {/* Right: the auth card, frosted glass floating on the cosmic panel */}
            <div className="mx-auto w-full max-w-sm">
              <div className="rounded-2xl border border-white/15 bg-white/[0.07] p-7 shadow-[0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                <div className="flex rounded-full border border-white/15 bg-white/5 p-1 text-sm font-medium">
                  <button
                    onClick={() => setMode("signin")}
                    className={`flex-1 rounded-full px-4 py-1.5 transition-colors ${
                      mode === "signin" ? "bg-white text-[#0a0a0a]" : "text-white/70 hover:text-white"
                    }`}
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => setMode("signup")}
                    className={`flex-1 rounded-full px-4 py-1.5 transition-colors ${
                      mode === "signup" ? "bg-white text-[#0a0a0a]" : "text-white/70 hover:text-white"
                    }`}
                  >
                    Create account
                  </button>
                </div>

                <h2 className="mt-6 font-display text-xl font-semibold tracking-tight">
                  {mode === "signin" ? "Welcome back" : "Get started with Orbit"}
                </h2>
                <p className="mt-1 text-sm text-white/60">
                  {mode === "signin"
                    ? "Sign in to reach your savings dashboard."
                    : "Create your account, connect a vault, and start growing."}
                </p>

                {/* email + password */}
                <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                  {mode === "signup" && (
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Name"
                      autoComplete="name"
                      className={inputClass}
                    />
                  )}
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    autoComplete="email"
                    className={inputClass}
                  />
                  <input
                    type="password"
                    required
                    minLength={mode === "signup" ? 8 : undefined}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "Password (8+ characters)" : "Password"}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    className={inputClass}
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {submitting ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
                  </button>
                </form>

                {error && (
                  <p className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-[12px] leading-relaxed text-red-200">
                    {error}
                  </p>
                )}

                <div className="my-5 flex items-center gap-3 text-xs text-white/50">
                  <span className="h-px flex-1 bg-white/15" />
                  or
                  <span className="h-px flex-1 bg-white/15" />
                </div>

                <div className="space-y-2.5">
                  {/* Google's own branded button, when the script is ready */}
                  <div ref={btnRef} className={googleReady ? "flex justify-center [color-scheme:light]" : "hidden"} />
                  {!googleReady && (
                    <button
                      onClick={signInWithGoogle}
                      className="flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
                    >
                      <GoogleGlyph /> Continue with Google
                    </button>
                  )}
                  {hasApple && (
                    <button
                      onClick={signInWithApple}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                    >
                      <AppleGlyph /> Continue with Apple
                    </button>
                  )}
                  <button
                    onClick={signInDemo}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
                  >
                    Continue with a demo account
                  </button>
                </div>
                <p className="mt-2 text-center text-[11px] text-white/45">Demo: explore the full dashboard, no sign-up needed.</p>

                <p className="mt-5 text-center text-[11px] leading-relaxed text-white/50">
                  By continuing you agree to Orbit&apos;s Terms and Privacy Policy.
                </p>
              </div>

              <p className="mt-5 text-center text-xs text-white/55 md:hidden">
                Self-driving savings on Solana. You keep the keys.
              </p>
            </div>
          </div>
        </main>
      </section>
    </div>
  );
}

function Feature({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3.5">
      <Icon className="mt-0.5 h-7 w-7 shrink-0 text-white" strokeWidth={1.75} />
      <span className="text-white/70">
        <span className="font-medium text-white">{title}.</span> {children}
      </span>
    </li>
  );
}

// A neutral mark for the fallback button (Google's real button carries the
// official logo when GSI is available).
function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.15 6.16-4.15Z" />
    </svg>
  );
}

function AppleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden fill="currentColor">
      <path d="M16.37 1.43c.02 1.06-.37 2.08-1.06 2.86-.72.82-1.9 1.45-2.99 1.37-.13-1.02.42-2.11 1.06-2.82.72-.8 1.98-1.4 2.99-1.41ZM20.5 17.08c-.55 1.27-.81 1.84-1.52 2.97-.98 1.57-2.37 3.53-4.09 3.54-1.52.02-1.92-.99-3.99-.98-2.07.01-2.5 1-4.03.97-1.72-.02-3.03-1.79-4.02-3.36C-.73 15.96-1.02 10.85 1.08 8.15c1.01-1.31 2.6-2.14 4.04-2.14 1.47 0 2.4.99 3.6.99 1.17 0 1.88-.99 3.6-.99 1.3 0 2.68.71 3.66 1.93-3.22 1.76-2.7 6.36.52 7.14Z" />
    </svg>
  );
}
