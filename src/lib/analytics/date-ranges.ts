import type { QuickDateRangeId } from "./types";
import type { ReportFilters } from "@/lib/admin/report-types";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function resolveQuickDateRange(id: QuickDateRangeId): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const today = isoDate(now);

  switch (id) {
    case "today":
      return { dateFrom: today, dateTo: today };
    case "7d": {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      return { dateFrom: isoDate(from), dateTo: today };
    }
    case "30d": {
      const from = new Date(now);
      from.setDate(from.getDate() - 29);
      return { dateFrom: isoDate(from), dateTo: today };
    }
    case "month": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { dateFrom: isoDate(from), dateTo: today };
    }
    case "custom":
    default:
      return { dateFrom: today, dateTo: today };
  }
}

export function filtersToQuery(filters: ReportFilters): Record<string, string> {
  const q: Record<string, string> = {};
  for (const [k, v] of Object.entries(filters)) {
    if (v) q[k] = String(v);
  }
  return q;
}

export function detectQuickRange(filters: ReportFilters): QuickDateRangeId {
  if (!filters.dateFrom && !filters.dateTo) return "30d";
  const resolved = resolveQuickDateRange("7d");
  if (filters.dateFrom === resolved.dateFrom && filters.dateTo === resolved.dateTo) return "7d";
  const month = resolveQuickDateRange("month");
  if (filters.dateFrom === month.dateFrom) return "month";
  return "custom";
}
