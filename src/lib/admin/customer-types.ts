/**
 * Client-safe constants, types and helpers for the customers module.
 */

export const CUSTOMER_STATUSES = ["active", "inactive", "deleted"] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  deleted: "Deleted",
};

export const CUSTOMER_SEGMENTS = [
  "new_customer",
  "returning",
  "vip",
  "high_value",
  "inactive",
  "at_risk",
] as const;
export type CustomerSegment = (typeof CUSTOMER_SEGMENTS)[number];

export const CUSTOMER_SEGMENT_LABELS: Record<CustomerSegment, string> = {
  new_customer: "New Customer",
  returning: "Returning",
  vip: "VIP",
  high_value: "High Value",
  inactive: "Inactive",
  at_risk: "At Risk",
};

export const CUSTOMER_SORTABLE_COLUMNS = [
  "full_name",
  "email",
  "created_at",
  "order_count",
  "lifetime_value",
  "last_order_at",
] as const;
export type CustomerSortColumn = (typeof CUSTOMER_SORTABLE_COLUMNS)[number];

export interface CustomerListItem {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  orderCount: number;
  lifetimeValue: number;
  lastOrderAt: string | null;
  status: CustomerStatus;
  isVip: boolean;
  isNewsletter: boolean;
  segment: CustomerSegment;
  createdAt: string;
}

export interface CustomerDashboard {
  totalCustomers: number;
  activeCustomers: number;
  vipCustomers: number;
  newThisMonth: number;
  averageLifetimeValue: number;
  abandonedCarts: number;
}

export interface CustomerAddressRow {
  id: string;
  type: "billing" | "shipping";
  fullName: string | null;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string;
  isDefault: boolean;
}

export interface CustomerOrderRow {
  id: string;
  orderNumber: string;
  status: string;
  grandTotal: number;
  currency: string;
  createdAt: string;
}

export interface CustomerWishlistRow {
  id: string;
  productId: string;
  productName: string;
  inStock: boolean;
  createdAt: string;
}

export interface CustomerCartRow {
  variantId: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
}

export interface CustomerReviewRow {
  id: string;
  productName: string;
  rating: number;
  title: string | null;
  body: string | null;
  isPublished: boolean;
  createdAt: string;
}

export interface CustomerTicketRow {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  assignedName: string | null;
  createdAt: string;
}

export interface CustomerLoyaltyRow {
  id: string;
  points: number;
  reason: string | null;
  createdAt: string;
}

export interface CustomerReferralRow {
  id: string;
  referredEmail: string | null;
  referredName: string | null;
  status: string;
  rewardPoints: number;
  createdAt: string;
}

export interface CustomerActivityEvent {
  id: string;
  type: string;
  message: string;
  metadata: Record<string, unknown>;
  userName: string | null;
  createdAt: string;
}

export interface CustomerDetail {
  id: string;
  profileId: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  status: CustomerStatus;
  isVip: boolean;
  notes: string | null;
  internalNotes: string | null;
  tags: string[];
  segment: CustomerSegment;
  isNewsletter: boolean;
  createdAt: string;
  updatedAt: string;
  orderCount: number;
  lifetimeValue: number;
  averageOrderValue: number;
  lastOrderAt: string | null;
}

/** Compute segment from order metrics (auto-calculated). */
export function computeCustomerSegment(input: {
  orderCount: number;
  lifetimeValue: number;
  lastOrderAt: string | null;
  isVip: boolean;
  createdAt: string;
}): CustomerSegment {
  const now = Date.now();
  const daysSince = (iso: string | null) =>
    iso ? (now - new Date(iso).getTime()) / (1000 * 60 * 60 * 24) : Infinity;
  const daysSinceCreated = daysSince(input.createdAt);

  if (input.isVip) return "vip";
  if (input.lifetimeValue >= 50000) return "high_value";
  if (input.orderCount === 0 && daysSinceCreated <= 30) return "new_customer";
  if (input.orderCount === 1 && daysSinceCreated <= 60) return "new_customer";
  if (input.orderCount > 0 && daysSince(input.lastOrderAt) > 90) return "inactive";
  if (input.orderCount >= 2 && daysSince(input.lastOrderAt) > 60 && daysSince(input.lastOrderAt) <= 90)
    return "at_risk";
  if (input.orderCount >= 2) return "returning";
  return "new_customer";
}

export function customerInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
