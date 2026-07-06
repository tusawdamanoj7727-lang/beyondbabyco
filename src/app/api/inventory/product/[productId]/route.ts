import { NextResponse } from "next/server";

import { getProductVariantStock } from "@/lib/inventory/storefront-stock";

export async function GET(
  _request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  const { productId } = await context.params;

  if (!productId) {
    return NextResponse.json({ error: "Product id required" }, { status: 400 });
  }

  try {
    const stock = await getProductVariantStock(productId);
    return NextResponse.json(stock);
  } catch {
    return NextResponse.json({ error: "Could not load stock" }, { status: 500 });
  }
}
