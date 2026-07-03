import type { Metadata } from "next";
import Link from "next/link";

import PageHeader from "@/components/admin/PageHeader";
import Icon from "@/components/admin/Icon";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import {
  listMedia,
  listMediaFolders,
  getMediaFolder,
  MEDIA_BUCKETS,
  MEDIA_TYPES,
  MEDIA_SORTS,
  type MediaBucket,
  type MediaType,
  type MediaSort,
} from "@/lib/admin/media-library";
import MediaClient from "./MediaClient";

export const metadata: Metadata = { title: "Media Library" };

function parseBucket(v: string | undefined): MediaBucket | "all" {
  return (MEDIA_BUCKETS as readonly string[]).includes(v ?? "") ? (v as MediaBucket) : "all";
}
function parseType(v: string | undefined): MediaType | "all" {
  return (MEDIA_TYPES as readonly string[]).includes(v ?? "") ? (v as MediaType) : "all";
}
function parseSort(v: string | undefined): MediaSort {
  return (MEDIA_SORTS as readonly string[]).includes(v ?? "") ? (v as MediaSort) : "newest";
}

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission(PERMISSIONS.MEDIA_MANAGE);

  const sp = await searchParams;
  const bucket = parseBucket(sp.bucket);
  const type = parseType(sp.type);
  const sort = parseSort(sp.sort);
  const page = Math.max(1, Number(sp.page) || 1);
  const view = sp.view === "list" ? "list" : "grid";
  const folderId = sp.folder ?? "";

  const folders = await listMediaFolders();
  const selectedFolder = folderId ? await getMediaFolder(folderId) : null;

  // Resolve the selected folder into concrete query filters.
  const folderFilter =
    selectedFolder && selectedFolder.isSystem
      ? { bucket: (selectedFolder.bucket ?? "all") as MediaBucket | "all", pathPrefix: selectedFolder.pathPrefix || undefined, folderId: undefined }
      : selectedFolder
        ? { bucket: "all" as const, pathPrefix: undefined, folderId: selectedFolder.id }
        : { bucket, pathPrefix: undefined, folderId: undefined };

  const result = await listMedia({
    search: sp.q ?? "",
    bucket: folderFilter.bucket,
    pathPrefix: folderFilter.pathPrefix,
    folderId: folderFilter.folderId,
    productId: sp.product ?? undefined,
    minWidth: sp.minWidth ? Number(sp.minWidth) : undefined,
    type,
    sort,
    page,
    perPage: view === "list" ? 20 : 24,
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Content"
        title="Media Library"
        description="Browse, organise and upload every asset across your storage buckets"
        actions={
          <Link
            href="/admin/media/upload"
            className="inline-flex h-12 items-center gap-2 rounded-3xl bg-green-500 px-6 font-medium text-cream-50 shadow-clay transition-colors hover:bg-green-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500 focus-visible:ring-offset-2"
          >
            <Icon name="plus" size={18} />
            Upload
          </Link>
        }
      />

      {sp.source === "generated" ? (
        <div className="rounded-3xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Approved FLUX editorial assets are managed in{" "}
          <Link href="/admin/ai-assets" className="font-medium underline">
            AI Assets
          </Link>
          . Only human-approved images go live on the storefront.
        </div>
      ) : null}

      <MediaClient
        rows={result.rows}
        total={result.total}
        page={result.page}
        perPage={result.perPage}
        pageCount={result.pageCount}
        folders={folders}
        selectedFolderId={folderId}
        filters={{ search: sp.q ?? "", bucket, type, productId: sp.product ?? "" }}
        sort={sort}
        view={view}
      />
    </div>
  );
}
