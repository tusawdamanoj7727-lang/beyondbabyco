import type { Page } from "@playwright/test";

type RazorpayMockMode = "success" | "dismiss" | "failed";

export async function installRazorpayMock(page: Page, mode: RazorpayMockMode = "success"): Promise<void> {
  await page.route("**/checkout.razorpay.com/v1/checkout.js", async (route) => {
    const body = `
      window.Razorpay = class RazorpayMock {
        constructor(options) {
          this.options = options;
          this._handlers = {};
        }
        on(event, handler) {
          this._handlers[event] = handler;
        }
        open() {
          const mode = ${JSON.stringify(mode)};
          if (mode === "success") {
            setTimeout(() => {
              this.options.handler({
                razorpay_payment_id: "pay_e2e_mock",
                razorpay_order_id: this.options.order_id,
                razorpay_signature: "sig_e2e_mock",
              });
            }, 50);
            return;
          }
          if (mode === "dismiss") {
            setTimeout(() => {
              if (this.options.modal && typeof this.options.modal.ondismiss === "function") {
                this.options.modal.ondismiss();
              }
            }, 50);
            return;
          }
          if (mode === "failed") {
            setTimeout(() => {
              const handler = this._handlers["payment.failed"];
              if (handler) handler({ error: { description: "Mock payment failed" } });
            }, 50);
          }
        }
      };
    `;
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body,
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
