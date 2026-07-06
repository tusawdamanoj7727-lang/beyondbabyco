import { ImageResponse } from "next/og";

import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo/site";

export const runtime = "edge";

const BG = "#faf5f0";
const GREEN = "#2d5a27";
const MUTED = "#666666";

async function loadMontserrat(weight: 600 | 800) {
  const url =
    weight === 800
      ? "https://fonts.gstatic.com/s/montserrat/v29/JTUHjIg1_i6t8kCHKm4532d3ByL_Gok.woff"
      : "https://fonts.gstatic.com/s/montserrat/v29/JTUSjIg1_i6t8kCHKm459Wlhyw.woff";

  const res = await fetch(url);
  if (!res.ok) return null;
  return res.arrayBuffer();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title")?.trim() || SITE_NAME;
  const subtitle = searchParams.get("subtitle")?.trim() || SITE_TAGLINE;

  const [montserratBold, montserratRegular] = await Promise.all([
    loadMontserrat(800),
    loadMontserrat(600),
  ]);

  const fonts =
    montserratBold && montserratRegular
      ? [
          { name: "Montserrat", data: montserratBold, weight: 800 as const, style: "normal" as const },
          { name: "Montserrat", data: montserratRegular, weight: 600 as const, style: "normal" as const },
        ]
      : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          background: BG,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonts ? "Montserrat" : "system-ui, sans-serif",
          padding: "48px",
        }}
      >
        <div
          style={{
            color: GREEN,
            fontSize: 52,
            fontWeight: 800,
            textAlign: "center",
            lineHeight: 1.15,
            maxWidth: "960px",
          }}
        >
          {title}
        </div>
        <div
          style={{
            color: MUTED,
            fontSize: 26,
            fontWeight: 600,
            marginTop: 20,
            textAlign: "center",
            lineHeight: 1.35,
            maxWidth: "900px",
          }}
        >
          {subtitle}
        </div>
        <div
          style={{
            color: GREEN,
            fontSize: 20,
            fontWeight: 600,
            marginTop: 36,
          }}
        >
          beyondbabyco.in
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts,
    },
  );
}
