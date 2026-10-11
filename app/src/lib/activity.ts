// Per-user activity log, persisted on the server (see the backend's /activity routes).
// Records app actions (goals, deposits, withdrawals, wallet connects, faucet, sign-in)
// so the Activity tab shows a full history alongside the server's spending transactions.
// The acting user is derived from the session token, so history is per-account — it
// follows the user across devices and never leaks between accounts on one browser.

import { apiFetch, getToken } from "@/lib/api";

export type ActivityKind =
  | "goal_create"
  | "goal_allocate"
  | "goal_empty"
  | "goal_delete"
  | "deposit"
  | "withdraw"
  | "faucet"
  | "wallet_connect"
  | "wallet_disconnect"
  | "sign_in";

export type ActivityEvent = { id: string; kind: ActivityKind; text: string; ts: number };

const EVT = "orbit-activity";

/** The signed-in user's activity, newest first. Empty when signed out. */
export async function getActivity(): Promise<ActivityEvent[]> {
  if (typeof window === "undefined" || !getToken()) return [];
  try {
    const r = await apiFetch("/activity");
    if (!r.ok) return [];
    const d = (await r.json()) as { activity?: ActivityEvent[] };
    return d.activity ?? [];
  } catch {
    return [];
  }
}

/** Record an app action for the signed-in user, then notify subscribers to refresh. */
export function logActivity(kind: ActivityKind, text: string) {
  if (typeof window === "undefined" || !getToken()) return;
  apiFetch("/activity", { method: "POST", body: JSON.stringify({ kind, text }) })
    .then(() => window.dispatchEvent(new Event(EVT)))
    .catch(() => {});
}

/** Clear the signed-in user's activity log. */
export function clearActivity() {
  if (typeof window === "undefined" || !getToken()) return;
  apiFetch("/activity", { method: "DELETE" })
    .then(() => window.dispatchEvent(new Event(EVT)))
    .catch(() => {});
}

/** Subscribe to activity changes in this tab. Returns an unsubscribe. */
export function onActivity(cb: () => void): () => void {
  const h = () => cb();
  window.addEventListener(EVT, h);
  return () => window.removeEventListener(EVT, h);
}
