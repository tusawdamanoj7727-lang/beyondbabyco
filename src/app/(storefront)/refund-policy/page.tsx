import ContentPageView, { buildContentPageMetadata } from "@/lib/content/page-view";

export const metadata = buildContentPageMetadata("refund-policy");

export default function RefundPolicyPage() {
  return <ContentPageView slug="refund-policy" />;
}
