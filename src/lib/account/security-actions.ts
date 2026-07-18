"use server";

import { z } from "zod";

import { mapSupabaseAuthError } from "@/lib/auth/auth-errors";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { passwordResetRedirectUrl } from "@/lib/auth/auth-urls";
import { getAuthBaseUrlForRequest } from "@/lib/app-url.server";

export type SecurityActionState = {
  error: string | null;
  success: string | null;
  fieldErrors?: Record<string, string>;
};

const changePasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function fieldErrorsFromIssues(issues: z.ZodIssue[]): Record<string, string> | undefined {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !errors[key]) errors[key] = issue.message;
  }
  return Object.keys(errors).length > 0 ? errors : undefined;
}

export async function changeAccountPasswordAction(
  _prev: SecurityActionState,
  formData: FormData,
): Promise<SecurityActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Sign in to change your password.", success: null };
  }

  const parsed = changePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Validation failed",
      success: null,
      fieldErrors: fieldErrorsFromIssues(parsed.error.issues),
    };
  }

  if (!isSupabaseConfigured()) {
    return { error: "Authentication is not configured.", success: null };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { error: mapSupabaseAuthError(error), success: null };
  }

  return { error: null, success: "Password updated successfully." };
}

export async function sendPasswordResetEmailAction(
  _prev: SecurityActionState,
  formData: FormData,
): Promise<SecurityActionState> {
  const user = await getCurrentUser();
  const email = (user?.email ?? String(formData.get("email") ?? "")).trim().toLowerCase();
  if (!email) {
    return { error: "No email on this account.", success: null };
  }

  if (!isSupabaseConfigured()) {
    return { error: "Authentication is not configured.", success: null };
  }

  const supabase = await createSupabaseServerClient();
  const authBaseUrl = await getAuthBaseUrlForRequest();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: passwordResetRedirectUrl(authBaseUrl),
  });

  if (error) {
    return { error: mapSupabaseAuthError(error), success: null };
  }

  return {
    error: null,
    success: "Password reset email sent. Check your inbox for the link.",
  };
}
