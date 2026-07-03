import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * Admin segment entry layout.
 *
 * The authenticated Shell (sidebar + topbar) lives in
 * `admin/(protected)/layout.tsx` so it does NOT wrap the chrome-free auth
 * pages in `admin/(auth)/` (login / logout). This layout only applies
 * segment-wide metadata.
 */
export const metadata: Metadata = {
  title: { default: "Admin — BeyondBabyCo", template: "%s — BeyondBabyCo Admin" },
  robots: { index: false, follow: false },
};

export default function AdminSegmentLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
