import ContentPageView, { buildContentPageMetadata } from "@/lib/content/page-view";

export const metadata = buildContentPageMetadata("faq");

export default function FaqPage() {
  return <ContentPageView slug="faq" />;
}
