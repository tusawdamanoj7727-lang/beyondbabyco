import { describe, expect, it } from "vitest";

import {
  ALL_EMAIL_TEMPLATES,
  EMAIL_TEMPLATE_COUNTS,
  NOTIFICATION_TEMPLATES,
  getEmailTemplate,
  renderEmailTemplate,
  renderNotificationChannel,
  interpolate,
} from "@/lib/communications";
import { categoryForType, NOTIFICATION_CATEGORY_LABELS } from "@/lib/storefront/notifications";
import { PROVIDER_ADAPTERS } from "@/lib/communications/adapters";

describe("communications email templates", () => {
  it("registers all required template counts", () => {
    expect(EMAIL_TEMPLATE_COUNTS.account).toBe(7);
    expect(EMAIL_TEMPLATE_COUNTS.order).toBe(15);
    expect(EMAIL_TEMPLATE_COUNTS.delivery).toBe(9);
    expect(EMAIL_TEMPLATE_COUNTS.marketing).toBe(11);
    expect(EMAIL_TEMPLATE_COUNTS.total).toBe(42);
    expect(ALL_EMAIL_TEMPLATES.length).toBe(42);
  });

  it("renders branded email HTML with subject and body", () => {
    const tpl = getEmailTemplate("order-confirmation");
    expect(tpl).toBeDefined();
    const rendered = renderEmailTemplate(tpl!, tpl!.sampleData);
    expect(rendered.subject).toContain("BBC-2026");
    expect(rendered.html).toContain("BeyondBabyCo");
    expect(rendered.html).toContain("Dermatologically Tested");
    expect(rendered.html).toContain("care@beyondbabyco.com");
    expect(rendered.text.length).toBeGreaterThan(20);
  });

  it("interpolates placeholders", () => {
    expect(interpolate("Hello {{customer_name}}", { customer_name: "Priya" })).toBe("Hello Priya");
  });

  it("every template has unique id", () => {
    const ids = ALL_EMAIL_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("multi-channel notifications", () => {
  it("defines notification templates", () => {
    expect(NOTIFICATION_TEMPLATES.length).toBeGreaterThanOrEqual(10);
  });

  it("renders push channel preview", () => {
    const preview = renderNotificationChannel("order-placed", "push");
    expect(preview).not.toBeNull();
    expect(preview!.title).toContain("Order");
  });

  it("maps notification types to categories", () => {
    expect(categoryForType("payment_success")).toBe("payments");
    expect(categoryForType("shipment_dispatched")).toBe("delivery");
    expect(Object.keys(NOTIFICATION_CATEGORY_LABELS)).toHaveLength(7);
  });
});

describe("provider adapters", () => {
  it("prepared adapters return not-configured without sending", async () => {
    const resend = new PROVIDER_ADAPTERS.email.resend();
    const result = await resend.send({
      to: "test@example.com",
      subject: "Test",
      html: "<p>Test</p>",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("not configured");
  });
});
