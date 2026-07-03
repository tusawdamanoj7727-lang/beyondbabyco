import type { ReactNode } from "react";

/**
 * Standalone full-screen layout for admin auth pages (login / logout).
 * Intentionally free of dashboard chrome.
 */
export default function AdminAuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-cream-100 px-4 py-12">
      {/* Decorative brand orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-green-200/50 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-terra-200/50 blur-3xl"
      />
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
