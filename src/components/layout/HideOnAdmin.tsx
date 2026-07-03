"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { isCustomerAuthPath } from "@/lib/routes";

/**
 * Renders children on the public website but hides them on /admin routes,
 * so the admin shell isn't wrapped in the marketing ticker/footer chrome.
 */
export default function HideOnAdmin({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin") || isCustomerAuthPath(pathname)) return null;
  return <>{children}</>;
}
