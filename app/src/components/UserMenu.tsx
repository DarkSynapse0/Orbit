"use client";

import { useEffect, useRef, useState } from "react";
import { LogIn, LogOut, ChevronDown } from "lucide-react";
import { useAuth, type OrbitUser } from "@/lib/auth";

export function Avatar({ user, size = "h-8 w-8" }: { user: OrbitUser | null; size?: string }) {
  if (user?.picture) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={user.picture} alt={user.name} className={`${size} shrink-0 rounded-full object-cover`} referrerPolicy="no-referrer" />;
  }
  const initials = (user?.name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className={`${size} grid shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[11px] font-semibold text-[var(--accent-strong)]`}>
      {initials}
    </span>
  );
}

export function UserMenu() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside or Escape. (A fixed-overlay approach fails here because
  // this lives inside the sticky header's stacking context.)
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <button
        type="button"
        onClick={signInWithGoogle}
        className="inline-flex items-center gap-2 rounded-full bg-[var(--contrast)] px-3.5 py-2 text-[13px] font-semibold text-[var(--contrast-fg)] transition-opacity hover:opacity-90"
      >
        <LogIn className="h-4 w-4" aria-hidden /> Sign in
      </button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-[var(--border)] py-1 pl-1 pr-2.5 transition-colors hover:bg-[var(--surface)]"
      >
        <Avatar user={user} size="h-7 w-7" />
        <span className="hidden max-w-[120px] truncate text-[13px] font-medium sm:block">{user.name.split(" ")[0]}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-[var(--muted)] transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <>
          <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[0_16px_44px_-14px_rgba(2,6,23,0.4)]">
            <div className="flex items-center gap-3 p-2">
              <Avatar user={user} size="h-10 w-10" />
              <div className="min-w-0">
                <div className="truncate text-[14px] font-medium">{user.name}</div>
                <div className="truncate text-[12px] text-[var(--muted)]">{user.email}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                signOut();
                setOpen(false);
              }}
              className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-[var(--muted)] transition-colors hover:bg-[var(--background)] hover:text-[var(--foreground)]"
            >
              <LogOut className="h-4 w-4" aria-hidden /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
