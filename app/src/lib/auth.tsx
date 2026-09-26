"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { API, getToken, setToken } from "@/lib/api";

// Lightweight auth: real Google sign-in via Google Identity Services when a
// client id is configured (NEXT_PUBLIC_GOOGLE_CLIENT_ID), otherwise a demo
// account so the flow works out of the box. Profile is persisted locally.
export type OrbitUser = { name: string; email: string; picture?: string };

type AuthCtx = {
  user: OrbitUser | null;
  ready: boolean;
  hasGoogle: boolean;
  googleReady: boolean;
  error: string | null;
  renderGoogleButton: (el: HTMLElement, opts?: Record<string, unknown>) => void;
  signInWithGoogle: () => void;
  signInDemo: () => void;
  signOut: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);
const LS_KEY = "orbit.user.v1";
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<OrbitUser | null>(null);
  const [ready, setReady] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const gsiReady = useRef(false);

  const persist = useCallback((u: OrbitUser | null) => {
    setUser(u);
    try {
      if (u) localStorage.setItem(LS_KEY, JSON.stringify(u));
      else localStorage.removeItem(LS_KEY);
    } catch {}
  }, []);

  // Exchange a Google credential for a verified server session.
  const exchangeGoogle = useCallback(
    async (credential: string) => {
      setError(null);
      let r: Response;
      try {
        r = await fetch(`${API}/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential }),
        });
      } catch (e) {
        // Network/CORS/CSP failure — the API wasn't reachable at all.
        console.error("[auth] Google exchange could not reach the API:", (e as Error).message);
        setError(`Couldn't reach the Orbit API at ${API}. Check the backend is running and NEXT_PUBLIC_API_URL is correct.`);
        return;
      }
      if (!r.ok) {
        const body = await r.text().catch(() => "");
        console.error("[auth] Google exchange rejected:", r.status, body);
        setError(`Sign-in was rejected by the server (${r.status}). ${body.slice(0, 140)}`);
        return;
      }
      const d = (await r.json()) as { token: string; user: OrbitUser };
      setToken(d.token);
      persist(d.user);
    },
    [persist],
  );

  // Restore a saved session, but only if we still hold a session token — otherwise
  // the API would 401 and the gate would be out of sync with real auth.
  useEffect(() => {
    try {
      const s = localStorage.getItem(LS_KEY);
      if (s && getToken()) setUser(JSON.parse(s));
      else {
        setToken(null);
        localStorage.removeItem(LS_KEY);
      }
    } catch {}
    setReady(true);
  }, []);

  // Load Google Identity Services (only if a client id is configured).
  useEffect(() => {
    if (!CLIENT_ID || typeof window === "undefined") return;
    const g = () => (window as unknown as { google?: any }).google;
    const init = () => {
      try {
        g().accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (resp: { credential: string }) => {
            // Verify the credential server-side; never trust it client-side.
            exchangeGoogle(resp.credential);
          },
        });
        gsiReady.current = true;
        setGoogleReady(true);
      } catch {}
    };
    if (g()?.accounts?.id) {
      init();
      return;
    }
    const existing = document.getElementById("gsi-script");
    if (existing) {
      existing.addEventListener("load", init);
      return;
    }
    const s = document.createElement("script");
    s.id = "gsi-script";
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = init;
    document.body.appendChild(s);
  }, [exchangeGoogle]);

  const signInDemo = useCallback(async () => {
    setError(null);
    try {
      const r = await fetch(`${API}/auth/demo`, { method: "POST" });
      if (!r.ok) throw new Error(`demo ${r.status}`);
      const d = (await r.json()) as { token: string; user: OrbitUser };
      setToken(d.token);
      persist(d.user);
    } catch (e) {
      console.error("[auth] demo sign-in failed:", (e as Error).message);
      setError(`Couldn't reach the Orbit API at ${API}. Is the backend running?`);
    }
  }, [persist]);

  const signInWithGoogle = useCallback(() => {
    const g = (window as unknown as { google?: any }).google;
    if (CLIENT_ID && g?.accounts?.id && gsiReady.current) {
      // Google One Tap / prompt. Falls back to demo if it can't be shown.
      g.accounts.id.prompt((n: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => {
        if (n.isNotDisplayed?.() || n.isSkippedMoment?.()) signInDemo();
      });
    } else {
      signInDemo();
    }
  }, [signInDemo]);

  const renderGoogleButton = useCallback((el: HTMLElement, opts?: Record<string, unknown>) => {
    const g = (window as unknown as { google?: any }).google;
    if (!g?.accounts?.id) return;
    try {
      el.innerHTML = "";
      g.accounts.id.renderButton(el, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        logo_alignment: "left",
        width: 320,
        ...opts,
      });
    } catch {}
  }, []);

  const signOut = useCallback(() => {
    try {
      (window as unknown as { google?: any }).google?.accounts?.id?.disableAutoSelect?.();
    } catch {}
    setToken(null);
    persist(null);
  }, [persist]);

  return (
    <Ctx.Provider value={{ user, ready, hasGoogle: !!CLIENT_ID, googleReady, error, renderGoogleButton, signInWithGoogle, signInDemo, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
