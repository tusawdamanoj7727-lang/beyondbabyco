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

import { supabase } from "@/lib/supabase/client";

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
  const [loading, setLoading] = useState(!initialSession);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const { data: sessionData } = await supabase.auth.getSession();
      setSession(sessionData.session);
    } else {
      setSession(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;

    if (!initialSession) {
      supabase.auth.getUser().then(({ data }) => {
        if (!active) return;
        if (data.user) {
          supabase.auth.getSession().then(({ data: sessionData }) => {
            if (!active) return;
            setSession(sessionData.session);
            setLoading(false);
          });
        } else {
          setSession(null);
          setLoading(false);
        }
      });
    }

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
  }, [initialSession]);

  const signOut = useCallback(() => {
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
