"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Wallet } from "lucide-react";

// Brand-styled connect button over the existing Solana wallet adapter (Phantom /
// Solflare / Orbit embedded). Opens the adapter modal; shows the address once
// connected (click to disconnect).
export function WalletButton({ className = "" }: { className?: string }) {
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  if (connected && publicKey) {
    const b58 = publicKey.toBase58();
    return (
      <button
        type="button"
        onClick={() => disconnect()}
        title="Disconnect"
        className={`inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] px-4 py-2.5 font-mono text-[13px] font-semibold transition-colors hover:bg-[var(--surface)] ${className}`}
      >
        <span className="h-2 w-2 rounded-full bg-[var(--accent)]" aria-hidden />
        {b58.slice(0, 4)}…{b58.slice(-4)}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setVisible(true)}
      className={`inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] px-5 py-2.5 text-[14px] font-semibold transition-colors hover:bg-[var(--surface)] ${className}`}
    >
      <Wallet className="h-4 w-4" aria-hidden /> Connect wallet
    </button>
  );
}
