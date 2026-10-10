// Central API client. Injects the session bearer token so the server can derive
// the acting user itself (the frontend never sends a userId anymore).

export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const TOKEN_KEY = "orbit.session.v1";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(t: string | null) {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

// A dead/expired session: clear it once and bounce back to the auth screen, so the user
// doesn't sit on a signed-in-looking dashboard that silently fails every request.
let handlingUnauthorized = false;
function handleUnauthorized() {
  if (handlingUnauthorized) return;
  handlingUnauthorized = true;
  setToken(null);
  try {
    localStorage.removeItem("orbit.user.v1");
  } catch {}
  if (typeof window !== "undefined") window.location.assign("/app");
}

/** fetch against the API with the bearer token + JSON headers applied. `path` is
 * the path only (e.g. "/plaid/state"). */
export async function apiFetch(path: string, opts: RequestInit = {}): Promise<Response> {
  const headers = new Headers(opts.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (opts.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  // Only treat it as a session problem if we actually sent a token (so public/unauthed
  // calls don't trigger a redirect loop).
  if (res.status === 401 && token) handleUnauthorized();
  return res;
}
