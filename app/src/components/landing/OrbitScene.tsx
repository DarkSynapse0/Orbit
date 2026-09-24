// The hero motif: a luminous vault at the center, savings orbiting it — "money in motion."
// Pure CSS/SVG (no JS), calm indigo, deliberately not neon. Rings + orbiting bodies + starfield.

// Fixed star positions (no Math.random — keeps SSR and client render identical).
const STARS = [
  { top: "8%", left: "18%", s: 2, d: "3.5s" },
  { top: "14%", left: "78%", s: 1.5, d: "4.2s" },
  { top: "26%", left: "42%", s: 1, d: "5s" },
  { top: "33%", left: "88%", s: 2, d: "3.8s" },
  { top: "52%", left: "6%", s: 1.5, d: "4.6s" },
  { top: "68%", left: "90%", s: 1, d: "5.4s" },
  { top: "78%", left: "24%", s: 2, d: "4s" },
  { top: "88%", left: "62%", s: 1.5, d: "3.6s" },
  { top: "44%", left: "72%", s: 1, d: "5.2s" },
  { top: "18%", left: "54%", s: 1, d: "4.4s" },
];

// Each orbit: distance from edge (inset), rotation period, direction, and the body riding it.
const ORBITS = [
  { inset: "7%", dur: "28s", rev: false, size: 10, tint: "bg-indigo-300" },
  { inset: "21%", dur: "42s", rev: true, size: 8, tint: "bg-violet-300" },
  { inset: "35%", dur: "60s", rev: false, size: 6, tint: "bg-indigo-200" },
];

export function OrbitScene() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[540px]">
      {/* Ambient glow behind everything */}
      <div
        className="absolute inset-[8%] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.28), rgba(139,92,246,0.10) 55%, transparent 72%)" }}
        aria-hidden
      />

      {/* Starfield */}
      {STARS.map((st, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{ top: st.top, left: st.left, width: st.s, height: st.s, animationDuration: st.d }}
          aria-hidden
        />
      ))}

      {/* Orbital rings */}
      {ORBITS.map((o, i) => (
        <div
          key={`ring-${i}`}
          className="absolute rounded-full border border-white/[0.07]"
          style={{ inset: o.inset }}
          aria-hidden
        />
      ))}

      {/* Bodies riding each ring */}
      {ORBITS.map((o, i) => (
        <div
          key={`orbit-${i}`}
          className="absolute animate-orbit"
          style={{ inset: o.inset, animationDuration: o.dur, animationDirection: o.rev ? "reverse" : "normal" }}
          aria-hidden
        >
          <span
            className={`absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full ${o.tint}`}
            style={{ width: o.size, height: o.size, boxShadow: "0 0 12px 2px rgba(129,140,248,0.7)" }}
          />
        </div>
      ))}

      {/* Luminous core — the vault */}
      <div className="absolute inset-0 grid place-items-center" aria-hidden>
        <div
          className="grid h-[34%] w-[34%] place-items-center rounded-full animate-core-pulse"
          style={{
            background: "radial-gradient(circle at 35% 30%, #a5b4fc, #6366f1 45%, #4338ca 100%)",
            boxShadow: "0 0 60px 12px rgba(99,102,241,0.45), inset 0 0 24px rgba(255,255,255,0.25)",
          }}
        >
          <svg viewBox="0 0 24 24" className="h-[42%] w-[42%] text-white/95" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" opacity="0.9" />
            <circle cx="12" cy="12" r="2.6" fill="currentColor" />
          </svg>
        </div>
      </div>
    </div>
  );
}
