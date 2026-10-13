"use client";

import { Wallet, Landmark, Sparkles, Check, ArrowRight, ChevronDown, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// First-run onboarding: a directional two-step flow (create a vault -> connect a bank)
// shown on the dashboard until the user has done both. Each step lights up as the current
// one, with a check once complete, and the arrows carry the eye from step to step.
type StepState = "done" | "active" | "todo";

function StepCard({
  n,
  state,
  icon: Icon,
  title,
  desc,
  cta,
  onCta,
}: {
  n: number;
  state: StepState;
  icon: LucideIcon;
  title: string;
  desc: string;
  cta?: string;
  onCta?: () => void;
}) {
  const done = state === "done";
  const active = state === "active";
  return (
    <div
      className={`flex flex-1 flex-col rounded-xl border p-4 transition-colors ${
        active
          ? "border-[var(--accent)] bg-[var(--accent-soft)]/40 ring-1 ring-inset ring-[var(--accent)]/40"
          : done
            ? "border-[var(--border)] bg-[var(--surface)]"
            : "border-[var(--border)] bg-[var(--surface)] opacity-70"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-semibold ${
            done
              ? "bg-[var(--accent)] text-[var(--on-accent)]"
              : active
                ? "bg-[var(--accent)] text-[var(--on-accent)]"
                : "bg-[var(--background)] text-[var(--muted)] ring-1 ring-inset ring-[var(--border-strong)]"
          }`}
        >
          {done ? <Check className="h-4 w-4" aria-hidden /> : n}
        </span>
        <div className="flex items-center gap-1.5 text-[14px] font-semibold">
          <Icon className="h-4 w-4 text-[var(--muted)]" aria-hidden />
          {title}
        </div>
      </div>
      <p className="mt-2 flex-1 text-[13px] leading-relaxed text-[var(--muted)]">{desc}</p>
      {cta &&
        (done ? (
          <div className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--accent-strong)]">
            <Check className="h-3.5 w-3.5" aria-hidden /> Done
          </div>
        ) : (
          <button
            type="button"
            onClick={onCta}
            className={`mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-semibold transition-opacity ${
              active
                ? "bg-[var(--accent)] text-[var(--on-accent)] hover:opacity-90"
                : "border border-[var(--border-strong)] text-[var(--foreground)] hover:bg-[var(--background)]"
            }`}
          >
            {cta} <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        ))}
    </div>
  );
}

// Arrow between steps — points right on desktop, down on mobile. Brightens once the
// step before it is complete, so the path visibly fills in as you go.
function Connector({ done }: { done: boolean }) {
  return (
    <div className="flex items-center justify-center md:px-1" aria-hidden>
      <ArrowRight className={`hidden h-5 w-5 md:block ${done ? "text-[var(--accent-strong)]" : "text-[var(--faint)]"}`} />
      <ChevronDown className={`h-5 w-5 md:hidden ${done ? "text-[var(--accent-strong)]" : "text-[var(--faint)]"}`} />
    </div>
  );
}

export function OnboardingFlow({
  vaultDone,
  bankDone,
  onGoVault,
  onGoBank,
  onDismiss,
}: {
  vaultDone: boolean;
  bankDone: boolean;
  onGoVault: () => void;
  onGoBank: () => void;
  onDismiss?: () => void;
}) {
  const vaultState: StepState = vaultDone ? "done" : "active";
  const bankState: StepState = bankDone ? "done" : vaultDone ? "active" : "todo";
  const startState: StepState = vaultDone && bankDone ? "active" : "todo";

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss setup"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--background)] hover:text-[var(--foreground)]"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}

      <div className="font-mono text-[12px] uppercase tracking-[0.24em] text-[var(--faint)]">Get started</div>
      <h2 className="mt-1 font-display text-[20px] font-bold">Set up Orbit in two steps</h2>
      <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-[var(--muted)]">
        Create your vault, then connect your bank. After that, just spend, Orbit sets a slice aside and grows it for you, automatically.
      </p>

      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-stretch">
        <StepCard
          n={1}
          state={vaultState}
          icon={Wallet}
          title="Create your vault"
          desc="Open your on-chain vault. One tap, no wallet or seed phrase to manage."
          cta="Create vault"
          onCta={onGoVault}
        />
        <Connector done={vaultDone} />
        <StepCard
          n={2}
          state={bankState}
          icon={Landmark}
          title="Connect your bank"
          desc="Link it read-only through Plaid so Orbit can notice spending. It can't move your money."
          cta="Connect bank"
          onCta={onGoBank}
        />
        <Connector done={bankDone} />
        <StepCard
          n={3}
          state={startState}
          icon={Sparkles}
          title="Start saving"
          desc="Spend like normal. Orbit sets a slice aside and invests it on-chain, earning yield."
        />
      </div>
    </section>
  );
}
