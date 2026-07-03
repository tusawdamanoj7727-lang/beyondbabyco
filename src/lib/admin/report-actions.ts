"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import type { Json } from "@/lib/supabase/database.types";
import {
  exportReportSchema,
  saveReportSchema,
  scheduleReportSchema,
  toggleScheduleSchema,
  widgetLayoutSchema,
} from "./report-schema";
import type { ExportFormat, ReportFilters } from "./report-types";

export interface ReportActionResult {
  ok: boolean;
  error: string | null;
  id?: string;
  content?: string;
  fileName?: string;
}

async function guardExport() {
  await requirePermission(PERMISSIONS.REPORTS_EXPORT);
}

async function guardManage() {
  await requirePermission(PERMISSIONS.ANALYTICS_MANAGE);
}

async function audit(table: string, record: string, action: string, payload?: Record<string, unknown>) {
  const supabase = await createSupabaseServerClient();
  await supabase.rpc("log_audit", {
    p_table: table,
    p_record: record,
    p_action: action,
    p_new: (payload ?? {}) as Json,
  });
}

function revalidateReports() {
  revalidatePath("/admin/reports");
  revalidatePath("/admin/analytics");
  revalidatePath("/admin/analytics/sales");
  revalidatePath("/admin/analytics/customers");
  revalidatePath("/admin/analytics/products");
  revalidatePath("/admin/analytics/marketing");
  revalidatePath("/admin/analytics/shipping");
  revalidatePath("/admin/analytics/payments");
  revalidatePath("/admin/analytics/reports");
}

