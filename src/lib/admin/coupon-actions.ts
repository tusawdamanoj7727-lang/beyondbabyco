"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import type { Json } from "@/lib/supabase/database.types";
import {
  bulkCouponIdsSchema,
  couponInputSchema,
  fieldErrorsFrom,
  giftCardInputSchema,
  type CouponFormInput,
  type CouponInput,
} from "./coupon-schema";
import { generateCouponCode, generateGiftCardCode } from "./coupon-types";

export interface CouponActionState {
  ok: boolean;
  error: string | null;
  fieldErrors?: Record<string, string>;
  couponId?: string;
}

async function guard() {
  await requirePermission(PERMISSIONS.MARKETING_MANAGE);
}

function revalidate(id?: string) {
  revalidatePath("/admin/coupons");
  if (id) revalidatePath(`/admin/coupons/${id}`);
}

function legacyType(promoType: string): "percent" | "fixed" {
  return promoType === "percentage" ? "percent" : "fixed";
}

function toRow(input: CouponInput) {
  const eligibility = {
    productIds: input.product_ids,
    categoryIds: input.category_ids,
    brandIds: input.brand_ids,
    segments: input.segments,
    customerIds: input.customer_ids,
    excludeProductIds: input.exclude_product_ids,
    excludeCategoryIds: input.exclude_category_ids,
  };
  const buyXGetY = {
    buyQuantity: input.buy_quantity,
    buyProductId: input.buy_product_id,
    buyCategoryId: input.buy_category_id,
    getQuantity: input.get_quantity,
    getProductId: input.get_product_id,
    discountPercent: input.bxgy_discount,
  };
  const freeShipping = {
    shippingMethodIds: input.fs_method_ids,
    minimumCartValue: input.fs_min_cart,
  };

  return {
    name: input.name,
    code: input.code.toUpperCase(),
    description: input.description,
    promo_type: input.promo_type,
    type: legacyType(input.promo_type),
    value: input.value,
    min_order: input.min_order,
    max_discount: input.max_discount ?? null,
    max_uses: input.max_uses ?? null,
    per_customer_limit: input.per_customer_limit ?? null,
    first_order_only: input.first_order_only,
    logged_in_only: input.logged_in_only,
    timezone: input.timezone,
    starts_at: input.starts_at || null,
    expires_at: input.expires_at || null,
    lifecycle_status: input.lifecycle_status,
    is_active: input.is_active,
    eligibility: eligibility as Json,
    allow_stack: input.allow_stack,
    priority: input.priority,
    is_exclusive: input.is_exclusive,
    auto_apply: input.auto_apply,
    buy_x_get_y: buyXGetY as Json,
    free_shipping: freeShipping as Json,
    updated_at: new Date().toISOString(),
  };
}

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

