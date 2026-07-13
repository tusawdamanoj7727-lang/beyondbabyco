import { uuidSchema } from "@/lib/api/schemas";
import { handleApiError, jsonError, jsonOk } from "@/lib/api/route-helpers";
import { getProductVariantStock } from "@/lib/inventory/storefront-stock";

export async function GET(
  _request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  const { productId } = await context.params;

  const parsed = uuidSchema.safeParse(productId);
  if (!parsed.success) {
    return jsonError("Invalid product id", 400);
  }

  try {
    const stock = await getProductVariantStock(parsed.data);
    return jsonOk(stock);
  } catch (error) {
    return handleApiError(error, "inventory.product");
  }
}
