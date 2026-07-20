"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import FormField, { Input, Select } from "@/components/admin/FormField";
import MediaPicker from "@/components/admin/MediaPicker";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { notifyActionResult } from "@/lib/admin/notify-action";
import { createBanner, updateBanner } from "@/lib/admin/banner-actions";
import { validateBannerForPublish } from "@/lib/admin/banner-validation";
import {
  BANNER_MEDIA_TYPES,
  BANNER_PLACEMENTS,
  BANNER_PLACEMENT_LABELS,
  BANNER_STATUSES,
  BANNER_STATUS_LABELS,
  type BannerInput,
  type BannerListItem,
  type BannerMediaType,
  type BannerPlacement,
  type BannerStatus,
} from "@/lib/admin/banner-types";
import { cn } from "@/lib/utils";

type Viewport = "desktop" | "tablet" | "mobile";

export default function BannerFormClient({
  initial,
  campaigns,
}: {
  initial: BannerListItem | null;
  campaigns: { id: string; name: string }[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [form, setForm] = useState<BannerInput>({
    title: initial?.title ?? "",
    subtitle: initial?.subtitle ?? "",
    imageUrl: initial?.imageUrl ?? "",
    mobileImageUrl: initial?.mobileImageUrl ?? "",
    tabletImageUrl: initial?.tabletImageUrl ?? "",
    videoUrl: initial?.videoUrl ?? "",
    mediaType: initial?.mediaType ?? "image",
    linkUrl: initial?.linkUrl ?? "",
    ctaLabel: initial?.ctaLabel ?? "Shop now",
    placement: initial?.placement ?? "homepage_mid",
    position: initial?.position ?? 0,
    priority: initial?.priority ?? 50,
    status: initial?.status ?? "draft",
    isActive: initial?.isActive ?? false,
    startsAt: initial?.startsAt ?? "",
    endsAt: initial?.endsAt ?? "",
    altText: initial?.altText ?? "",
    ariaLabel: initial?.ariaLabel ?? "",
    campaignId: initial?.campaignId ?? null,
  });

  const validation = useMemo(() => validateBannerForPublish(form), [form]);

  function patch(partial: Partial<BannerInput>) {
    setForm((f) => ({ ...f, ...partial }));
  }

  function save(nextStatus?: BannerStatus) {
    const payload = { ...form, status: nextStatus ?? form.status };
    if (payload.status === "published" && !validateBannerForPublish(payload).ok) {
      toast.error(validateBannerForPublish(payload).errors[0] ?? "Fix validation errors before publish.");
      return;
    }

    startTransition(async () => {
      const res = initial
        ? await updateBanner(initial.id, payload)
        : await createBanner(payload);
      notifyActionResult(toast, res);
      if (!res.ok) return;
      if (res.id && !initial) router.push(`/admin/banners/${res.id}`);
      else router.refresh();
    });
  }

  const previewSrc =
    viewport === "mobile"
      ? form.mobileImageUrl || form.imageUrl
      : viewport === "tablet"
        ? form.tabletImageUrl || form.imageUrl
        : form.imageUrl;

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
      <div className="space-y-4 rounded-3xl border border-cream-200 bg-white p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Title" required>
            <Input value={form.title} onChange={(e) => patch({ title: e.target.value })} />
          </FormField>
          <FormField label="Subtitle">
            <Input value={form.subtitle} onChange={(e) => patch({ subtitle: e.target.value })} />
          </FormField>
          <FormField label="Placement">
            <Select
              value={form.placement}
              onChange={(e) => patch({ placement: e.target.value })}
            >
              {BANNER_PLACEMENTS.map((p) => (
                <option key={p} value={p}>
                  {BANNER_PLACEMENT_LABELS[p]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Status">
            <Select
              value={form.status}
              onChange={(e) => patch({ status: e.target.value as BannerStatus })}
            >
              {BANNER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {BANNER_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="CTA label" required>
            <Input value={form.ctaLabel} onChange={(e) => patch({ ctaLabel: e.target.value })} />
          </FormField>
          <FormField label="CTA / link URL" required>
            <Input value={form.linkUrl} onChange={(e) => patch({ linkUrl: e.target.value })} placeholder="/products" />
          </FormField>
          <FormField label="Priority (0–100)">
            <Input
              type="number"
              min={0}
              max={100}
              value={form.priority}
              onChange={(e) => patch({ priority: Number(e.target.value) })}
            />
          </FormField>
          <FormField label="Position">
            <Input
              type="number"
              value={form.position}
              onChange={(e) => patch({ position: Number(e.target.value) })}
            />
          </FormField>
          <FormField label="Starts at">
            <Input
              type="datetime-local"
              value={form.startsAt?.slice(0, 16) ?? ""}
              onChange={(e) =>
                patch({ startsAt: e.target.value ? new Date(e.target.value).toISOString() : "" })
              }
            />
          </FormField>
          <FormField label="Ends at">
            <Input
              type="datetime-local"
              value={form.endsAt?.slice(0, 16) ?? ""}
              onChange={(e) =>
                patch({ endsAt: e.target.value ? new Date(e.target.value).toISOString() : "" })
              }
            />
          </FormField>
          <FormField label="Media type">
            <Select
              value={form.mediaType}
              onChange={(e) => patch({ mediaType: e.target.value as BannerMediaType })}
            >
              {BANNER_MEDIA_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.toUpperCase()}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Linked campaign">
            <Select
              value={form.campaignId ?? ""}
              onChange={(e) => patch({ campaignId: e.target.value || null })}
            >
              <option value="">None</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <MediaPicker label="Desktop image" value={form.imageUrl ?? ""} onChange={(v) => patch({ imageUrl: v })} />
          <MediaPicker label="Tablet image" value={form.tabletImageUrl ?? ""} onChange={(v) => patch({ tabletImageUrl: v })} />
          <MediaPicker label="Mobile image" value={form.mobileImageUrl ?? ""} onChange={(v) => patch({ mobileImageUrl: v })} />
          <FormField label="Video URL (optional)">
            <Input value={form.videoUrl} onChange={(e) => patch({ videoUrl: e.target.value })} />
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Alt text">
            <Input value={form.altText} onChange={(e) => patch({ altText: e.target.value })} />
          </FormField>
          <FormField label="Accessibility label">
            <Input value={form.ariaLabel} onChange={(e) => patch({ ariaLabel: e.target.value })} />
          </FormField>
        </div>

        {validation.errors.length || validation.warnings.length ? (
          <div className="rounded-2xl border border-cream-200 bg-cream-50 p-4 text-sm">
            {validation.errors.map((e) => (
              <p key={e} className="font-medium text-terra-700">
                • {e}
              </p>
            ))}
            {validation.warnings.map((w) => (
              <p key={w} className="text-green-700/70">
                • {w}
              </p>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={pending} onClick={() => save("draft")}>
            Save draft
          </Button>
          <Button type="button" disabled={pending} onClick={() => save("published")}>
            Publish
          </Button>
          <Link href="/admin/banners" className="inline-flex h-11 items-center px-4 text-sm font-medium text-green-800">
            Back
          </Link>
        </div>
      </div>

      <aside className="space-y-3">
        <div className="flex gap-1 rounded-2xl border border-cream-200 bg-white p-1">
          {(["desktop", "tablet", "mobile"] as Viewport[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setViewport(v)}
              className={cn(
                "flex-1 rounded-xl px-3 py-2 text-xs font-semibold capitalize",
                viewport === v ? "bg-green-800 text-cream-50" : "text-green-800 hover:bg-cream-50",
              )}
            >
              {v}
            </button>
          ))}
        </div>
        <div
          className={cn(
            "overflow-hidden rounded-3xl border border-cream-200 bg-cream-50 shadow-card",
            viewport === "mobile" ? "mx-auto max-w-[320px]" : viewport === "tablet" ? "mx-auto max-w-[640px]" : "w-full",
          )}
        >
          <div className="relative aspect-[16/7] bg-green-900/10">
            {previewSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewSrc} alt={form.altText || form.title || "Preview"} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-sm text-green-700/50">No image</div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-4 text-white">
              <p className="font-semibold">{form.title || "Banner title"}</p>
              {form.subtitle ? <p className="text-sm opacity-90">{form.subtitle}</p> : null}
              <span className="mt-2 inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-green-900">
                {form.ctaLabel || "CTA"}
              </span>
            </div>
          </div>
          <p className="px-3 py-2 text-xs text-green-700/60">
            Placement: {BANNER_PLACEMENT_LABELS[(form.placement as BannerPlacement) ?? "homepage_mid"]}
          </p>
        </div>
      </aside>
    </div>
  );
}
