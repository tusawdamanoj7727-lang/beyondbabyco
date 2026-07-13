import { Montserrat } from "next/font/google";
import type { ReactNode } from "react";

/** Products hero title only — Montserrat 900 kept off the global critical path. */
const montserrat = Montserrat({
  weight: ["900"],
  variable: "--font-montserrat",
  display: "swap",
  subsets: ["latin"],
  adjustFontFallback: true,
});

export default function ProductsLayout({ children }: { children: ReactNode }) {
  return <div className={montserrat.variable}>{children}</div>;
}
