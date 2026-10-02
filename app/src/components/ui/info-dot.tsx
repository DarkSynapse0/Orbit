"use client";

import { useId, useState } from "react";
import { Info } from "lucide-react";

// A small "i-in-a-circle" that explains a number in plain language. Opens on
// hover and keyboard focus, closes on blur/leave/Escape. Accessible: the button
// is labelled and the tooltip is wired via aria-describedby.
export function InfoDot({ label, className = "" }: { label: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        type="button"
        aria-label="More info"
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className="grid h-4 w-4 place-items-center rounded-full text-[var(--faint)] transition-colors hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:text-[var(--foreground)]"
      >
        <Info className="h-3.5 w-3.5" aria-hidden />
      </button>
      {open && (
        <span
          role="tooltip"
          id={id}
          className="absolute top-full left-0 z-40 mt-1.5 ml-1 w-max max-w-[15rem] rounded-lg bg-[var(--foreground)] px-2.5 py-1.5 text-[12px] leading-snug font-normal text-[var(--background)] shadow-[0_6px_20px_-6px_rgba(0,0,0,0.35)]"
        >
          {label}
        </span>
      )}
    </span>
  );
}
