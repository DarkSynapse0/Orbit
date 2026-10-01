"use client";

import { DotLottieReact, setWasmUrl } from "@lottiefiles/dotlottie-react";

// Self-host the player WASM (the default CDN fetch is blocked/offline here).
setWasmUrl("/dotlottie-player.wasm");

// Thin client wrapper so server components can drop a .lottie into a slot.
export function LottieBox({ src, className }: { src: string; className?: string }) {
  return <DotLottieReact src={src} loop autoplay className={className} />;
}
