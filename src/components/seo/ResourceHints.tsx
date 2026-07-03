import { getPreconnectOrigins } from "@/lib/network/resource-hints";

/** Server-rendered connection hints for LCP and third-party scripts. */
export default function ResourceHints() {
  const origins = getPreconnectOrigins();
  if (!origins.length) return null;

  return (
    <>
      {origins.map((origin) => (
        <link key={origin} rel="preconnect" href={origin} crossOrigin="anonymous" />
      ))}
      {origins.map((origin) => (
        <link key={`dns-${origin}`} rel="dns-prefetch" href={origin} />
      ))}
    </>
  );
}
