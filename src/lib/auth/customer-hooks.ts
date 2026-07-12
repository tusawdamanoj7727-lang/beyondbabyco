"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "../supabase/client";
import { useAuth } from "./hooks";

export interface CustomerProfile {
  fullName: string | null;
  avatarUrl: string | null;
}

export interface UseCustomerAuthResult {
  user: User | null;
  profile: CustomerProfile | null;
  displayName: string;
  loading: boolean;
  isLoggedIn: boolean;
  signOut: () => void;
}

function displayNameFrom(user: User | null, profile: CustomerProfile | null): string {
  if (profile?.fullName) return profile.fullName;
  const meta = user?.user_metadata?.full_name;
  if (typeof meta === "string" && meta.trim()) return meta.trim();
  if (user?.email) return user.email.split("@")[0] ?? "Account";
  return "Account";
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function useCustomerAuth(): UseCustomerAuthResult {
  const { user, loading: authLoading, signOut: authSignOut } = useAuth();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);

  useEffect(() => {
    let active = true;

    if (authLoading) return;

    if (!user) {
      setProfile(null);
      return;
    }

    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setProfile(null);
        } else {
          setProfile(
            data
              ? { fullName: data.full_name, avatarUrl: data.avatar_url }
              : null,
          );
        }
      });

    return () => {
      active = false;
    };
  }, [user, authLoading]);

  const signOut = useCallback(() => {
    authSignOut();
  }, [authSignOut]);

  const displayName = displayNameFrom(user, profile);
  // Show authenticated UI as soon as user is known — profile enriches in background.
  const loading = authLoading;

  return {
    user,
    profile,
    displayName,
    loading,
    isLoggedIn: !!user && !authLoading,
    signOut,
  };
}
