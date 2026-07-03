"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import FormField, { Input, Select, Textarea, Checkbox } from "@/components/admin/FormField";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/admin/LoadingState";
import { cn } from "@/lib/utils";
import {
  COUPON_LIFECYCLE,
  COUPON_LIFECYCLE_LABELS,
  COUPON_TYPES,
  COUPON_TYPE_LABELS,
  generateCouponCode,
  type CouponDetail,
} from "@/lib/admin/coupon-types";
import {
  createCouponAction,
  updateCouponAction,
  type CouponActionState,
} from "@/lib/admin/coupon-actions";

const TABS = ["General", "Validity", "Usage Rules", "Eligibility", "Stacking", "Advanced"] as const;
type Tab = (typeof TABS)[number];

const initialState: CouponActionState = { ok: false, error: null };

function toLocalDatetime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function joinIds(ids?: string[]) {
  return (ids ?? []).join(",");
}

export default function CouponForm({
  mode,
  initial,
  options,
}: {
  mode: "create" | "edit";
  initial: CouponDetail | null;
  options: {
    products: { id: string; name: string }[];
    categories: { id: string; name: string }[];
    brands: { id: string; name: string }[];
    customers: { id: string; name: string }[];
  };
}) {
  const router = useRouter();
  const action = mode === "edit" ? updateCouponAction : createCouponAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [tab, setTab] = useState<Tab>("General");
  const [code, setCode] = useState(initial?.code ?? generateCouponCode());

  const errors = state.fieldErrors ?? {};
  const e = initial?.eligibility ?? {};

  useEffect(() => {
    if (state.ok && state.couponId && mode === "create") {
      router.push(`/admin/coupons/${state.couponId}`);
    }
  }, [state.ok, state.couponId, mode, router]);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {mode === "edit" && initial && <input type="hidden" name="id" value={initial.id} />}

      {state.error && (
        <div role="alert" className="rounded-2xl border border-terra-200 bg-terra-50 px-4 py-3 text-sm font-medium text-terra-700">{state.error}</div>
      )}

      <div role="tablist" aria-label="Coupon sections" className="flex flex-wrap gap-1 rounded-2xl border border-cream-300 bg-cream-50 p-1">
        {TABS.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50", tab === t ? "bg-white text-green-900 shadow-card" : "text-green-700/70 hover:text-green-900")}>
            {t}
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-cream-300 bg-white p-5 sm:p-6 space-y-5">
        <Panel active={tab === "General"}>
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Name" htmlFor="name" required error={errors.name} className="md:col-span-2">
              <Input id="name" name="name" defaultValue={initial?.name} aria-invalid={!!errors.name} />
            </FormField>
            <FormField label="Coupon code" htmlFor="code" required error={errors.code}>
              <Input id="code" name="code" value={code} onChange={(ev) => setCode(ev.target.value.toUpperCase())} aria-invalid={!!errors.code} />
            </FormField>
            <FormField label="Type" htmlFor="promo_type" required>
              <Select id="promo_type" name="promo_type" defaultValue={initial?.promoType ?? "percentage"}>
                {COUPON_TYPES.map((t) => <option key={t} value={t}>{COUPON_TYPE_LABELS[t]}</option>)}
              </Select>
            </FormField>
            <FormField label="Value (% or ₹)" htmlFor="value" required error={errors.value}>
              <Input id="value" name="value" type="number" min={0} step="0.01" defaultValue={initial?.value ?? 10} />
            </FormField>
            <FormField label="Description" htmlFor="description" className="md:col-span-2">
              <Textarea id="description" name="description" rows={3} defaultValue={initial?.description ?? ""} />
            </FormField>
          </div>
        </Panel>

        <Panel active={tab === "Validity"}>
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Start date" htmlFor="starts_at">
              <Input id="starts_at" name="starts_at" type="datetime-local" defaultValue={toLocalDatetime(initial?.startsAt ?? null)} />
            </FormField>
            <FormField label="End date" htmlFor="expires_at">
              <Input id="expires_at" name="expires_at" type="datetime-local" defaultValue={toLocalDatetime(initial?.expiresAt ?? null)} />
            </FormField>
            <FormField label="Timezone" htmlFor="timezone">
              <Input id="timezone" name="timezone" defaultValue={initial?.timezone ?? "Asia/Kolkata"} />
            </FormField>
            <FormField label="Lifecycle status" htmlFor="lifecycle_status">
              <Select id="lifecycle_status" name="lifecycle_status" defaultValue={initial?.lifecycleStatus ?? "draft"}>
                {COUPON_LIFECYCLE.map((s) => <option key={s} value={s}>{COUPON_LIFECYCLE_LABELS[s]}</option>)}
              </Select>
            </FormField>
            <Checkbox name="is_active" defaultChecked={initial?.isActive ?? false} label="Active" />
          </div>
        </Panel>

        <Panel active={tab === "Usage Rules"}>
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Minimum cart value" htmlFor="min_order">
              <Input id="min_order" name="min_order" type="number" min={0} defaultValue={initial?.minOrder ?? 0} />
            </FormField>
            <FormField label="Maximum discount" htmlFor="max_discount">
              <Input id="max_discount" name="max_discount" type="number" min={0} defaultValue={initial?.maxDiscount ?? ""} />
            </FormField>
            <FormField label="Total usage limit" htmlFor="max_uses">
              <Input id="max_uses" name="max_uses" type="number" min={0} defaultValue={initial?.maxUses ?? ""} />
            </FormField>
            <FormField label="Per customer limit" htmlFor="per_customer_limit">
              <Input id="per_customer_limit" name="per_customer_limit" type="number" min={0} defaultValue={initial?.perCustomerLimit ?? ""} />
            </FormField>
            <Checkbox name="first_order_only" defaultChecked={initial?.firstOrderOnly} label="First order only" />
            <Checkbox name="logged_in_only" defaultChecked={initial?.loggedInOnly} label="Logged-in customers only" />
          </div>
        </Panel>

        <Panel active={tab === "Eligibility"}>
          <MultiSelectField label="Products" name="product_ids" options={options.products} defaultValue={joinIds(e.productIds)} />
          <MultiSelectField label="Categories" name="category_ids" options={options.categories} defaultValue={joinIds(e.categoryIds)} />
          <MultiSelectField label="Brands" name="brand_ids" options={options.brands} defaultValue={joinIds(e.brandIds)} />
          <MultiSelectField label="Specific customers" name="customer_ids" options={options.customers} defaultValue={joinIds(e.customerIds)} />
          <MultiSelectField label="Exclude products" name="exclude_product_ids" options={options.products} defaultValue={joinIds(e.excludeProductIds)} />
          <MultiSelectField label="Exclude categories" name="exclude_category_ids" options={options.categories} defaultValue={joinIds(e.excludeCategoryIds)} />
        </Panel>

        <Panel active={tab === "Stacking"}>
          <div className="grid gap-4 md:grid-cols-2">
            <Checkbox name="allow_stack" defaultChecked={initial?.allowStack} label="Allow with other coupons" />
            <Checkbox name="is_exclusive" defaultChecked={initial?.isExclusive} label="Exclusive (cannot combine)" />
            <Checkbox name="auto_apply" defaultChecked={initial?.autoApply} label="Enable automatic application" />
            <FormField label="Priority" htmlFor="priority">
              <Input id="priority" name="priority" type="number" defaultValue={initial?.priority ?? 0} />
            </FormField>
          </div>
        </Panel>

        <Panel active={tab === "Advanced"}>
          <div className="grid gap-5 md:grid-cols-2">
            <p className="md:col-span-2 text-sm font-semibold text-green-900">Buy X Get Y</p>
            <FormField label="Buy quantity" htmlFor="buy_quantity"><Input id="buy_quantity" name="buy_quantity" type="number" min={1} defaultValue={initial?.buyXGetY.buyQuantity ?? ""} /></FormField>
            <FormField label="Get quantity" htmlFor="get_quantity"><Input id="get_quantity" name="get_quantity" type="number" min={1} defaultValue={initial?.buyXGetY.getQuantity ?? ""} /></FormField>
            <FormField label="Buy product" htmlFor="buy_product_id">
              <Select id="buy_product_id" name="buy_product_id" defaultValue={initial?.buyXGetY.buyProductId ?? ""}>
                <option value="">—</option>
                {options.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Get product" htmlFor="get_product_id">
              <Select id="get_product_id" name="get_product_id" defaultValue={initial?.buyXGetY.getProductId ?? ""}>
                <option value="">—</option>
                {options.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Get discount %" htmlFor="bxgy_discount"><Input id="bxgy_discount" name="bxgy_discount" type="number" min={0} max={100} defaultValue={initial?.buyXGetY.discountPercent ?? ""} /></FormField>

            <p className="md:col-span-2 mt-4 text-sm font-semibold text-green-900">Free Shipping</p>
            <FormField label="Minimum cart value" htmlFor="fs_min_cart"><Input id="fs_min_cart" name="fs_min_cart" type="number" min={0} defaultValue={initial?.freeShipping.minimumCartValue ?? ""} /></FormField>
          </div>
        </Panel>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={pending} leftIcon={pending ? <Spinner size={16} /> : undefined}>
          {mode === "edit" ? "Save coupon" : "Create coupon"}
        </Button>
      </div>
    </form>
  );
}

function Panel({ active, children }: { active: boolean; children: React.ReactNode }) {
  if (!active) return null;
  return <div>{children}</div>;
}

function MultiSelectField({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: { id: string; name: string }[];
  defaultValue: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const selected = new Set(value.split(",").filter(Boolean));

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setValue([...next].join(","));
  }

  return (
    <FormField label={label}>
      <input type="hidden" name={name} value={value} />
      <div className="max-h-36 overflow-y-auto rounded-2xl border border-cream-200 p-2 space-y-1" role="listbox" aria-label={label}>
        {options.map((o) => (
          <label key={o.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-green-50">
            <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggle(o.id)} className="rounded border-green-300" />
            {o.name}
          </label>
        ))}
      </div>
    </FormField>
  );
}
