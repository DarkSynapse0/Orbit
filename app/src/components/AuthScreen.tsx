"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, TrendingUp, Landmark } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { OrbitRings } from "@/components/landing/OrbitRings";
import { OrbitLogo } from "@/components/OrbitLogo";
import { ThemeToggle } from "@/components/ThemeToggle";

// Full-screen sign-in / sign-up gate for the dashboard. Google OAuth covers both
// (Google creates the account on first continue), so there is one flow, not two
// forms. We render Google's own branded button when GSI is ready; otherwise a
// token-styled fallback that still signs in (demo account when no client id).
export function AuthScreen() {
  const { googleReady, hasGoogle, error, renderGoogleButton, signInWithGoogle, signInDemo } = useAuth();
  const btnRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    if (googleReady && btnRef.current) renderGoogleButton(btnRef.current);
  }, [googleReady, renderGoogleButton]);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      {/* Brand motif, quiet in the background */}
      <div aria-hidden className="pointer-events-none absolute -right-40 top-1/2 hidden -translate-y-1/2 opacity-[0.35] md:block">
        <OrbitRings className="h-[46rem] w-[46rem] text-[var(--faint)]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <Link href="/" className="flex items-center text-[var(--foreground)]" aria-label="Orbit home">
          <OrbitLogo className="h-8" />
        </Link>
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex flex-1 items-center px-6 md:px-10">
        <div className="mx-auto grid w-full max-w-5xl items-center gap-12 md:grid-cols-2">
          {/* Left: the pitch, so the screen isn't a bare form */}
          <div className="hidden md:block">
            <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight">
              Money that saves,
              <br /> invests, and grows
              <br /> itself.
            </h1>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-[var(--muted)]">
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

          {/* Right: the auth card */}
          <div className="mx-auto w-full max-w-sm">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 shadow-sm">
              <div className="flex rounded-full border border-[var(--border)] p-1 text-sm font-medium">
                <button
                  onClick={() => setMode("signin")}
                  className={`flex-1 rounded-full px-4 py-1.5 transition-colors ${
                    mode === "signin" ? "bg-[var(--contrast)] text-[var(--contrast-fg)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Sign in
                </button>
                <button
                  onClick={() => setMode("signup")}
                  className={`flex-1 rounded-full px-4 py-1.5 transition-colors ${
                    mode === "signup" ? "bg-[var(--contrast)] text-[var(--contrast-fg)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Create account
                </button>
              </div>

              <h2 className="mt-6 font-display text-xl font-semibold tracking-tight">
                {mode === "signin" ? "Welcome back" : "Get started with Orbit"}
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {mode === "signin"
                  ? "Sign in to reach your savings dashboard."
                  : "Create your account, connect a vault, and start growing."}
              </p>

              <div className="mt-6">
                {/* Google's own branded button, when the script is ready */}
                <div ref={btnRef} className={googleReady ? "flex justify-center [color-scheme:light]" : "hidden"} />
                {!googleReady && (
                  <button
                    onClick={signInWithGoogle}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--background)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--faint)]"
                  >
                    <GoogleGlyph /> Continue with Google
                  </button>
                )}
              </div>

              {error && (
                <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] leading-relaxed text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}

              <div className="my-5 flex items-center gap-3 text-xs text-[var(--muted)]">
                <span className="h-px flex-1 bg-[var(--border)]" />
                or
                <span className="h-px flex-1 bg-[var(--border)]" />
              </div>

              <button
                onClick={signInDemo}
                className="w-full rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--on-accent)] transition-opacity hover:opacity-90"
              >
                Continue with a demo account
              </button>
              <p className="mt-2 text-center text-xs text-[var(--muted)]">
                Explore the full dashboard, no sign-up needed.
              </p>

              <p className="mt-6 text-center text-[11px] leading-relaxed text-[var(--muted)]">
                By continuing you agree to Orbit&apos;s Terms and Privacy Policy.
                {!hasGoogle && " Google sign-in is not configured, so the demo account is used."}
              </p>
            </div>

            <Link
              href="/"
              className="mt-5 flex items-center justify-center gap-1.5 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              <ArrowLeft className="h-4 w-4" /> Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function Feature({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--accent)]">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-[var(--muted)]">
        <span className="font-medium text-[var(--foreground)]">{title}.</span> {children}
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
