"use client";

import { useEffect, useRef, useState } from "react";

const SECONDS_PER_YEAR = 31_536_000;

// Illustrates real, continuous yield: a principal growing every tick at a fixed APY.
// The settled dollars read large; the accruing tail ticks faintly (same treatment as the app).
export function LiveYield({ principal = 10_000, apy = 0.06 }: { principal?: number; apy?: number }) {
  const start = useRef<number>(Date.now());
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const id = setInterval(() => setNow(Date.now()), reduced ? 1000 : 100);
    return () => clearInterval(id);
  }, []);

  const elapsed = (now - start.current) / 1000;
  const value = principal + (principal * apy * elapsed) / SECONDS_PER_YEAR;
  const s = value.toFixed(8);
  const dot = s.indexOf(".");
  const head = s.slice(0, dot + 3);
  const tail = s.slice(dot + 3);

  return (
    <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-300" aria-label={`Balance $${value.toFixed(2)} and rising`}>
      ${Number(head).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      <span className="text-emerald-600/40 dark:text-emerald-300/40">{tail}</span>
    </span>
  );
}
