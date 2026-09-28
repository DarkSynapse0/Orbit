"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Coins, Target, Trash2, Wallet, LogIn, Activity as ActivityIcon } from "lucide-react";
import { getActivity, onActivity, clearActivity, type ActivityEvent, type ActivityKind } from "@/lib/activity";

const ICON: Record<ActivityKind, typeof Coins> = {
  goal_create: Target,
  goal_allocate: Target,
  goal_empty: Target,
  goal_delete: Trash2,
  deposit: ArrowDownToLine,
  withdraw: ArrowUpFromLine,
  faucet: Coins,
  wallet_connect: Wallet,
  wallet_disconnect: Wallet,
  sign_in: LogIn,
};

// Category tabs. `kinds: null` means "all". Each tab groups the raw activity kinds
// into the buckets a user actually thinks in.
const FILTERS: { id: string; label: string; kinds: ActivityKind[] | null }[] = [
  { id: "all", label: "All", kinds: null },
  { id: "deposit", label: "Deposits", kinds: ["deposit"] },
  { id: "withdraw", label: "Withdrawals", kinds: ["withdraw"] },
  { id: "goals", label: "Goals", kinds: ["goal_create", "goal_allocate", "goal_empty", "goal_delete"] },
  { id: "faucet", label: "Faucet", kinds: ["faucet"] },
  { id: "wallet", label: "Wallet", kinds: ["wallet_connect", "wallet_disconnect", "sign_in"] },
];

const when = (ts: number) => new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export function ActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const sync = () => setEvents(getActivity());
    sync();
    return onActivity(sync);
  }, []);

  // Count per category so tabs can show how many of each there are.
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const f of FILTERS) c[f.id] = f.kinds === null ? events.length : events.filter((e) => f.kinds!.includes(e.kind)).length;
    return c;
  }, [events]);

  const active = FILTERS.find((f) => f.id === filter) ?? FILTERS[0];
  const shown = active.kinds === null ? events : events.filter((e) => active.kinds!.includes(e.kind));

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_1px_2px_rgba(2,6,23,0.03),0_18px_40px_-24px_rgba(2,6,23,0.22)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ActivityIcon className="h-4 w-4 text-[var(--accent-strong)]" aria-hidden />
          <h3 className="font-display text-[17px] font-semibold">Activity</h3>
        </div>
        {events.length > 0 && (
          <button type="button" onClick={clearActivity} className="text-[13px] text-[var(--muted)] transition-colors hover:text-[var(--foreground)]">
            Clear
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <p className="mt-4 text-[14px] text-[var(--muted)]">Goals, deposits, withdrawals and more will show up here as you use Orbit.</p>
      ) : (
        <>
          {/* Category tabs */}
          <div className="mt-4 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Filter activity">
            {FILTERS.map((f) => {
              const on = f.id === filter;
              return (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setFilter(f.id)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${
                    on ? "bg-[var(--accent)] text-[var(--on-accent)]" : "border border-[var(--border-strong)] text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {f.label}
                  <span className={`font-mono text-[11px] tabular-nums ${on ? "text-[var(--on-accent)]/70" : "text-[var(--faint)]"}`}>{counts[f.id]}</span>
                </button>
              );
            })}
          </div>

          {shown.length === 0 ? (
            <p className="mt-4 text-[14px] text-[var(--muted)]">No {active.label.toLowerCase()} yet.</p>
          ) : (
            <ul className="mt-3 space-y-1">
              {shown.map((e) => {
                const Icon = ICON[e.kind] ?? ActivityIcon;
                const isMoney = e.kind === "deposit" || e.kind === "withdraw" || e.kind === "faucet";
                return (
                  <li key={e.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-[var(--background)]">
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${isMoney ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]" : "bg-[var(--background)] text-[var(--muted)]"}`}>
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[14px]">{e.text}</span>
                    <span className="shrink-0 font-mono text-[12px] text-[var(--faint)]">{when(e.ts)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
