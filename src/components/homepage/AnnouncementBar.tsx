import { getStorefrontHomepage } from "@/lib/homepage/storefront";
import TickerBar from "@/components/sections/TickerBar";

export default async function AnnouncementBar() {
  const data = await getStorefrontHomepage();
  if (!data.announcement.enabled) return null;

  return (
    <TickerBar
      items={data.announcement.items}
      backgroundColor={data.announcement.background}
      link={data.announcement.link}
    />
  );
}
