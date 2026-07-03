import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { computeCustomerSegment, type CustomerSegment } from "./customer-types";
import {
  REVIEW_SORTABLE_COLUMNS,
  type ReviewDashboard,
  type ReviewDetail,
  type ReviewListItem,
  type ReviewSortColumn,
  type ReviewStatus,
  type ReviewTimelineEvent,
} from "./review-types";

export { REVIEW_SORTABLE_COLUMNS, type ReviewSortColumn };

export interface ReviewListParams {
  search?: string;
  rating?: number | "all";
  status?: ReviewStatus | "all";
  verified?: boolean;
  productId?: string;
  customerId?: string;
  hasImages?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sort?: ReviewSortColumn;
  dir?: "asc" | "desc";
  page?: number;
  perPage?: number;
  trash?: boolean;
}

export interface ReviewListResult {
  rows: ReviewListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

export interface VerifiedPurchaseInfo {
  verified: boolean;
  orderId: string | null;
  orderNumber: string | null;
  purchaseDate: string | null;
}

/** Determine verified purchase from orders + order_items (read-only). */
export async function resolveVerifiedPurchase(
  customerId: string | null,
  productId: string,
): Promise<VerifiedPurchaseInfo> {
  if (!customerId) return { verified: false, orderId: null, orderNumber: null, purchaseDate: null };

  const supabase = await createSupabaseServerClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, created_at, placed_at, status")
    .eq("customer_id", customerId);

  const validOrders = (orders ?? []).filter((o) => o.status !== "cancelled" && o.status !== "refunded");
  if (!validOrders.length) return { verified: false, orderId: null, orderNumber: null, purchaseDate: null };

  const orderIds = validOrders.map((o) => o.id);
  const { data: items } = await supabase
    .from("order_items")
    .select("order_id, product_id")
    .in("order_id", orderIds)
    .eq("product_id", productId)
    .limit(1);

  if (!items?.length) return { verified: false, orderId: null, orderNumber: null, purchaseDate: null };

  const order = validOrders.find((o) => o.id === items[0].order_id);
  return {
    verified: true,
    orderId: order?.id ?? items[0].order_id,
    orderNumber: order?.order_number ?? null,
    purchaseDate: order?.placed_at ?? order?.created_at ?? null,
  };
}

async function batchVerifiedPurchases(
  pairs: { customerId: string | null; productId: string }[],
): Promise<Map<string, boolean>> {
  const map = new Map<string, boolean>();
  const valid = pairs.filter((p) => p.customerId);
  if (!valid.length) return map;

  const customerIds = [...new Set(valid.map((p) => p.customerId!))];
  const supabase = await createSupabaseServerClient();

  const { data: orders } = await supabase.from("orders").select("id, customer_id, status").in("customer_id", customerIds);

  const validOrders = (orders ?? []).filter((o) => o.status !== "cancelled" && o.status !== "refunded");
  if (!validOrders.length) return map;

  const orderIds = validOrders.map((o) => o.id);
  const orderCustomer = new Map(validOrders.map((o) => [o.id, o.customer_id]));

  const { data: items } = await supabase
    .from("order_items")
    .select("order_id, product_id")
    .in("order_id", orderIds);

  const purchased = new Set<string>();
  for (const item of items ?? []) {
    const cid = orderCustomer.get(item.order_id);
    if (cid) purchased.add(`${cid}:${item.product_id}`);
  }

  for (const p of valid) {
    map.set(`${p.customerId}:${p.productId}`, purchased.has(`${p.customerId}:${p.productId}`));
  }
  return map;
}

function startOfMonthIso() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function parseStatus(raw: string | null | undefined, isPublished: boolean): ReviewStatus {
  const s = raw as ReviewStatus;
  if (s && (["pending", "approved", "rejected", "hidden", "spam"] as string[]).includes(s)) return s;
  return isPublished ? "approved" : "pending";
}

export async function getReviewDashboard(): Promise<ReviewDashboard> {
  const supabase = await createSupabaseServerClient();
  const monthStart = startOfMonthIso();

  const { data } = await supabase
    .from("reviews")
    .select("moderation_status, is_published, rating, is_featured, created_at, deleted_at");

  const active = (data ?? []).filter((r) => !r.deleted_at);
  const approved = active.filter((r) => parseStatus(r.moderation_status, r.is_published) === "approved");
  const pending = active.filter((r) => parseStatus(r.moderation_status, r.is_published) === "pending");
  const thisMonth = active.filter((r) => r.created_at >= monthStart);
  const ratings = approved.map((r) => r.rating);
  const avg = ratings.length ? ratings.reduce((s, n) => s + n, 0) / ratings.length : 0;

  return {
    pendingReviews: pending.length,
    approvedReviews: approved.length,
    averageRating: Math.round(avg * 10) / 10,
    reviewsThisMonth: thisMonth.length,
    featuredReviews: active.filter((r) => r.is_featured).length,
  };
}

export async function listReviews(params: ReviewListParams): Promise<ReviewListResult> {
  const supabase = await createSupabaseServerClient();
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(5, params.perPage ?? 20));
  const sort = params.sort ?? "created_at";
  const dir = params.dir === "asc";

