"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Orbit as OrbitIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        scrolled ? "border-white/[0.08] bg-[#08080c]/80 backdrop-blur-md" : "border-transparent"
      }`}
    >
      <nav className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <OrbitIcon className="h-7 w-7 text-white" aria-hidden />
          <span className="text-xl font-semibold tracking-tight">Orbit</span>
        </Link>
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 text-[15px] text-neutral-300 md:flex">
          <a href="#how" className="transition-colors hover:text-white">How it works</a>
          <a href="#security" className="transition-colors hover:text-white">Security</a>
          <a href="#proof" className="transition-colors hover:text-white">On-chain</a>
          <a href="#faq" className="transition-colors hover:text-white">FAQ</a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/app"
            className="hidden rounded px-3 py-2 text-[15px] text-neutral-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:inline-block"
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
