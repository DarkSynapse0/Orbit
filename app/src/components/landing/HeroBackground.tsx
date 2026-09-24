// Full-bleed atmospheric hero backdrop: a deep-indigo night sky with a drifting, twinkling
// starfield, softly wandering aurora glows, and a luminous horizon. Pure CSS motion (no JS),
// reduced-motion honored globally. Stars are generated deterministically (fixed seed) so the
// server and client render identically (no hydration mismatch).

function makeStars(n: number) {
  let seed = 1337;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  return Array.from({ length: n }, () => ({
    top: +(rnd() * 100).toFixed(2),
    left: +(rnd() * 100).toFixed(2),
    size: +(0.6 + rnd() * 1.9).toFixed(2),
    delay: +(rnd() * 6).toFixed(2),
    dur: +(3 + rnd() * 4).toFixed(2),
    base: +(0.25 + rnd() * 0.5).toFixed(2),
  }));
}

const STARS = makeStars(52);

export function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* Base night-sky gradient */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, #0b0b18 0%, #0a0a15 45%, #08080c 100%)" }}
      />

      {/* Aurora glows, slowly wandering */}
      <div
        className="absolute left-1/2 top-[-15%] h-[75vh] w-[75vh] -translate-x-1/2 rounded-full blur-[110px] animate-aurora-a"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.38), transparent 62%)" }}
      />
      <div
        className="absolute right-[-12%] top-[12%] h-[55vh] w-[55vh] rounded-full blur-[120px] animate-aurora-b"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.30), transparent 62%)" }}
      />

      {/* Drifting starfield (the whole layer eases back and forth; each star twinkles) */}
      <div className="absolute inset-0 animate-star-drift">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: s.size,
              height: s.size,
              opacity: s.base,
              animationDuration: `${s.dur}s`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Luminous horizon (a planet's limb glowing at the bottom, like the terrain in the ref) */}
      <div
        className="absolute bottom-[-55%] left-1/2 h-[90vh] w-[150vw] -translate-x-1/2 rounded-[50%]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(79,70,229,0.28), rgba(99,102,241,0.10) 58%, transparent 72%)",
        }}
      />
      <div
        className="absolute bottom-0 left-1/2 h-px w-[130vw] -translate-x-1/2"
        style={{ background: "linear-gradient(90deg, transparent, rgba(129,140,248,0.35), transparent)" }}
      />

      {/* Fade into the page background below the fold */}
      <div
        className="absolute inset-x-0 bottom-0 h-48"
        style={{ background: "linear-gradient(180deg, transparent, #08080c)" }}
      />
    </div>
  );
}
