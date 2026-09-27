"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Target, Trash2, TrendingUp } from "lucide-react";

// Named savings goals ("pots") layered over the single on-chain vault. Each goal has
// its own allocated balance and earns the same 6% APY on that balance — mathematically
// identical to a separate vault, since the rate is uniform. Allocations are tracked
// client-side (localStorage); the real funds + yield live in the one vault.

const LS_KEY = "orbit.goals.v1";
const SECONDS_PER_YEAR = 31_536_000;
const EMOJIS = ["🏖️", "🚨", "🏠", "🚗", "🎁", "✈️", "🎓", "💍", "🐷", "💻"];

type Goal = { id: string; emoji: string; name: string; target: number; allocated: number; since: number };

const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function load(): Goal[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Goal[]) : [];
  } catch {
    return [];
  }
}

// apy is a fraction (e.g. 0.06). All goals share the one vault, so they all earn this
// same rate — when it moves, every goal moves with it.
export function SavingsGoals({ saved, apy = 0.06 }: { saved: number; apy?: number }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [now, setNow] = useState(() => 0);
  const [adding, setAdding] = useState(false);
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("500");
  const [initial, setInitial] = useState("");
  const idSeed = useRef(0);

  useEffect(() => {
    setGoals(load());
    setNow(Date.now());
  }, []);

  // Live tick for the per-goal yield (paused for reduced-motion).
  useEffect(() => {
    const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const t = setInterval(() => setNow(Date.now()), reduced ? 1000 : 250);
    return () => clearInterval(t);
  }, []);

  const persist = (next: Goal[]) => {
    setGoals(next);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch {}
  };

  const allocatedTotal = goals.reduce((s, g) => s + g.allocated, 0);
  const unallocated = Math.max(0, saved - allocatedTotal);

  // Each goal's live yield = its allocated balance growing at 6% since it was set.
  const withYield = useMemo(
    () =>
      goals.map((g) => {
        const elapsed = g.since && now ? Math.max(0, now / 1000 - g.since / 1000) : 0;
        const yieldUsd = (g.allocated * apy * elapsed) / SECONDS_PER_YEAR;
        return { ...g, balance: g.allocated + yieldUsd, yieldUsd };
      }),
    [goals, now, apy],
  );

  const addGoal = () => {
    const t = Math.max(1, Number(target) || 0);
    if (!name.trim()) return;
    // Fund the goal on creation, capped at what's free in the vault.
    const alloc = Math.round(Math.min(Math.max(0, Number(initial) || 0), unallocated) * 100) / 100;
    idSeed.current += 1;
    persist([...goals, { id: `g${now}${idSeed.current}`, emoji, name: name.trim().slice(0, 24), target: t, allocated: alloc, since: now }]);
    setName("");
    setTarget("500");
    setInitial("");
    setEmoji(EMOJIS[0]);
    setAdding(false);
  };

  const allocate = (id: string, delta: number) => {
    persist(
      goals.map((g) => {
        if (g.id !== id) return g;
        const max = g.allocated + unallocated; // can't allocate more than what's free
        const next = Math.min(Math.max(0, g.allocated + delta), max);
        // Reset the yield clock only when adding money in; keep it when trimming.
        return { ...g, allocated: Math.round(next * 100) / 100, since: delta > 0 ? now : g.since };
      }),
    );
  };

  const remove = (id: string) => persist(goals.filter((g) => g.id !== id));

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-[var(--accent-strong)]" aria-hidden />
          <h3 className="font-display text-[17px] font-semibold">Savings goals</h3>
        </div>
        <div className="text-[13px] text-[var(--muted)]">
          Unallocated <span className="font-mono font-medium text-[var(--foreground)]">{usd(unallocated)}</span>
        </div>
      </div>
      <p className="mt-1 text-[13px] text-[var(--muted)]">Split your vault into pots. Each earns the same {(apy * 100).toFixed(1)}% a year on its own balance.</p>

      {withYield.length > 0 && (
        <ul className="mt-5 space-y-3">
          {withYield.map((g) => {
            const pct = Math.min(100, (g.balance / g.target) * 100);
            return (
              <li key={g.id} className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--surface)] text-[18px]">{g.emoji}</span>
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-medium">{g.name}</div>
                      <div className="font-mono text-[12px] tabular-nums text-[var(--accent-strong)]">
                        +{g.yieldUsd.toFixed(6)} <span className="text-[var(--faint)]">earned, live</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[15px] font-semibold tabular-nums text-[var(--accent-strong)]">{usd(g.balance)}</div>
                    <div className="font-mono text-[12px] tabular-nums text-[var(--faint)]">of {usd(g.target)}</div>
                  </div>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
                  <div className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex gap-1.5">
                    {[10, 50].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => allocate(g.id, d)}
                        disabled={unallocated <= 0}
                        className="rounded-lg border border-[var(--border-strong)] px-2.5 py-1 text-[12px] font-medium transition-colors hover:bg-[var(--surface)] disabled:pointer-events-none disabled:opacity-40"
                      >
                        +${d}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => allocate(g.id, -g.allocated)}
                      disabled={g.allocated <= 0}
                      className="rounded-lg border border-[var(--border-strong)] px-2.5 py-1 text-[12px] font-medium transition-colors hover:bg-[var(--surface)] disabled:pointer-events-none disabled:opacity-40"
                    >
                      Empty
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(g.id)}
                    aria-label={`Delete ${g.name}`}
                    className="grid h-7 w-7 place-items-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--background)] hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {adding ? (
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
          <div className="flex flex-wrap gap-1.5">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`grid h-9 w-9 place-items-center rounded-lg text-[18px] transition-colors ${emoji === e ? "bg-[var(--accent-soft)] ring-1 ring-inset ring-[var(--accent)]/40" : "hover:bg-[var(--surface)]"}`}
              >
                {e}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Goal name (e.g. Vacation)"
              maxLength={24}
              className="h-11 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 text-[15px] text-[var(--foreground)] placeholder:text-[var(--faint)] focus:border-[var(--accent)]/50 focus:outline-none"
            />
            <div className="flex h-11 items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 sm:w-36">
              <span className="text-[var(--muted)]">$</span>
              <input
                value={target}
                onChange={(e) => setTarget(e.target.value.replace(/[^0-9.]/g, ""))}
                inputMode="decimal"
                placeholder="Target"
                className="h-full w-full min-w-0 bg-transparent px-1.5 font-mono text-[15px] tabular-nums focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-2 flex h-11 items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3">
            <span className="text-[var(--muted)]">$</span>
            <input
              value={initial}
              onChange={(e) => setInitial(e.target.value.replace(/[^0-9.]/g, ""))}
              inputMode="decimal"
              placeholder="Allocate now (optional)"
              className="h-full w-full min-w-0 bg-transparent px-1.5 font-mono text-[15px] tabular-nums focus:outline-none"
            />
            <span className="shrink-0 text-[12px] text-[var(--faint)]">of {usd(unallocated)} free</span>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={addGoal}
              disabled={!name.trim()}
              className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--accent)] text-[14px] font-semibold text-[var(--on-accent)] transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
            >
              Add goal
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border-strong)] px-4 text-[14px] font-medium transition-colors hover:bg-[var(--background)]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border-strong)] text-[14px] font-medium text-[var(--muted)] transition-colors hover:bg-[var(--background)] hover:text-[var(--foreground)]"
        >
          <Plus className="h-4 w-4" aria-hidden /> New goal
        </button>
      )}

      {withYield.length === 0 && !adding && (
        <div className="mt-4 flex items-center gap-2 text-[13px] text-[var(--faint)]">
          <TrendingUp className="h-4 w-4" aria-hidden /> Create a goal and allocate from your vault to watch it grow.
        </div>
      )}
    </section>
  );
}
