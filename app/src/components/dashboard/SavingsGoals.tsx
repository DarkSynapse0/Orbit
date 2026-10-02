"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, TrendingUp, Check, Info } from "lucide-react";
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
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[var(--surface)] px-5 py-3.5">
        <div className="inline-flex items-baseline gap-2">
          <span className="text-[13px] text-[var(--muted)]">Unallocated</span>
          <span className="font-mono text-[15px] font-semibold tabular-nums text-[var(--foreground)]">{usd(unallocated)}</span>
        </div>
        <button type="button" onClick={() => setAdding((v) => !v)} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 text-[14px] font-semibold text-[var(--primary-fg)] transition-opacity hover:opacity-90">
          <Plus className="h-4 w-4" aria-hidden /> New goal
        </button>
      </div>

      {withYield.length > 0 && (
        <>
          <div className="my-4 border-t border-[var(--line)]" />
          {/* Desktop: table */}
          <div className="hidden overflow-x-auto rounded-2xl bg-[var(--surface)] px-5 py-2 lg:block">
            <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="border-b border-[var(--border)] text-[14px] font-bold text-[var(--foreground)]">
                <th className="pb-3">Goal</th>
                <th className="pb-3">Progress</th>
                <th className="pb-3 text-right">Saved</th>
                <th className="pb-3 text-right">Target</th>
                <th className="pb-3 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {withYield.map((g) => {
                const pct = Math.min(100, (g.balance / g.target) * 100);
                const reached = g.target > 0 && g.balance >= g.target;
                return (
                  <tr key={g.id}>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--background)] text-[18px]">{g.emoji}</span>
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-[15px] font-medium">{g.name}</span>
                          {reached && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--primary-strong)]">
                              <Check className="h-3 w-3" aria-hidden /> Reached
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-full min-w-[80px] overflow-hidden rounded-full bg-[var(--border)]">
                          <div className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-300" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="shrink-0 font-mono text-[11px] tabular-nums text-[var(--faint)]">{Math.round(pct)}%</span>
                      </div>
                    </td>
                    <td className="py-3 text-right font-mono text-[14px] font-semibold tabular-nums text-[var(--primary-strong)]">{usd(g.balance)}</td>
                    <td className="py-3 text-right font-mono text-[14px] tabular-nums text-[var(--muted)]">{usd(g.target)}</td>
                    <td className="py-3 pl-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {[10, 50].map((d) => (
                          <button key={d} type="button" onClick={() => allocate(g.id, d)} disabled={unallocated <= 0} className="rounded-md border border-[var(--border-strong)] px-2 py-0.5 text-[12px] font-medium transition-colors hover:bg-[var(--surface)] disabled:pointer-events-none disabled:opacity-40">+${d}</button>
                        ))}
                        <button type="button" onClick={() => allocate(g.id, -1e12)} disabled={g.allocated <= 0} className="rounded-md border border-[var(--border-strong)] px-2 py-0.5 text-[12px] font-medium transition-colors hover:bg-[var(--surface)] disabled:pointer-events-none disabled:opacity-40">Empty</button>
                        <button type="button" onClick={() => remove(g.id)} aria-label={`Delete ${g.name}`} className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-[var(--faint)] transition-colors hover:bg-[var(--destructive-soft)] hover:text-[var(--destructive)]"><Trash2 className="h-3.5 w-3.5" aria-hidden /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>

          {/* Mobile: stacked cards */}
          <div className="space-y-3 lg:hidden">
            {withYield.map((g) => {
              const pct = Math.min(100, (g.balance / g.target) * 100);
              const reached = g.target > 0 && g.balance >= g.target;
              return (
                <div key={g.id} className="rounded-2xl bg-[var(--surface)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--background)] text-[18px]">{g.emoji}</span>
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-[15px] font-medium">{g.name}</span>
                        {reached && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--primary-strong)]">
                            <Check className="h-3 w-3" aria-hidden /> Reached
                          </span>
                        )}
                      </div>
                    </div>
                    <button type="button" onClick={() => remove(g.id)} aria-label={`Delete ${g.name}`} className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-[var(--faint)] transition-colors hover:bg-[var(--destructive-soft)] hover:text-[var(--destructive)]"><Trash2 className="h-4 w-4" aria-hidden /></button>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between gap-2">
                    <span className="font-mono text-lg font-semibold tabular-nums text-[var(--primary-strong)]">{usd(g.balance)}</span>
                    <span className="font-mono text-[13px] tabular-nums text-[var(--muted)]">of {usd(g.target)} · {Math.round(pct)}%</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
                    <div className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-300" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-3 flex items-center gap-1.5">
                    {[10, 50].map((d) => (
                      <button key={d} type="button" onClick={() => allocate(g.id, d)} disabled={unallocated <= 0} className="rounded-md border border-[var(--border-strong)] px-2.5 py-1 text-[12px] font-medium transition-colors hover:bg-[var(--background)] disabled:pointer-events-none disabled:opacity-40">+${d}</button>
                    ))}
                    <button type="button" onClick={() => allocate(g.id, -1e12)} disabled={g.allocated <= 0} className="rounded-md border border-[var(--border-strong)] px-2.5 py-1 text-[12px] font-medium transition-colors hover:bg-[var(--background)] disabled:pointer-events-none disabled:opacity-40">Empty</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {withYield.length > 0 && saved <= 0.005 && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-[var(--surface)] px-4 py-3 text-[13px] text-[var(--muted)]">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--faint)]" aria-hidden />
          <span>Your vault is empty, so these goals are unfunded. Add money to your vault to fund them, or delete any you don&apos;t need.</span>
        </div>
      )}

      <Sheet open={adding} onClose={() => setAdding(false)} side="right" title="New goal">
        <div className="space-y-5">
          <div>
            <span className="mb-1.5 block text-[12px] font-medium text-[var(--muted)]">Icon</span>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  aria-label={`Icon ${e}`}
                  onClick={() => setEmoji(e)}
                  className={`grid h-9 w-9 place-items-center rounded-lg text-[18px] transition-colors ${emoji === e ? "bg-[var(--primary-soft)] ring-1 ring-inset ring-[var(--primary)]/40" : "hover:bg-[var(--surface)]"}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="goal-name" className="mb-1.5 block text-[12px] font-medium text-[var(--muted)]">Goal name</label>
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
            <label htmlFor="goal-target" className="mb-1.5 block text-[12px] font-medium text-[var(--muted)]">Target amount</label>
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
            <label htmlFor="goal-initial" className="mb-1.5 block text-[12px] font-medium text-[var(--muted)]">Allocate from vault now (optional)</label>
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
            className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--primary)] text-[14px] font-semibold text-[var(--primary-fg)] transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
          >
            <Plus className="h-4 w-4" aria-hidden /> Add goal
          </button>
        </div>
      </Sheet>

      {withYield.length === 0 && !adding && (
        <div className="mt-5 flex items-center gap-2 border-t border-[var(--line)] pt-5 text-[13px] text-[var(--faint)]">
          <TrendingUp className="h-4 w-4" aria-hidden /> Create a goal and allocate from your vault to watch it grow.
        </div>
      )}
    </section>
  );
}
