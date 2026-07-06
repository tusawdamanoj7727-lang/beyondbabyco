import ContentPageView, { buildContentPageMetadata } from "@/lib/content/page-view";

export const metadata = buildContentPageMetadata("contact");

export default function ContactPage() {
  return <ContentPageView slug="contact" />;
}
