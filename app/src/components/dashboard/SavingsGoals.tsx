"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, TrendingUp, Check, Info, Target, Wallet } from "lucide-react";
import { logActivity } from "@/lib/activity";
import { Sheet } from "@/components/ui/sheet";

// Named savings goals ("pots") layered over the single on-chain vault. Each goal has
// its own allocated balance and earns the same 6% APY on that balance — mathematically
// identical to a separate vault, since the rate is uniform. Allocations are tracked
// client-side (localStorage); the real funds + yield live in the one vault.

const LS_KEY = "orbit.goals.v1";
const SECONDS_PER_YEAR = 31_536_000;
const EMOJIS = ["🏖️", "🚨", "🏠", "🚗", "🎁", "✈️", "🎓", "💍", "🐷", "💻"];

// `earned` banks yield accrued before the last balance change, so topping up a goal
// keeps its existing yield instead of resetting to 0. `since` clocks new accrual on the
// current balance; live yield = earned + (allocated growing since `since`).
type Goal = { id: string; emoji: string; name: string; target: number; allocated: number; earned?: number; since: number };

const eyebrow = "font-mono text-[12px] font-medium uppercase tracking-[0.24em] text-[var(--faint)]";
const CARD = "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-7";

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
  // Goals are pots inside the one vault, so they can never hold more than the vault
  // actually has. If the vault shrinks (e.g. you withdraw everything), shrink each
  // pot to its share of what's left — so empty vault means empty goals.
  const coverage = allocatedTotal > 0 ? Math.min(1, saved / allocatedTotal) : 1;

  // Yield accrued on the current balance since the last change (not yet banked).
  const accruedSince = (g: Goal) => {
    const elapsed = g.since && now ? Math.max(0, now / 1000 - g.since / 1000) : 0;
    return (g.allocated * apy * elapsed) / SECONDS_PER_YEAR;
  };

  // Live yield = yield banked at the last change + yield accruing on the current balance,
  // both scaled to how much of the pot the vault can actually back right now.
  const withYield = useMemo(
    () =>
      goals.map((g) => {
        const allocated = g.allocated * coverage;
        const yieldUsd = ((g.earned ?? 0) + accruedSince(g)) * coverage;
        return { ...g, allocated, balance: allocated + yieldUsd, yieldUsd };
      }),
    [goals, now, apy, coverage],
  );

  const reachedCount = withYield.filter((g) => g.target > 0 && g.balance >= g.target).length;

  const addGoal = () => {
    const t = Math.max(1, Number(target) || 0);
    if (!name.trim()) return;
    // Fund the goal on creation, capped at what's free in the vault.
    const alloc = Math.round(Math.min(Math.max(0, Number(initial) || 0), unallocated) * 100) / 100;
    idSeed.current += 1;
    const goalName = name.trim().slice(0, 24);
    persist([...goals, { id: `g${now}${idSeed.current}`, emoji, name: goalName, target: t, allocated: alloc, earned: 0, since: now }]);
    logActivity("goal_create", `Created goal ${emoji} ${goalName}` + (alloc > 0 ? ` · allocated ${usd(alloc)}` : ""));
    setName("");
    setTarget("500");
    setInitial("");
    setEmoji(EMOJIS[0]);
    setAdding(false);
  };

  const allocate = (id: string, delta: number) => {
    const g0 = goals.find((g) => g.id === id);
    if (g0) {
      if (delta > 0) logActivity("goal_allocate", `Added ${usd(Math.min(delta, unallocated))} to ${g0.emoji} ${g0.name}`);
      else if (g0.allocated > 0) logActivity("goal_empty", `Emptied ${g0.emoji} ${g0.name} (${usd(g0.allocated)})`);
    }
    persist(
      goals.map((g) => {
        if (g.id !== id) return g;
        const max = g.allocated + unallocated; // can't allocate more than what's free
        const next = Math.round(Math.min(Math.max(0, g.allocated + delta), max) * 100) / 100;
        // Bank the yield earned so far before restarting the clock on the new balance,
        // so a top-up keeps existing yield. Emptying the pot clears its banked yield too.
        const earned = next <= 0 ? 0 : (g.earned ?? 0) + accruedSince(g);
        return { ...g, allocated: next, earned, since: now };
      }),
    );
  };

  const remove = (id: string) => {
    const g = goals.find((x) => x.id === id);
    if (g) logActivity("goal_delete", `Deleted goal ${g.emoji} ${g.name}`);
    persist(goals.filter((x) => x.id !== id));
  };

  return (
    <section className="w-full space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className={eyebrow}>Goals</div>
          <h2 className="mt-1 font-display text-[clamp(1.4rem,3vw,1.9rem)] font-semibold leading-none tracking-[-0.02em]">Savings goals</h2>
        </div>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-[var(--foreground)] px-5 text-[14px] font-semibold text-[var(--background)] transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" aria-hidden /> New goal
        </button>
      </div>

      {/* Overview tiles */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className={CARD}>
          <div className="flex items-center justify-between">
            <span className={eyebrow}>Unallocated</span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--foreground)] text-[var(--background)]"><Wallet className="h-4 w-4" aria-hidden /></span>
          </div>
          <div className="mt-4 font-display text-[clamp(1.5rem,3.5vw,2rem)] font-semibold leading-none tabular-nums">{usd(unallocated)}</div>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted)]">Free in your vault to assign to a goal.</p>
        </div>
        <div className={CARD}>
          <div className="flex items-center justify-between">
            <span className={eyebrow}>Active goals</span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--foreground)] text-[var(--background)]"><Target className="h-4 w-4" aria-hidden /></span>
          </div>
          <div className="mt-4 font-display text-[clamp(1.5rem,3.5vw,2rem)] font-semibold leading-none tabular-nums">{withYield.length}</div>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted)]">Pots layered over your one vault.</p>
        </div>
        <div className={CARD}>
          <div className="flex items-center justify-between">
            <span className={eyebrow}>Reached</span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--foreground)] text-[var(--background)]"><Check className="h-4 w-4" aria-hidden /></span>
          </div>
          <div className="mt-4 font-display text-[clamp(1.5rem,3.5vw,2rem)] font-semibold leading-none tabular-nums text-[var(--accent-strong)]">{reachedCount}</div>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted)]">Goals fully funded and earning.</p>
        </div>
      </div>

      {/* Goal cards */}
      {withYield.length > 0 && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {withYield.map((g) => {
            const pct = Math.min(100, (g.balance / g.target) * 100);
            const reached = g.target > 0 && g.balance >= g.target;
            return (
              <div key={g.id} className={CARD}>
                {/* Head */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--background)] text-[20px]">{g.emoji}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[16px] font-semibold tracking-[-0.01em]">{g.name}</span>
                        {reached && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--accent-strong)]">
                            <Check className="h-3 w-3" aria-hidden /> Reached
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 font-mono text-[12px] tabular-nums text-[var(--muted)]">Target {usd(g.target)}</div>
                    </div>
                  </div>
                  <button type="button" onClick={() => remove(g.id)} aria-label={`Delete ${g.name}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[var(--faint)] transition-colors hover:bg-[var(--destructive-soft)] hover:text-[var(--destructive)]"><Trash2 className="h-4 w-4" aria-hidden /></button>
                </div>

                {/* Balance */}
                <div className="mt-5 flex items-baseline justify-between gap-2">
                  <div className="font-display text-[clamp(1.75rem,4vw,2.25rem)] font-semibold leading-none tabular-nums text-[var(--accent-strong)]">{usd(g.balance)}</div>
                  <div className="font-mono text-[13px] tabular-nums text-[var(--faint)]">{Math.round(pct)}%</div>
                </div>

                {/* Progress */}
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[var(--border)]">
                  <div className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300" style={{ width: `${pct}%` }} />
                </div>

                {/* Actions */}
                <div className="mt-5 flex items-center gap-2">
                  {[10, 50].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => allocate(g.id, d)}
                      disabled={unallocated <= 0}
                      className="inline-flex h-9 items-center justify-center rounded-full border border-[var(--border-strong)] px-3.5 text-[13px] font-medium tabular-nums transition-colors hover:bg-[var(--background)] disabled:pointer-events-none disabled:opacity-40"
                    >
                      +${d}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => allocate(g.id, -1e12)}
                    disabled={g.allocated <= 0}
                    className="inline-flex h-9 items-center justify-center rounded-full border border-[var(--border-strong)] px-3.5 text-[13px] font-medium transition-colors hover:bg-[var(--background)] disabled:pointer-events-none disabled:opacity-40"
                  >
                    Empty
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty-vault notice */}
      {withYield.length > 0 && saved <= 0.005 && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-[13px] leading-relaxed text-[var(--muted)]">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--faint)]" aria-hidden />
          <span>Your vault is empty, so these goals are unfunded. Add money to your vault to fund them, or delete any you don&apos;t need.</span>
        </div>
      )}

      {/* Empty state */}
      {withYield.length === 0 && !adding && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[var(--border-strong)] px-6 py-12 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--foreground)] text-[var(--background)]"><Target className="h-5 w-5" aria-hidden /></span>
          <div>
            <div className="font-display text-[16px] font-semibold tracking-[-0.01em]">No goals yet</div>
            <p className="mx-auto mt-1 max-w-xs text-[13px] leading-relaxed text-[var(--muted)]">Create a goal and allocate from your vault to watch it grow at {(apy * 100).toFixed(0)}% a year.</p>
          </div>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--accent)] px-5 text-[14px] font-semibold text-[var(--on-accent)] transition-opacity hover:opacity-90"
          >
            <TrendingUp className="h-4 w-4" aria-hidden /> Create your first goal
          </button>
        </div>
      )}

      <Sheet open={adding} onClose={() => setAdding(false)} side="right" title="New goal">
        <div className="space-y-5">
          <div>
            <span className="mb-2 block font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--faint)]">Icon</span>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  aria-label={`Icon ${e}`}
                  onClick={() => setEmoji(e)}
                  className={`grid h-9 w-9 place-items-center rounded-full text-[18px] transition-colors ${emoji === e ? "bg-[var(--accent-soft)] ring-1 ring-inset ring-[var(--accent)]/40" : "hover:bg-[var(--surface)]"}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="goal-name" className="mb-2 block font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--faint)]">Goal name</label>
            <input
              id="goal-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Vacation"
              maxLength={24}
              className="h-11 w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 text-[15px] text-[var(--foreground)] placeholder:text-[var(--faint)] focus:border-[var(--border-strong)] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="goal-target" className="mb-2 block font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--faint)]">Target amount</label>
            <div className="flex h-11 items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3">
              <span className="text-[var(--muted)]">$</span>
              <input
                id="goal-target"
                value={target}
                onChange={(e) => setTarget(e.target.value.replace(/[^0-9.]/g, ""))}
                inputMode="decimal"
                placeholder="500"
                className="h-full w-full min-w-0 bg-transparent px-1.5 font-mono text-[15px] tabular-nums focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label htmlFor="goal-initial" className="mb-2 block font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--faint)]">Allocate from vault now (optional)</label>
            <div className="flex h-11 items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3">
              <span className="text-[var(--muted)]">$</span>
              <input
                id="goal-initial"
                value={initial}
                onChange={(e) => setInitial(e.target.value.replace(/[^0-9.]/g, ""))}
                inputMode="decimal"
                placeholder="0"
                className="h-full w-full min-w-0 bg-transparent px-1.5 font-mono text-[15px] tabular-nums focus:outline-none"
              />
              <span className="shrink-0 text-[12px] text-[var(--faint)]">of {usd(unallocated)} free</span>
            </div>
          </div>
          <button
            type="button"
            onClick={addGoal}
            disabled={!name.trim()}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--foreground)] text-[14px] font-semibold text-[var(--background)] transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
          >
            <Plus className="h-4 w-4" aria-hidden /> Add goal
          </button>
        </div>
      </Sheet>
    </section>
  );
}
