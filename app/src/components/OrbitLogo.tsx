// Orbit brand logo — an inline SVG so it scales crisply and adapts to the
// surrounding text color (currentColor). The mark is an orbit ring with a
// core and a small satellite (the money that orbits + grows); the satellite
// picks up the brand accent. `mark` renders the icon alone; default renders
// the icon + "Orbit" wordmark lockup.

type Props = { className?: string; mark?: boolean; alt?: string };

function Glyph() {
  return (
    <>
      {/* orbit ring */}
      <ellipse
        cx="14"
        cy="14"
        rx="12.5"
        ry="5.4"
        transform="rotate(-27 14 14)"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      {/* core */}
      <circle cx="14" cy="14" r="4" fill="currentColor" />
      {/* satellite — the orbiting, growing money */}
      <circle cx="23.6" cy="8.4" r="2.2" fill="var(--accent)" />
    </>
  );
}

export function OrbitLogo({ className = "h-7", mark = false, alt = "Orbit" }: Props) {
  if (mark) {
    return (
      <svg viewBox="0 0 28 28" role="img" aria-label={alt} className={`${className} w-auto select-none`}>
        <Glyph />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 28" role="img" aria-label={alt} className={`${className} w-auto select-none`}>
      <Glyph />
      <text
        x="35"
        y="20.5"
        fill="currentColor"
        fontSize="20"
        style={{ fontFamily: "var(--ff-sans, ui-sans-serif)", fontWeight: 700, letterSpacing: "-0.03em" }}
      >
        Orbit
      </text>
    </svg>
  );
}

export function OrbitMark({ className = "h-8", alt = "Orbit" }: { className?: string; alt?: string }) {
  return <OrbitLogo mark className={className} alt={alt} />;
}
