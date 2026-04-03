import { GOOGLE_ANALYTICS_ID } from "@/constants";
import Script from "next/script";
import { FC } from "react";

export const GoogleAnalyics: FC = () => {
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
                gtag('config', '${GOOGLE_ANALYTICS_ID}', {
                    page_path: window.location.pathname,
                });
                ` }
      </Script>
    </>
  );
};
