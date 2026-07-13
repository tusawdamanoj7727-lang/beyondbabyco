import type { APIRequestContext } from "@playwright/test";

export type VariantStock = { variantId: string; available: number };

export async function fetchProductInventory(
  request: APIRequestContext,
  productId: string,
): Promise<VariantStock[]> {
  const res = await request.get(`/api/inventory/product/${productId}`);
  if (!res.ok()) return [];

  const body = (await res.json()) as {
    ok?: boolean;
    data?: { variants?: VariantStock[] };
  };

  return body.ok && body.data?.variants ? body.data.variants : [];
}

export async function captureInventoryFromPdp(
  page: import("@playwright/test").Page,
): Promise<{ productId: string; variants: VariantStock[] } | null> {
  let productId = "";
  let variants: VariantStock[] = [];

  page.on("response", async (response) => {
    const url = response.url();
    const match = url.match(/\/api\/inventory\/product\/([0-9a-f-]{36})/i);
    if (!match || !response.ok()) return;
    productId = match[1];
    const body = (await response.json()) as {
      ok?: boolean;
      data?: { variants?: VariantStock[] };
    };
    if (body.ok && body.data?.variants) {
      variants = body.data.variants;
    }
  });

  return { productId, variants };
}
