import type { Metadata } from "next";

import PageHeader from "@/components/admin/PageHeader";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getCouponFilterOptions } from "@/lib/admin/coupons";
import CouponForm from "../CouponForm";

export const metadata: Metadata = { title: "New coupon" };

export default async function NewCouponPage() {
  await requirePermission(PERMISSIONS.MARKETING_MANAGE);
  const options = await getCouponFilterOptions();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader eyebrow="Coupons" title="Create coupon" description="Set up a new discount code or automatic promotion" />
      <CouponForm mode="create" initial={null} options={options} />
    </div>
  );
}
