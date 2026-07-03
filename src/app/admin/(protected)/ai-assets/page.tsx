import type { Metadata } from "next";
import Link from "next/link";

import PageHeader from "@/components/admin/PageHeader";
import Icon from "@/components/admin/Icon";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getAiAssetDashboard, listAiAssets } from "@/lib/admin/ai-asset-library";
import { AI_ASSET_STATUSES, type AiAssetStatus } from "@/lib/admin/ai-asset-types";
import AiAssetsClient from "./AiAssetsClient";

export const metadata: Metadata = { title: "AI Assets" };

function parseStatus(v: string | undefined): AiAssetStatus | "all" {
  return (AI_ASSET_STATUSES as readonly string[]).includes(v ?? "") ? (v as AiAssetStatus) : "all";
}

export default async function AiAssetsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission(PERMISSIONS.MEDIA_MANAGE);

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const status = parseStatus(sp.status);
  const category = sp.category ?? "all";

  const [result, dashboard] = await Promise.all([
    listAiAssets({ search: sp.q ?? "", status, category, page, perPage: 24 }),
    getAiAssetDashboard(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Catalog"
        title="AI Assets"
        description="Review FLUX editorial candidates, approve for live storefront, and manage slot assignments"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/media"
              className="inline-flex h-12 items-center gap-2 rounded-3xl border border-cream-300 bg-cream-50 px-5 font-medium text-green-800 transition-colors hover:bg-cream-100"
            >
              <Icon name="media" size={18} />
              Media Library
            </Link>
            <Link
              href="/admin/media/upload"
              className="inline-flex h-12 items-center gap-2 rounded-3xl bg-green-500 px-6 font-medium text-cream-50 shadow-clay transition-colors hover:bg-green-600"
            >
              <Icon name="plus" size={18} />
              Upload Packaging
            </Link>
          </div>
        }
      />

      <AiAssetsClient
        rows={result.rows}
        total={result.total}
        page={result.page}
        perPage={result.perPage}
        pageCount={result.pageCount}
        dashboard={dashboard}
        filters={{ search: sp.q ?? "", status, category }}
      />
    </div>
  );
}
