// Lightweight client-side activity log: records app actions (goals, deposits,
// withdrawals, wallet connects, faucet…) so the Activity tab can show a full
// history alongside the server's spending transactions. Stored in localStorage.

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

const LS_KEY = "orbit.activity.v1";
const EVT = "orbit-activity";

export function getActivity(): ActivityEvent[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]") as ActivityEvent[];
  } catch {
    return [];
  }
}

export function logActivity(kind: ActivityKind, text: string) {
  if (typeof window === "undefined") return;
  try {
    const list = getActivity();
    const ts = Date.now();
    list.unshift({ id: `${ts}-${Math.round(performance.now())}`, kind, text, ts });
    localStorage.setItem(LS_KEY, JSON.stringify(list.slice(0, 200)));
    window.dispatchEvent(new Event(EVT));
  } catch {}
}

export function clearActivity() {
  try {
    localStorage.removeItem(LS_KEY);
    window.dispatchEvent(new Event(EVT));
  } catch {}
}

/** Subscribe to activity changes (and cross-tab storage updates). Returns an unsubscribe. */
export function onActivity(cb: () => void): () => void {
  const h = () => cb();
  window.addEventListener(EVT, h);
  window.addEventListener("storage", h);
  return () => {
    window.removeEventListener(EVT, h);
    window.removeEventListener("storage", h);
  };
}
