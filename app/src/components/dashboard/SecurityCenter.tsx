"use client";

import {
  KeyRound,
  ShieldCheck,
  Wallet,
  Landmark,
  Building2,
  Lock,
  ExternalLink,
  ArrowUpRight,
  RotateCcw,
  LogOut,
  Eye,
  type LucideIcon,
} from "lucide-react";

const solAcct = (a: string) => `https://solscan.io/account/${a}?cluster=devnet`;

const eyebrow =
  "font-mono text-[12px] font-medium uppercase tracking-[0.24em] text-[var(--faint)]";
const CARD =
  "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-7";

// A labelled section: mono eyebrow + optional title, then children.
function Section({
  label,
  title,
  className = "",
  children,
}: {
  label: string;
  title?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${CARD} ${className}`}>
      <div className={eyebrow}>{label}</div>
      {title && (
        <h3 className="mt-1 font-display text-[16px] font-semibold tracking-[-0.02em]">
          {title}
        </h3>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}

// One security topic. Optional action renders on the right (link or button).
function Row({
  icon: Icon,
  title,
  desc,
  action,
  tone = "default",
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  action?: React.ReactNode;
  tone?: "default" | "good";
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
            tone === "good"
              ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
              : "bg-[var(--foreground)] text-[var(--background)]"
          }`}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-[var(--foreground)]">{title}</div>
          <div className="mt-0.5 text-[13px] leading-relaxed text-[var(--muted)]">{desc}</div>
        </div>
      </div>
      {action && <div className="shrink-0 pt-0.5">{action}</div>}
    </div>
  );
}

function VerifyLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-[var(--border-strong)] px-3 py-1.5 text-[13px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
    >
      {children}
      <ExternalLink className="h-3 w-3" aria-hidden />
    </a>
  );
}

// Pill, outline style — used for the subtle "Manage / Connect / Open vault" actions.
function GhostPill({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-[var(--border-strong)] px-3 py-1.5 text-[13px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]"
    >
      {children}
    </button>
  );
}

// Pill, destructive style — disconnect / sign out / reset.
function DangerPill({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--destructive)]/40 px-3.5 py-1.5 text-[13px] font-medium text-[var(--destructive)] transition-colors hover:bg-[var(--destructive-soft)]"
    >
      {children}
    </button>
  );
}

