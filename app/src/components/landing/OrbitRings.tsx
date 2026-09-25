// Concentric hairline rings with orbiting nodes — the recurring "Orbit" motif.
// Pure geometry (no image). Inherits color via currentColor; the accent node
// uses the theme accent. Rings rotate slowly; honors reduced-motion globally.
export function OrbitRings({ className = "" }: { className?: string }) {
  const rings = [70, 120, 170, 220];
  return (
    <svg viewBox="0 0 480 480" className={className} fill="none" aria-hidden>
      <g stroke="currentColor" strokeWidth="1">
        {rings.map((r) => (
          <circle key={r} cx="240" cy="240" r={r} opacity={0.9 - r / 320} />
        ))}
      </g>
      {/* orbiting nodes, one per ring, at varied angles + speeds */}
      {[
        { r: 70, a: 20, s: 26, accent: false },
        { r: 120, a: 200, s: 40, accent: true },
        { r: 170, a: 110, s: 58, accent: false },
        { r: 220, a: 300, s: 80, accent: false },
      ].map((n, i) => (
        <g
          key={i}
          className="animate-orbit"
          style={{ transformOrigin: "240px 240px", animationDuration: `${n.s}s` }}
        >
          <circle
            cx={240 + n.r * Math.cos((n.a * Math.PI) / 180)}
            cy={240 + n.r * Math.sin((n.a * Math.PI) / 180)}
            r={n.accent ? 5 : 3}
            fill={n.accent ? "var(--accent)" : "currentColor"}
          />
        </g>
      ))}
      {/* core */}
      <circle cx="240" cy="240" r="4" fill="currentColor" />
    </svg>
  );
}
