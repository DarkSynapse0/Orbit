// Vault-growth line chart. Solid indigo line = your vault (saving + 6% yield),
// dashed line = the same cash left idle. Illustrative monthly shape; the live
// figure is carried by <LiveYield> in the card header.

const ORBIT = [8, 11, 10, 15, 19, 18, 25, 30, 34, 42, 50, 60];
const IDLE = [8, 10, 11, 13, 14, 16, 17, 19, 20, 22, 23, 25];

const W = 580;
const H = 240;
const L = 20;
const R = 14;
const T = 18;
const B = 30;
const MAX = 64;

const x = (i: number) => L + (i * (W - L - R)) / (ORBIT.length - 1);
const y = (v: number) => T + (1 - v / MAX) * (H - T - B);

const toLine = (a: number[]) =>
  a.map((v, i) => `${i ? "L" : "M"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
const toArea = (a: number[]) =>
  `${toLine(a)} L ${x(a.length - 1).toFixed(1)} ${(H - B).toFixed(1)} L ${x(0).toFixed(1)} ${(
    H - B
  ).toFixed(1)} Z`;

const GRID = [0, 20, 40, 60];
const lastX = x(ORBIT.length - 1);
const lastY = y(ORBIT[ORBIT.length - 1]);

export function GrowthChart() {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Vault balance growing over 12 months">
      <defs>
        <linearGradient id="orbitArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* horizontal grid + axis labels */}
      {GRID.map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="rgba(15,17,28,0.08)" strokeWidth="1" />
          <text x={L} y={y(v) - 4} fill="rgba(15,17,28,0.4)" fontSize="10" fontFamily="var(--font-geist-mono)">
            ${v / 10}k
          </text>
        </g>
      ))}

      {/* idle cash, dashed */}
      <path d={toLine(IDLE)} fill="none" stroke="rgba(15,17,28,0.25)" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" />

      {/* your vault, solid + area */}
      <path d={toArea(ORBIT)} fill="url(#orbitArea)" />
      <path d={toLine(ORBIT)} fill="none" stroke="#4f46e5" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" />

      {/* current point */}
      <line x1={lastX} x2={lastX} y1={lastY} y2={H - B} stroke="rgba(79,70,229,0.35)" strokeWidth="1" strokeDasharray="3 3" />
      <circle cx={lastX} cy={lastY} r="5.5" fill="#4f46e5" />
      <circle cx={lastX} cy={lastY} r="5.5" fill="none" stroke="#ffffff" strokeWidth="2" />
      <g transform={`translate(${lastX - 66}, ${lastY - 34})`}>
        <rect width="60" height="22" rx="6" fill="#ffffff" stroke="rgba(15,17,28,0.12)" />
        <text x="30" y="15" textAnchor="middle" fill="#4338ca" fontSize="11" fontWeight="600" fontFamily="var(--font-geist-mono)">
          $6,010
        </text>
      </g>
    </svg>
  );
}
