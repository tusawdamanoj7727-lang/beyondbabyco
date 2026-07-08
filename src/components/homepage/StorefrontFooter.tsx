import dynamic from "next/dynamic";

import { getStorefrontHomepage } from "@/lib/homepage/storefront";

const Footer = dynamic(() => import("@/components/sections/Footer"), {
  loading: () => <footer className="min-h-[24rem] bg-cream-50" aria-hidden="true" />,
});

export default async function StorefrontFooter() {
  const data = await getStorefrontHomepage();
  return <Footer cms={data.published ? data.footer : undefined} />;
}
