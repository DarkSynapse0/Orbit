"use client";

import { useState } from "react";
import {
  KeyRound,
  ShieldCheck,
  Wallet,
  Landmark,
  Lock,
  ExternalLink,
  ArrowUpRight,
  RotateCcw,
  LogOut,
  Eye,
  Copy,
  Check,
  Fingerprint,
  type LucideIcon,
} from "lucide-react";

const solAcct = (a: string) => `https://solscan.io/account/${a}?cluster=devnet`;

// A single protection guarantee: a check + a line of plain copy.
function Guarantee({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 text-[13px] leading-6 text-[var(--muted)]">
      <Check className="mt-[5px] h-3.5 w-3.5 shrink-0 text-[var(--accent-strong)]" aria-hidden />
      <span>{children}</span>
    </li>
  );
}

// A protection pillar: a titled column of guarantees with a soft header icon.
function Pillar({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <h3 className="font-display text-[15px] font-semibold tracking-[-0.01em]">{title}</h3>
      </div>
      <ul className="mt-4 space-y-2.5">{children}</ul>
    </div>
  );
}

// A compact live-status tile for the strip at the top.
function StatusTile({ icon: Icon, label, value, ok }: { icon: LucideIcon; label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${ok ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-[var(--primary-soft)] text-[var(--muted)]"}`}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--faint)]">{label}</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[13px] font-semibold text-[var(--foreground)]">
          <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-[var(--success)]" : "bg-[var(--faint)]"}`} aria-hidden />
          <span className="truncate">{value}</span>
        </div>
      </div>
    </div>
  );
}

// A copyable on-chain address with a Solscan link.
function AddressRow({ label, address }: { label: string; address: string }) {
  const [copied, setCopied] = useState(false);
  const short = `${address.slice(0, 8)}…${address.slice(-8)}`;
  const copy = () => {
    navigator.clipboard?.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  };
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-black/20 px-3.5 py-2.5">
      <div className="min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">{label}</div>
        <div className="mt-0.5 truncate font-mono text-[13px] text-white/90">{short}</div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label} address`}
          className="grid h-8 w-8 place-items-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check className="h-4 w-4 text-[#35f0c6]" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
        </button>
        <a
          href={solAcct(address)}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${label} on Solscan`}
          className="grid h-8 w-8 place-items-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </div>
    </div>
  );
}

// Primary control row (neutral action).
function ControlRow({ icon: Icon, title, desc, action }: { icon: LucideIcon; title: string; desc: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--background)] text-[var(--foreground)] ring-1 ring-inset ring-[var(--border)]">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-[var(--foreground)]">{title}</div>
          <div className="mt-0.5 text-[13px] leading-snug text-[var(--muted)]">{desc}</div>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function GhostPill({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[var(--foreground)] px-4 py-2 text-[13px] font-semibold text-[var(--background)] transition-opacity hover:opacity-90"
    >
      {children}
    </button>
  );
}

