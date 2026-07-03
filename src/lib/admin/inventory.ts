import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  computeStockStatus,
  type InventoryDashboard,
  type InventoryListItem,
  type InventorySortColumn,
  type MovementType,
  type PurchaseOrderListItem,
  type StockMovementItem,
  type StockStatusFilter,
} from "./inventory-types";
import type { PoStatus } from "@/lib/supabase/database.types";

export interface InventoryListParams {
  search?: string;
  warehouseId?: string;
  productId?: string;
  stockStatus?: StockStatusFilter;
  sort?: InventorySortColumn;
  dir?: "asc" | "desc";
  page?: number;
  perPage?: number;
}

export interface InventoryListResult {
  rows: InventoryListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

async function loadVariants(ids: string[]) {
  const map = new Map<string, { id: string; name: string; sku: string | null; product_id: string; price: number | null }>();
  if (!ids.length) return map;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("product_variants").select("id, name, sku, product_id, price").in("id", ids);
  for (const v of data ?? []) map.set(v.id, v);
  return map;
}

async function loadProducts(ids: string[]) {
  const map = new Map<string, { id: string; name: string }>();
  if (!ids.length) return map;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("products").select("id, name").in("id", ids);
  for (const p of data ?? []) map.set(p.id, p);
  return map;
}

async function loadWarehouses(ids: string[]) {
  const map = new Map<string, { id: string; name: string; code: string }>();
  if (!ids.length) return map;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("warehouses").select("id, name, code").in("id", ids);
  for (const w of data ?? []) map.set(w.id, w);
  return map;
}

async function loadSuppliers(ids: string[]) {
  const map = new Map<string, { id: string; name: string }>();
  if (!ids.length) return map;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("suppliers").select("id, name").in("id", ids);
  for (const s of data ?? []) map.set(s.id, s);
  return map;
}

/** Sum outstanding PO quantities keyed by variant + warehouse. */
async function incomingMap(): Promise<Map<string, number>> {
  const supabase = await createSupabaseServerClient();
  const { data: pos } = await supabase.from("purchase_orders").select("id, warehouse_id, status").eq("status", "sent");
  if (!pos?.length) return new Map();

  const poWarehouse = new Map(pos.map((p) => [p.id, p.warehouse_id]));
  const { data: items } = await supabase
    .from("purchase_order_items")
    .select("purchase_order_id, product_variant_id, quantity, quantity_received")
    .in("purchase_order_id", pos.map((p) => p.id));

  const map = new Map<string, number>();
  for (const item of items ?? []) {
    const wh = poWarehouse.get(item.purchase_order_id);
    if (!wh) continue;
    const pending = Math.max(0, item.quantity - (item.quantity_received ?? 0));
    if (pending <= 0) continue;
    const key = `${item.product_variant_id}:${wh}`;
    map.set(key, (map.get(key) ?? 0) + pending);
  }
  return map;
}

function incomingFor(map: Map<string, number>, variantId: string, warehouseId: string): number {
  return map.get(`${variantId}:${warehouseId}`) ?? 0;
}

export async function listInventory(params: InventoryListParams): Promise<InventoryListResult> {
  const supabase = await createSupabaseServerClient();
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(5, params.perPage ?? 20));
  const incoming = await incomingMap();

  let query = supabase.from("inventory").select("id, quantity, reserved, reorder_level, updated_at, product_variant_id, warehouse_id");
  if (params.warehouseId) query = query.eq("warehouse_id", params.warehouseId);

  const { data, error } = await query;
  if (error) throw error;

  const variantIds = [...new Set((data ?? []).map((r) => r.product_variant_id))];
  const warehouseIds = [...new Set((data ?? []).map((r) => r.warehouse_id))];
  const variants = await loadVariants(variantIds);
  const warehouses = await loadWarehouses(warehouseIds);
  const products = await loadProducts([...new Set([...variants.values()].map((v) => v.product_id))]);

