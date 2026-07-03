import type { MetadataRoute } from "next";

import {
  BRAND_APPLE_TOUCH_ICON,
  BRAND_ICON_192,
  BRAND_ICON_512,
  BRAND_ICON_MASKABLE_512,
  BRAND_FAVICON_SVG,
} from "@/lib/brand/logo";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "BeyondBabyCo",
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#fffdf8",
    theme_color: "#225536",
    orientation: "portrait-primary",
    icons: [
      { src: BRAND_FAVICON_SVG, sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: BRAND_ICON_192, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: BRAND_ICON_512, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: BRAND_ICON_MASKABLE_512, sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: BRAND_APPLE_TOUCH_ICON, sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  };
}
