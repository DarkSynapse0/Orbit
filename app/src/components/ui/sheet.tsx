"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

// A side drawer that slides in from the left or right, with a dimmed backdrop.
// Closes on backdrop click and Escape. Use side="right" for primary actions
// (e.g. New goal) and side="left" for secondary panels.
export function Sheet({
  open,
  onClose,
  side = "right",
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";
  title?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close" onClick={onClose} className="animate-overlay absolute inset-0 cursor-default bg-black/40" />
      <div
        className={`absolute inset-y-0 flex w-full max-w-[420px] flex-col bg-[var(--background)] shadow-[0_0_28px_-20px_rgba(10,10,10,0.35)] ${
          side === "right" ? "right-0 border-l border-[var(--border)] animate-sheet-right" : "left-0 border-r border-[var(--border)] animate-sheet-left"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="font-display text-[16px] font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
