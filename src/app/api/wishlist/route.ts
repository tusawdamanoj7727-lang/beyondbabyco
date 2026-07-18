import { NextResponse } from "next/server";

import { getStorefrontProductsByIds } from "@/lib/catalog/storefront";
import {
  listWishlistProductIds,
  removeWishlistProduct,
  toggleWishlistProduct,
} from "@/lib/storefront/wishlist-service";

export const dynamic = "force-dynamic";

/** GET /api/wishlist — cookie-authenticated wishlist product ids (+ optional products). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeProducts = searchParams.get("products") === "1";
  const ids = await listWishlistProductIds();

  if (!includeProducts) {
    return NextResponse.json({ ids });
  }

  const products = await getStorefrontProductsByIds(ids);
  return NextResponse.json({ ids, products });
}

/** POST /api/wishlist — toggle a product id in the wishlist. */
export async function POST(request: Request) {
  let productId = "";
  try {
    const body = (await request.json()) as { productId?: string; action?: string };
    productId = body.productId?.trim() ?? "";
    if (body.action === "remove") {
      const result = await removeWishlistProduct(productId);
      return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    }
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const result = await toggleWishlistProduct(productId);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
