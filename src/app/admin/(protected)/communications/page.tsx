import type { Metadata } from "next";
import dynamic from "next/dynamic";

import PageHeader from "@/components/admin/PageHeader";
import ModuleLoading from "@/components/ui/ModuleLoading";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { EMAIL_TEMPLATE_COUNTS } from "@/lib/communications";

const CommunicationsPreviewClient = dynamic(() => import("./CommunicationsPreviewClient"), {
  loading: () => <ModuleLoading label="Loading communications preview…" />,
});

export const metadata: Metadata = { title: "Communications Preview" };

export default async function CommunicationsPage() {
  await requirePermission(PERMISSIONS.MARKETING_VIEW);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Marketing"
        title="Communications Preview"
        description={`Preview ${EMAIL_TEMPLATE_COUNTS.total} branded email templates and multi-channel notifications with sample data.`}
      />
      <CommunicationsPreviewClient />
    </div>
  );
}
