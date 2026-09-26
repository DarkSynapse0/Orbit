"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { OrbitLogo } from "@/components/OrbitLogo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

// Transparent over the hero; once scrolled, fades in a dark blur + themed bottom border.
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled ? "border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md" : "border-transparent"
      }`}
    >
      <nav className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
        >
          <OrbitLogo className="h-7" />
        </Link>
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 text-[15px] text-[var(--muted)] md:flex">
          <a href="#how" className="transition-colors hover:text-[var(--foreground)]">How it works</a>
          <a href="#proof" className="transition-colors hover:text-[var(--foreground)]">On-chain</a>
          <a href="#faq" className="transition-colors hover:text-[var(--foreground)]">FAQ</a>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/app"
            className="hidden rounded px-3 py-2 text-[15px] text-[var(--muted)] transition-colors hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 sm:inline-block"
          >
            Launch app
          </Link>
          <Button asChild>
            <Link href="/app">Get started</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