export function SecurityCenter({
  owner,
  connected,
  plaidConnected,
  programId,
  vaultAccount,
  onManageWallet,
  onDisconnectBank,
  onReset,
  onSignOut,
  signedIn,
}: {
  owner: string | null;
  connected: boolean;
  plaidConnected: boolean;
  programId: string;
  vaultAccount: string | null;
  onManageWallet: () => void;
  onDisconnectBank: () => void;
  onReset: () => void;
  onSignOut: () => void;
  signedIn: boolean;
}) {
  const short = owner ? `${owner.slice(0, 4)}…${owner.slice(-4)}` : null;

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className={eyebrow}>Security</div>
          <h2 className="mt-1 font-display text-[clamp(1.4rem,3vw,1.9rem)] font-semibold leading-none tracking-[-0.02em]">
            What protects your money
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--success-soft)] px-3 py-1 text-[12px] font-medium text-[var(--success)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" aria-hidden />
          Non-custodial
        </span>
      </div>

      {/* Self-custody banner */}
      <section className={CARD}>
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)]">
            <ShieldCheck className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-[17px] font-semibold tracking-[-0.02em]">
              Your money stays yours
            </h3>
            <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-[var(--muted)]">
              Orbit is non-custodial. Your savings live in an on-chain vault that only you own, Orbit
              never touches your bank login, and every balance is public on Solana. Here is exactly
              what protects your money, and the controls you hold.
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        {/* Wallet & keys */}
        <Section label="Wallet & keys">
          <div className="-my-4 divide-y divide-[var(--border)]">
            <Row
              icon={Lock}
              tone="good"
              title="Non-custodial by design"
              desc="Orbit never sees or stores your private keys. Only your wallet can approve a move of your funds."
            />
            <Row
              icon={Wallet}
              title={connected ? "Connected wallet" : "No wallet connected"}
              desc={
                connected && short
                  ? `Signed in as ${short}. Manage or disconnect it anytime.`
                  : "Open or connect a wallet to hold your savings."
              }
              action={
                <GhostPill onClick={onManageWallet}>
                  {connected ? "Manage" : "Connect"}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </GhostPill>
              }
            />
            <Row
              icon={KeyRound}
              title="Back up your recovery phrase"
              desc="If you use the built-in wallet, save your recovery phrase offline. It is the only way to restore access, and no one at Orbit can recover it for you."
            />
          </div>
        </Section>

        {/* Vault */}
        <Section label="Your vault (the chamber)">
          <div className="-my-4 divide-y divide-[var(--border)]">
            <Row
              icon={ShieldCheck}
              tone="good"
              title="User-owned, program-controlled"
              desc="Funds sit in a Solana program vault tied to your wallet. The program's rules, not a company, decide what can happen to them."
            />
            <Row
              icon={ArrowUpRight}
              title="Withdraw anytime"
              desc="No lockups and no withdrawal windows. Pull your full balance back to your wallet whenever you want."
              action={
                <GhostPill onClick={onManageWallet}>
                  Open vault
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </GhostPill>
              }
            />
            <Row
              icon={Eye}
              title="Verify it yourself on-chain"
              desc="Don't trust, verify. Inspect the vault program and your vault account directly on the Solana explorer."
              action={
                <div className="flex flex-col items-end gap-1.5">
                  <VerifyLink href={solAcct(programId)}>Program</VerifyLink>
                  {vaultAccount && <VerifyLink href={solAcct(vaultAccount)}>Vault</VerifyLink>}
                </div>
              }
            />
          </div>
        </Section>

        {/* Bank & money movement */}
        <Section label="Bank & money movement">
          <div className="-my-4 divide-y divide-[var(--border)]">
            <Row
              icon={Eye}
              tone="good"
              title="Your bank link is read-only"
              desc="Orbit connects through Plaid only to watch for spending. It cannot move, hold, or withdraw money from your bank account."
            />
            <Row
              icon={Building2}
              title="Money moves only at your threshold"
              desc="Before the threshold, a set-aside is just a number and the dollars stay in your bank. Only when you cross it does the transfer run."
            />
            <Row
              icon={Landmark}
              title={plaidConnected ? "Bank connected" : "No bank connected"}
              desc={
                plaidConnected
                  ? "Revoke Orbit's read-only access at any time. Your savings are unaffected."
                  : "Connect a bank in Budget to start detecting spending."
              }
              action={
                plaidConnected ? (
                  <DangerPill onClick={onDisconnectBank}>Disconnect</DangerPill>
                ) : undefined
              }
            />
          </div>
        </Section>

        {/* App & account */}
        <Section label="App & account">
          <div className="-my-4 divide-y divide-[var(--border)]">
            <Row
              icon={LogOut}
              title="Sign out"
              desc={
                signedIn
                  ? "End your session on this device. Your vault and savings stay safe on-chain."
                  : "You are browsing as a demo account."
              }
              action={
                signedIn ? (
                  <DangerPill onClick={onSignOut}>
                    <LogOut className="h-3.5 w-3.5" aria-hidden /> Sign out
                  </DangerPill>
                ) : undefined
              }
            />
            <Row
              icon={RotateCcw}
              title="Reset app data"
              desc="Clears set-asides and activity on this device and disconnects your bank. Your on-chain vault balance is never touched."
              action={
                <DangerPill onClick={onReset}>
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset
                </DangerPill>
              }
            />
          </div>
        </Section>
      </div>

      <p className="text-[12px] leading-relaxed text-[var(--faint)]">
        Live on Solana devnet. Not a bank and not FDIC-insured. Yield and principal are not
        guaranteed. Never share your recovery phrase with anyone, including anyone claiming to be
        from Orbit.
      </p>
    </div>
  );
}
