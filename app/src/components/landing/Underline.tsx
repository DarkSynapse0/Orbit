import type { ReactNode } from "react";

// A hand-drawn accent stroke under a focus word in a headline.
// The stroke draws itself in on load (see .hand-underline in globals.css).
export function Underline({ children }: { children: ReactNode }) {
  return (
    <span className="relative inline-block whitespace-nowrap">
      {children}
      <svg
        className="hand-underline pointer-events-none absolute -bottom-[0.12em] left-0 h-[0.36em] w-full overflow-visible text-indigo-400"
        viewBox="0 0 200 14"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M4 9 C 42 3, 78 3, 116 7 C 148 10, 174 6, 196 5"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          pathLength={1}
        />
      </svg>
    </span>
  );
}
