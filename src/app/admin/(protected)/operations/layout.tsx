import type { Metadata } from "next";

import PageHeader from "@/components/admin/PageHeader";
import OperationsNav from "@/components/admin/operations/OperationsNav";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";

export const metadata: Metadata = { title: "Operations" };

export default async function OperationsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.SETTINGS_MANAGE);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="System"
        title="Operations"
        description="Production health, integrations, security, and deployment readiness"
      />
      <OperationsNav />
      {children}
    </div>
  );
}
