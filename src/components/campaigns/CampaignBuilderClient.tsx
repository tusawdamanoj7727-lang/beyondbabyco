"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import FormField, { Input, Select, Textarea } from "@/components/admin/FormField";
import { CampaignStatusBadge } from "@/components/admin/marketing/MarketingStatusBadge";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { notifyActionResult } from "@/lib/admin/notify-action";
import AICreativeLibrary from "@/components/campaigns/AICreativeLibrary";
import CampaignPreviewPanel from "@/components/campaigns/CampaignPreviewPanel";
import CampaignTypeBadge from "@/components/campaigns/CampaignTypeBadge";
import CouponCampaignPanel from "@/components/campaigns/CouponCampaignPanel";
import LandingPagePreview from "@/components/campaigns/LandingPagePreview";
import CampaignAnalyticsPreviewCards from "@/components/campaigns/CampaignAnalyticsPreview";
import { saveCampaignCenter } from "@/lib/admin/campaign-center-actions";
import { validateCampaignForPublish } from "@/lib/campaigns/validation";
import {
  CAMPAIGN_TYPES,
  CAMPAIGN_TYPE_LABELS,
  type CampaignType,
} from "@/lib/admin/marketing-types";
import type { CouponListItem } from "@/lib/admin/coupon-types";
import { DEFAULT_CAMPAIGN_CONFIG, slugifyCampaignName } from "@/lib/campaigns/config";
import {
  applyFestivalTemplate,
  FESTIVAL_TEMPLATES,
  type FestivalTemplateId,
} from "@/lib/campaigns/festival-templates";
import {
  HOMEPAGE_CAMPAIGN_SLOTS,
  HOMEPAGE_SLOT_LABELS,
  MARKETING_CAMPAIGN_TYPES,
  MARKETING_CAMPAIGN_TYPE_LABELS,
  type CampaignCenterConfig,
} from "@/lib/campaigns/types";
import type { CampaignCenterItem } from "@/lib/campaigns/types";
import { cn } from "@/lib/utils";

type Tab = "content" | "placement" | "schedule" | "coupon" | "landing" | "media" | "ai";

