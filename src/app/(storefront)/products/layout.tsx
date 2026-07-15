import type { ReactNode } from "react";

/** Products routes share the global Geist heading font — no extra Google Font load. */
export default function ProductsLayout({ children }: { children: ReactNode }) {
  return children;
}
