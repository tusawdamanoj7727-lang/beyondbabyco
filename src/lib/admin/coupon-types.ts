/**
 * Client-safe constants, types and helpers for coupons & promotions.
 */

export const COUPON_TYPES = [
  "percentage",
  "fixed_amount",
  "free_shipping",
  "buy_x_get_y",
  "automatic",
  "gift_voucher",
] as const;
export type CouponType = (typeof COUPON_TYPES)[number];

export const COUPON_TYPE_LABELS: Record<CouponType, string> = {
  percentage: "Percentage",
  fixed_amount: "Fixed Amount",
  free_shipping: "Free Shipping",
  buy_x_get_y: "Buy X Get Y",
  automatic: "Automatic Discount",
  gift_voucher: "Gift Voucher",
};

export const COUPON_LIFECYCLE = ["draft", "active", "archived"] as const;
export type CouponLifecycle = (typeof COUPON_LIFECYCLE)[number];

export const COUPON_LIFECYCLE_LABELS: Record<CouponLifecycle, string> = {
  draft: "Draft",
  active: "Active",
  archived: "Archived",
};

/** Computed display status for list filters */
export type CouponDisplayStatus = "active" | "scheduled" | "expired" | "inactive" | "archived";

export const COUPON_SORTABLE_COLUMNS = ["code", "name", "promo_type", "value", "updated_at", "starts_at", "expires_at"] as const;
export type CouponSortColumn = (typeof COUPON_SORTABLE_COLUMNS)[number];

export interface CouponEligibility {
  productIds?: string[];
  categoryIds?: string[];
  brandIds?: string[];
  segments?: string[];
  customerIds?: string[];
  excludeProductIds?: string[];
  excludeCategoryIds?: string[];
}

export interface BuyXGetYRule {
  buyQuantity?: number;
  buyProductId?: string | null;
  buyCategoryId?: string | null;
  getQuantity?: number;
  getProductId?: string | null;
  discountPercent?: number;
}

export interface FreeShippingRule {
  shippingMethodIds?: string[];
  minimumCartValue?: number;
}

export interface CouponListItem {
  id: string;
  code: string;
  name: string;
  promoType: CouponType;
  value: number;
  usageCount: number;
  maxUses: number | null;
  displayStatus: CouponDisplayStatus;
  lifecycleStatus: CouponLifecycle;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  updatedAt: string;
}

export interface CouponDashboard {
  activeCoupons: number;
  scheduledCoupons: number;
  expiredCoupons: number;
  disabledCoupons: number;
  expiringSoon: number;
  redemptionRate: number;
  revenueGenerated: number;
  topCoupons: { id: string; code: string; name: string; usageCount: number; revenue: number }[];
}

export interface CouponDetail {
  id: string;
  code: string;
  name: string;
  description: string | null;
  promoType: CouponType;
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  maxUses: number | null;
  usedCount: number;
  perCustomerLimit: number | null;
  firstOrderOnly: boolean;
  loggedInOnly: boolean;
  timezone: string;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  lifecycleStatus: CouponLifecycle;
  eligibility: CouponEligibility;
  allowStack: boolean;
  priority: number;
  isExclusive: boolean;
  autoApply: boolean;
  autoConditions: Record<string, unknown>;
  buyXGetY: BuyXGetYRule;
  freeShipping: FreeShippingRule;
  totalRevenue: number;
  createdAt: string;
  updatedAt: string;
}

export interface GiftCardListItem {
  id: string;
  code: string;
  name: string | null;
  balance: number;
  initialBalance: number;
  currency: string;
  isActive: boolean;
  expiresAt: string | null;
  customerName: string | null;
  createdAt: string;
}

export interface CartLineItem {
  productId: string | null;
  categoryId: string | null;
  brandId: string | null;
  quantity: number;
  unitPrice: number;
}

export interface CouponValidationContext {
  customerId?: string | null;
  isLoggedIn: boolean;
  isFirstOrder?: boolean;
  subtotal: number;
  shippingTotal?: number;
  shippingMethodId?: string | null;
  items: CartLineItem[];
  existingCouponIds?: string[];
}

export interface CouponValidationResult {
  valid: boolean;
  error: string | null;
  couponId?: string;
  discountAmount?: number;
  freeShipping?: boolean;
}

export function computeDisplayStatus(c: {
  isActive: boolean;
  lifecycleStatus: string;
  startsAt: string | null;
  expiresAt: string | null;
}): CouponDisplayStatus {
  const now = Date.now();
  if (c.lifecycleStatus === "archived") return "archived";
  if (c.expiresAt && new Date(c.expiresAt).getTime() <= now) return "expired";
  if (c.startsAt && new Date(c.startsAt).getTime() > now) return "scheduled";
  if (c.isActive && c.lifecycleStatus === "active") return "active";
  return "inactive";
}

export function generateCouponCode(prefix = "SAVE"): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${rand}`;
}

export function generateGiftCardCode(): string {
  const seg = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GC-${seg()}-${seg()}`;
}
