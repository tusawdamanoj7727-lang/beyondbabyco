import ContentPageView, { buildContentPageMetadata } from "@/lib/content/page-view";

export const metadata = buildContentPageMetadata("privacy-policy");

export default function PrivacyPolicyPage() {
  return <ContentPageView slug="privacy-policy" />;
}
