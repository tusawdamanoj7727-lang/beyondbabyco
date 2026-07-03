import { describe, expect, it } from "vitest";

import { resolveQuickDateRange, detectQuickRange, filtersToQuery } from "@/lib/analytics/date-ranges";
import { getAnalyticsIntegrationStatuses, INTEGRATION_ADAPTERS } from "@/lib/analytics/integrations";
import { ANALYTICS_NAV, QUICK_DATE_RANGES } from "@/lib/analytics/types";

describe("analytics navigation", () => {
  it("defines analytics hub routes", () => {
    expect(ANALYTICS_NAV.map((n) => n.label)).toEqual([
      "Dashboard",
      "Sales",
      "Customers",
      "Products",
      "Marketing",
      "Shipping",
      "Payments",
      "Reports",
    ]);
  });
});

describe("date ranges", () => {
  it("resolves quick ranges", () => {
    const week = resolveQuickDateRange("7d");
    expect(week.dateFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(week.dateTo).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("serializes filters to query", () => {
    const q = filtersToQuery({ dateFrom: "2026-01-01", categoryId: "abc" });
    expect(q.dateFrom).toBe("2026-01-01");
    expect(q.categoryId).toBe("abc");
  });

  it("detects default range when empty", () => {
    expect(detectQuickRange({})).toBe("30d");
  });

  it("defines quick range presets", () => {
    expect(QUICK_DATE_RANGES.length).toBe(5);
  });
});

describe("external integrations", () => {
  it("prepares GA4, Meta, Clarity, and Search Console adapters", () => {
    const statuses = getAnalyticsIntegrationStatuses();
    expect(statuses).toHaveLength(4);
    for (const item of statuses) {
      expect(typeof item.connected).toBe("boolean");
      expect(typeof item.configured).toBe("boolean");
      expect(INTEGRATION_ADAPTERS[item.provider]).toBeDefined();
    }
  });
});
