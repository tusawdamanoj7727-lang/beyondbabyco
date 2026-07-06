import ContentPageView, { buildContentPageMetadata } from "@/lib/content/page-view";

export const metadata = buildContentPageMetadata("shipping-policy");

export default function ShippingPolicyPage() {
  return <ContentPageView slug="shipping-policy" />;
}
