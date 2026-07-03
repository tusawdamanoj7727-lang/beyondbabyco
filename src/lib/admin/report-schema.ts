import { z } from "zod";

import { DASHBOARD_WIDGET_KEYS, EXPORT_FORMATS, REPORT_FREQUENCIES } from "./report-types";

const optionalUuid = z.string().uuid().optional().nullable();
const optionalText = z.string().trim().max(200).optional().nullable();

export const reportFiltersSchema = z.object({
  dateFrom: optionalText,
  dateTo: optionalText,
  warehouseId: optionalUuid,
  categoryId: optionalUuid,
  brandId: optionalUuid,
  productId: optionalUuid,
  customerId: optionalUuid,
  carrierId: optionalUuid,
  gatewayId: optionalUuid,
  couponId: optionalUuid,
  country: optionalText,
  state: optionalText,
});

export const exportReportSchema = z.object({
  report_type: z.string().min(1).max(100),
  format: z.enum(EXPORT_FORMATS),
  filters: reportFiltersSchema.default({}),
  rows: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.null()]))).default([]),
  columns: z.array(z.object({ key: z.string(), header: z.string() })).default([]),
});

export const saveReportSchema = z.object({
  name: z.string().trim().min(1).max(200),
  report_type: z.string().min(1).max(100),
  filters: reportFiltersSchema.default({}),
  widget_config: z.record(z.string(), z.unknown()).default({}),
  layout: z.array(z.object({ widgetKey: z.enum(DASHBOARD_WIDGET_KEYS), visible: z.boolean(), sortOrder: z.number() })).default([]),
});

export const scheduleReportSchema = z.object({
  name: z.string().trim().min(1).max(200),
  report_type: z.string().min(1).max(100),
  frequency: z.enum(REPORT_FREQUENCIES),
  email: z.string().email(),
  format: z.enum(["csv", "excel", "pdf"]),
  filters: reportFiltersSchema.default({}),
  is_enabled: z.boolean().default(true),
});

export const widgetLayoutSchema = z.object({
  widgets: z.array(z.object({
    widgetKey: z.enum(DASHBOARD_WIDGET_KEYS),
    visible: z.boolean(),
    sortOrder: z.number().int(),
  })).min(1),
});

export const toggleScheduleSchema = z.object({
  id: z.string().uuid(),
  is_enabled: z.boolean(),
});