  let query = supabase.from("reviews").select("*", { count: "exact" });
  query = params.trash ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);

  if (params.status && params.status !== "all") query = query.eq("moderation_status", params.status);
  if (params.rating && params.rating !== "all") query = query.eq("rating", params.rating);
  if (params.productId) query = query.eq("product_id", params.productId);
  if (params.customerId) query = query.eq("customer_id", params.customerId);
  if (params.dateFrom) query = query.gte("created_at", params.dateFrom);
  if (params.dateTo) query = query.lte("created_at", params.dateTo);

  const dbSort = sort === "rating" ? "rating" : sort === "updated_at" ? "updated_at" : "created_at";
  query = query.order(dbSort, { ascending: dir });

  const from = (page - 1) * perPage;
  const { data, count, error } = await query.range(from, from + perPage - 1);
  if (error) throw error;

  const reviewIds = (data ?? []).map((r) => r.id);
  const productIds = [...new Set((data ?? []).map((r) => r.product_id))];
  const customerIds = [...new Set((data ?? []).map((r) => r.customer_id).filter(Boolean))] as string[];

  const [{ data: products }, { data: customers }, { data: images }] = await Promise.all([
    productIds.length ? supabase.from("products").select("id, name, sku").in("id", productIds) : Promise.resolve({ data: [] }),
    customerIds.length ? supabase.from("customers").select("id, full_name, email").in("id", customerIds) : Promise.resolve({ data: [] }),
    reviewIds.length ? supabase.from("review_images").select("review_id").in("review_id", reviewIds) : Promise.resolve({ data: [] }),
  ]);

  const pMap = new Map((products ?? []).map((p) => [p.id, p]));
  const cMap = new Map((customers ?? []).map((c) => [c.id, c]));
  const imgCounts = new Map<string, number>();
  for (const img of images ?? []) imgCounts.set(img.review_id, (imgCounts.get(img.review_id) ?? 0) + 1);

  const verifiedMap = await batchVerifiedPurchases(
    (data ?? []).map((r) => ({ customerId: r.customer_id, productId: r.product_id })),
  );

  let rows: ReviewListItem[] = (data ?? []).map((r) => {
    const product = pMap.get(r.product_id);
    const customer = r.customer_id ? cMap.get(r.customer_id) : undefined;
    const verified =
      verifiedMap.get(`${r.customer_id}:${r.product_id}`) ?? r.is_verified ?? false;
    return {
      id: r.id,
      rating: r.rating,
      productId: r.product_id,
      productName: product?.name ?? "Product",
      productSku: product?.sku ?? null,
      customerId: r.customer_id,
      customerName: customer?.full_name ?? customer?.email ?? "Anonymous",
      verifiedPurchase: verified,
      status: parseStatus(r.moderation_status, r.is_published),
      isFeatured: r.is_featured ?? false,
      imageCount: imgCounts.get(r.id) ?? 0,
      title: r.title,
      createdAt: r.created_at,
    };
  });

  if (params.verified) rows = rows.filter((r) => r.verifiedPurchase);
  if (params.hasImages) rows = rows.filter((r) => r.imageCount > 0);
  if (params.search?.trim()) {
    const q = params.search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.productName.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        (r.title?.toLowerCase().includes(q) ?? false),
    );
  }

  const total = count ?? rows.length;
  return { rows, total, page, perPage, pageCount: Math.max(1, Math.ceil(total / perPage)) };
}

