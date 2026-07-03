import type { Metadata } from "next";

import PageHeader from "@/components/admin/PageHeader";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import {
  REVIEW_SORTABLE_COLUMNS,
  getReviewDashboard,
  getReviewFilterOptions,
  listReviews,
  type ReviewSortColumn,
} from "@/lib/admin/reviews";
import { REVIEW_STATUSES, type ReviewStatus } from "@/lib/admin/review-types";
import ReviewsClient from "./ReviewsClient";

export const metadata: Metadata = { title: "Reviews" };

function parseSort(v: string | undefined): ReviewSortColumn {
  return (REVIEW_SORTABLE_COLUMNS as readonly string[]).includes(v ?? "") ? (v as ReviewSortColumn) : "created_at";
}

function parseStatus(v: string | undefined): ReviewStatus | "all" {
  return (REVIEW_STATUSES as readonly string[]).includes(v ?? "") ? (v as ReviewStatus) : "all";
}

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission(PERMISSIONS.REVIEWS_MANAGE);

  const sp = await searchParams;
  const sort = parseSort(sp.sort);
  const dir = sp.dir === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(sp.page) || 1);
  const rating = sp.rating ? Number(sp.rating) : "all";

  const [result, dashboard, options] = await Promise.all([
    listReviews({
      search: sp.q ?? "",
      rating: rating === "all" || Number.isNaN(rating) ? "all" : rating,
      status: parseStatus(sp.status),
      verified: sp.verified === "1",
      productId: sp.product,
      customerId: sp.customer,
      hasImages: sp.images === "1",
      dateFrom: sp.from,
      dateTo: sp.to,
      sort,
      dir,
      page,
      trash: sp.trash === "1",
    }),
    getReviewDashboard(),
    getReviewFilterOptions(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Sales"
        title="Reviews"
        description="Moderate product reviews, verify purchases, and feature top ratings"
      />

      <ReviewsClient
        rows={result.rows}
        total={result.total}
        page={result.page}
        perPage={result.perPage}
        pageCount={result.pageCount}
        dashboard={dashboard}
        products={options.products}
        customers={options.customers}
        filters={{
          search: sp.q ?? "",
          rating: rating === "all" || Number.isNaN(rating) ? "all" : rating,
          status: parseStatus(sp.status),
          verified: sp.verified === "1",
          productId: sp.product ?? "",
          customerId: sp.customer ?? "",
          hasImages: sp.images === "1",
          dateFrom: sp.from ?? "",
          dateTo: sp.to ?? "",
        }}
        sort={sort}
        dir={dir}
        trash={sp.trash === "1"}
      />
    </div>
  );
}
