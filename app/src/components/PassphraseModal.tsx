"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import type { PassphraseMode } from "@/lib/orbitWallet";

// In-app passphrase dialog for the embedded Orbit account. We use this instead of
// window.prompt() because the prompt is triggered from a deferred effect (not directly
// in the click), and browsers block non-gesture prompt()/alert() dialogs — which made
// "Create an account" silently do nothing. A rendered modal has no such restriction.
export type PphRequest = { mode: PassphraseMode; resolve: (value: string | null) => void };

export function PassphraseModal({ req }: { req: PphRequest | null }) {
  const [value, setValue] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset fields each time a new request opens, and focus the first field.
  useEffect(() => {
    if (req) {
      setValue("");
      setConfirm("");
      setErr(null);
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [req]);

  if (!req) return null;
  const creating = req.mode === "create";

  const submit = () => {
    if (!value) {
      setErr("Enter a passphrase.");
      return;
    }
    if (creating && value.length < 8) {
      setErr("Use at least 8 characters.");
      return;
    }
    if (creating && value !== confirm) {
      setErr("Passphrases don't match.");
      return;
    }
    req.resolve(value);
  };
  const cancel = () => req.resolve(null);

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4 backdrop-blur-sm"
      onKeyDown={(e) => {
        if (e.key === "Escape") cancel();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-[var(--surface)] p-6 shadow-xl">
        <div className="flex items-center gap-2 font-display text-[17px] font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
            <Lock className="h-4 w-4" aria-hidden />
          </span>
          {creating ? "Protect your Orbit account" : "Unlock your Orbit account"}
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted)]">
          {creating
            ? "Set a passphrase to secure your account on this device. You'll need it to sign in again — it can't be recovered, so keep it safe."
            : "Enter the passphrase you set when you created this account."}
        </p>

        <input
          ref={inputRef}
          type="password"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setErr(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !creating) submit();
          }}
          placeholder={creating ? "New passphrase" : "Passphrase"}
          autoComplete={creating ? "new-password" : "current-password"}
          className="mt-4 h-11 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
        />
        {creating && (
          <input
            type="password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              setErr(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="Confirm passphrase"
            autoComplete="new-password"
            className="mt-2 h-11 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
          />
        )}
        {err && <div className="mt-2 text-[12px] text-[var(--accent-strong)]">{err}</div>}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={cancel}
            className="h-11 flex-1 rounded-xl border border-[var(--border-strong)] bg-[var(--background)] text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] text-sm font-semibold text-[var(--on-accent)] transition-opacity hover:opacity-90 active:scale-[0.99]"
          >
            {creating ? "Create account" : "Unlock"}
          </button>
        </div>
      </div>
    </div>
  );
}
