import { getMarketingSurfaces } from "@/lib/marketing/surfaces";
import TickerBar from "@/components/sections/TickerBar";

/**
 * Storefront announcement ticker — shared on every page via root layout.
 * Sticky preference is stored in CMS (kept with the fixed header stack for CLS stability).
 */
export default async function AnnouncementBar() {
  const marketing = await getMarketingSurfaces();
  const { announcement } = marketing;

  if (!announcement.enabled) {
    return <div data-announcement-active="false" hidden aria-hidden="true" />;
  }

  return (
    <div data-announcement-active="true">
      <TickerBar
        items={announcement.items}
        backgroundColor={announcement.background}
        textColor={announcement.textColor}
        link={announcement.link}
        ctaLabel={announcement.ctaLabel}
        ctaUrl={announcement.ctaUrl}
        rotationSpeedMs={announcement.rotationSpeedMs}
        pauseOnHover={announcement.pauseOnHover}
        autoPlay={announcement.autoPlay}
        maxVisible={announcement.maxVisible}
        mobileSwipe={announcement.mobileSwipe}
      />
    </div>
  );
}
