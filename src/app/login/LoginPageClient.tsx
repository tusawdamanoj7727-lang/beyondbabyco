"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { resolveCustomerRedirect } from "@/lib/routes";

type AuthMode = "login" | "register" | "forgot";

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = resolveCustomerRedirect(searchParams.get("redirectTo") ?? undefined);

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError("");
    setMessage("");
  };

  const handle = async () => {
    const supabase = createClient();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        router.push(redirectTo);
        router.refresh();
      } else if (mode === "register") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (signUpError) throw signUpError;
        setMessage("Account created! Check your email to verify.");
      } else {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (resetError) throw resetError;
        setMessage("Reset link sent to your email!");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf5f0] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl">
          <div className="bg-[#2d5a27] p-8 text-center">
            <Image
              src="/images/brand/logo.svg"
              alt="BeyondBabyCo"
              width={150}
              height={48}
              sizes="150px"
              className="mx-auto h-12 w-auto"
              priority
            />
            <p className="mt-2 text-sm text-green-200">Every Baby Deserves The Safest Touch</p>
          </div>

          <div className="p-8">
            <h1 className="mb-6 text-center text-2xl font-black text-[#2d5a27]">
              {mode === "login"
                ? "Welcome Back 👋"
                : mode === "register"
                  ? "Create Account ✨"
                  : "Reset Password 🔑"}
            </h1>

            {mode === "register" ? (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                className="mb-3 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a27]"
              />
            ) : null}

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Email address"
              autoComplete="email"
              className="mb-3 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a27]"
            />

            {mode !== "forgot" ? (
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Password"
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                className="mb-4 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a27]"
              />
            ) : null}

            {error ? <p className="mb-3 text-center text-sm text-red-500">{error}</p> : null}
            {message ? <p className="mb-3 text-center text-sm text-green-600">{message}</p> : null}

            <button
              type="button"
              onClick={() => void handle()}
              disabled={loading}
              className="w-full rounded-2xl bg-[#2d5a27] py-4 text-base font-bold text-white transition-colors hover:bg-[#234821] disabled:opacity-60"
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Sign In"
                  : mode === "register"
                    ? "Create Account"
                    : "Send Reset Email"}
            </button>

            <div className="mt-6 space-y-2 text-center text-sm text-gray-500">
              {mode === "login" ? (
                <>
                  <button
                    type="button"
                    onClick={() => switchMode("forgot")}
                    className="block w-full hover:text-[#2d5a27]"
                  >
                    Forgot password?
                  </button>
                  <p>
                    No account?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("register")}
                      className="font-semibold text-[#2d5a27] hover:underline"
                    >
                      Sign up free
                    </button>
                  </p>
                </>
              ) : (
                <p>
                  Have account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="font-semibold text-[#2d5a27] hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          By continuing, you agree to our{" "}
          <Link href="/terms-of-service" className="underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy-policy" className="underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
