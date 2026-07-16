"use client";

import Link from "next/link";

import { formatInr } from "@/lib/catalog/format";
import type { CouponListItem } from "@/lib/admin/coupon-types";
import type { CampaignCenterConfig } from "@/lib/campaigns/types";
import { cn } from "@/lib/utils";

export default function CouponCampaignPanel({
  config,
  coupons,
  onSelect,
  className,
}: {
  config: CampaignCenterConfig;
  coupons: CouponListItem[];
  onSelect: (couponId: string | null) => void;
  className?: string;
}) {
  const selected = coupons.find((c) => c.id === config.couponId);

  return (
    <section className={cn("space-y-4", className)} aria-labelledby="coupon-campaign-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="coupon-campaign-heading" className="font-heading text-sm font-bold text-green-900">
          Coupon association
        </h3>
        <Link href="/admin/coupons" className="text-xs font-semibold text-terra-600 hover:underline">
          Manage coupons →
        </Link>
      </div>
      <p className="text-xs text-green-700">Visual association only — no changes to the coupon engine.</p>

      <label className="block">
        <span className="sr-only">Select coupon</span>
        <select
          value={config.couponId ?? ""}
          onChange={(e) => onSelect(e.target.value || null)}
          className="w-full rounded-2xl border border-cream-200 px-3 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-terra-400"
        >
          <option value="">No coupon linked</option>
          {coupons.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.name ?? c.promoType}
            </option>
          ))}
        </select>
      </label>

      {selected ? (
        <div className="rounded-2xl border border-terra-200 bg-terra-50/40 p-4">
          <p className="font-heading text-lg font-bold text-green-900">{selected.code}</p>
          <p className="mt-1 text-sm text-green-700">{selected.name ?? "Promotion"}</p>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase text-green-700/50">Discount</dt>
              <dd className="font-semibold text-green-900">
                {selected.promoType === "percentage" ? `${selected.value}%` : formatInr(selected.value)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-green-700/50">Validity</dt>
              <dd className="text-green-800">
                {selected.startsAt?.slice(0, 10) ?? "—"} → {selected.expiresAt?.slice(0, 10) ?? "—"}
              </dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-green-700">Uses: {selected.usageCount}{selected.maxUses ? ` / ${selected.maxUses}` : ""}</p>
          <p className="mt-3 text-xs font-semibold text-terra-700">
            CTA: {config.cta.label} → {config.cta.url}
          </p>
        </div>
      ) : null}
    </section>
  );
}
