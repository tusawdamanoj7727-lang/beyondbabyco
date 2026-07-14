/** Playwright base URL — mirrors playwright.config.ts resolution. */
export function getPlaywrightBaseUrl(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://beyondbabyco.in";
  return process.env.PLAYWRIGHT_BASE_URL ?? siteUrl;
}

/** Launch product slug — stable across seed migrations. */
export const LAUNCH_PRODUCT_SLUG = "baby-wipes";

/** Launch product UUID — used for inventory API checks in E2E. */
export const LAUNCH_PRODUCT_ID = "7f9c7578-1d61-4130-a95a-917d938270db";

export const TEST_COUPON_CODE = "WELCOME10";

export const TEST_CUSTOMER = {
  fullName: "E2E Test User",
  get email() {
    return process.env.E2E_CUSTOMER_EMAIL ?? "";
  },
  get password() {
    return process.env.E2E_CUSTOMER_PASSWORD ?? "";
  },
  phone: "9876543210",
};

export const TEST_SHIPPING = {
  full_name: "E2E Test User",
  phone: "9876543210",
  line1: "12 Test Lane",
  line2: "Near City Mall",
  city: "Jaipur",
  state: "Rajasthan",
  pincode: "302001",
  country: "India",
};

export const FAKE_ORDER_ID = "00000000-0000-4000-8000-000000000001";
