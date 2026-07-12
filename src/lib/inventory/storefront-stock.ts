import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type VariantStockRow = {
  variantId: string;
  available: number;
};

async function defaultWarehouseId(): Promise<string | null> {
  const supabase = createSupabaseServiceClient();
  const { data } = await supabase
    .from("warehouses")
    .select("id")
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

/** Sellable quantity (quantity - reserved) per variant at the default warehouse. */
export async function getVariantAvailableStock(
  variantIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (variantIds.length === 0) return map;

  const warehouseId = await defaultWarehouseId();
  if (!warehouseId) {
    for (const id of variantIds) map.set(id, 0);
    return map;
  }

  const supabase = createSupabaseServiceClient();
  const { data } = await supabase
    .from("inventory")
    .select("product_variant_id, quantity, reserved")
    .eq("warehouse_id", warehouseId)
    .in("product_variant_id", variantIds);

  for (const id of variantIds) map.set(id, 0);
  for (const row of data ?? []) {
    map.set(row.product_variant_id, Math.max(0, row.quantity - row.reserved));
  }
  return map;
}

/** Unified in-stock + sellable quantity from inventory rows (quantity - reserved). */
export function resolveStorefrontAvailability(input: {
  slug: string;
  status: string;
  productStock: number;
  variantStocks: number[];
}): { inStock: boolean; totalStock: number } {
  const totalStock = input.variantStocks.reduce((sum, qty) => sum + qty, 0);
  const inStock = input.status === "active" && totalStock > 0;
  return { inStock, totalStock };
}

export type OrderStockLine = {
  variantId: string;
  quantity: number;
};

export const OUT_OF_STOCK_MESSAGE = "Sorry, this item just went out of stock!";

/** Atomically reserve stock for a single variant (uses DB row lock). */
export async function checkAndReserveStock(
  variantId: string,
  quantity: number,
): Promise<boolean> {
  if (!variantId || quantity <= 0) return false;

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.rpc("check_and_reserve_stock", {
    p_variant_id: variantId,
    p_qty: quantity,
  });

  return !error && Boolean(data);
}

export async function decrementOrderStock(
  lines: OrderStockLine[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const validLines = lines.filter((l) => l.variantId && l.quantity > 0);
  if (validLines.length === 0) {
    return { ok: false, error: "No valid line items for stock decrement." };
  }

  const reserved: OrderStockLine[] = [];

  for (const line of validLines) {
    const ok = await checkAndReserveStock(line.variantId, line.quantity);
    if (!ok) {
      if (reserved.length > 0) {
        await restoreOrderStock(reserved);
      }
      return { ok: false, error: OUT_OF_STOCK_MESSAGE };
    }
    reserved.push(line);
  }

  return { ok: true };
}

export async function restoreOrderStock(lines: OrderStockLine[]): Promise<void> {
  const supabase = createSupabaseServiceClient();
  for (const line of lines) {
    if (!line.variantId || line.quantity <= 0) continue;
    await supabase.rpc("restore_stock", {
      p_variant_id: line.variantId,
      p_quantity: line.quantity,
    });
  }
}

export async function getProductVariantStock(productId: string): Promise<{
  variants: VariantStockRow[];
  totalAvailable: number;
  inStock: boolean;
  status: string;
}> {
  const supabase = createSupabaseServiceClient();
  const { data: product } = await supabase
    .from("products")
    .select("status, slug, stock")
    .eq("id", productId)
    .maybeSingle();

  const { data: variantRows } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", productId)
    .eq("is_active", true);

  const variantIds = (variantRows ?? []).map((v) => v.id);
  const stockMap = await getVariantAvailableStock(variantIds);
  const variants = variantIds.map((id) => ({
    variantId: id,
    available: stockMap.get(id) ?? 0,
  }));
  const status = product?.status ?? "draft";
  const availability = resolveStorefrontAvailability({
    slug: product?.slug ?? "",
    status,
    productStock: product?.stock ?? 0,
    variantStocks: variants.map((v) => v.available),
  });

  const totalAvailable = variants.reduce((sum, v) => sum + v.available, 0);

  return {
    variants,
    totalAvailable,
    inStock: availability.inStock,
    status,
  };
}
