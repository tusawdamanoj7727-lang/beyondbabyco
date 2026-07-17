import Script from "next/script";

import {
  getClarityProjectId,
  getGa4MeasurementId,
  getGoogleAdsId,
  getGtmContainerId,
  getMetaPixelId,
  isAnalyticsConfigured,
  isProductionAnalyticsRuntime,
} from "@/lib/analytics/config";

/** Server-rendered third-party analytics scripts (env-driven, production only). */
export default function ProductionAnalyticsScripts() {
  if (!isProductionAnalyticsRuntime() || !isAnalyticsConfigured()) return null;

  const gtmId = getGtmContainerId();
  const ga4Id = getGa4MeasurementId();
  const adsId = getGoogleAdsId();
  const metaPixelId = getMetaPixelId();
  const clarityId = getClarityProjectId();
  const directGoogleTagId = ga4Id ?? adsId;

  if (!gtmId && !ga4Id && !adsId && !metaPixelId && !clarityId) return null;

  return (
    <>
      {gtmId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtm.js?id=${gtmId}`}
            strategy="afterInteractive"
          />
          <Script id="gtm-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              window.dataLayer.push({
                'gtm.start': new Date().getTime(),
                event: 'gtm.js'
              });
            `}
          </Script>
        </>
      ) : null}
      {/* GA4/Ads via gtag even when GTM is present — send_page_view false (SPA listener owns pageviews). */}
      {directGoogleTagId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${directGoogleTagId}`}
            strategy="afterInteractive"
          />
          <Script id="google-tag-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              ${ga4Id ? `gtag('config', '${ga4Id}', { send_page_view: false });` : ""}
              ${adsId ? `gtag('config', '${adsId}');` : ""}
            `}
          </Script>
        </>
      ) : null}
      {metaPixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${metaPixelId}');
          `}
        </Script>
      )}
      {clarityId && (
        <Script id="ms-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${clarityId}");
          `}
        </Script>
      )}
    </>
  );
}
