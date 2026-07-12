"use client";

import type { Session } from "@supabase/supabase-js";
import type { ReactNode } from "react";

import { AuthProvider } from "@/lib/auth/auth-context";

/** Root auth context — wraps the full app so header chrome can read session state. */
export default function AppProviders({
  children,
  initialSession = null,
}: {
  children: ReactNode;
  initialSession?: Session | null;
}) {
  return <AuthProvider initialSession={initialSession}>{children}</AuthProvider>;
}
