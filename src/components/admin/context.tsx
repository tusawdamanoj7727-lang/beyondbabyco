"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { Role } from "@/lib/auth/roles";
import type { Permission } from "@/lib/auth/permissions";

export interface AdminUser {
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface AdminContextValue {
  user: AdminUser;
  role: Role | null;
  permissions: Permission[];
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({
  value,
  children,
}: {
  value: AdminContextValue;
  children: ReactNode;
}) {
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return ctx;
}

/** A short initials label for avatars, e.g. "Aman Verma" -> "AV". */
export function initialsFrom(user: AdminUser): string {
  const source = user.fullName?.trim() || user.email?.trim() || "";
  if (!source) return "BB";
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  const letters = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return (letters || source.slice(0, 2)).toUpperCase();
}
