import type { StorefrontProduct } from "@/lib/catalog/types";

export type NotifyMeMode = "launch" | "restock";

export type NotifyMeTarget = {
  productCategory: string;
  productId?: string;
  productName?: string;
  mode?: NotifyMeMode;
};

export function buildCategoryNotifyTarget(productCategory: string): NotifyMeTarget {
  return { productCategory, mode: "launch" };
}

export function buildProductNotifyTarget(
  product: Pick<StorefrontProduct, "id" | "name" | "categoryName" | "status">,
): NotifyMeTarget {
  const isComingSoon = product.status === "coming_soon";
  return {
    productCategory: product.categoryName ?? product.name,
    productId: product.id,
    productName: product.name,
    mode: isComingSoon ? "launch" : "restock",
  };
}

export function notifyMeButtonLabel(
  mode: NotifyMeMode = "launch",
  status?: string,
): string {
  if (mode === "restock") return "Notify when in stock";
  if (status === "coming_soon") return "Notify Me When Available";
  return "Notify Me";
}
