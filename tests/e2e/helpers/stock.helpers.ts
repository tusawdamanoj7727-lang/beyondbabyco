import type { APIRequestContext } from "@playwright/test";

import { LAUNCH_PRODUCT_ID } from "./constants";
import { fetchProductInventory } from "./inventory.helpers";

/** Returns false when launch SKU has no sellable stock on the target environment. */
export async function launchProductHasStock(request: APIRequestContext): Promise<boolean> {
  const stock = await fetchProductInventory(request, LAUNCH_PRODUCT_ID);
  return stock.length > 0 && stock[0].available >= 1;
}

export const LAUNCH_PRODUCT_OUT_OF_STOCK_MESSAGE =
  "Launch product has no sellable stock on this environment — order placement tests require inventory";
