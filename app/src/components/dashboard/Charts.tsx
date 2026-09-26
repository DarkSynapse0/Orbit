// Lightweight, dependency-free dashboard charts in the Orbit B&W + green theme.
// Colors come from theme tokens so they flip with light/dark.
import type { ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export function DeltaBadge({ up, value }: { up: boolean; value: string }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
        up ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]" : "bg-red-500/10 text-red-500"
      }`}
    >
      {up ? <ArrowUpRight className="h-3 w-3" aria-hidden /> : <ArrowDownRight className="h-3 w-3" aria-hidden />}
      {value}
    </span>
  );
}

export function StatCard({
  icon,
  delta,
  value,
  label,
  highlight = false,
}: {
  icon: ReactNode;
  delta?: { up: boolean; value: string };
  value: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        highlight
          ? "border-[var(--accent-soft)] bg-[var(--accent-soft)]"
          : "border-[var(--border)] bg-[var(--surface)]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--background)] ring-1 ring-inset ring-[var(--border)]">
          {icon}
        </span>
        {delta && <DeltaBadge up={delta.up} value={delta.value} />}
      </div>
      <div className="mt-4 font-mono text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-1 text-[12px] text-[var(--muted)]">{label}</div>
    </div>
  );
}

// Grouped vertical bars: two series per period (primary green, secondary gray).
export function GroupedBars({
  data,
  aLabel,
  bLabel,
}: {
  data: { x: string; a: number; b: number }[];
  aLabel: string;
  bLabel: string;
}) {
  const max = Math.max(1, ...data.flatMap((d) => [d.a, d.b]));
  const ticks = 4;
  return (
    <div>
      <div className="flex gap-3">
        {/* y axis */}
        <div className="flex flex-col justify-between py-1 text-right font-mono text-[10px] text-[var(--faint)]" style={{ height: 220 }}>
          {Array.from({ length: ticks + 1 }, (_, i) => {
            const v = (max * (ticks - i)) / ticks;
            return <span key={i}>{v >= 1000 ? `${Math.round(v / 1000)}k` : Math.round(v)}</span>;
          })}
        </div>
        {/* plot */}
        <div className="relative flex-1">
          <div className="absolute inset-0 flex flex-col justify-between">
            {Array.from({ length: ticks + 1 }, (_, i) => (
              <span key={i} className="h-px w-full bg-[var(--border)]" />
            ))}
          </div>
          <div className="relative flex h-[220px] items-end justify-between gap-2">
            {data.map((d) => (
              <div key={d.x} className="flex h-full flex-1 items-end justify-center gap-1">
                <div
                  className="w-2.5 rounded-t-[3px] bg-[var(--accent)] transition-[height] duration-500 sm:w-3"
                  style={{ height: `${(d.a / max) * 100}%` }}
                  title={`${aLabel}: ${d.a}`}
                />
                <div
                  className="w-2.5 rounded-t-[3px] bg-[var(--faint)] transition-[height] duration-500 sm:w-3"
                  style={{ height: `${(d.b / max) * 100}%` }}
                  title={`${bLabel}: ${d.b}`}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between font-mono text-[10px] text-[var(--faint)]">
            {data.map((d) => (
              <span key={d.x} className="flex-1 text-center">{d.x}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-5 text-[12px] text-[var(--muted)]">
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-[var(--accent)]" /> {aLabel}</span>
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-[var(--faint)]" /> {bLabel}</span>
      </div>
    </div>
  );
}

// Simple single-series bars.
export function Bars({ data }: { data: { x: string; v: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.v));
  return (
    <div>
      <div className="flex h-[150px] items-end justify-between gap-2">
        {data.map((d) => (
          <div
            key={d.x}
            className="flex-1 rounded-t-[3px] bg-[var(--accent)] transition-[height] duration-500"
            style={{ height: `${(d.v / max) * 100}%` }}
            title={`${d.v}`}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between">
        {data.map((d) => (
          <span key={d.x} className="flex-1 text-center font-mono text-[10px] text-[var(--faint)]">{d.x}</span>
        ))}
      </div>
    </div>
  );
}

// Donut with center label + legend.
export function Donut({
  segments,
  centerTop,
  centerBottom,
}: {
  segments: { label: string; value: number; color: string }[];
  centerTop: string;
  centerBottom: string;
}) {
  const total = Math.max(1, segments.reduce((s, x) => s + x.value, 0));
  const R = 54;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0">
        <svg viewBox="0 0 140 140" className="h-32 w-32 -rotate-90">
          <circle cx="70" cy="70" r={R} fill="none" stroke="var(--border)" strokeWidth="16" />
          {segments.map((s) => {
            const len = (s.value / total) * C;
            const el = (
              <circle
                key={s.label}
                cx="70"
                cy="70"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth="16"
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-lg font-semibold tabular-nums leading-none">{centerTop}</span>
          <span className="mt-1 text-[10px] text-[var(--muted)]">{centerBottom}</span>
        </div>
      </div>
      <div className="flex-1 space-y-2.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-2 text-[var(--muted)]">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} /> {s.label}
            </span>
            <span className="font-mono tabular-nums">{Math.round((s.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Horizontal bars (category breakdown).
export function HBars({ rows }: { rows: { label: string; v: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.v));
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="w-24 shrink-0 truncate text-[12px] text-[var(--muted)]">{r.label}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--border)]">
            <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${(r.v / max) * 100}%` }} />
          </div>
          <span className="w-14 shrink-0 text-right font-mono text-[11px] tabular-nums text-[var(--muted)]">
            ${r.v.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
