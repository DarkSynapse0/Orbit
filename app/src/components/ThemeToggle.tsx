"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

// Toggles `.dark` on <html> and persists the choice. Pairs with the inline
// init script in layout.tsx that sets the class before paint (no flash).
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
    setDark(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={`grid h-9 w-9 place-items-center rounded-full border border-[var(--border)] text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${className}`}
    >
      <Sun className="h-[18px] w-[18px] dark:hidden" aria-hidden />
      <Moon className="hidden h-[18px] w-[18px] dark:block" aria-hidden />
    </button>
  );
}