function numOr(fd: FormData, key: string, fallback: number): number {
  const v = str(fd, key);
  if (v === null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function numNull(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function bool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}

function isoFromLocal(v: string | null): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function rawFromFormData(fd: FormData): CouponFormInput {
  return {
    name: str(fd, "name") ?? "",
    code: (str(fd, "code") ?? generateCouponCode()).toUpperCase(),
    description: str(fd, "description"),
    promo_type: (str(fd, "promo_type") ?? "percentage") as CouponFormInput["promo_type"],
    value: numOr(fd, "value", 0),
    min_order: numOr(fd, "min_order", 0),
    max_discount: numNull(fd, "max_discount"),
    max_uses: numNull(fd, "max_uses"),
    per_customer_limit: numNull(fd, "per_customer_limit"),
    first_order_only: bool(fd, "first_order_only"),
    logged_in_only: bool(fd, "logged_in_only"),
    timezone: str(fd, "timezone") ?? "Asia/Kolkata",
    starts_at: isoFromLocal(str(fd, "starts_at")),
    expires_at: isoFromLocal(str(fd, "expires_at")),
    lifecycle_status: (str(fd, "lifecycle_status") ?? "draft") as CouponFormInput["lifecycle_status"],
    is_active: bool(fd, "is_active"),
    product_ids: str(fd, "product_ids") ?? "",
    category_ids: str(fd, "category_ids") ?? "",
    brand_ids: str(fd, "brand_ids") ?? "",
    segments: str(fd, "segments") ?? "",
    customer_ids: str(fd, "customer_ids") ?? "",
    exclude_product_ids: str(fd, "exclude_product_ids") ?? "",
    exclude_category_ids: str(fd, "exclude_category_ids") ?? "",
    allow_stack: bool(fd, "allow_stack"),
    priority: numOr(fd, "priority", 0),
    is_exclusive: bool(fd, "is_exclusive"),
    auto_apply: bool(fd, "auto_apply"),
    buy_quantity: numNull(fd, "buy_quantity"),
    buy_product_id: str(fd, "buy_product_id"),
    buy_category_id: str(fd, "buy_category_id"),
    get_quantity: numNull(fd, "get_quantity"),
    get_product_id: str(fd, "get_product_id"),
    bxgy_discount: numNull(fd, "bxgy_discount"),
    fs_min_cart: numNull(fd, "fs_min_cart"),
    fs_method_ids: str(fd, "fs_method_ids") ?? "",
  };
}

export async function createCouponAction(_prev: CouponActionState, fd: FormData): Promise<CouponActionState> {
  await guard();
  const parsed = couponInputSchema.safeParse(rawFromFormData(fd));
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = await createSupabaseServerClient();
  const row = toRow(parsed.data);
  const { data, error } = await supabase.from("coupons").insert(row).select("id").single();
  if (error) return { ok: false, error: error.message };

  await supabase.rpc("log_audit", { p_table: "coupons", p_record: data.id, p_action: "create", p_new: row as Json });
  revalidate(data.id);
  return { ok: true, error: null, couponId: data.id };
}

export async function updateCouponAction(_prev: CouponActionState, fd: FormData): Promise<CouponActionState> {
  await guard();
  const id = str(fd, "id");
  if (!id) return { ok: false, error: "Missing coupon id." };

  const parsed = couponInputSchema.safeParse(rawFromFormData(fd));
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = await createSupabaseServerClient();
  const row = toRow(parsed.data);
  const { error } = await supabase.from("coupons").update(row).eq("id", id);
  if (error) return { ok: false, error: error.message };

  await supabase.rpc("log_audit", { p_table: "coupons", p_record: id, p_action: "update", p_new: row as Json });
  revalidate(id);
  return { ok: true, error: null, couponId: id };
}

export async function activateCoupon(id: string): Promise<CouponActionState> {
  await guard();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("coupons")
    .update({ is_active: true, lifecycle_status: "active", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await supabase.rpc("log_audit", { p_table: "coupons", p_record: id, p_action: "activate" });
  revalidate(id);
  return { ok: true, error: null, couponId: id };
}

export async function deactivateCoupon(id: string): Promise<CouponActionState> {
  await guard();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("coupons")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await supabase.rpc("log_audit", { p_table: "coupons", p_record: id, p_action: "deactivate" });
  revalidate(id);
  return { ok: true, error: null, couponId: id };
}

export async function archiveCoupon(id: string): Promise<CouponActionState> {
  await guard();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("coupons")
    .update({ lifecycle_status: "archived", is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await supabase.rpc("log_audit", { p_table: "coupons", p_record: id, p_action: "archive" });
  revalidate(id);
  return { ok: true, error: null, couponId: id };
}

export async function duplicateCoupon(id: string): Promise<CouponActionState> {
  await guard();
  const supabase = await createSupabaseServerClient();
  const { data: src } = await supabase.from("coupons").select("*").eq("id", id).maybeSingle();
  if (!src) return { ok: false, error: "Coupon not found." };

  const { data, error } = await supabase
    .from("coupons")
    .insert({
      code: generateCouponCode("COPY"),
      name: `${src.name ?? src.code} (Copy)`,
      description: src.description,
      type: src.type,
      promo_type: src.promo_type,
      value: src.value,
      min_order: src.min_order,
      max_discount: src.max_discount,
      max_uses: src.max_uses,
      per_customer_limit: src.per_customer_limit,
      first_order_only: src.first_order_only,
      logged_in_only: src.logged_in_only,
      timezone: src.timezone,
      starts_at: src.starts_at,
      expires_at: src.expires_at,
      eligibility: src.eligibility,
      allow_stack: src.allow_stack,
      priority: src.priority,
      is_exclusive: src.is_exclusive,
      auto_apply: src.auto_apply,
      auto_conditions: src.auto_conditions,
      buy_x_get_y: src.buy_x_get_y,
      free_shipping: src.free_shipping,
      used_count: 0,
      total_revenue: 0,
      lifecycle_status: "draft",
      is_active: false,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  await supabase.rpc("log_audit", { p_table: "coupons", p_record: data.id, p_action: "create", p_new: { duplicated_from: id } as Json });
  revalidate(data.id);
  return { ok: true, error: null, couponId: data.id };
}

export async function deleteCoupon(id: string): Promise<CouponActionState> {
  await guard();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("coupons")
    .update({ deleted_at: new Date().toISOString(), is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await supabase.rpc("log_audit", { p_table: "coupons", p_record: id, p_action: "delete" });
  revalidate();
  return { ok: true, error: null };
}

export async function bulkActivateCoupons(ids: string[]): Promise<CouponActionState> {
  const parsed = bulkCouponIdsSchema.safeParse({ ids });
  if (!parsed.success) return { ok: false, error: "No coupons selected." };
  for (const id of parsed.data.ids) {
    const res = await activateCoupon(id);
    if (!res.ok) return res;
  }
  revalidate();
  return { ok: true, error: null };
}

export async function bulkArchiveCoupons(ids: string[]): Promise<CouponActionState> {
  const parsed = bulkCouponIdsSchema.safeParse({ ids });
  if (!parsed.success) return { ok: false, error: "No coupons selected." };
  for (const id of parsed.data.ids) {
    const res = await archiveCoupon(id);
    if (!res.ok) return res;
  }
  revalidate();
  return { ok: true, error: null };
}

export async function bulkDeleteCoupons(ids: string[]): Promise<CouponActionState> {
  const parsed = bulkCouponIdsSchema.safeParse({ ids });
  if (!parsed.success) return { ok: false, error: "No coupons selected." };
  for (const id of parsed.data.ids) {
    const res = await deleteCoupon(id);
    if (!res.ok) return res;
  }
  revalidate();
  return { ok: true, error: null };
}

// --------------------------- Gift cards ---------------------------

export async function createGiftCard(input: {
  code?: string;
  name?: string | null;
  amount: number;
  customer_id?: string | null;
  issued_to_email?: string | null;
  expires_at?: string | null;
  notes?: string | null;
}): Promise<CouponActionState> {
  await guard();
  const parsed = giftCardInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createSupabaseServerClient();
  const code = (parsed.data.code ?? generateGiftCardCode()).toUpperCase();
  const { data, error } = await supabase
    .from("gift_cards")
    .insert({
      code,
      name: parsed.data.name,
      balance: parsed.data.amount,
      initial_balance: parsed.data.amount,
      customer_id: parsed.data.customer_id,
      issued_to_email: parsed.data.issued_to_email,
      expires_at: parsed.data.expires_at,
      notes: parsed.data.notes,
      is_active: true,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  await supabase.from("gift_card_transactions").insert({
    gift_card_id: data.id,
    amount: parsed.data.amount,
    type: "credit",
    notes: "Initial issuance",
  });

  await supabase.rpc("log_audit", { p_table: "gift_cards", p_record: data.id, p_action: "create", p_new: { amount: parsed.data.amount } as Json });
  revalidate();
  return { ok: true, error: null, couponId: data.id };
}

export async function deactivateGiftCard(id: string): Promise<CouponActionState> {
  await guard();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("gift_cards").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  await supabase.rpc("log_audit", { p_table: "gift_cards", p_record: id, p_action: "deactivate" });
  revalidate();
  return { ok: true, error: null };
}

export async function redeemGiftCard(code: string, amount: number, orderId?: string): Promise<CouponActionState> {
  await guard();
  const supabase = await createSupabaseServerClient();
  const { data: card } = await supabase.from("gift_cards").select("*").eq("code", code.trim().toUpperCase()).maybeSingle();
  if (!card || !card.is_active) return { ok: false, error: "Gift card not found or inactive." };
  if (card.expires_at && new Date(card.expires_at).getTime() <= Date.now()) return { ok: false, error: "Gift card expired." };
  if (card.balance < amount) return { ok: false, error: "Insufficient balance." };

  const { error: txErr } = await supabase.from("gift_card_transactions").insert({
    gift_card_id: card.id,
    order_id: orderId ?? null,
    amount,
    type: "debit",
    notes: orderId ? `Redeemed on order ${orderId}` : "Manual redemption",
  });
  if (txErr) return { ok: false, error: txErr.message };

  await supabase.from("gift_cards").update({ balance: card.balance - amount, updated_at: new Date().toISOString() }).eq("id", card.id);
  await supabase.rpc("log_audit", { p_table: "gift_cards", p_record: card.id, p_action: "redeem", p_new: { amount, order_id: orderId } as Json });
  revalidate();
  return { ok: true, error: null };
}
