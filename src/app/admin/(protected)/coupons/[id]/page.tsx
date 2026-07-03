import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PageHeader from "@/components/admin/PageHeader";
import CouponDisplayBadge, { CouponTypeBadge } from "@/components/admin/CouponStatusBadge";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { computeDisplayStatus } from "@/lib/admin/coupon-types";
import { getCouponDetail, getCouponFilterOptions } from "@/lib/admin/coupons";
import CouponForm from "../CouponForm";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const coupon = await getCouponDetail(id);
  return { title: coupon ? `Coupon: ${coupon.code}` : "Coupon" };
}

export default async function CouponDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(PERMISSIONS.MARKETING_MANAGE);
  const { id } = await params;

  const [coupon, options] = await Promise.all([getCouponDetail(id), getCouponFilterOptions()]);
  if (!coupon) notFound();

  const display = computeDisplayStatus({
    isActive: coupon.isActive,
    lifecycleStatus: coupon.lifecycleStatus,
    startsAt: coupon.startsAt,
    expiresAt: coupon.expiresAt,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Coupons"
        title={coupon.name}
        description={`${coupon.code} · ${coupon.usedCount} redemptions · ₹${coupon.totalRevenue.toLocaleString("en-IN")} revenue`}
      />
      <div className="flex flex-wrap gap-2">
        <CouponTypeBadge type={coupon.promoType} />
        <CouponDisplayBadge status={display} />
      </div>
      <CouponForm mode="edit" initial={coupon} options={options} />
    </div>
  );
}