export default function CampaignBuilderClient({
  campaign,
  coupons,
  segments,
  templates,
}: {
  campaign: CampaignCenterItem | null;
  coupons: CouponListItem[];
  segments: { id: string; name: string }[];
  templates: { id: string; name: string }[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<Tab>("content");
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [name, setName] = useState(campaign?.name ?? "");
  const [channelType, setChannelType] = useState<CampaignType>((campaign?.channelType as CampaignType) ?? "email");
  const [segmentId, setSegmentId] = useState("");
  const [templateId, setTemplateId] = useState(campaign?.config.communicationsTemplateId ?? "");
  const [config, setConfig] = useState<CampaignCenterConfig>(campaign?.config ?? DEFAULT_CAMPAIGN_CONFIG());

  const coupon = coupons.find((c) => c.id === config.couponId);
  const isDemo = campaign?.id.startsWith("demo-");

  function patchConfig(partial: Partial<CampaignCenterConfig>) {
    setConfig((prev) => ({ ...prev, ...partial }));
  }

  function patchAssets(partial: CampaignCenterConfig["assets"]) {
    setConfig((prev) => ({ ...prev, assets: { ...prev.assets, ...partial } }));
  }

  function save(publish = false) {
    startTransition(async () => {
      const nextConfig = {
        ...config,
        slug: config.slug || slugifyCampaignName(name),
        communicationsTemplateId: templateId || null,
      };
      if (publish) {
        const v = validateCampaignForPublish(nextConfig, { status: "running" });
        if (!v.ok) {
          setValidationErrors(v.errors);
          toast.error(v.errors[0] ?? "Fix validation errors before publishing.");
          return;
        }
        setValidationErrors(v.warnings.length ? v.warnings : []);
      } else {
        setValidationErrors([]);
      }

      const res = await saveCampaignCenter(isDemo ? null : campaign?.id ?? null, {
        name,
        campaign_type: channelType,
        config: nextConfig,
        segment_id: segmentId || null,
        template_id: templateId || null,
        publish,
        scheduled_at: nextConfig.startDate,
      });
      notifyActionResult(toast, res);
      if (!res.ok) return;
      if (res.id) router.push(`/admin/marketing/campaigns/${res.id}`);
      else router.refresh();
    });
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "content", label: "Content" },
    { id: "placement", label: "Homepage slots" },
    { id: "schedule", label: "Schedule" },
    { id: "coupon", label: "Coupon" },
    { id: "landing", label: "Landing page" },
    { id: "media", label: "Media" },
    { id: "ai", label: "AI creative" },
  ];

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_400px]">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/marketing/campaigns" className="text-sm font-semibold text-terra-600 hover:underline">
            ← Campaigns
          </Link>
          {campaign ? (
            <>
              <CampaignTypeBadge type={config.marketingType} />
              <CampaignStatusBadge status={campaign.status} />
            </>
          ) : null}
        </div>

        <nav className="flex flex-wrap gap-1 border-b border-cream-200 pb-px" aria-label="Campaign editor sections">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-t-2xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-terra-400",
                tab === t.id ? "bg-white text-green-900 shadow-card" : "text-green-700 hover:text-green-900",
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="rounded-3xl border border-cream-200 bg-white p-6 space-y-4">
          {tab === "content" && (
            <>
              <FormField label="Festival template">
                  <Select
                    value=""
                    onChange={(e) => {
                      const id = e.target.value as FestivalTemplateId;
                      if (!id) return;
                      setConfig(applyFestivalTemplate(id, config));
                      if (!name) setName(FESTIVAL_TEMPLATES.find((t) => t.id === id)?.name ?? "");
                    }}
                    aria-label="Apply festival template"
                  >
                    <option value="">Apply a seasonal template…</option>
                    {FESTIVAL_TEMPLATES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </Select>
                </FormField>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Campaign name">
                  <Input value={name} onChange={(e) => setName(e.target.value)} required aria-label="Campaign name" />
                </FormField>
                <FormField label="Slug">
                  <Input
                    value={config.slug}
                    onChange={(e) => patchConfig({ slug: e.target.value })}
                    placeholder={slugifyCampaignName(name)}
                    aria-label="Slug"
                  />
                </FormField>
                <FormField label="Campaign type">
                  <Select
                    value={config.marketingType}
                    onChange={(e) => patchConfig({ marketingType: e.target.value as CampaignCenterConfig["marketingType"] })}
                    aria-label="Marketing campaign type"
                  >
                    {MARKETING_CAMPAIGN_TYPES.map((t) => (
                      <option key={t} value={t}>{MARKETING_CAMPAIGN_TYPE_LABELS[t]}</option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Channel">
                  <Select value={channelType} onChange={(e) => setChannelType(e.target.value as CampaignType)} aria-label="Channel">
                    {CAMPAIGN_TYPES.map((t) => (
                      <option key={t} value={t}>{CAMPAIGN_TYPE_LABELS[t]}</option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Headline">
                  <Input value={config.headline} onChange={(e) => patchConfig({ headline: e.target.value })} aria-label="Headline" />
                </FormField>
                <FormField label="Subheading">
                  <Input value={config.subheading} onChange={(e) => patchConfig({ subheading: e.target.value })} aria-label="Subheading" />
                </FormField>
                <FormField label="CTA label">
                  <Input
                    value={config.cta.label}
                    onChange={(e) => patchConfig({ cta: { ...config.cta, label: e.target.value } })}
                    aria-label="CTA label"
                  />
                </FormField>
                <FormField label="Target URL">
                  <Input value={config.targetUrl} onChange={(e) => patchConfig({ targetUrl: e.target.value })} aria-label="Target URL" />
                </FormField>
                <FormField label="Priority (0–100)">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={config.priority}
                    onChange={(e) => patchConfig({ priority: Number(e.target.value) })}
                    aria-label="Priority"
                  />
                </FormField>
                <FormField label="Audience">
                  <Select value={segmentId} onChange={(e) => setSegmentId(e.target.value)} aria-label="Audience">
                    <option value="">All segments</option>
                    {segments.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Email template">
                  <Select value={templateId} onChange={(e) => setTemplateId(e.target.value)} aria-label="Template">
                    <option value="">None</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </Select>
                </FormField>
              </div>
              <FormField label="Description">
                <Textarea
                  value={config.description}
                  onChange={(e) => patchConfig({ description: e.target.value })}
                  rows={4}
                  aria-label="Description"
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField label="Primary color">
                  <Input type="color" value={config.theme.primary} onChange={(e) => patchConfig({ theme: { ...config.theme, primary: e.target.value } })} aria-label="Primary color" />
                </FormField>
                <FormField label="Background">
                  <Input type="color" value={config.theme.background} onChange={(e) => patchConfig({ theme: { ...config.theme, background: e.target.value } })} aria-label="Background color" />
                </FormField>
                <FormField label="Accent">
                  <Input type="color" value={config.theme.accent ?? "#c45c3e"} onChange={(e) => patchConfig({ theme: { ...config.theme, accent: e.target.value } })} aria-label="Accent color" />
                </FormField>
              </div>
            </>
          )}

          {tab === "placement" && (
            <>
              <p className="text-sm text-green-700">
                Priority engine: Emergency → Flash → Festival → Launch → Free shipping → Evergreen. Only one campaign
                controls each surface unless announcement rotation is enabled.
              </p>
              <FormField label="Homepage slot">
                <Select
                  value={config.homepageSlot ?? ""}
                  onChange={(e) => patchConfig({ homepageSlot: (e.target.value || null) as CampaignCenterConfig["homepageSlot"] })}
                  aria-label="Homepage slot"
                >
                  <option value="">No slot</option>
                  {HOMEPAGE_CAMPAIGN_SLOTS.map((s) => (
                    <option key={s} value={s}>{HOMEPAGE_SLOT_LABELS[s]}</option>
                  ))}
                </Select>
              </FormField>
            </>
          )}

          {tab === "schedule" && (
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Start date">
                <Input
                  type="datetime-local"
                  value={config.startDate?.slice(0, 16) ?? ""}
                  onChange={(e) =>
                    patchConfig({ startDate: e.target.value ? new Date(e.target.value).toISOString() : null })
                  }
                  aria-label="Start date"
                />
              </FormField>
              <FormField label="End date">
                <Input
                  type="datetime-local"
                  value={config.endDate?.slice(0, 16) ?? ""}
                  onChange={(e) =>
                    patchConfig({ endDate: e.target.value ? new Date(e.target.value).toISOString() : null })
                  }
                  aria-label="End date"
                />
              </FormField>
              <FormField label="Timezone">
                <Select
                  value={config.timezone}
                  onChange={(e) => patchConfig({ timezone: e.target.value })}
                  aria-label="Timezone"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/London">Europe/London</option>
                </Select>
              </FormField>
              <FormField label="Recurring">
                <Select
                  value={config.recurring}
                  onChange={(e) =>
                    patchConfig({
                      recurring: e.target.value as CampaignCenterConfig["recurring"],
                    })
                  }
                  aria-label="Recurring"
                >
                  <option value="none">None (one-time)</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </Select>
              </FormField>
              <label className="flex items-center gap-2 text-sm text-green-800">
                <input
                  type="checkbox"
                  checked={config.autoPublish}
                  onChange={(e) => patchConfig({ autoPublish: e.target.checked })}
                />
                Auto-publish at start
              </label>
              <label className="flex items-center gap-2 text-sm text-green-800">
                <input
                  type="checkbox"
                  checked={config.autoUnpublish}
                  onChange={(e) => patchConfig({ autoUnpublish: e.target.checked })}
                />
                Auto-unpublish at end
              </label>
              <label className="flex items-center gap-2 text-sm text-green-800 md:col-span-2">
                <input
                  type="checkbox"
                  checked={config.showCountdown}
                  onChange={(e) => patchConfig({ showCountdown: e.target.checked })}
                />
                Show countdown on storefront surfaces
              </label>
              <p className="md:col-span-2 text-xs text-green-700/60">
                Festival templates pre-fill content — apply from the Content tab. Calendar view:{" "}
                <Link href="/admin/marketing/campaigns/calendar" className="font-semibold text-terra-600 hover:underline">
                  Marketing calendar
                </Link>
                .
              </p>
            </div>
          )}

          {tab === "coupon" && (
            <CouponCampaignPanel config={config} coupons={coupons} onSelect={(id) => patchConfig({ couponId: id })} />
          )}

          {tab === "landing" && (
            <>
              <FormField label="Landing slug">
                <Input
                  value={config.landingSlug ?? ""}
                  onChange={(e) => patchConfig({ landingSlug: e.target.value || null })}
                  placeholder={config.slug}
                  aria-label="Landing slug"
                />
              </FormField>
              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold text-green-900">Sections</legend>
                {(
                  [
                    ["showHero", "Hero"],
                    ["showProducts", "Products"],
                    ["showBenefits", "Benefits"],
                    ["showTrust", "Trust"],
                    ["showCta", "CTA"],
                    ["showFaq", "FAQ"],
                    ["showNewsletter", "Newsletter"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm text-green-800">
                    <input
                      type="checkbox"
                      checked={config.landingSections[key]}
                      onChange={(e) =>
                        patchConfig({ landingSections: { ...config.landingSections, [key]: e.target.checked } })
                      }
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
              <LandingPagePreview config={config} name={name || "Campaign"} />
            </>
          )}

          {tab === "media" && (
            <div className="grid gap-4 md:grid-cols-2">
              {(
                [
                  ["banner", "Banner"],
                  ["hero", "Hero image"],
                  ["mobileBanner", "Mobile banner"],
                  ["background", "Background"],
                ] as const
              ).map(([key, label]) => (
                <FormField key={key} label={label}>
                  <Input
                    value={config.assets[key] ?? ""}
                    onChange={(e) => patchAssets({ [key]: e.target.value || null })}
                    placeholder="/images/… or media library URL"
                    aria-label={label}
                  />
                </FormField>
              ))}
              <p className="md:col-span-2 text-xs text-green-700/50">
                Assign assets from{" "}
                <Link href="/admin/media" className="font-semibold text-terra-600 hover:underline">
                  Media Library
                </Link>{" "}
                — use Campaigns folder for organisation.
              </p>
            </div>
          )}

          {tab === "ai" && (
            <AICreativeLibrary
              campaignId={isDemo ? null : campaign?.id ?? null}
              existingCreatives={config.aiCreatives}
            />
          )}

          {validationErrors.length > 0 ? (
            <ul className="rounded-2xl border border-terra-200 bg-terra-50 px-4 py-3 text-sm text-terra-800" role="alert">
              {validationErrors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="button" disabled={pending} onClick={() => save(false)}>
              {campaign && !isDemo ? "Save draft" : "Create campaign"}
            </Button>
            <Button type="button" variant="secondary" disabled={pending} onClick={() => save(true)}>
              Validate &amp; publish
            </Button>
            <Link
              href="/admin/marketing/campaigns/creative"
              className="inline-flex h-11 items-center rounded-3xl border border-cream-200 px-4 text-sm font-semibold text-green-800 hover:bg-cream-50"
            >
              Open AI library
            </Link>
          </div>
        </div>

        {campaign && !isDemo ? (
          <div className="rounded-3xl border border-cream-200 bg-white p-6">
            <h2 className="font-heading text-lg font-bold text-green-900">Campaign analytics</h2>
            <div className="mt-4">
              <CampaignAnalyticsPreviewCards analytics={campaign.analytics} />
            </div>
          </div>
        ) : null}
      </div>

      <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <div className="flex gap-2" role="tablist" aria-label="Preview viewport">
          {(["desktop", "tablet", "mobile"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={viewport === v}
              onClick={() => setViewport(v)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold capitalize focus:outline-none focus-visible:ring-2 focus-visible:ring-terra-400",
                viewport === v ? "bg-green-900 text-white" : "border border-cream-200 text-green-800",
              )}
            >
              {v}
            </button>
          ))}
        </div>
        <CampaignPreviewPanel config={config} name={name || "New campaign"} viewport={viewport} couponLabel={coupon?.code} />
      </aside>
    </div>
  );
}