  let rows: InventoryListItem[] = (data ?? []).map((row) => {
    const variant = variants.get(row.product_variant_id);
    const product = variant ? products.get(variant.product_id) : undefined;
    const warehouse = warehouses.get(row.warehouse_id);
    const available = Math.max(0, row.quantity - row.reserved);
    const inc = incomingFor(incoming, row.product_variant_id, row.warehouse_id);

    return {
      id: row.id,
      productId: product?.id ?? variant?.product_id ?? "",
      productName: product?.name ?? "Unknown product",
      variantId: variant?.id ?? row.product_variant_id,
      variantName: variant?.name ?? "Default",
      sku: variant?.sku ?? null,
      warehouseId: warehouse?.id ?? row.warehouse_id,
      warehouseName: warehouse?.name ?? "Unknown",
      warehouseCode: warehouse?.code ?? "",
      available,
      reserved: row.reserved,
      incoming: inc,
      reorderLevel: row.reorder_level,
      status: computeStockStatus(available, row.reorder_level, inc),
      updatedAt: row.updated_at,
    };
  });

  if (params.search?.trim()) {
    const q = params.search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.productName.toLowerCase().includes(q) ||
        r.variantName.toLowerCase().includes(q) ||
        (r.sku?.toLowerCase().includes(q) ?? false),
    );
  }
  if (params.productId) rows = rows.filter((r) => r.productId === params.productId);
  if (params.stockStatus && params.stockStatus !== "all") rows = rows.filter((r) => r.status === params.stockStatus);

  const sort = params.sort ?? "updated_at";
  const dir = params.dir ?? "desc";
  const mul = dir === "asc" ? 1 : -1;
  rows.sort((a, b) => {
    switch (sort) {
      case "product": return mul * a.productName.localeCompare(b.productName);
      case "variant": return mul * a.variantName.localeCompare(b.variantName);
      case "warehouse": return mul * a.warehouseName.localeCompare(b.warehouseName);
      case "quantity": return mul * (a.available - b.available);
      default: return mul * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
    }
  });

  const total = rows.length;
  const from = (page - 1) * perPage;
  return {
    rows: rows.slice(from, from + perPage),
    total,
    page,
    perPage,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getInventoryDashboard(): Promise<InventoryDashboard> {
  const supabase = await createSupabaseServerClient();
  const incoming = await incomingMap();
  const { data: invRows } = await supabase.from("inventory").select("quantity, reserved, reorder_level, product_variant_id, warehouse_id");

  const variants = await loadVariants([...new Set((invRows ?? []).map((r) => r.product_variant_id))]);

  let totalStockValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const row of invRows ?? []) {
    const variant = variants.get(row.product_variant_id);
    const price = Number(variant?.price ?? 0);
    const available = Math.max(0, row.quantity - row.reserved);
    totalStockValue += available * price;
    const inc = incomingFor(incoming, row.product_variant_id, row.warehouse_id);
    const status = computeStockStatus(available, row.reorder_level, inc);
    if (status === "low_stock") lowStockCount++;
    if (status === "out_of_stock") outOfStockCount++;
  }

  const { count: incomingShipments } = await supabase.from("purchase_orders").select("id", { count: "exact", head: true }).eq("status", "sent");
  const { movements } = await listStockMovements({ type: "adjustment", perPage: 5 });

  return { totalStockValue, lowStockCount, outOfStockCount, incomingShipments: incomingShipments ?? 0, recentAdjustments: movements };
}

