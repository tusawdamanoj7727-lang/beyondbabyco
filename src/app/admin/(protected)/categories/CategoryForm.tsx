"use client";

import { useActionState, useMemo, useState } from "react";
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
  createCategoryAction,
  updateCategoryAction,
  type CategoryActionState,
} from "@/lib/admin/category-actions";
import type { CategoryEditData, CategoryOption } from "@/lib/admin/categories";

const TABS = ["General", "Media", "SEO", "Publishing"] as const;
type Tab = (typeof TABS)[number];

const initialState: CategoryActionState = { ok: false, error: null };

export default function CategoryForm({
  mode,
  initial,
  categories,
}: {
  mode: "create" | "edit";
  initial: CategoryEditData | null;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const action = mode === "edit" ? updateCategoryAction : createCategoryAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [tab, setTab] = useState<Tab>("General");

  const errors = state.fieldErrors ?? {};

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [parentId, setParentId] = useState(initial?.parentId ?? "");

  // Exclude self + descendants from the parent options to avoid cycles.
  const parentOptions = useMemo(() => {
    if (!initial) return categories;
    const childrenOf = new Map<string | null, CategoryOption[]>();
    for (const c of categories) {
      const list = childrenOf.get(c.parentId) ?? [];
      list.push(c);
      childrenOf.set(c.parentId, list);
    }
    const blocked = new Set<string>([initial.id]);
    const stack = [initial.id];
    while (stack.length) {
      const cur = stack.pop()!;
      for (const child of childrenOf.get(cur) ?? []) {
        if (!blocked.has(child.id)) {
          blocked.add(child.id);
          stack.push(child.id);
        }
      }
    }
    return categories.filter((c) => !blocked.has(c.id));
  }, [categories, initial]);

  // Breadcrumb preview from the selected parent chain.
  const breadcrumb = useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, c]));
    const chain: string[] = [];
    let cursor: string | null = parentId || null;
    const guard = new Set<string>();
    while (cursor && byId.has(cursor) && !guard.has(cursor)) {
      guard.add(cursor);
      chain.unshift(byId.get(cursor)!.name);
      cursor = byId.get(cursor)!.parentId;
    }
    return [...chain, name || "New category"];
  }, [parentId, categories, name]);

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
          Category saved successfully.
        </div>
      )}

      {/* Breadcrumb preview */}
      <nav aria-label="Category path" className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-cream-300 bg-cream-50/60 px-4 py-2.5 text-sm">
        <Icon name="categories" size={15} className="text-green-600" />
        {breadcrumb.map((label, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-green-700/30">/</span>}
            <span className={cn(i === breadcrumb.length - 1 ? "font-semibold text-green-900" : "text-green-700/70")}>
              {label}
            </span>
          </span>
        ))}
      </nav>

      {/* Tab nav */}
      <div role="tablist" aria-label="Category sections" className="flex flex-wrap gap-1 rounded-2xl border border-cream-300 bg-cream-50 p-1">
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
            <FormField label="Category name" htmlFor="name" required error={errors.name} className="md:col-span-2">
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
                aria-invalid={!!errors.name}
                placeholder="e.g. Baby Wipes"
              />
            </FormField>

            <FormField label="Slug" htmlFor="slug" required error={errors.slug} description="Used in the category URL.">
              <Input
                id="slug"
                name="slug"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugTouched(true);
                }}
                aria-invalid={!!errors.slug}
                placeholder="baby-wipes"
              />
            </FormField>

            <FormField label="Parent category" htmlFor="parent_id" error={errors.parent_id} description="Leave empty for a top-level category.">
              <Select id="parent_id" name="parent_id" value={parentId} onChange={(e) => setParentId(e.target.value)}>
                <option value="">— None (top level) —</option>
                {parentOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="Description" htmlFor="description" className="md:col-span-2" error={errors.description}>
              <RichTextEditor id="description" name="description" defaultValue={initial?.description ?? ""} />
            </FormField>
          </div>
        </Panel>

        {/* MEDIA */}
        <Panel active={tab === "Media"}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label="Category image" description="Primary thumbnail shown in listings.">
              <ImageField name="image_url" folder="categories" initialUrl={initial?.imageUrl ?? null} />
            </FormField>
            <FormField label="Icon" description="Small icon for navigation menus.">
              <ImageField name="icon_url" folder="categories" initialUrl={initial?.iconUrl ?? null} />
            </FormField>
            <FormField label="Banner image" description="Wide hero banner for the category page." className="md:col-span-2">
              <ImageField name="banner_url" folder="categories" initialUrl={initial?.bannerUrl ?? null} aspect="wide" />
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
            <FormField label="Meta keywords" htmlFor="meta_keywords" error={errors.meta_keywords} description="Comma-separated">
              <Input id="meta_keywords" name="meta_keywords" defaultValue={initial?.metaKeywords ?? ""} placeholder="baby wipes, gentle" />
            </FormField>
            <FormField label="Canonical URL" htmlFor="canonical_url" error={errors.canonical_url}>
              <Input id="canonical_url" name="canonical_url" type="url" defaultValue={initial?.canonicalUrl ?? ""} placeholder="https://…" />
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
              <Checkbox name="is_featured" label="Featured" description="Highlight this category on the storefront." defaultChecked={initial?.isFeatured} />
            </div>
          </div>
        </Panel>
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2.5 rounded-3xl border border-cream-300 bg-cream-50/90 px-4 py-3 backdrop-blur-md">
        <Button type="button" variant="ghost" size="md" onClick={() => router.push("/admin/categories")} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="md" disabled={pending} leftIcon={pending ? <Spinner size={16} className="border-white/50 border-t-white" /> : <Icon name="plus" size={16} />}>
          {pending ? "Saving…" : mode === "edit" ? "Save changes" : "Create category"}
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