export async function getReviewDetail(id: string): Promise<ReviewDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data: r } = await supabase.from("reviews").select("*").eq("id", id).maybeSingle();
  if (!r) return null;

  const verified = await resolveVerifiedPurchase(r.customer_id, r.product_id);

  const [{ data: product }, { data: customer }, { data: images }, { data: moderator }] = await Promise.all([
    supabase.from("products").select("id, name, sku, slug").eq("id", r.product_id).maybeSingle(),
    r.customer_id
      ? supabase.from("customers").select("id, full_name, email, avatar_url, is_vip, created_at").eq("id", r.customer_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("review_images").select("id, url, created_at").eq("review_id", id).order("created_at"),
    r.moderator_id
      ? supabase.from("profiles").select("full_name").eq("id", r.moderator_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  let segment: string | null = null;
  if (customer) {
    const { data: orders } = await supabase
      .from("orders")
      .select("grand_total, created_at, status")
      .eq("customer_id", customer.id)
      .not("status", "eq", "cancelled");
    const orderCount = orders?.length ?? 0;
    const ltv = (orders ?? []).reduce((s, o) => s + o.grand_total, 0);
    const last = orders?.[0]?.created_at ?? null;
    segment = computeCustomerSegment({
      orderCount,
      lifetimeValue: ltv,
      lastOrderAt: last,
      isVip: customer.is_vip ?? false,
      createdAt: customer.created_at,
    });
  }

  const { data: thumbs } = product
    ? await supabase.from("product_images").select("url").eq("product_id", product.id).order("position").limit(1)
    : { data: [] };

  let orderInfo: ReviewDetail["order"] = null;
  if (verified.verified && verified.orderId) {
    orderInfo = {
      id: verified.orderId,
      orderNumber: verified.orderNumber ?? "—",
      purchaseDate: verified.purchaseDate ?? r.created_at,
    };
  }

  return {
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    pros: r.pros,
    cons: r.cons,
    status: parseStatus(r.moderation_status, r.is_published),
    isFeatured: r.is_featured ?? false,
    verifiedPurchase: verified.verified,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    editedAt: r.edited_at,
    internalNotes: r.internal_notes,
    moderationReason: r.moderation_reason,
    moderatorName: moderator?.full_name ?? null,
    customer: {
      id: customer?.id ?? null,
      name: customer?.full_name ?? customer?.email ?? "Anonymous",
      email: customer?.email ?? null,
      avatarUrl: customer?.avatar_url ?? null,
      segment: segment as CustomerSegment | null,
    },
    product: {
      id: product?.id ?? r.product_id,
      name: product?.name ?? "Product",
      sku: product?.sku ?? null,
      slug: product?.slug ?? "",
      thumbnailUrl: thumbs?.[0]?.url ?? null,
    },
    order: orderInfo,
    images: (images ?? []).map((img) => ({ id: img.id, url: img.url, createdAt: img.created_at })),
  };
}

export async function getReviewTimeline(reviewId: string): Promise<ReviewTimelineEvent[]> {
  const supabase = await createSupabaseServerClient();
  const { data: events } = await supabase
    .from("review_events")
    .select("id, type, message, metadata, created_by, created_at")
    .eq("review_id", reviewId)
    .order("created_at", { ascending: false });

  const userIds = [...new Set((events ?? []).map((e) => e.created_by).filter(Boolean))] as string[];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [] };
  const uMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const { data: review } = await supabase.from("reviews").select("created_at, updated_at, edited_at").eq("id", reviewId).maybeSingle();

  const synthetic: ReviewTimelineEvent[] = [];
  if (review) {
    synthetic.push({
      id: `submitted-${reviewId}`,
      type: "submitted",
      message: "Review submitted",
      metadata: {},
      userName: null,
      createdAt: review.created_at,
    });
    if (review.edited_at) {
      synthetic.push({
        id: `edited-${reviewId}`,
        type: "edited",
        message: "Review edited",
        metadata: {},
        userName: null,
        createdAt: review.edited_at,
      });
    }
  }

  const merged = [
    ...(events ?? []).map((e) => ({
      id: e.id,
      type: e.type,
      message: e.message,
      metadata: (e.metadata as Record<string, unknown>) ?? {},
      userName: e.created_by ? uMap.get(e.created_by) ?? null : null,
      createdAt: e.created_at,
    })),
    ...synthetic,
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return merged;
}

export async function getReviewFilterOptions() {
  const supabase = await createSupabaseServerClient();
  const [{ data: products }, { data: customers }] = await Promise.all([
    supabase.from("products").select("id, name").order("name").limit(200),
    supabase.from("customers").select("id, full_name, email").is("deleted_at", null).order("full_name").limit(200),
  ]);
  return {
    products: (products ?? []).map((p) => ({ id: p.id, name: p.name })),
    customers: (customers ?? []).map((c) => ({
      id: c.id,
      name: c.full_name ?? c.email ?? c.id.slice(0, 8),
    })),
  };
}
