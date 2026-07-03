import { getStorefrontHomepage } from "@/lib/homepage/storefront";
import Footer from "@/components/sections/Footer";

export default async function StorefrontFooter() {
  const data = await getStorefrontHomepage();
  return <Footer cms={data.published ? data.footer : undefined} />;
}
