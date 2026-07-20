"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import StatsCard from "@/components/admin/StatsCard";
import { useToast } from "@/components/ui/ToastProvider";
import { notifyActionResult } from "@/lib/admin/notify-action";
import {
  duplicateBanner,
  setBannerStatus,
  softDeleteBanner,
} from "@/lib/admin/banner-actions";
import {
  BANNER_PLACEMENT_LABELS,
  BANNER_STATUS_LABELS,
  type BannerDashboard,
  type BannerListItem,
  type BannerPlacement,
  type BannerStatus,
} from "@/lib/admin/banner-types";

export default function BannersClient({
  rows,
  dashboard,
}: {
  rows: BannerListItem[];
  dashboard: BannerDashboard;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<BannerStatus | "all">("all");

  const visible = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  function run(fn: () => Promise<{ ok: boolean; error: string | null }>) {
    startTransition(async () => {
      const res = await fn();
      notifyActionResult(toast, res);
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatsCard label="Total" value={String(dashboard.total)} icon="banners" />
        <StatsCard label="Published" value={String(dashboard.published)} icon="sparkles" />
        <StatsCard label="Draft" value={String(dashboard.draft)} icon="activity" />
        <StatsCard label="Scheduled" value={String(dashboard.scheduled)} icon="activity" />
        <StatsCard label="Archived" value={String(dashboard.archived)} icon="audit" />
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "published", "draft", "archived"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              filter === s ? "bg-green-800 text-cream-50" : "bg-cream-100 text-green-800 hover:bg-cream-200"
            }`}
          >
            {s === "all" ? "All" : BANNER_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-card">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-cream-200 bg-cream-50/80 text-xs uppercase tracking-wide text-green-700/70">
            <tr>
              <th className="px-4 py-3">Banner</th>
              <th className="px-4 py-3">Placement</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Schedule</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-green-700/60">
                  No banners yet. Create your first campaign banner.
                </td>
              </tr>
            ) : (
              visible.map((b) => (
                <tr key={b.id} className="border-b border-cream-100 last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/banners/${b.id}`} className="font-semibold text-green-900 hover:underline">
                      {b.title || "Untitled"}
                    </Link>
                    {b.ctaLabel ? <p className="text-xs text-green-700/60">{b.ctaLabel}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-green-800">
                    {BANNER_PLACEMENT_LABELS[b.placement as BannerPlacement] ?? b.placement}
                  </td>
                  <td className="px-4 py-3">{b.priority}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={b.status === "published" ? "success" : b.status === "archived" ? "default" : "warning"}
                      size="sm"
                    >
                      {BANNER_STATUS_LABELS[b.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-green-700/70">
                    {b.startsAt ? new Date(b.startsAt).toLocaleDateString("en-IN") : "—"}
                    {" → "}
                    {b.endsAt ? new Date(b.endsAt).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Link
                        href={`/admin/banners/${b.id}`}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-green-800 hover:bg-green-50"
                      >
                        Edit
                      </Link>
                      {b.status !== "published" ? (
                        <button
                          type="button"
                          disabled={pending}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-green-800 hover:bg-green-50"
                          onClick={() => run(() => setBannerStatus(b.id, "published"))}
                        >
                          Publish
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={pending}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-green-800 hover:bg-green-50"
                          onClick={() => run(() => setBannerStatus(b.id, "archived"))}
                        >
                          Archive
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={pending}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-green-800 hover:bg-green-50"
                        onClick={() => run(() => duplicateBanner(b.id))}
                      >
                        Duplicate
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-terra-700 hover:bg-terra-50"
                        onClick={() => run(() => softDeleteBanner(b.id))}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <Button asChild size="sm">
          <Link href="/admin/banners/new">Create Banner</Link>
        </Button>
      </div>
    </div>
  );
}
