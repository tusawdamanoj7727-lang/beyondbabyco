import type { Page } from "@playwright/test";
import { test } from "@playwright/test";

type RazorpayMockMode = "success" | "dismiss" | "failed";

export async function installRazorpayMock(page: Page, mode: RazorpayMockMode = "success"): Promise<void> {
  await page.addInitScript((mockMode: RazorpayMockMode) => {
    window.Razorpay = class RazorpayMock {
      options: Record<string, unknown>;
      _handlers: Record<string, (payload: unknown) => void>;

      constructor(options: Record<string, unknown>) {
        this.options = options;
        this._handlers = {};
      }

      on(event: string, handler: (payload: unknown) => void) {
        this._handlers[event] = handler;
      }

      open() {
        if (mockMode === "success") {
          setTimeout(() => {
            const handler = this.options.handler as (payload: Record<string, string>) => void;
            handler?.({
              razorpay_payment_id: "pay_e2e_mock",
              razorpay_order_id: String(this.options.order_id),
              razorpay_signature: "sig_e2e_mock",
            });
          }, 50);
          return;
        }
        if (mockMode === "dismiss") {
          setTimeout(() => {
            const ondismiss = (this.options.modal as { ondismiss?: () => void } | undefined)?.ondismiss;
            ondismiss?.();
          }, 50);
          return;
        }
        if (mockMode === "failed") {
          setTimeout(() => {
            this._handlers["payment.failed"]?.({ error: { description: "Mock payment failed" } });
          }, 50);
        }
      }
    } as unknown as typeof window.Razorpay;
  }, mode);

  await page.route("**/checkout.razorpay.com/v1/checkout.js", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "// Razorpay mocked via addInitScript",
    });
  });

  if (mode === "success") {
    await page.route("**/api/verify-payment", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, data: { awb: null } }),
      });
    });
  }
}

/** Skip when server-side Razorpay order creation is unavailable (local env without gateway keys). */
export async function skipIfRazorpayOrderUnavailable(page: Page): Promise<void> {
  const bodyText = await page.locator("body").innerText();
  if (/Could not create Razorpay order|Payment gateway not configured|Payment could not be initialized/i.test(bodyText)) {
    test.skip(true, "Razorpay gateway not configured for order creation in this environment");
  }
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      on: (event: string, handler: (payload: unknown) => void) => void;
      open: () => void;
    };
  }
}
