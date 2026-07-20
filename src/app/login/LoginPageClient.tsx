"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import type { AuthError } from "@supabase/supabase-js";

import { Mascot } from "@/components/mascots";
import {
  customerOAuthAction,
  ensureCustomerBootstrapAction,
} from "@/lib/auth/customer-auth-actions";
import { callbackErrorMessage, mapSupabaseAuthError } from "@/lib/auth/auth-errors";
import { trackAccountCreated, trackLogin, trackSignup } from "@/lib/analytics/events";
import { authCallbackUrl } from "@/lib/auth/auth-urls";
import { resolveCustomerRedirect } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type AuthTab = "login" | "register";

const TRUST_POINTS = [
  "Dermatologically Tested",
  "Made in India",
  "5 Years of Research",
  "Safe for Newborns",
] as const;

const AMBIENT_DOTS = [
  { left: "6%", top: "14%", size: 10, delay: 0 },
  { left: "18%", top: "72%", size: 8, delay: 0.6 },
  { left: "82%", top: "22%", size: 12, delay: 1.2 },
  { left: "74%", top: "78%", size: 9, delay: 0.3 },
  { left: "42%", top: "8%", size: 7, delay: 0.9 },
  { left: "55%", top: "88%", size: 11, delay: 1.5 },
] as const;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function GentleAlertIcon({ variant }: { variant: "error" | "success" }) {
  if (variant === "success") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
  );
}

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = resolveCustomerRedirect(searchParams.get("redirectTo") ?? undefined);

  const [tab, setTab] = useState<AuthTab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const errorCode = searchParams.get("error");
    if (!errorCode) return;
    setError(callbackErrorMessage(errorCode, searchParams.get("reason")));
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      setMessage("Password updated. You can sign in with your new password.");
    }
  }, [searchParams]);

  const switchTab = (next: AuthTab) => {
    setTab(next);
    setError("");
    setMessage("");
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError("");

    const { url, error: oauthError } = await customerOAuthAction(redirectTo);

    if (oauthError || !url) {
      setError(oauthError ?? "Unable to start Google sign in. Please try email instead.");
      setGoogleLoading(false);
      return;
    }

    window.location.href = url;
  };

  const handleSubmit = async () => {
    const supabase = createClient();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (tab === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        trackLogin({ method: "password" });
        await ensureCustomerBootstrapAction();
        router.push(redirectTo);
        router.refresh();
      } else {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: authCallbackUrl({
              baseUrl: window.location.origin,
              type: "signup",
              next: "/account?verified=1",
            }),
          },
        });
        if (signUpError) throw signUpError;
        trackSignup({ method: "password" });
        trackAccountCreated({ method: "password" });
        if (signUpData.session) {
          await ensureCustomerBootstrapAction({ welcome: true });
          router.push(redirectTo);
          router.refresh();
        } else {
          setMessage("Account created! Check your email to verify.");
        }
      }
    } catch (err) {
      setError(mapSupabaseAuthError(err as AuthError));
    } finally {
      setLoading(false);
    }
  };

  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const formErrorId = useId();

  const inputClassName =
    "auth-modal-input w-full text-sm text-green-900 placeholder:text-green-700/55";

  return (
    <div className="auth-modal-page relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <div aria-hidden="true" className="auth-modal-ambient pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_15%_0%,rgba(232,180,184,0.22),transparent_68%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_88%_100%,rgba(168,191,160,0.2),transparent_72%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_50%,rgba(245,220,160,0.14),transparent_70%)]" />
        {AMBIENT_DOTS.map((dot, index) => (
          <span
            key={index}
            className="auth-modal-dot absolute rounded-full bg-[#e8b4b8]/35"
            style={{
              left: dot.left,
              top: dot.top,
              width: dot.size,
              height: dot.size,
              animationDelay: `${dot.delay}s`,
            }}
          />
        ))}
        <span className="auth-modal-cloud auth-modal-cloud--one" />
        <span className="auth-modal-cloud auth-modal-cloud--two" />
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-10 left-10 hidden max-w-xs lg:block"
      >
        <p className="font-heading text-sm font-semibold uppercase tracking-[0.18em] text-green-800/35">
          BeyondBabyCo
        </p>
        <ul className="mt-3 space-y-1.5">
          {TRUST_POINTS.map((point) => (
            <li key={point} className="text-xs text-green-800/30">
              {point}
            </li>
          ))}
        </ul>
      </div>

      <div className="auth-modal-card auth-panel-enter relative z-10 w-full max-w-md overflow-visible px-6 py-8 sm:px-8 sm:py-10">
        <Link
          href="/"
          aria-label="Close and return home"
          className="auth-modal-close absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-[#e8dfd2] bg-[#fff9f2]/90 text-green-800/70 shadow-sm transition-all hover:scale-105 hover:bg-white hover:text-green-900 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8b4b8]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffbf5] sm:right-5 sm:top-5"
        >
          <X size={18} strokeWidth={2} aria-hidden="true" />
        </Link>

        <div
          aria-hidden="true"
          className="auth-modal-mascot-peek pointer-events-none absolute -right-2 -top-14 z-20 sm:-right-4 sm:-top-16"
        >
          <Mascot
            mascot="gigi-giraffe"
            pose="welcome"
            size={96}
            priority
            animated
            floating
            duration={4}
            alt=""
          />
        </div>

        <span aria-hidden="true" className="auth-modal-star absolute left-6 top-3 text-[#f5dca0] sm:left-8">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.2 6.8H21l-5.5 4 2.1 6.7L12 17.8 6.4 19.5l2.1-6.7L3 8.8h6.8L12 2z" />
          </svg>
        </span>

        <div className="relative mb-7 pt-2 text-center">
          <Image
            src="/images/brand/logo.svg"
            alt="BeyondBabyCo"
            width={132}
            height={42}
            sizes="132px"
            className="mx-auto h-9 w-auto"
            priority
          />

          <div className="auth-modal-tabs mt-6 flex rounded-[var(--radius-card)] bg-cream-200/80 p-1.5">
            <button
              type="button"
              onClick={() => switchTab("login")}
              className={cn(
                "flex-1 rounded-[18px] py-2.5 text-sm font-semibold transition-all duration-300",
                tab === "login"
                  ? "auth-modal-tab--active bg-white text-green-900 shadow-[0_4px_14px_rgba(168,191,160,0.22)]"
                  : "text-green-800/55 hover:text-green-800/75",
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchTab("register")}
              className={cn(
                "flex-1 rounded-[18px] py-2.5 text-sm font-semibold transition-all duration-300",
                tab === "register"
                  ? "auth-modal-tab--active bg-white text-green-900 shadow-[0_4px_14px_rgba(232,180,184,0.24)]"
                  : "text-green-800/55 hover:text-green-800/75",
              )}
            >
              Create Account
            </button>
          </div>

          <h1 className="auth-modal-title mt-6 font-heading text-[1.65rem] font-bold leading-[1.35] text-green-900">
            {tab === "login" ? "Welcome back!" : "Join our little family"}
          </h1>
          <p className="auth-modal-subtitle mt-2 text-sm leading-relaxed text-green-800/65">
            {tab === "login"
              ? "We're so glad you're here — sign in to pick up where you left off."
              : "Create your free account and discover gentle, research-backed baby care."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleGoogle()}
          disabled={googleLoading}
          className="auth-modal-google mb-4 flex w-full items-center justify-center gap-3 rounded-[var(--radius-card)] border border-cream-300 bg-white/85 py-3.5 text-sm font-medium text-green-900/85 shadow-sm transition-all hover:-translate-y-px hover:border-cream-400 hover:bg-white hover:shadow-md disabled:opacity-60"
        >
          {googleLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#e8dfd2] border-t-green-800" />
          ) : (
            <GoogleIcon />
          )}
          Continue with Google
        </button>

        <div className="auth-modal-divider mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cream-300 to-transparent" />
          <span className="text-xs font-medium text-green-800/58">or continue with email</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cream-300 to-transparent" />
        </div>

        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          {tab === "register" ? (
            <div className="mb-3">
              <label htmlFor={nameId} className="sr-only">
                Full name
              </label>
              <input
                id={nameId}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                type="text"
                autoComplete="name"
                required
                aria-required="true"
                className={inputClassName}
              />
            </div>
          ) : null}

          <div className="mb-3">
            <label htmlFor={emailId} className="sr-only">
              Email address
            </label>
            <input
              id={emailId}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              type="email"
              autoComplete="email"
              required
              aria-required="true"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? formErrorId : undefined}
              className={inputClassName}
            />
          </div>

          <div className="mb-1">
            <label htmlFor={passwordId} className="sr-only">
              Password
            </label>
            <input
              id={passwordId}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              autoComplete={tab === "register" ? "new-password" : "current-password"}
              required
              aria-required="true"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? formErrorId : undefined}
              className={inputClassName}
            />
          </div>

          {tab === "login" ? (
            <div className="mb-4 text-right">
              <Link
                href="/forgot-password"
                className="rounded-full px-1 text-xs font-medium text-brand-terra/90 transition-colors hover:text-terra-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500/50"
              >
                Forgot password?
              </Link>
            </div>
          ) : (
            <div className="mb-4" />
          )}

          {error ? (
            <p
              id={formErrorId}
              role="alert"
              aria-live="polite"
              className="auth-modal-alert auth-modal-alert--error mb-3 flex items-start gap-2.5 rounded-[18px] px-3.5 py-2.5 text-left text-xs leading-relaxed"
            >
              <span className="mt-0.5 shrink-0 opacity-80">
                <GentleAlertIcon variant="error" />
              </span>
              <span>{error}</span>
            </p>
          ) : null}

          {message ? (
            <p
              role="status"
              aria-live="polite"
              className="auth-modal-alert auth-modal-alert--success mb-3 flex items-start gap-2.5 rounded-[18px] px-3.5 py-2.5 text-left text-xs leading-relaxed"
            >
              <span className="mt-0.5 shrink-0 opacity-80">
                <GentleAlertIcon variant="success" />
              </span>
              <span>{message}</span>
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="auth-modal-primary w-full rounded-full py-4 text-base font-bold text-white disabled:opacity-60"
          >
            {loading ? "Please wait..." : tab === "login" ? "Sign In →" : "Create Account →"}
          </button>
        </form>

        <p className="auth-modal-legal mt-6 text-center text-xs leading-relaxed text-green-800/58">
          By continuing you agree to our{" "}
          <Link
            href="/terms-of-service"
            className="font-medium text-green-800/60 underline decoration-[#e8b4b8]/50 underline-offset-2 hover:text-green-900"
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy-policy"
            className="font-medium text-green-800/60 underline decoration-[#e8b4b8]/50 underline-offset-2 hover:text-green-900"
          >
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
