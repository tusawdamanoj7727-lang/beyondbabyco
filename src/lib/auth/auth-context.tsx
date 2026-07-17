"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { trackLogout } from "@/lib/analytics/events";
import { supabase } from "@/lib/supabase/client";
import { resetClientCart } from "@/lib/storefront/cart-reset";

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialSession = null,
}: {
  children: ReactNode;
  initialSession?: Session | null;
}) {
  const [session, setSession] = useState<Session | null>(initialSession);
  // Trust SSR: do not block paint with getUser(). onAuthStateChange restores local session.
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    setSession(sessionData.session);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;

    // Prefer local session read (no Auth network) for first paint INP/TBT.
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(() => {
    trackLogout({ method: "password" });
    resetClientCart();
    setSession(null);
    window.location.replace("/");
    void supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      signOut,
      refresh,
    }),
    [session, loading, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return ctx;
}
