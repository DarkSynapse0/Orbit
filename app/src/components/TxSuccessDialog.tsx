"use client";

import { CheckCircle2, ExternalLink, X } from "lucide-react";

// Success dialog shown after a deposit or withdrawal confirms on-chain. Instead of dumping
// a raw signature, it links straight to the transaction on Solana Explorer (and Solscan)
// so anyone can verify the real on-chain move themselves.
export type TxKind = "deposit" | "withdraw";

export function TxSuccessDialog({
  kind,
  amount,
  sig,
  onClose,
}: {
  kind: TxKind;
  amount: number;
  sig: string;
  onClose: () => void;
}) {
  const explorer = `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
  const solscan = `https://solscan.io/tx/${sig}?cluster=devnet`;
  const title = kind === "withdraw" ? "Withdrawal on its way" : "Deposit confirmed";
  const message =
    kind === "withdraw"
      ? "is heading back to your bank. The on-chain withdrawal is confirmed and public, so you can verify it yourself."
      : "is now in your vault, earning yield on-chain. The deposit is confirmed and public, so you can verify it yourself.";

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl bg-[var(--surface)] p-6 text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--background)] hover:text-[var(--foreground)]"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)]">
          <CheckCircle2 className="h-7 w-7" aria-hidden />
        </span>

        <div className="mt-4 font-display text-[18px] font-bold">{title}</div>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--muted)]">
          <span className="font-semibold text-[var(--foreground)]">${amount.toFixed(2)}</span> {message}
        </p>

        <a
          href={explorer}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] text-sm font-semibold text-[var(--on-accent)] transition-opacity hover:opacity-90 active:scale-[0.99]"
        >
          Verify on Solana Explorer <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
        <a
          href={solscan}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center justify-center gap-1 text-[12px] font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
        >
          or view on Solscan <ExternalLink className="h-3 w-3" aria-hidden />
        </a>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 h-10 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--background)] text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]"
        >
          Done
        </button>
      </div>
    </div>
  );
}
