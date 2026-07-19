import ContentPageView, { buildContentPageMetadata } from "@/lib/content/page-view";

export const metadata = buildContentPageMetadata("research");

export default function ResearchPage() {
  return <ContentPageView slug="research" />;
}
