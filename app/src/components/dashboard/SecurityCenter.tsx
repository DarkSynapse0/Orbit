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

function GroupLabel({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.16em] text-[var(--faint)]">
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {children}
    </div>
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
    <div className="flex items-start justify-between gap-4 py-3.5">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
            tone === "good"
              ? "bg-[var(--success-soft)] text-[var(--success)]"
              : "bg-[var(--background)] text-[var(--muted)] ring-1 ring-inset ring-[var(--border)]"
          }`}
        >
          <Icon className="h-4.5 w-4.5" aria-hidden />
        </span>
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-[var(--foreground)]">{title}</div>
          <div className="mt-0.5 text-[13px] leading-5 text-[var(--muted)]">{desc}</div>
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
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg text-[13px] font-medium text-[var(--primary-strong)] transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40"
    >
      {children}
      <ExternalLink className="h-3 w-3" aria-hidden />
    </a>
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
    <div className="space-y-4">
      {/* Self-custody banner */}
      <section className="rounded-2xl bg-[var(--surface)] p-6">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--success-soft)] text-[var(--success)]">
            <ShieldCheck className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-[17px] font-bold">Your money stays yours</h2>
            <p className="mt-1 max-w-xl text-[13px] leading-6 text-[var(--muted)]">
              Orbit is non-custodial. Your savings live in an on-chain vault that only you own, Orbit
              never touches your bank login, and every balance is public on Solana. Here is exactly
              what protects your money, and the controls you hold.
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        {/* Wallet & keys */}
        <section className="rounded-2xl bg-[var(--surface)] px-5 pb-4 pt-5">
          <GroupLabel icon={KeyRound}>Wallet &amp; keys</GroupLabel>
          <div className="mt-1 divide-y divide-[var(--border)]">
            <Row
              icon={Lock}
              tone="good"
              title="Non-custodial by design"
              desc="Orbit never sees or stores your private keys. Only your wallet can approve a move of your funds."
            />
            <Row
              icon={Wallet}
              title={connected ? "Connected wallet" : "No wallet connected"}
              desc={connected && short ? `Signed in as ${short}. Manage or disconnect it anytime.` : "Open or connect a wallet to hold your savings."}
              action={
                <button
                  type="button"
                  onClick={onManageWallet}
                  className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg text-[13px] font-medium text-[var(--secondary-fg)] transition-opacity hover:opacity-70"
                >
                  {connected ? "Manage" : "Connect"} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </button>
              }
            />
            <Row
              icon={KeyRound}
              title="Back up your recovery phrase"
              desc="If you use the built-in wallet, save your recovery phrase offline. It is the only way to restore access, and no one at Orbit can recover it for you."
            />
          </div>
        </section>

        {/* Vault */}
        <section className="rounded-2xl bg-[var(--surface)] px-5 pb-4 pt-5">
          <GroupLabel icon={ShieldCheck}>Your vault (the chamber)</GroupLabel>
          <div className="mt-1 divide-y divide-[var(--border)]">
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
                <button
                  type="button"
                  onClick={onManageWallet}
                  className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg text-[13px] font-medium text-[var(--secondary-fg)] transition-opacity hover:opacity-70"
                >
                  Open vault <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </button>
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
        </section>

        {/* Bank & money movement */}
        <section className="rounded-2xl bg-[var(--surface)] px-5 pb-4 pt-5">
          <GroupLabel icon={Landmark}>Bank &amp; money movement</GroupLabel>
          <div className="mt-1 divide-y divide-[var(--border)]">
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
              desc={plaidConnected ? "Revoke Orbit's read-only access at any time. Your savings are unaffected." : "Connect a bank in Budget to start detecting spending."}
              action={
                plaidConnected ? (
                  <button
                    type="button"
                    onClick={onDisconnectBank}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[var(--destructive)]/40 px-2.5 py-1.5 text-[13px] font-medium text-[var(--destructive)] transition-colors hover:bg-[var(--destructive-soft)]"
                  >
                    Disconnect
                  </button>
                ) : undefined
              }
            />
          </div>
        </section>

        {/* App & account */}
        <section className="rounded-2xl bg-[var(--surface)] px-5 pb-4 pt-5">
          <GroupLabel icon={Lock}>App &amp; account</GroupLabel>
          <div className="mt-1 divide-y divide-[var(--border)]">
            <Row
              icon={LogOut}
              title="Sign out"
              desc={signedIn ? "End your session on this device. Your vault and savings stay safe on-chain." : "You are browsing as a demo account."}
              action={
                signedIn ? (
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[var(--destructive)]/40 px-2.5 py-1.5 text-[13px] font-medium text-[var(--destructive)] transition-colors hover:bg-[var(--destructive-soft)]"
                  >
                    <LogOut className="h-3.5 w-3.5" aria-hidden /> Sign out
                  </button>
                ) : undefined
              }
            />
            <Row
              icon={RotateCcw}
              title="Reset app data"
              desc="Clears set-asides and activity on this device and disconnects your bank. Your on-chain vault balance is never touched."
              action={
                <button
                  type="button"
                  onClick={onReset}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[var(--destructive)]/40 px-2.5 py-1.5 text-[13px] font-medium text-[var(--destructive)] transition-colors hover:bg-[var(--destructive-soft)]"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset
                </button>
              }
            />
          </div>
        </section>
      </div>

      <p className="text-[12px] leading-5 text-[var(--faint)]">
        Live on Solana devnet. Not a bank and not FDIC-insured. Yield and principal are not
        guaranteed. Never share your recovery phrase with anyone, including anyone claiming to be
        from Orbit.
      </p>
    </div>
  );
}