export async function listStockMovements(params: {
  search?: string;
  type?: MovementType | "all";
  page?: number;
  perPage?: number;
}): Promise<{ movements: StockMovementItem[]; total: number; page: number; pageCount: number }> {
  const supabase = await createSupabaseServerClient();
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(5, params.perPage ?? 20));

  let query = supabase.from("stock_movements").select("id, inventory_id, type, quantity, reference, reason, note, created_at, created_by", { count: "exact" });
  if (params.type && params.type !== "all") query = query.eq("type", params.type);

  const { data, count, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;

  const invIds = [...new Set((data ?? []).map((m) => m.inventory_id))];
  const { data: invRows } = invIds.length
    ? await supabase.from("inventory").select("id, product_variant_id, warehouse_id").in("id", invIds)
    : { data: [] };

  const invMap = new Map((invRows ?? []).map((i) => [i.id, i]));
  const variants = await loadVariants([...new Set((invRows ?? []).map((i) => i.product_variant_id))]);
  const warehouses = await loadWarehouses([...new Set((invRows ?? []).map((i) => i.warehouse_id))]);
  const products = await loadProducts([...new Set([...variants.values()].map((v) => v.product_id))]);

  const userIds = [...new Set((data ?? []).map((m) => m.created_by).filter(Boolean))] as string[];
  const nameMap = new Map<string, string>();
  if (userIds.length) {
    const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
    for (const p of profiles ?? []) nameMap.set(p.id, p.full_name ?? "Staff");
  }

  let movements: StockMovementItem[] = (data ?? []).map((m) => {
    const inv = invMap.get(m.inventory_id);
    const variant = inv ? variants.get(inv.product_variant_id) : undefined;
    const product = variant ? products.get(variant.product_id) : undefined;
    const warehouse = inv ? warehouses.get(inv.warehouse_id) : undefined;
    return {
      id: m.id,
      inventoryId: m.inventory_id,
      type: m.type as MovementType,
      quantity: m.quantity,
      reference: m.reference,
      reason: m.reason,
      note: m.note,
      productName: product?.name ?? "—",
      variantName: variant?.name ?? "—",
      warehouseName: warehouse?.name ?? "—",
      userName: m.created_by ? (nameMap.get(m.created_by) ?? null) : null,
      createdAt: m.created_at,
    };
  });

  if (params.search?.trim()) {
    const q = params.search.trim().toLowerCase();
    movements = movements.filter(
      (m) =>
        m.productName.toLowerCase().includes(q) ||
        m.variantName.toLowerCase().includes(q) ||
        m.warehouseName.toLowerCase().includes(q),
    );
  }

  const total = params.search?.trim() ? movements.length : (count ?? movements.length);
  const from = (page - 1) * perPage;
  return { movements: movements.slice(from, from + perPage), total, page, pageCount: Math.max(1, Math.ceil(total / perPage)) };
}

export async function listPurchaseOrders(params: {
  status?: PoStatus | "all";
  page?: number;
  perPage?: number;
}): Promise<{ rows: PurchaseOrderListItem[]; total: number; page: number; pageCount: number }> {
  const supabase = await createSupabaseServerClient();
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(50, Math.max(5, params.perPage ?? 10));
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase.from("purchase_orders").select("id, po_number, supplier_id, warehouse_id, status, total, expected_at, received_at, created_at", { count: "exact" });
  if (params.status && params.status !== "all") query = query.eq("status", params.status);

  const { data, count, error } = await query.order("created_at", { ascending: false }).range(from, to);
  if (error) throw error;

  const poIds = (data ?? []).map((p) => p.id);
  const { data: itemCounts } = poIds.length
    ? await supabase.from("purchase_order_items").select("purchase_order_id").in("purchase_order_id", poIds)
    : { data: [] };

  const countMap = new Map<string, number>();
  for (const it of itemCounts ?? []) {
    countMap.set(it.purchase_order_id, (countMap.get(it.purchase_order_id) ?? 0) + 1);
  }

  const suppliers = await loadSuppliers([...new Set((data ?? []).map((p) => p.supplier_id).filter(Boolean))] as string[]);
  const warehouses = await loadWarehouses([...new Set((data ?? []).map((p) => p.warehouse_id).filter(Boolean))] as string[]);

  const rows: PurchaseOrderListItem[] = (data ?? []).map((po) => ({
    id: po.id,
    poNumber: po.po_number,
    supplierName: po.supplier_id ? suppliers.get(po.supplier_id)?.name ?? null : null,
    warehouseName: po.warehouse_id ? warehouses.get(po.warehouse_id)?.name ?? null : null,
    status: po.status as PoStatus,
    total: Number(po.total),
    itemCount: countMap.get(po.id) ?? 0,
    expectedAt: po.expected_at,
    receivedAt: po.received_at,
    createdAt: po.created_at,
  }));

  const total = count ?? 0;
  return { rows, total, page, pageCount: Math.max(1, Math.ceil(total / perPage)) };
}

