"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

// Lightweight auth: real Google sign-in via Google Identity Services when a
// client id is configured (NEXT_PUBLIC_GOOGLE_CLIENT_ID), otherwise a demo
// account so the flow works out of the box. Profile is persisted locally.
export type OrbitUser = { name: string; email: string; picture?: string };

type AuthCtx = {
  user: OrbitUser | null;
  ready: boolean;
  hasGoogle: boolean;
  signInWithGoogle: () => void;
  signInDemo: () => void;
  signOut: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);
const LS_KEY = "orbit.user.v1";
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

function decodeJwt(token: string): Record<string, string> {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return {};
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<OrbitUser | null>(null);
  const [ready, setReady] = useState(false);
  const gsiReady = useRef(false);

  const persist = useCallback((u: OrbitUser | null) => {
    setUser(u);
    try {
      if (u) localStorage.setItem(LS_KEY, JSON.stringify(u));
      else localStorage.removeItem(LS_KEY);
    } catch {}
  }, []);

  // Restore a saved session.
  useEffect(() => {
    try {
      const s = localStorage.getItem(LS_KEY);
      if (s) setUser(JSON.parse(s));
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
            const p = decodeJwt(resp.credential);
            persist({ name: p.name || "Orbit user", email: p.email || "", picture: p.picture });
          },
        });
        gsiReady.current = true;
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
  }, [persist]);

  const signInDemo = useCallback(() => {
    persist({ name: "Alex Rivera", email: "alex@orbit.app" });
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

  const signOut = useCallback(() => {
    try {
      (window as unknown as { google?: any }).google?.accounts?.id?.disableAutoSelect?.();
    } catch {}
    persist(null);
  }, [persist]);

  return (
    <Ctx.Provider value={{ user, ready, hasGoogle: !!CLIENT_ID, signInWithGoogle, signInDemo, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
