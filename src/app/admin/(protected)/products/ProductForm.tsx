"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import FormField, { Input, Select, Textarea, Checkbox } from "@/components/admin/FormField";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ProductMediaManager from "@/components/admin/ProductMediaManager";
import EmptyState from "@/components/admin/EmptyState";
import Icon from "@/components/admin/Icon";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/admin/LoadingState";
import { useToast } from "@/components/ui/ToastProvider";
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/admin/product-schema";
import {
  createProductAction,
  updateProductAction,
  createIngredient,
  createBenefit,
  type ProductActionState,
} from "@/lib/admin/product-actions";
import type { ProductEditData, ProductFormOptions } from "@/lib/admin/products";

const TABS = [
  "General",
  "Media",
  "Pricing",
  "Inventory",
  "Ingredients",
  "Benefits",
  "SEO",
  "Publishing",
] as const;
type Tab = (typeof TABS)[number];

const initialState: ProductActionState = { ok: false, error: null };

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ProductForm({
  mode,
  initial,
  options,
}: {
  mode: "create" | "edit";
  initial: ProductEditData | null;
  options: ProductFormOptions;
}) {
  const router = useRouter();
  const toast = useToast();
  const action = mode === "edit" ? updateProductAction : createProductAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [tab, setTab] = useState<Tab>("General");

  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok) {
      toast.success(mode === "edit" ? "Product saved" : "Product created");
    }
  }, [state.ok, mode, toast]);

  // Slug auto-fill (create only) until manually edited.
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");

  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const subcategoryOptions = useMemo(
    () => options.subcategories.filter((s) => !categoryId || s.categoryId === categoryId),
    [options.subcategories, categoryId],
  );

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
          Product saved successfully.
        </div>
      )}

      {/* Tab nav */}
      <div role="tablist" aria-label="Product sections" className="flex flex-wrap gap-1 rounded-2xl border border-cream-300 bg-cream-50 p-1">
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
            <FormField label="Product name" htmlFor="name" required error={errors.name} className="md:col-span-2">
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
                aria-invalid={!!errors.name}
                placeholder="e.g. Gentle Baby Wipes (72 pcs)"
              />
            </FormField>

            <FormField label="Slug" htmlFor="slug" required error={errors.slug} description="Used in the product URL.">
              <Input
                id="slug"
                name="slug"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugTouched(true);
                }}
                aria-invalid={!!errors.slug}
                placeholder="gentle-baby-wipes"
              />
            </FormField>

            <FormField label="Brand" htmlFor="brand_id" error={errors.brand_id}>
              <Select id="brand_id" name="brand_id" defaultValue={initial?.brandId ?? ""}>
                <option value="">— None —</option>
                {options.brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="Category" htmlFor="category_id" error={errors.category_id}>
              <Select id="category_id" name="category_id" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">— None —</option>
                {options.categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="Subcategory" htmlFor="subcategory_id" error={errors.subcategory_id}>
              <Select id="subcategory_id" name="subcategory_id" defaultValue={initial?.subcategoryId ?? ""}>
                <option value="">— None —</option>
                {subcategoryOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="Short description" htmlFor="short_description" className="md:col-span-2" error={errors.short_description}>
              <Textarea id="short_description" name="short_description" rows={2} defaultValue={initial?.shortDescription ?? ""} placeholder="One-line summary shown on cards." />
            </FormField>

            <FormField label="Description" htmlFor="description" className="md:col-span-2" error={errors.description}>
              <RichTextEditor id="description" name="description" defaultValue={initial?.description ?? ""} />
            </FormField>
          </div>
        </Panel>

        {/* MEDIA */}
        <Panel active={tab === "Media"}>
          {mode === "edit" && initial ? (
            <ProductMediaManager
              productId={initial.id}
              productName={initial.name}
              productSlug={initial.slug}
              initialImages={initial.images}
            />
          ) : (
            <EmptyState
              icon="media"
              title="Save the product first"
              description="Create the product, then return here to upload, reorder, and caption images in the products bucket."
            />
          )}
        </Panel>

        {/* PRICING */}
        <Panel active={tab === "Pricing"}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="MRP" htmlFor="compare_at_price" error={errors.compare_at_price} description="Maximum retail price">
              <Input id="compare_at_price" name="compare_at_price" type="number" min="0" step="0.01" defaultValue={initial?.compareAtPrice ?? ""} placeholder="0.00" />
            </FormField>
            <FormField label="Selling price" htmlFor="price" required error={errors.price}>
              <Input id="price" name="price" type="number" min="0" step="0.01" defaultValue={initial?.price ?? ""} aria-invalid={!!errors.price} placeholder="0.00" />
            </FormField>
            <FormField label="Sale price" htmlFor="sale_price" error={errors.sale_price} description="Optional discounted price">
              <Input id="sale_price" name="sale_price" type="number" min="0" step="0.01" defaultValue={initial?.salePrice ?? ""} aria-invalid={!!errors.sale_price} placeholder="0.00" />
            </FormField>
            <FormField label="GST %" htmlFor="gst_rate" error={errors.gst_rate}>
              <Input id="gst_rate" name="gst_rate" type="number" min="0" max="100" step="0.01" defaultValue={initial?.gstRate ?? 0} />
            </FormField>
            <FormField label="Tax class" htmlFor="tax_class" error={errors.tax_class}>
              <Input id="tax_class" name="tax_class" defaultValue={initial?.taxClass ?? ""} placeholder="e.g. Standard" />
            </FormField>
          </div>
        </Panel>

        {/* INVENTORY */}
        <Panel active={tab === "Inventory"}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="SKU" htmlFor="sku" error={errors.sku}>
              <Input id="sku" name="sku" defaultValue={initial?.sku ?? ""} placeholder="BBC-WIPES-72" />
            </FormField>
            <FormField label="Barcode" htmlFor="barcode" error={errors.barcode}>
              <Input id="barcode" name="barcode" defaultValue={initial?.barcode ?? ""} placeholder="EAN / UPC" />
            </FormField>
            <FormField label="Stock" htmlFor="stock" error={errors.stock}>
              <Input id="stock" name="stock" type="number" min="0" step="1" defaultValue={initial?.stock ?? 0} />
            </FormField>
            <FormField label="Low stock threshold" htmlFor="low_stock_threshold" error={errors.low_stock_threshold}>
              <Input id="low_stock_threshold" name="low_stock_threshold" type="number" min="0" step="1" defaultValue={initial?.lowStockThreshold ?? 0} />
            </FormField>
            <FormField label="Weight (g)" htmlFor="weight_grams" error={errors.weight_grams}>
              <Input id="weight_grams" name="weight_grams" type="number" min="0" step="1" defaultValue={initial?.weightGrams ?? ""} />
            </FormField>
            <div className="grid grid-cols-3 gap-2 sm:col-span-2 lg:col-span-1">
              <FormField label="L (cm)" htmlFor="length_cm" error={errors.length_cm}>
                <Input id="length_cm" name="length_cm" type="number" min="0" step="0.1" defaultValue={initial?.lengthCm ?? ""} />
              </FormField>
              <FormField label="W (cm)" htmlFor="width_cm" error={errors.width_cm}>
                <Input id="width_cm" name="width_cm" type="number" min="0" step="0.1" defaultValue={initial?.widthCm ?? ""} />
              </FormField>
              <FormField label="H (cm)" htmlFor="height_cm" error={errors.height_cm}>
                <Input id="height_cm" name="height_cm" type="number" min="0" step="0.1" defaultValue={initial?.heightCm ?? ""} />
              </FormField>
            </div>
          </div>
        </Panel>

        {/* INGREDIENTS */}
        <Panel active={tab === "Ingredients"}>
          <TagSelect
            name="ingredient_ids"
            label="Ingredients"
            placeholder="Search ingredients…"
            options={options.ingredients}
            initialSelected={initial?.ingredientIds ?? []}
            onCreate={createIngredient}
          />
        </Panel>

        {/* BENEFITS */}
        <Panel active={tab === "Benefits"}>
          <TagSelect
            name="benefit_ids"
            label="Benefits"
            placeholder="Search benefits…"
            options={options.benefits}
            initialSelected={initial?.benefitIds ?? []}
            onCreate={createBenefit}
          />
        </Panel>

        {/* SEO */}
        <Panel active={tab === "SEO"}>
          <div className="grid grid-cols-1 gap-5">
            <FormField label="SEO title" htmlFor="seo_title" error={errors.seo_title}>
              <Input id="seo_title" name="seo_title" defaultValue={initial?.seoTitle ?? ""} maxLength={70} />
            </FormField>
            <FormField label="SEO description" htmlFor="seo_description" error={errors.seo_description}>
              <Textarea id="seo_description" name="seo_description" rows={3} defaultValue={initial?.seoDescription ?? ""} maxLength={180} />
            </FormField>
            <FormField label="Meta keywords" htmlFor="meta_keywords" error={errors.meta_keywords} description="Comma-separated">
              <Input id="meta_keywords" name="meta_keywords" defaultValue={initial?.metaKeywords ?? ""} placeholder="baby wipes, gentle, fragrance-free" />
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
              <Select id="status" name="status" defaultValue={initial?.status === "active" ? "active" : initial?.status === "archived" ? "archived" : "draft"}>
                <option value="draft">Draft</option>
                <option value="active">Published</option>
                <option value="archived">Archived</option>
              </Select>
            </FormField>
            <FormField label="Launch date" htmlFor="launch_date" error={errors.launch_date}>
              <Input id="launch_date" name="launch_date" type="datetime-local" defaultValue={toLocalInput(initial?.launchDate ?? null)} />
            </FormField>

            <div className="space-y-2.5 md:col-span-2">
              <Checkbox name="is_featured" label="Featured" description="Highlight on the storefront." defaultChecked={initial?.isFeatured} />
              <Checkbox name="is_best_seller" label="Best seller" defaultChecked={initial?.isBestSeller} />
              <Checkbox name="is_new_arrival" label="New arrival" defaultChecked={initial?.isNewArrival} />
              <Checkbox name="is_trending" label="Trending" defaultChecked={initial?.isTrending} />
            </div>
          </div>
        </Panel>
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 z-10 -mx-1 flex items-center justify-between gap-2.5 rounded-3xl border border-cream-300 bg-cream-50/95 px-4 py-3 shadow-clay backdrop-blur-md">
        <p className="hidden text-xs font-medium text-green-700/60 sm:block">
          {pending ? "Saving changes…" : "Changes save when you submit"}
        </p>
        <div className="ml-auto flex items-center gap-2.5">
        <Button type="button" variant="ghost" size="md" onClick={() => router.push("/admin/products")} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="md" disabled={pending} leftIcon={pending ? <Spinner size={16} className="border-white/50 border-t-white" /> : <Icon name="plus" size={16} />}>
          {pending ? "Saving…" : mode === "edit" ? "Save changes" : "Create product"}
        </Button>
        </div>
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

interface Option {
  id: string;
  name: string;
}

function TagSelect({
  name,
  label,
  placeholder,
  options,
  initialSelected,
  onCreate,
}: {
  name: string;
  label: string;
  placeholder: string;
  options: Option[];
  initialSelected: string[];
  onCreate: (name: string) => Promise<Option | null>;
}) {
  const [all, setAll] = useState<Option[]>(options);
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedOptions = all.filter((o) => selected.includes(o.id));
  const q = query.trim().toLowerCase();
  const matches = all.filter((o) => !selected.includes(o.id) && (!q || o.name.toLowerCase().includes(q)));
  const exactExists = all.some((o) => o.name.toLowerCase() === q);

  function add(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setQuery("");
  }
  function remove(id: string) {
    setSelected((prev) => prev.filter((x) => x !== id));
  }
  function createNew() {
    if (!q) return;
    startTransition(async () => {
      const created = await onCreate(query.trim());
      if (created) {
        setAll((prev) => [...prev, created]);
        setSelected((prev) => [...prev, created.id]);
        setQuery("");
      }
    });
  }

  return (
    <FormField label={label} description="Select existing or create new.">
      {selected.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}

      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-1">
          {selectedOptions.map((o) => (
            <span key={o.id} className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              {o.name}
              <button type="button" onClick={() => remove(o.id)} aria-label={`Remove ${o.name}`} className="text-green-700/60 hover:text-green-900 focus-visible:outline-none">
                <Icon name="close" size={14} />
              </button>
            </span>
          ))}
        </div>
      )}

      <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} aria-label={`Search ${label.toLowerCase()}`} />

      {(matches.length > 0 || (q && !exactExists)) && (
        <div className="mt-1 max-h-52 overflow-y-auto rounded-2xl border border-cream-300 bg-white p-1.5">
          {matches.slice(0, 30).map((o) => (
            <button key={o.id} type="button" onClick={() => add(o.id)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-green-800 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50">
              <Icon name="plus" size={14} /> {o.name}
            </button>
          ))}
          {q && !exactExists && (
            <button type="button" onClick={createNew} disabled={isPending} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-terra-600 hover:bg-terra-50 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50">
              {isPending ? <Spinner size={14} /> : <Icon name="plus" size={14} />} Create “{query.trim()}”
            </button>
          )}
        </div>
      )}
    </FormField>
  );
}
