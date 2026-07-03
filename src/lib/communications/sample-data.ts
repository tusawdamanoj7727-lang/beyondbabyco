import { absoluteUrl } from "@/lib/seo/site";

/** Shared sample data merged into all template previews. */
export const BASE_SAMPLE_DATA: Record<string, string> = {
  site_url: absoluteUrl("/"),
  customer_name: "Priya Sharma",
  customer_email: "priya@example.com",
  order_number: "BBC-2026-004821",
  order_date: "1 July 2026",
  order_total: "₹847.00",
  payment_method: "UPI",
  payment_status: "Paid",
  product_name: "99% Pure Water Baby Wipes",
  product_url: absoluteUrl("/products"),
  tracking_number: "DLV7894561230",
  carrier_name: "Delhivery",
  shipment_status: "In Transit",
  estimated_delivery: "4 July 2026",
  delivery_address: "12, Lake Palace Road, Udaipur, Rajasthan 313001",
  refund_amount: "₹299.00",
  refund_date: "8 July 2026",
  return_reason: "Ordered wrong variant",
  coupon_code: "BEYOND10",
  coupon_discount: "10% off",
  offer_expiry: "15 July 2026",
  reset_link: absoluteUrl("/forgot-password"),
  verify_link: absoluteUrl("/account/profile"),
  invoice_url: absoluteUrl("/account/orders/sample-id/documents/invoice"),
  order_url: absoluteUrl("/account/orders/sample-id"),
  cart_url: absoluteUrl("/cart"),
  wishlist_url: absoluteUrl("/wishlist"),
  support_url: absoluteUrl("/account/support"),
  contact_url: absoluteUrl("/contact"),
  unsubscribe_url: absoluteUrl("/account/profile"),
  birthday_offer: "15% off your next order",
  campaign_name: "Monsoon Baby Care Sale",
  research_title: "Five Years of Baby Skin Research",
  research_url: absoluteUrl("/research"),
};

export function mergeSampleData(overrides?: Record<string, string>): Record<string, string> {
  return { ...BASE_SAMPLE_DATA, ...overrides };
}
