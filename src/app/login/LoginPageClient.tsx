"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import type { AuthError } from "@supabase/supabase-js";

import { Mascot } from "@/components/mascots";
import { customerOAuthAction } from "@/lib/auth/customer-auth-actions";
import { callbackErrorMessage, mapSupabaseAuthError } from "@/lib/auth/auth-errors";
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

const PANEL_CIRCLES = [
  { left: "8%", top: "12%", size: 128 },
  { left: "72%", top: "18%", size: 96 },
  { left: "45%", top: "8%", size: 64 },
  { left: "18%", top: "55%", size: 112 },
  { left: "68%", top: "62%", size: 80 },
  { left: "38%", top: "78%", size: 144 },
  { left: "82%", top: "38%", size: 56 },
  { left: "5%", top: "82%", size: 72 },
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
        router.push(redirectTo);
        router.refresh();
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
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
        setMessage("Account created! Check your email to verify.");
      }
    } catch (err) {
      setError(mapSupabaseAuthError(err as AuthError));
    } finally {
      setLoading(false);
    }
  };

  const inputClassName =
    "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a27]";

  return (
    <div className="flex min-h-screen bg-[#faf5f0]">
      {/* Left panel — desktop */}
      <div className="relative hidden w-5/12 flex-col items-center justify-center overflow-hidden bg-[#2d5a27] p-12 lg:flex">
        <div aria-hidden="true" className="absolute inset-0 opacity-5">
          {PANEL_CIRCLES.map((circle, index) => (
            <div
              key={index}
              className="absolute rounded-full border border-white"
              style={{
                left: circle.left,
                top: circle.top,
                width: circle.size,
                height: circle.size,
              }}
            />
          ))}
        </div>

        <Image
          src="/images/brand/logo.svg"
          alt="BeyondBabyCo"
          width={160}
          height={52}
          sizes="160px"
          className="relative z-10 mb-8 h-12 w-auto brightness-0 invert"
          priority
        />

        <div className="relative z-10 my-6">
          <Mascot
            mascot="bella-bunny"
            pose="welcome"
            size={224}
            priority
            animated
            floating
            alt="Bella Bunny welcomes you to BeyondBabyCo"
          />
        </div>

        <h2 className="relative z-10 mb-4 text-center text-2xl font-black leading-tight text-white">
          Every Baby Deserves
          <br />
          The Safest Touch
        </h2>

        <div className="relative z-10 mt-4 space-y-2">
          {TRUST_POINTS.map((point) => (
            <div key={point} className="flex items-center gap-2 text-sm text-green-200">
              <span className="font-bold text-green-400">✓</span>
              {point}
            </div>
          ))}
        </div>

        <p className="relative z-10 mt-8 text-center text-xs text-green-300">
          Join 2,000+ parents who trust BeyondBabyCo
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center p-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <Image
              src="/images/brand/logo.svg"
              alt="BeyondBabyCo"
              width={140}
              height={45}
              sizes="140px"
              className="mx-auto h-10 w-auto"
              priority
            />
          </div>

          <div className="mb-8 flex rounded-2xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => switchTab("login")}
              className={cn(
                "flex-1 rounded-xl py-2.5 text-sm font-bold transition-all",
                tab === "login" ? "bg-white text-[#2d5a27] shadow-sm" : "text-gray-500",
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchTab("register")}
              className={cn(
                "flex-1 rounded-xl py-2.5 text-sm font-bold transition-all",
                tab === "register" ? "bg-white text-[#2d5a27] shadow-sm" : "text-gray-500",
              )}
            >
              Create Account
            </button>
          </div>

          <h1 className="mb-1 text-2xl font-black text-[#2d5a27]">
            {tab === "login" ? "Welcome back 👋" : "Join the family ✨"}
          </h1>
          <p className="mb-6 text-sm text-gray-500">
            {tab === "login" ? "Sign in to your BeyondBabyCo account" : "Create your free account"}
          </p>

          <button
            type="button"
            onClick={() => void handleGoogle()}
            disabled={googleLoading}
            className="mb-4 flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white py-3.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 disabled:opacity-60"
          >
            {googleLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-[#2d5a27]" />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </button>

          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-medium text-gray-400">or continue with email</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {tab === "register" ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              type="text"
              autoComplete="name"
              className={cn(inputClassName, "mb-3")}
            />
          ) : null}

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            type="email"
            autoComplete="email"
            className={cn(inputClassName, "mb-3")}
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            autoComplete={tab === "register" ? "new-password" : "current-password"}
            className={cn(inputClassName, "mb-1")}
          />

          {tab === "login" ? (
            <div className="mb-4 text-right">
              <Link href="/forgot-password" className="text-xs text-[#2d5a27] hover:underline">
                Forgot password?
              </Link>
            </div>
          ) : (
            <div className="mb-4" />
          )}

          {error ? (
            <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-center text-xs text-red-500">{error}</p>
          ) : null}
          {message ? (
            <p className="mb-3 rounded-xl bg-green-50 px-3 py-2 text-center text-xs text-green-600">{message}</p>
          ) : null}

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={loading}
            className="w-full rounded-2xl bg-[#2d5a27] py-4 text-base font-bold text-white shadow-lg shadow-green-900/20 transition-colors hover:bg-[#234821] disabled:opacity-60"
          >
            {loading ? "Please wait..." : tab === "login" ? "Sign In →" : "Create Account →"}
          </button>

          <p className="mt-6 text-center text-xs text-gray-400">
            By continuing you agree to our{" "}
            <Link href="/terms-of-service" className="underline hover:text-gray-600">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="underline hover:text-gray-600">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
