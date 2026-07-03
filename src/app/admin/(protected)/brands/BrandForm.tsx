"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";

import FormField, { Input, Select, Checkbox } from "@/components/admin/FormField";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ImageField from "@/components/admin/ImageField";
import Icon from "@/components/admin/Icon";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/admin/LoadingState";
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/admin/category-schema";
import {
  createBrandAction,
  updateBrandAction,
  type BrandActionState,
} from "@/lib/admin/brand-actions";
import type { BrandEditData } from "@/lib/admin/brands";

const TABS = ["General", "Media", "SEO", "Publishing"] as const;
type Tab = (typeof TABS)[number];

const initialState: BrandActionState = { ok: false, error: null };

export default function BrandForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial: BrandEditData | null;
}) {
  const router = useRouter();
  const action = mode === "edit" ? updateBrandAction : createBrandAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [tab, setTab] = useState<Tab>("General");

  const errors = state.fieldErrors ?? {};

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {mode === "edit" && initial && <input type="hidden" name="id" value={initial.id} />}

      {state.error && (
        <div role="alert" className="rounded-2xl border border-terra-200 bg-terra-50 px-4 py-3 text-sm font-medium text-terra-700">
          {state.error}
        </div>
      )}
      {state.ok && (
        <div role="status" className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          Brand saved successfully.
        </div>
      )}

      {/* Tab nav */}
      <div role="tablist" aria-label="Brand sections" className="flex flex-wrap gap-1 rounded-2xl border border-cream-300 bg-cream-50 p-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50",
              tab === t ? "bg-white text-green-900 shadow-card" : "text-green-700/70 hover:text-green-900",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-cream-300 bg-white p-5 sm:p-6">
        {/* GENERAL */}
        <Panel active={tab === "General"}>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField label="Brand name" htmlFor="name" required error={errors.name} className="md:col-span-2">
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
                aria-invalid={!!errors.name}
                placeholder="e.g. Beyond Baby Co"
              />
            </FormField>

            <FormField label="Slug" htmlFor="slug" required error={errors.slug} description="Used in the brand URL.">
              <Input
                id="slug"
                name="slug"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugTouched(true);
                }}
                aria-invalid={!!errors.slug}
                placeholder="beyond-baby-co"
              />
            </FormField>

            <FormField label="Website" htmlFor="website_url" error={errors.website_url}>
              <Input id="website_url" name="website_url" type="url" defaultValue={initial?.websiteUrl ?? ""} placeholder="https://…" />
            </FormField>

            <FormField label="Country of origin" htmlFor="country_of_origin" error={errors.country_of_origin}>
              <Input id="country_of_origin" name="country_of_origin" defaultValue={initial?.countryOfOrigin ?? ""} placeholder="e.g. India" />
            </FormField>

            <FormField label="Description" htmlFor="description" className="md:col-span-2" error={errors.description}>
              <RichTextEditor id="description" name="description" defaultValue={initial?.description ?? ""} />
            </FormField>
          </div>
        </Panel>

        {/* MEDIA */}
        <Panel active={tab === "Media"}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label="Logo" description="Square brand logo shown in listings.">
              <ImageField name="logo_url" folder="brands" initialUrl={initial?.logoUrl ?? null} />
            </FormField>
            <FormField label="Banner" description="Wide banner for the brand page." className="md:col-span-2">
              <ImageField name="banner_url" folder="brands" initialUrl={initial?.bannerUrl ?? null} aspect="wide" />
            </FormField>
          </div>
        </Panel>

        {/* SEO */}
        <Panel active={tab === "SEO"}>
          <div className="grid grid-cols-1 gap-5">
            <FormField label="SEO title" htmlFor="seo_title" error={errors.seo_title}>
              <Input id="seo_title" name="seo_title" defaultValue={initial?.seoTitle ?? ""} maxLength={70} />
            </FormField>
            <FormField label="SEO description" htmlFor="seo_description" error={errors.seo_description}>
              <Input id="seo_description" name="seo_description" defaultValue={initial?.seoDescription ?? ""} maxLength={180} />
            </FormField>
          </div>
        </Panel>

        {/* PUBLISHING */}
        <Panel active={tab === "Publishing"}>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField label="Status" htmlFor="status" error={errors.status}>
              <Select id="status" name="status" defaultValue={initial?.status ?? "draft"}>
                <option value="draft">Draft</option>
                <option value="active">Published</option>
                <option value="archived">Archived</option>
              </Select>
            </FormField>
            <FormField label="Sort order" htmlFor="position" error={errors.position} description="Lower numbers appear first.">
              <Input id="position" name="position" type="number" min="0" step="1" defaultValue={initial?.position ?? 0} />
            </FormField>
            <div className="md:col-span-2">
              <Checkbox name="is_featured" label="Featured" description="Highlight this brand on the storefront." defaultChecked={initial?.isFeatured} />
            </div>
          </div>
        </Panel>
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2.5 rounded-3xl border border-cream-300 bg-cream-50/90 px-4 py-3 backdrop-blur-md">
        <Button type="button" variant="ghost" size="md" onClick={() => router.push("/admin/brands")} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="md" disabled={pending} leftIcon={pending ? <Spinner size={16} className="border-white/50 border-t-white" /> : <Icon name="plus" size={16} />}>
          {pending ? "Saving…" : mode === "edit" ? "Save changes" : "Create brand"}
        </Button>
      </div>
    </form>
  );
}

function Panel({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div role="tabpanel" hidden={!active} className={cn(active ? "block" : "hidden")}>
      {children}
    </div>
  );
}
