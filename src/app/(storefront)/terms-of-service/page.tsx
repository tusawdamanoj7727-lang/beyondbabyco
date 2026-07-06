import ContentPageView, { buildContentPageMetadata } from "@/lib/content/page-view";

export const metadata = buildContentPageMetadata("terms-of-service");

export default function TermsOfServicePage() {
  return <ContentPageView slug="terms-of-service" />;
}