function DangerPill({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--destructive)]/40 px-4 py-2 text-[13px] font-medium text-[var(--destructive)] transition-colors hover:bg-[var(--destructive-soft)]"
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
  const short = owner ? `${owner.slice(0, 4)}…${owner.slice(-4)}` : "Not connected";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* ── Hero: the one promise that matters ── */}
      <section
        className="dark relative isolate overflow-hidden rounded-[2rem] p-7 text-white sm:p-9"
        style={{ "--accent": "#35f0c6" } as React.CSSProperties}
      >
        <div className="absolute inset-0 -z-10 bg-[#0b1411]" aria-hidden />
        <div className="pointer-events-none absolute -right-10 -top-16 -z-10 h-64 w-64 rounded-full bg-[var(--accent)] opacity-20 blur-[90px]" aria-hidden />
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-[var(--accent)] backdrop-blur">
            <ShieldCheck className="h-7 w-7" aria-hidden />
          </span>
          <div className="min-w-0">
            <div className="font-mono text-[12px] uppercase tracking-[0.24em] text-white/50">Security</div>
            <h2 className="mt-1.5 font-display text-[clamp(1.5rem,3.4vw,2.1rem)] font-semibold leading-tight tracking-[-0.02em]">
              Your money is yours. Always.
            </h2>
            <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-white/70">
              Orbit is fully self-custodial. Your savings live in an on-chain vault only you can open, your bank login
              never touches our servers, and every balance is public on Solana for you to verify.
            </p>
          </div>
        </div>
      </section>

      {/* ── Live status strip ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatusTile icon={Wallet} label="Wallet" value={connected ? short : "Not connected"} ok={connected} />
        <StatusTile icon={Landmark} label="Bank link" value={plaidConnected ? "Read-only · connected" : "Not connected"} ok={plaidConnected} />
        <StatusTile icon={Fingerprint} label="Vault" value={vaultAccount ? "On-chain · verifiable" : "Opens on first deposit"} ok={!!vaultAccount} />
      </div>

      {/* ── How your money is protected: three pillars ── */}
      <div>
        <h3 className="mb-3 px-1 font-mono text-[12px] uppercase tracking-[0.24em] text-[var(--faint)]">How your money is protected</h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Pillar icon={KeyRound} title="Keys & wallet">
            <Guarantee>Orbit never sees or stores your private keys.</Guarantee>
            <Guarantee>Only your wallet can approve a move of your funds.</Guarantee>
            <Guarantee>Back up your recovery phrase offline — it&apos;s the only way to restore access, and no one at Orbit can recover it for you.</Guarantee>
          </Pillar>
          <Pillar icon={Lock} title="Your vault">
            <Guarantee>Funds sit in a Solana program vault tied to your wallet.</Guarantee>
            <Guarantee>Program rules, not a company, decide what can happen.</Guarantee>
            <Guarantee>Withdraw your full balance anytime — no lockups, no windows.</Guarantee>
          </Pillar>
          <Pillar icon={Eye} title="Bank link">
            <Guarantee>Connected through Plaid, read-only, just to notice spending.</Guarantee>
            <Guarantee>It can&apos;t move, hold, or withdraw money from your bank.</Guarantee>
            <Guarantee>Before your threshold, a set-aside is just a number — the dollars stay put.</Guarantee>
          </Pillar>
        </div>
      </div>

      {/* ── Verify it yourself ── */}
      <section
        className="dark relative overflow-hidden rounded-3xl bg-[#0b1411] p-6 text-white sm:p-7"
        style={{ "--accent": "#35f0c6" } as React.CSSProperties}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-[16px] font-semibold tracking-[-0.01em]">Don&apos;t trust. Verify.</h3>
            <p className="mt-1 max-w-md text-[13px] leading-relaxed text-white/60">
              Your vault and the program that controls it are public. Inspect them on the Solana explorer, or copy the
              addresses and check for yourself.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium text-[var(--accent)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" aria-hidden /> Solana devnet
          </span>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <AddressRow label="Vault program" address={programId} />
          {vaultAccount ? (
            <AddressRow label="Your vault account" address={vaultAccount} />
          ) : (
            <div className="flex items-center rounded-xl bg-black/20 px-3.5 py-2.5 text-[12px] text-white/45">
              Your vault account appears here after your first deposit.
            </div>
          )}
        </div>
      </section>

      {/* ── Your controls ── */}
      <div>
        <h3 className="mb-3 px-1 font-mono text-[12px] uppercase tracking-[0.24em] text-[var(--faint)]">Your controls</h3>
        <div className="divide-y divide-[var(--border)] overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
          <ControlRow
            icon={Wallet}
            title={connected ? "Wallet" : "Connect a wallet"}
            desc={connected ? `Signed in as ${short}. Manage or disconnect it anytime.` : "Open or connect a wallet to hold your savings."}
            action={<GhostPill onClick={onManageWallet}>{connected ? "Manage" : "Connect"} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden /></GhostPill>}
          />
          <ControlRow
            icon={ShieldCheck}
            title="Your vault"
            desc="Open the vault to invest, withdraw, or move funds. Everything is non-custodial."
            action={<GhostPill onClick={onManageWallet}>Open vault <ArrowUpRight className="h-3.5 w-3.5" aria-hidden /></GhostPill>}
          />
          <ControlRow
            icon={Landmark}
            title={plaidConnected ? "Bank connection" : "No bank connected"}
            desc={plaidConnected ? "Revoke Orbit's read-only access anytime. Your savings are unaffected." : "Connect a bank in Budget to start detecting spending."}
            action={plaidConnected ? <DangerPill onClick={onDisconnectBank}>Disconnect</DangerPill> : undefined}
          />
        </div>
      </div>

      {/* ── Danger zone ── */}
      <div>
        <h3 className="mb-3 px-1 font-mono text-[12px] uppercase tracking-[0.24em] text-[var(--destructive)]/70">Danger zone</h3>
        <div className="divide-y divide-[var(--destructive)]/15 overflow-hidden rounded-3xl border border-[var(--destructive)]/25 bg-[var(--destructive-soft)]">
          {signedIn && (
            <ControlRow
              icon={LogOut}
              title="Sign out"
              desc="End your session on this device. Your vault and savings stay safe on-chain."
              action={<DangerPill onClick={onSignOut}><LogOut className="h-3.5 w-3.5" aria-hidden /> Sign out</DangerPill>}
            />
          )}
          <ControlRow
            icon={RotateCcw}
            title="Reset app data"
            desc="Clears set-asides and activity on this device and disconnects your bank. Your on-chain vault balance is never touched."
            action={<DangerPill onClick={onReset}><RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset</DangerPill>}
          />
        </div>
      </div>

      <p className="px-1 text-[12px] leading-relaxed text-[var(--faint)]">
        Live on Solana devnet. Not a bank and not FDIC-insured. Yield and principal are not guaranteed. Never share your
        recovery phrase with anyone, including anyone claiming to be from Orbit.
      </p>
    </div>
  );
}
