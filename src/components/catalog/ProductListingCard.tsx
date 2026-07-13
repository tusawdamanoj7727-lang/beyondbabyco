import AddToCartButton from "@/components/catalog/AddToCartButton";
import NotifyMeButton from "@/components/catalog/NotifyMeButton";
import { ProductCardLayout } from "@/components/catalog/ProductCardLayout";
import { canPurchaseProduct } from "@/lib/catalog/availability";
import { notifyMeButtonLabel } from "@/lib/notify-me/target";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

function cardPurchaseAction(product: StorefrontProduct) {
  if (canPurchaseProduct(product)) {
    return (
      <AddToCartButton
        product={product}
        size="sm"
        fullWidth={false}
        showIcon={false}
        label="Add to Cart"
        className="h-auto shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold active:scale-95"
      />
    );
  }

  return (
    <NotifyMeButton
      product={product}
      size="sm"
      fullWidth={false}
      label={notifyMeButtonLabel(
        product.status === "coming_soon" ? "launch" : "restock",
        product.status,
      )}
      className="h-auto shrink-0 rounded-lg border border-brand-forest bg-transparent px-3 py-1.5 text-xs font-semibold text-brand-forest hover:bg-brand-mint"
    />
  );
}

/** Server-rendered product card — visible without client JavaScript. */
export default function ProductListingCard({
  product,
  className,
  priority = false,
}: {
  product: StorefrontProduct;
  className?: string;
  priority?: boolean;
}) {
  return (
    <ProductCardLayout
      product={product}
      priority={priority}
      className={cn("h-full", className)}
      actions={cardPurchaseAction(product)}
    />
  );
}
