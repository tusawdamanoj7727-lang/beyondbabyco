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

export function productInStockFromVariants(
  status: string,
  variantStock: Iterable<number>,
): boolean {
  if (status !== "active") return false;
  for (const qty of variantStock) {
    if (qty > 0) return true;
  }
  return false;
}

export type OrderStockLine = {
  variantId: string;
  quantity: number;
};

export async function decrementOrderStock(
  lines: OrderStockLine[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createSupabaseServiceClient();
  const payload = lines
    .filter((l) => l.variantId && l.quantity > 0)
    .map((l) => ({ variant_id: l.variantId, quantity: l.quantity }));

  if (payload.length === 0) {
    return { ok: false, error: "No valid line items for stock decrement." };
  }

  const { data, error } = await supabase.rpc("decrement_order_lines", {
    p_lines: payload,
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data) {
    return { ok: false, error: "Item is out of stock" };
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
    .select("status")
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
  const totalAvailable = variants.reduce((sum, v) => sum + v.available, 0);
  const status = product?.status ?? "draft";

  return {
    variants,
    totalAvailable,
    inStock: productInStockFromVariants(status, variants.map((v) => v.available)),
    status,
  };
}
