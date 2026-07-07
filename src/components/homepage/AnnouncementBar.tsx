import { TICKER_ITEMS } from "@/lib/brand/copy";
import { getStorefrontHomepage } from "@/lib/homepage/storefront";
import TickerBar from "@/components/sections/TickerBar";

/** Storefront announcement ticker — always shown on every page using brand copy. */
export default async function AnnouncementBar() {
  const data = await getStorefrontHomepage();

  return (
    <TickerBar
      items={[...TICKER_ITEMS]}
      backgroundColor={data.announcement.background}
      link={data.announcement.link}
    />
  );
}
