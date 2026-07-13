import { Suspense } from "react";

import LoginPageClient from "./LoginPageClient";

function LoginFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div
        className="spinner-premium h-8 w-8 border-[3px] border-green-700"
        role="status"
        aria-label="Loading sign in"
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-green-900 focus:shadow-md focus:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
      >
        Skip to main content
      </a>
      <main id="main-content">
        <Suspense fallback={<LoginFallback />}>
          <LoginPageClient />
        </Suspense>
      </main>
    </>
  );
}
