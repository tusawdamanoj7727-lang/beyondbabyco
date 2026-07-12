"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { ensureCustomerRecordsForUser } from "@/lib/auth/customer-bootstrap";
import { onNewCustomer } from "@/lib/email/events/admin";
import { getAuthBaseUrlForRequest } from "@/lib/app-url.server";
import {
  emailVerificationRedirectUrl,
  oauthRedirectUrl,
  passwordResetRedirectUrl,
} from "@/lib/auth/auth-urls";
import { mapSupabaseAuthError } from "@/lib/auth/auth-errors";
import { isSupabaseConfigured } from "@/lib/env";
import { resolveCustomerRedirect } from "@/lib/routes";
import { createSupabaseServerClient } from "../supabase/server";

export interface CustomerAuthState {
  error: string | null;
  success: string | null;
  fieldErrors?: Record<string, string>;
}

const emailSchema = z.string().trim().min(1, "Email is required").email("Enter a valid email");

const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, "Password must be at least 6 characters"),
  redirectTo: z.string().optional(),
});

const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2, "Name must be at least 2 characters"),
    email: emailSchema,
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function fieldErrorsFromIssues(
  issues: z.ZodIssue[],
): Record<string, string> | undefined {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !errors[key]) {
      errors[key] = issue.message;
    }
  }
  return Object.keys(errors).length > 0 ? errors : undefined;
}

export async function customerSignInAction(
  _prevState: CustomerAuthState,
  formData: FormData,
): Promise<CustomerAuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    redirectTo: formData.get("redirectTo") ?? undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid credentials",
      success: null,
      fieldErrors: fieldErrorsFromIssues(parsed.error.issues),
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      error:
        "Authentication is not configured. Please try again later or contact support.",
      success: null,
    };
  }

  const { email, password, redirectTo } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: mapSupabaseAuthError(error), success: null };
  }

  if (data.user) {
    void ensureCustomerRecordsForUser(data.user).catch((err) => {
      console.warn("[customer-auth] profile bootstrap skipped:", err);
    });
  }

  redirect(resolveCustomerRedirect(redirectTo));
}

export async function customerSignUpAction(
  _prevState: CustomerAuthState,
  formData: FormData,
): Promise<CustomerAuthState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
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
    return {
      error:
        "Authentication is not configured. Please try again later or contact support.",
      success: null,
    };
  }

  const { fullName, email, password } = parsed.data;
  const supabase = await createSupabaseServerClient();
  const authBaseUrl = await getAuthBaseUrlForRequest();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: emailVerificationRedirectUrl(authBaseUrl),
    },
  });

  if (error) {
    return { error: mapSupabaseAuthError(error), success: null };
  }

  if (data.user) {
    void ensureCustomerRecordsForUser(data.user)
      .then((customerId) => {
        if (customerId) onNewCustomer(customerId);
      })
      .catch((err) => {
        console.warn("[customer-auth] profile bootstrap skipped:", err);
      });
  }

  if (data.session) {
    redirect("/account");
  }

  return {
    error: null,
    success: "Account created! Check your email to confirm your address, then sign in.",
  };
}

export async function customerForgotPasswordAction(
  _prevState: CustomerAuthState,
  formData: FormData,
): Promise<CustomerAuthState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Enter a valid email",
      success: null,
      fieldErrors: fieldErrorsFromIssues(parsed.error.issues),
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      error:
        "Authentication is not configured. Please try again later or contact support.",
      success: null,
    };
  }

  const supabase = await createSupabaseServerClient();
  const authBaseUrl = await getAuthBaseUrlForRequest();

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: passwordResetRedirectUrl(authBaseUrl),
  });

  if (error) {
    return { error: mapSupabaseAuthError(error), success: null };
  }

  return {
    error: null,
    success: "If an account exists for that email, we sent a password reset link.",
  };
}

export async function customerResetPasswordAction(
  _prevState: CustomerAuthState,
  formData: FormData,
): Promise<CustomerAuthState> {
  const parsed = resetPasswordSchema.safeParse({
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
    return {
      error: "Authentication is not configured.",
      success: null,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { error: mapSupabaseAuthError(error), success: null };
  }

  redirect("/login?reset=success");
}

export async function customerOAuthAction(
  redirectTo?: string,
): Promise<{ url: string | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { url: null, error: "Authentication is not configured." };
  }

  const supabase = await createSupabaseServerClient();
  const next = resolveCustomerRedirect(redirectTo);
  const authBaseUrl = await getAuthBaseUrlForRequest();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: oauthRedirectUrl(next, authBaseUrl),
      skipBrowserRedirect: true,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });

  if (error) {
    return { url: null, error: mapSupabaseAuthError(error) };
  }

  return { url: data.url, error: null };
}

export async function customerSignOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
