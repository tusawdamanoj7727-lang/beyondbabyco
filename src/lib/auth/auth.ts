"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "../supabase/server";
import { isSupabaseConfigured } from "../env";
import { mapSupabaseAuthError } from "./auth-errors";
import { isStaffRole, resolveEffectiveRole } from "./roles";

export interface AuthActionState {
  error: string | null;
}

const signInSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember: z.boolean().optional(),
  redirectTo: z.string().optional(),
});

/** Safe internal redirect target (must stay within the admin area). */
function resolveRedirect(target: string | undefined): string {
  if (target && target.startsWith("/admin") && !target.startsWith("//")) {
    return target;
  }
  return "/admin";
}

/**
 * Server action: email + password sign in for the admin area.
 * Only staff roles (admin / manager / support) are admitted; on success an
 * audit entry is written to activity_logs.
 */
export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    remember: formData.get("remember") === "on",
    redirectTo: formData.get("redirectTo") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid credentials" };
  }

  const { email, password, redirectTo } = parsed.data;

  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart the dev server.",
    };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: mapSupabaseAuthError(error) };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Gate the admin area to staff roles only (profile role + metadata fallback).
  const { data: roleName, error: roleError } = await supabase.rpc("current_user_role");

  if (roleError) {
    console.error("[auth] current_user_role RPC failed:", roleError.message);
  }

  const role = roleError ? resolveEffectiveRole(null, user) : resolveEffectiveRole(roleName, user);

  if (!isStaffRole(role)) {
    await supabase.auth.signOut();
    if (!role) {
      return {
        error:
          "This account is not set up for admin access. Run npm run bootstrap:admin or contact your administrator.",
      };
    }
    return { error: "This account does not have admin access." };
  }

  void supabase.rpc("log_activity", {
    p_action: "auth.login",
    p_entity: "session",
    p_metadata: { role, method: "password" },
  }).then(({ error }) => {
    if (error) console.warn("[auth] log_activity skipped:", error.message);
  });

  redirect(resolveRedirect(redirectTo));
}

/**
 * Server action: destroy the session and return to the login page.
 * Writes a logout audit entry before clearing the session.
 */
export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    void supabase.rpc("log_activity", {
      p_action: "auth.logout",
      p_entity: "session",
    });
  }

  await supabase.auth.signOut();
  redirect("/admin/login");
}
