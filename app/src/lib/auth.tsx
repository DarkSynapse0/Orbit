"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { API, getToken, setToken } from "@/lib/api";

// Auth: email/password accounts plus real OAuth — Google (Google Identity
// Services) and, when configured, Sign in with Apple. Each path exchanges a
// credential for a verified server session; the profile is persisted locally.
export type OrbitUser = { name: string; email: string; picture?: string };

type AuthCtx = {
  user: OrbitUser | null;
  ready: boolean;
  hasGoogle: boolean;
  hasApple: boolean;
  googleReady: boolean;
  error: string | null;
  renderGoogleButton: (el: HTMLElement, opts?: Record<string, unknown>) => void;
  signInWithGoogle: () => void;
  signInWithApple: () => void;
  signInEmail: (email: string, password: string) => Promise<boolean>;
  signUpEmail: (email: string, password: string, name?: string) => Promise<boolean>;
  signOut: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);
const LS_KEY = "orbit.user.v1";
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const APPLE_CLIENT_ID = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
const APPLE_REDIRECT = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI;

// Lazy-load Apple's JS SDK the first time it's needed.
function loadAppleSdk(): Promise<any> {
  return new Promise((resolve, reject) => {
    const w = window as unknown as { AppleID?: any };
    if (w.AppleID) return resolve(w.AppleID);
    const existing = document.getElementById("apple-id-script");
    if (existing) {
      existing.addEventListener("load", () => resolve((window as unknown as { AppleID?: any }).AppleID));
      return;
    }
    const s = document.createElement("script");
    s.id = "apple-id-script";
    s.src = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
    s.async = true;
    s.onload = () => resolve((window as unknown as { AppleID?: any }).AppleID);
    s.onerror = () => reject(new Error("failed to load Apple SDK"));
    document.body.appendChild(s);
  });
}

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

  // Shared POST → session helper for email + Apple sign-in. Returns true on success.
  const postAuth = useCallback(
    async (path: string, body: Record<string, unknown>): Promise<boolean> => {
      setError(null);
      let r: Response;
      try {
        r = await fetch(`${API}${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } catch {
        setError(`Couldn't reach the Orbit API at ${API}. Check the backend is running and NEXT_PUBLIC_API_URL is correct.`);
        return false;
      }
      const d = (await r.json().catch(() => ({}))) as { token?: string; user?: OrbitUser; error?: string };
      if (!r.ok || !d.token || !d.user) {
        setError(d.error || `Sign-in failed (${r.status}).`);
        return false;
      }
      setToken(d.token);
      persist(d.user);
      return true;
    },
    [persist],
  );

  const signUpEmail = useCallback(
    (email: string, password: string, name?: string) => postAuth("/auth/register", { email, password, name }),
    [postAuth],
  );
  const signInEmail = useCallback(
    (email: string, password: string) => postAuth("/auth/login", { email, password }),
    [postAuth],
  );

  const signInWithApple = useCallback(async () => {
    setError(null);
    if (!APPLE_CLIENT_ID) {
      setError("Apple sign-in isn't configured yet.");
      return;
    }
    try {
      const AppleID = await loadAppleSdk();
      AppleID.auth.init({
        clientId: APPLE_CLIENT_ID,
        scope: "name email",
        redirectURI: APPLE_REDIRECT || `${window.location.origin}/app`,
        usePopup: true,
      });
      const data = await AppleID.auth.signIn();
      const identityToken: string | undefined = data?.authorization?.id_token;
      // Apple returns the name only on the first authorization.
      const nm = data?.user?.name;
      const name = nm ? [nm.firstName, nm.lastName].filter(Boolean).join(" ") : undefined;
      if (!identityToken) {
        setError("Apple didn't return a sign-in token.");
        return;
      }
      await postAuth("/auth/apple", { identityToken, name });
    } catch (e) {
      // AppleID throws { error: "popup_closed_by_user" } on cancel — not a real error.
      if ((e as { error?: string })?.error !== "popup_closed_by_user") {
        setError("Apple sign-in failed. Please try again.");
      }
    }
  }, [postAuth]);

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

  const signInWithGoogle = useCallback(() => {
    const g = (window as unknown as { google?: any }).google;
    if (CLIENT_ID && g?.accounts?.id && gsiReady.current) {
      // Google One Tap / prompt. If it can't be shown, point the user at the
      // branded Google button instead.
      g.accounts.id.prompt((n: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => {
        if (n.isNotDisplayed?.() || n.isSkippedMoment?.()) {
          setError("Couldn't open Google sign-in. Please use the Google button above.");
        }
      });
    } else {
      setError("Google sign-in isn't ready yet. Please refresh and try again.");
    }
  }, []);

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
    <Ctx.Provider
      value={{
        user,
        ready,
        hasGoogle: !!CLIENT_ID,
        hasApple: !!APPLE_CLIENT_ID,
        googleReady,
        error,
        renderGoogleButton,
        signInWithGoogle,
        signInWithApple,
        signInEmail,
        signUpEmail,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