function escapeCsv(value: string | number | null) {
  const s = value == null ? "" : String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowsToCsv(columns: { key: string; header: string }[], rows: Record<string, string | number | null>[]) {
  const header = columns.map((c) => escapeCsv(c.header)).join(",");
  const body = rows.map((r) => columns.map((c) => escapeCsv(r[c.key] ?? null)).join(",")).join("\n");
  return `${header}\n${body}`;
}

function rowsToExcelXml(columns: { key: string; header: string }[], rows: Record<string, string | number | null>[]) {
  const headerCells = columns.map((c) => `<Cell><Data ss:Type="String">${c.header}</Data></Cell>`).join("");
  const dataRows = rows
    .map((r) => {
      const cells = columns.map((c) => `<Cell><Data ss:Type="String">${r[c.key] ?? ""}</Data></Cell>`).join("");
      return `<Row>${cells}</Row>`;
    })
    .join("");
  return `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Report"><Table><Row>${headerCells}</Row>${dataRows}</Table></Worksheet></Workbook>`;
}

function rowsToPrintHtml(title: string, columns: { key: string; header: string }[], rows: Record<string, string | number | null>[]) {
  const th = columns.map((c) => `<th>${c.header}</th>`).join("");
  const tr = rows.map((r) => `<tr>${columns.map((c) => `<td>${r[c.key] ?? ""}</td>`).join("")}</tr>`).join("");
  return `<!DOCTYPE html><html><head><title>${title}</title><style>body{font-family:sans-serif;padding:24px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#f5f5f5}</style></head><body><h1>${title}</h1><table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></body></html>`;
}

export async function exportReport(input: {
  report_type: string;
  format: ExportFormat;
  filters?: ReportFilters;
  rows?: Record<string, string | number | null>[];
  columns?: { key: string; header: string }[];
}): Promise<ReportActionResult> {
  await guardExport();
  const parsed = exportReportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid export." };

  const { report_type, format, filters, rows, columns } = parsed.data;
  const cols = columns.length ? columns : Object.keys(rows[0] ?? {}).map((k) => ({ key: k, header: k }));
  const safeRows = rows.length ? rows : [{ message: "No data for selected filters." }];

  let content = "";
  let fileName = `${report_type}-${new Date().toISOString().slice(0, 10)}`;
  if (format === "csv") {
    content = rowsToCsv(cols, safeRows);
    fileName += ".csv";
  } else if (format === "excel") {
    content = rowsToExcelXml(cols, safeRows);
    fileName += ".xls";
  } else {
    content = rowsToPrintHtml(report_type, cols, safeRows);
    fileName += format === "pdf" ? ".html" : ".html";
  }

  const supabase = await createSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();
  const { data: rec } = await supabase
    .from("report_exports")
    .insert({
      report_type,
      format,
      status: "completed",
      row_count: safeRows.length,
      file_name: fileName,
      filters: filters as Json,
      created_by: user.user?.id ?? null,
    })
    .select("id")
    .single();

  if (rec) await audit("report_exports", rec.id, "export", { report_type, format });
  revalidateReports();
  return { ok: true, error: null, id: rec?.id, content, fileName };
}

export async function saveReport(input: {
  name: string;
  report_type: string;
  filters?: ReportFilters;
  widget_config?: Record<string, unknown>;
  layout?: { widgetKey: string; visible: boolean; sortOrder: number }[];
}): Promise<ReportActionResult> {
  await guardManage();
  const parsed = saveReportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid save." };

  const supabase = await createSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("saved_reports")
    .insert({
      name: parsed.data.name,
      report_type: parsed.data.report_type,
      filters: parsed.data.filters as Json,
      widget_config: parsed.data.widget_config as Json,
      layout: parsed.data.layout as Json,
      created_by: user.user?.id ?? null,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  await audit("saved_reports", data.id, "create");
  revalidateReports();
  return { ok: true, error: null, id: data.id };
}

export async function createScheduledReport(input: {
  name: string;
  report_type: string;
  frequency: string;
  email: string;
  format: string;
  filters?: ReportFilters;
  is_enabled?: boolean;
}): Promise<ReportActionResult> {
  await guardManage();
  const parsed = scheduleReportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid schedule." };

  const supabase = await createSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();
  const nextRun = new Date();
  nextRun.setDate(nextRun.getDate() + 1);

  const { data, error } = await supabase
    .from("scheduled_reports")
    .insert({
      name: parsed.data.name,
      report_type: parsed.data.report_type,
      frequency: parsed.data.frequency,
      email: parsed.data.email,
      format: parsed.data.format,
      filters: parsed.data.filters as Json,
      is_enabled: parsed.data.is_enabled,
      next_run_at: nextRun.toISOString(),
      created_by: user.user?.id ?? null,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  await audit("scheduled_reports", data.id, "create", { frequency: parsed.data.frequency });
  revalidateReports();
  return { ok: true, error: null, id: data.id };
}

export async function toggleScheduledReport(id: string, isEnabled: boolean): Promise<ReportActionResult> {
  await guardManage();
  const parsed = toggleScheduleSchema.safeParse({ id, is_enabled: isEnabled });
  if (!parsed.success) return { ok: false, error: "Invalid schedule." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("scheduled_reports")
    .update({ is_enabled: isEnabled, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await audit("scheduled_reports", id, isEnabled ? "enable" : "disable");
  revalidateReports();
  return { ok: true, error: null, id };
}

export async function saveDashboardLayout(input: {
  widgets: { widgetKey: string; visible: boolean; sortOrder: number }[];
}): Promise<ReportActionResult> {
  await guardManage();
  const parsed = widgetLayoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid layout." };

  const supabase = await createSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();
  const userId = user.user?.id;
  if (!userId) return { ok: false, error: "Not authenticated." };

  for (const w of parsed.data.widgets) {
    await supabase.from("dashboard_widgets").upsert({
      user_id: userId,
      widget_key: w.widgetKey,
      visible: w.visible,
      sort_order: w.sortOrder,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,widget_key" });
  }

  await audit("dashboard_widgets", userId, "update_layout", { count: parsed.data.widgets.length });
  revalidateReports();
  return { ok: true, error: null, id: userId };
}

export async function deleteSavedReport(id: string): Promise<ReportActionResult> {
  await guardManage();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("saved_reports").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit("saved_reports", id, "delete");
  revalidateReports();
  return { ok: true, error: null, id };
}
