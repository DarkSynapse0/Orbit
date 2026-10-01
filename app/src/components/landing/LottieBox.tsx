"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

// Thin client wrapper so server components can drop a .lottie into a slot.
export function LottieBox({ src, className }: { src: string; className?: string }) {
  return <DotLottieReact src={src} loop autoplay className={className} />;
}
