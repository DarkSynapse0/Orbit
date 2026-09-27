"use client";

import { useEffect, useState } from "react";
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

const when = (ts: number) => new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export function ActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  useEffect(() => {
    const sync = () => setEvents(getActivity());
    sync();
    return onActivity(sync);
  }, []);

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
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
        <ul className="mt-4 space-y-1">
          {events.map((e) => {
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
    </section>
  );
}
