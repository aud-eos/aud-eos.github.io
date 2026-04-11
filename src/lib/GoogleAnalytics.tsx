import { COOKIE_CONSENT_KEY, GOOGLE_ANALYTICS_ID } from "@/constants";
import Script from "next/script";
import { FC } from "react";

export const GoogleAnalytics: FC = () => {
  return (
    <>
      <Script
        src={ `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}` }
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        { `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());

                /* deny by default */
                gtag('consent', 'default', {
                  analytics_storage: 'denied'
                });

                const consent = localStorage.getItem("${COOKIE_CONSENT_KEY}");
                if (consent === "accepted") {
                  gtag('consent', 'update', {
                    analytics_storage: 'granted'
                  });
                }

                gtag('config', '${GOOGLE_ANALYTICS_ID}', {
                    page_path: window.location.pathname,
                });
                ` }
      </Script>
    </>
  );
};
