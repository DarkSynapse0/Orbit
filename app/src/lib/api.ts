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

/** fetch against the API with the bearer token + JSON headers applied. `path` is
 * the path only (e.g. "/plaid/state"). */
export async function apiFetch(path: string, opts: RequestInit = {}): Promise<Response> {
  const headers = new Headers(opts.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (opts.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(`${API}${path}`, { ...opts, headers });
}
