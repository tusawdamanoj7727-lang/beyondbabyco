import type { Metadata } from "next";

import PageHeader from "@/components/admin/PageHeader";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { listCustomFolders } from "@/lib/admin/media-library";
import UploadClient from "./UploadClient";

export const metadata: Metadata = { title: "Upload media" };

export default async function UploadMediaPage() {
  await requirePermission(PERMISSIONS.MEDIA_MANAGE);
  const folders = await listCustomFolders();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Media Library"
        title="Upload media"
        description="Drag & drop files, choose a destination bucket or folder, and upload in bulk."
      />
      <UploadClient folders={folders.map((f) => ({ id: f.id, name: f.name, pathPrefix: f.pathPrefix }))} />
    </div>
  );
}