export interface PoDetail {
  id: string;
  poNumber: string;
  status: PoStatus;
  supplierId: string | null;
  warehouseId: string | null;
  total: number;
  expectedAt: string | null;
  receivedAt: string | null;
  notes: string | null;
  items: {
    id: string;
    variantId: string;
    variantName: string;
    productName: string;
    sku: string | null;
    quantity: number;
    quantityReceived: number;
    unitCost: number;
  }[];
}

export async function getPurchaseOrder(id: string): Promise<PoDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data: po } = await supabase.from("purchase_orders").select("*").eq("id", id).maybeSingle();
  if (!po) return null;

  const { data: items } = await supabase
    .from("purchase_order_items")
    .select("id, product_variant_id, quantity, quantity_received, unit_cost")
    .eq("purchase_order_id", id);

  const variants = await loadVariants([...new Set((items ?? []).map((i) => i.product_variant_id))]);
  const products = await loadProducts([...new Set([...variants.values()].map((v) => v.product_id))]);

  return {
    id: po.id,
    poNumber: po.po_number,
    status: po.status as PoStatus,
    supplierId: po.supplier_id,
    warehouseId: po.warehouse_id,
    total: Number(po.total),
    expectedAt: po.expected_at,
    receivedAt: po.received_at,
    notes: po.notes,
    items: (items ?? []).map((it) => {
      const v = variants.get(it.product_variant_id);
      const p = v ? products.get(v.product_id) : undefined;
      return {
        id: it.id,
        variantId: it.product_variant_id,
        variantName: v?.name ?? "—",
        productName: p?.name ?? "—",
        sku: v?.sku ?? null,
        quantity: it.quantity,
        quantityReceived: it.quantity_received ?? 0,
        unitCost: Number(it.unit_cost),
      };
    }),
  };
}

export interface VariantOption {
  id: string;
  label: string;
  productId: string;
  productName: string;
  sku: string | null;
}

export async function getVariantOptions(search = ""): Promise<VariantOption[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("product_variants").select("id, name, sku, product_id").eq("is_active", true).order("name", { ascending: true }).limit(200);
  const products = await loadProducts([...new Set((data ?? []).map((v) => v.product_id))]);

  let rows = (data ?? []).map((v) => {
    const product = products.get(v.product_id);
    return {
      id: v.id,
      label: `${product?.name ?? "Product"} — ${v.name}${v.sku ? ` (${v.sku})` : ""}`,
      productId: v.product_id,
      productName: product?.name ?? "Product",
      sku: v.sku,
    };
  });

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter((r) => r.label.toLowerCase().includes(q) || r.productName.toLowerCase().includes(q) || (r.sku?.toLowerCase().includes(q) ?? false));
  }
  return rows;
}

export async function getProductOptions(): Promise<{ id: string; name: string }[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("products").select("id, name").in("status", ["active", "coming_soon"]).order("name", { ascending: true });
  return data ?? [];
}

export async function getInventoryRow(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("inventory").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function ensureInventoryRecord(variantId: string, warehouseId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase.from("inventory").select("id").eq("product_variant_id", variantId).eq("warehouse_id", warehouseId).maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("inventory")
    .insert({ product_variant_id: variantId, warehouse_id: warehouseId, quantity: 0, reserved: 0 })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not create inventory record.");
  return data.id;
}
