import ContentPageView, { buildContentPageMetadata } from "@/lib/content/page-view";

export const metadata = buildContentPageMetadata("about");

export default function AboutPage() {
  return <ContentPageView slug="about" />;
}
