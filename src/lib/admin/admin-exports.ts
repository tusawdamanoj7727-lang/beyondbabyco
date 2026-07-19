import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";

export type AdminExportFormat = "csv" | "excel";

function escapeCsv(value: string | number | null | undefined) {
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
  const headerCells = columns.map((c) => `<Cell><Data ss:Type="String">${escapeXml(c.header)}</Data></Cell>`).join("");
  const dataRows = rows
    .map((r) => {
      const cells = columns
        .map((c) => `<Cell><Data ss:Type="String">${escapeXml(String(r[c.key] ?? ""))}</Data></Cell>`)
        .join("");
      return `<Row>${cells}</Row>`;
    })
    .join("");
  return `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Export"><Table><Row>${headerCells}</Row>${dataRows}</Table></Worksheet></Workbook>`;
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function encode(format: AdminExportFormat, columns: { key: string; header: string }[], rows: Record<string, string | number | null>[]) {
  if (format === "excel") return rowsToExcelXml(columns, rows);
  return rowsToCsv(columns, rows);
}

export type AdminExportResult = {
  content: string;
  fileName: string;
  contentType: string;
};

function fileMeta(base: string, format: AdminExportFormat) {
  const stamp = new Date().toISOString().slice(0, 10);
  if (format === "excel") {
    return {
      fileName: `${base}-${stamp}.xls`,
      contentType: "application/vnd.ms-excel",
    };
  }
  return {
    fileName: `${base}-${stamp}.csv`,
    contentType: "text/csv; charset=utf-8",
  };
}

export async function exportOrdersAdmin(format: AdminExportFormat = "csv"): Promise<AdminExportResult> {
  await requirePermission(PERMISSIONS.REPORTS_EXPORT);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, status, grand_total, currency, created_at, customer_id")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw error;

  const orderIds = (data ?? []).map((o) => o.id);
  const customerIds = [...new Set((data ?? []).map((o) => o.customer_id).filter(Boolean))] as string[];
  const customers = new Map<string, string>();
  const payments = new Map<string, string>();
  if (customerIds.length) {
    const { data: cust } = await supabase.from("customers").select("id, email, full_name").in("id", customerIds);
    for (const c of cust ?? []) customers.set(c.id, c.full_name || c.email || c.id);
  }
  if (orderIds.length) {
    const { data: pays } = await supabase
      .from("payments")
      .select("order_id, status, method")
      .in("order_id", orderIds);
    for (const p of pays ?? []) {
      payments.set(p.order_id, `${p.method ?? "—"} / ${p.status}`);
    }
  }

  const columns = [
    { key: "order_number", header: "Order Number" },
    { key: "customer", header: "Customer" },
    { key: "status", header: "Status" },
    { key: "payment", header: "Payment" },
    { key: "grand_total", header: "Total" },
    { key: "currency", header: "Currency" },
    { key: "created_at", header: "Created At" },
  ];
  const rows = (data ?? []).map((o) => ({
    order_number: o.order_number,
    customer: o.customer_id ? customers.get(o.customer_id) ?? "" : "Guest",
    status: o.status,
    payment: payments.get(o.id) ?? "",
    grand_total: o.grand_total,
    currency: o.currency ?? "INR",
    created_at: o.created_at,
  }));

  const meta = fileMeta("orders", format);
  await supabase.rpc("log_audit", {
    p_table: "orders",
    p_record: "export",
    p_action: "export",
    p_new: { format, rows: rows.length },
  });
  return { content: encode(format, columns, rows), ...meta };
}

export async function exportProductsAdmin(format: AdminExportFormat = "csv"): Promise<AdminExportResult> {
  await requirePermission(PERMISSIONS.REPORTS_EXPORT);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("name, slug, status, price, compare_at_price, sku, created_at")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(5000);
  if (error) throw error;

  const columns = [
    { key: "name", header: "Name" },
    { key: "slug", header: "Slug" },
    { key: "sku", header: "SKU" },
    { key: "status", header: "Status" },
    { key: "price", header: "Price" },
    { key: "compare_at_price", header: "Compare At" },
    { key: "created_at", header: "Created At" },
  ];
  const rows = (data ?? []).map((p) => ({
    name: p.name,
    slug: p.slug,
    sku: p.sku ?? "",
    status: p.status,
    price: p.price,
    compare_at_price: p.compare_at_price,
    created_at: p.created_at,
  }));
  const meta = fileMeta("products", format);
  await supabase.rpc("log_audit", {
    p_table: "products",
    p_record: "export",
    p_action: "export",
    p_new: { format, rows: rows.length },
  });
  return { content: encode(format, columns, rows), ...meta };
}

export async function exportInventoryAdmin(format: AdminExportFormat = "csv"): Promise<AdminExportResult> {
  await requirePermission(PERMISSIONS.REPORTS_EXPORT);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("inventory")
    .select("product_variant_id, warehouse_id, quantity, reserved, reorder_level, updated_at")
    .order("updated_at", { ascending: false })
    .limit(5000);
  if (error) throw error;

  const variantIds = [...new Set((data ?? []).map((i) => i.product_variant_id).filter(Boolean))] as string[];
  const warehouseIds = [...new Set((data ?? []).map((i) => i.warehouse_id).filter(Boolean))] as string[];
  const variantLabels = new Map<string, string>();
  const warehouseNames = new Map<string, string>();
  if (variantIds.length) {
    const { data: variants } = await supabase
      .from("product_variants")
      .select("id, sku, name, product_id")
      .in("id", variantIds);
    const productIds = [...new Set((variants ?? []).map((v) => v.product_id).filter(Boolean))] as string[];
    const productNames = new Map<string, string>();
    if (productIds.length) {
      const { data: products } = await supabase.from("products").select("id, name").in("id", productIds);
      for (const p of products ?? []) productNames.set(p.id, p.name);
    }
    for (const v of variants ?? []) {
      const productName = productNames.get(v.product_id) ?? "Product";
      variantLabels.set(v.id, `${productName}${v.sku ? ` (${v.sku})` : v.name ? ` — ${v.name}` : ""}`);
    }
  }
  if (warehouseIds.length) {
    const { data: wh } = await supabase.from("warehouses").select("id, name").in("id", warehouseIds);
    for (const w of wh ?? []) warehouseNames.set(w.id, w.name);
  }

  const columns = [
    { key: "product", header: "Product / Variant" },
    { key: "warehouse", header: "Warehouse" },
    { key: "quantity", header: "On Hand" },
    { key: "reserved", header: "Reserved" },
    { key: "available", header: "Available" },
    { key: "reorder_level", header: "Reorder Level" },
    { key: "updated_at", header: "Updated At" },
  ];
  const rows = (data ?? []).map((i) => {
    const qty = Number(i.quantity);
    const reserved = Number(i.reserved);
    return {
      product: variantLabels.get(i.product_variant_id) ?? i.product_variant_id,
      warehouse: i.warehouse_id ? warehouseNames.get(i.warehouse_id) ?? i.warehouse_id : "",
      quantity: qty,
      reserved,
      available: qty - reserved,
      reorder_level: i.reorder_level,
      updated_at: i.updated_at,
    };
  });
  const meta = fileMeta("inventory", format);
  await supabase.rpc("log_audit", {
    p_table: "inventory",
    p_record: "export",
    p_action: "export",
    p_new: { format, rows: rows.length },
  });
  return { content: encode(format, columns, rows), ...meta };
}

export async function exportCouponsAdmin(format: AdminExportFormat = "csv"): Promise<AdminExportResult> {
  await requirePermission(PERMISSIONS.REPORTS_EXPORT);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("coupons")
    .select("code, name, promo_type, value, is_active, lifecycle_status, used_count, max_uses, total_revenue, starts_at, expires_at")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(2000);
  if (error) throw error;

  const columns = [
    { key: "code", header: "Code" },
    { key: "name", header: "Name" },
    { key: "promo_type", header: "Type" },
    { key: "value", header: "Value" },
    { key: "is_active", header: "Active" },
    { key: "lifecycle_status", header: "Lifecycle" },
    { key: "used_count", header: "Uses" },
    { key: "max_uses", header: "Max Uses" },
    { key: "total_revenue", header: "Revenue" },
    { key: "starts_at", header: "Starts" },
    { key: "expires_at", header: "Expires" },
  ];
  const rows = (data ?? []).map((c) => ({
    code: c.code,
    name: c.name ?? "",
    promo_type: c.promo_type,
    value: c.value,
    is_active: c.is_active ? "yes" : "no",
    lifecycle_status: c.lifecycle_status ?? "",
    used_count: c.used_count ?? 0,
    max_uses: c.max_uses,
    total_revenue: c.total_revenue ?? 0,
    starts_at: c.starts_at,
    expires_at: c.expires_at,
  }));
  const meta = fileMeta("coupons", format);
  await supabase.rpc("log_audit", {
    p_table: "coupons",
    p_record: "export",
    p_action: "export",
    p_new: { format, rows: rows.length },
  });
  return { content: encode(format, columns, rows), ...meta };
}
