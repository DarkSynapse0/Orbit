"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

// Dismissible notice bar: Orbit is a work-in-progress demo, not a real product.
// It waits until the page has fully loaded, then slides down from the top.
// Dismissing fades + collapses it so the page slides back up.
export function DemoBanner() {
  const [render, setRender] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let raf = 0;
    let t: ReturnType<typeof setTimeout>;
    const reveal = () => {
      // short beat after load, then mount collapsed and animate open next frames
      t = setTimeout(() => {
        setRender(true);
        raf = requestAnimationFrame(() => requestAnimationFrame(() => setOpen(true)));
      }, 450);
    };
    if (document.readyState === "complete") reveal();
    else window.addEventListener("load", reveal, { once: true });
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
      window.removeEventListener("load", reveal);
    };
  }, []);

  if (!render) return null;

  return (
    <div
      onTransitionEnd={() => {
        if (!open) setRender(false);
      }}
      className={`relative mx-2 overflow-hidden rounded-full bg-[var(--surface)] text-[var(--foreground)] transition-all duration-300 ease-in-out sm:mx-3 ${
        open ? "mt-3 max-h-20 translate-y-0 opacity-100" : "mt-0 max-h-0 -translate-y-2 opacity-0"
      }`}
    >
      <div className="mx-auto max-w-[88rem] px-12 py-2">
        <p className="text-center text-[15px] leading-snug">
          Heads up: Orbit is still just a demo. It runs on a test network, it&rsquo;s not a finished product yet, and no
          real money is involved.
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Dismiss notice"
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--muted)] transition hover:bg-[var(--border)] hover:text-[var(--foreground)]"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
