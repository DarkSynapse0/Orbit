// Orbit logomark: a saving (the small body) held in orbit around a luminous core (the vault).
// Geometric, scalable, works from favicon size up. Uses the brand indigo gradient.
export function OrbitMark({ className = "", title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} role={title ? "img" : "presentation"} aria-label={title} aria-hidden={title ? undefined : true}>
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id="orbitCore" x1="7" y1="7" x2="25" y2="25" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a5b4fc" />
          <stop offset="0.55" stopColor="#6366f1" />
          <stop offset="1" stopColor="#4338ca" />
        </linearGradient>
      </defs>
      {/* Tilted orbital path */}
      <ellipse cx="16" cy="16" rx="13" ry="6.4" stroke="#818cf8" strokeWidth="1.7" transform="rotate(-28 16 16)" />
      {/* Luminous core (the vault) */}
      <circle cx="16" cy="16" r="5" fill="url(#orbitCore)" />
      {/* The saving, riding the orbit */}
      <circle cx="19" cy="8" r="2.4" fill="#c7d2fe" />
    </svg>
  );
}
