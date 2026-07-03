import type { ReactNode } from "react";

import Shell from "@/components/admin/Shell";
import { requireStaff } from "@/lib/auth/guards";
import type { AdminContextValue } from "@/components/admin/context";

export const dynamic = "force-dynamic";

/**
 * Protected admin layout — renders the full Shell for authenticated staff.
 * `requireStaff()` redirects anyone without a staff role to /admin/login.
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, profile, role, permissions } = await requireStaff();

  const value: AdminContextValue = {
    user: {
      email: user?.email ?? null,
      fullName: profile?.fullName ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
    },
    role,
    permissions,
  };

  return <Shell value={value}>{children}</Shell>;
}
