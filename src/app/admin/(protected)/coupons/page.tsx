import type { Metadata } from "next";
import Link from "next/link";

import PageHeader from "@/components/admin/PageHeader";
import Icon from "@/components/admin/Icon";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import {
  COUPON_SORTABLE_COLUMNS,
  getCouponDashboard,
  getCouponFilterOptions,
  listCoupons,
  listGiftCards,
  type CouponSortColumn,
} from "@/lib/admin/coupons";
import {
  COUPON_LIFECYCLE,
  COUPON_TYPES,
  type CouponDisplayStatus,
  type CouponLifecycle,
  type CouponType,
} from "@/lib/admin/coupon-types";
import CouponsClient from "./CouponsClient";

export const metadata: Metadata = { title: "Coupons & Promotions" };

function parseSort(v: string | undefined): CouponSortColumn {
  return (COUPON_SORTABLE_COLUMNS as readonly string[]).includes(v ?? "") ? (v as CouponSortColumn) : "updated_at";
}

function parseType(v: string | undefined): CouponType | "all" {
  return (COUPON_TYPES as readonly string[]).includes(v ?? "") ? (v as CouponType) : "all";
}

function parseLifecycle(v: string | undefined): CouponLifecycle | "all" {
  return (COUPON_LIFECYCLE as readonly string[]).includes(v ?? "") ? (v as CouponLifecycle) : "all";
}

const DISPLAY_STATUSES = ["all", "active", "scheduled", "expired", "inactive", "archived"] as const;

function parseDisplay(v: string | undefined): CouponDisplayStatus | "all" {
  return (DISPLAY_STATUSES as readonly string[]).includes(v ?? "") ? (v as CouponDisplayStatus | "all") : "all";
}

export default async function CouponsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission(PERMISSIONS.MARKETING_MANAGE);

  const sp = await searchParams;
  const sort = parseSort(sp.sort);
  const dir = sp.dir === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(sp.page) || 1);

  const [result, dashboard, options, giftCards] = await Promise.all([
    listCoupons({
      search: sp.q ?? "",
      promoType: parseType(sp.type),
      lifecycle: parseLifecycle(sp.lifecycle),
      displayStatus: parseDisplay(sp.status),
      customerId: sp.customer,
      dateFrom: sp.from,
      dateTo: sp.to,
      sort,
      dir,
      page,
      trash: sp.trash === "1",
    }),
    getCouponDashboard(),
    getCouponFilterOptions(),
    listGiftCards(20),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Marketing"
        title="Coupons & Promotions"
        description="Create discount codes, automatic promotions, and manage gift cards"
        actions={
          <Link
            href="/admin/coupons/new"
            className="inline-flex h-12 items-center gap-2 rounded-3xl bg-green-500 px-6 font-medium text-cream-50 shadow-clay transition-colors hover:bg-green-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500 focus-visible:ring-offset-2"
          >
            <Icon name="plus" size={18} />
            Create Coupon
          </Link>
        }
      />

      <CouponsClient
        rows={result.rows}
        total={result.total}
        page={result.page}
        perPage={result.perPage}
        pageCount={result.pageCount}
        dashboard={dashboard}
        giftCards={giftCards}
        customers={options.customers}
        filters={{
          search: sp.q ?? "",
          promoType: parseType(sp.type),
          lifecycle: parseLifecycle(sp.lifecycle),
          displayStatus: parseDisplay(sp.status),
          customerId: sp.customer ?? "",
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
