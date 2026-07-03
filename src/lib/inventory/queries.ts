import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  computeStockStatus,
  type InventoryListItem,
  type StockDisplayStatus,
} from "@/lib/admin/inventory-types";

export interface PublicInventoryItem {
  id: string;
  variantId: string;
  warehouseId: string;
  available: number;
  reserved: number;
  reorderLevel: number;
  status: StockDisplayStatus;
}

export interface PublicWarehouse {
  id: string;
  name: string;
  code: string;
  city: string | null;
  country: string;
  isDefault: boolean;
}

export interface PublicSupplier {
  id: string;
  name: string;
  country: string | null;
}

export async function getInventory(opts?: { warehouseId?: string; variantId?: string }): Promise<PublicInventoryItem[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("inventory").select("id, product_variant_id, warehouse_id, quantity, reserved, reorder_level");
  if (opts?.warehouseId) query = query.eq("warehouse_id", opts.warehouseId);
  if (opts?.variantId) query = query.eq("product_variant_id", opts.variantId);
  const { data } = await query;

  return (data ?? []).map((r) => {
    const available = Math.max(0, r.quantity - r.reserved);
    return {
      id: r.id,
      variantId: r.product_variant_id,
      warehouseId: r.warehouse_id,
      available,
      reserved: r.reserved,
      reorderLevel: r.reorder_level,
      status: computeStockStatus(available, r.reorder_level, 0),
    };
  });
}

export async function getLowStockProducts(limit = 50): Promise<InventoryListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("inventory").select("id, quantity, reserved, reorder_level, updated_at, product_variant_id, warehouse_id");

  const variantIds = [...new Set((data ?? []).map((r) => r.product_variant_id))];
  const warehouseIds = [...new Set((data ?? []).map((r) => r.warehouse_id))];

  const { data: variants } = variantIds.length
    ? await supabase.from("product_variants").select("id, name, sku, product_id").in("id", variantIds)
    : { data: [] };
  const { data: warehouses } = warehouseIds.length
    ? await supabase.from("warehouses").select("id, name, code").in("id", warehouseIds)
    : { data: [] };
  const productIds = [...new Set((variants ?? []).map((v) => v.product_id))];
  const { data: products } = productIds.length
    ? await supabase.from("products").select("id, name").in("id", productIds)
    : { data: [] };

  const vMap = new Map((variants ?? []).map((v) => [v.id, v]));
  const wMap = new Map((warehouses ?? []).map((w) => [w.id, w]));
  const pMap = new Map((products ?? []).map((p) => [p.id, p]));

  return (data ?? [])
    .map((row) => {
      const variant = vMap.get(row.product_variant_id);
      const product = variant ? pMap.get(variant.product_id) : undefined;
      const warehouse = wMap.get(row.warehouse_id);
      const available = Math.max(0, row.quantity - row.reserved);
      return {
        id: row.id,
        productId: product?.id ?? variant?.product_id ?? "",
        productName: product?.name ?? "Unknown",
        variantId: variant?.id ?? row.product_variant_id,
        variantName: variant?.name ?? "Default",
        sku: variant?.sku ?? null,
        warehouseId: warehouse?.id ?? row.warehouse_id,
        warehouseName: warehouse?.name ?? "Unknown",
        warehouseCode: warehouse?.code ?? "",
        available,
        reserved: row.reserved,
        incoming: 0,
        reorderLevel: row.reorder_level,
        status: computeStockStatus(available, row.reorder_level, 0),
        updatedAt: row.updated_at,
      };
    })
    .filter((r) => r.status === "low_stock" || r.status === "out_of_stock")
    .slice(0, limit);
}

export async function getWarehouses(): Promise<PublicWarehouse[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("warehouses").select("id, name, code, city, country, is_default").eq("is_active", true).order("is_default", { ascending: false }).order("name", { ascending: true });
  return (data ?? []).map((w) => ({ id: w.id, name: w.name, code: w.code, city: w.city, country: w.country, isDefault: w.is_default }));
}

export async function getSuppliers(): Promise<PublicSupplier[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("suppliers").select("id, name, country").eq("is_active", true).order("name", { ascending: true });
  return (data ?? []).map((s) => ({ id: s.id, name: s.name, country: s.country }));
}
