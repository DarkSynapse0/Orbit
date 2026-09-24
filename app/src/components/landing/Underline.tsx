import type { ReactNode } from "react";

// A hand-drawn accent stroke under a focus word in a headline.
// The stroke draws itself in on load (see .hand-underline in globals.css).
export function Underline({ children }: { children: ReactNode }) {
  return (
    <span className="relative inline-block whitespace-nowrap">
      {children}
      <svg
        className="hand-underline pointer-events-none absolute -bottom-[0.06em] left-0 h-[0.28em] w-full overflow-visible text-indigo-400"
        viewBox="0 0 200 12"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M5 8 C 44 3, 80 3, 118 6 C 150 8.5, 172 6, 195 5"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          pathLength={1}
        />
      </svg>
    </span>
  );
}
