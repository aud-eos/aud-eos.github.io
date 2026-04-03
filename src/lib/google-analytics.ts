/**
 * Google Analytics Helper
 */

import { GOOGLE_ANALYTICS_ID } from "@/constants";

type Gtag = {
  ( command: "js", config: Date ): void
  ( command: "config", targetId: string, config?: {
    page_path?: string
    send_page_view?: boolean
  }): void
  ( command: "event", eventName: string, params?: {
    event_category?: string
    event_label?: string
    value?: number
  }): void

  ( command: "consent", action: "default" | "update", params: {
    analytics_storage?: "granted" | "denied"
    ad_storage?: "granted" | "denied"
    ad_user_data?: "granted" | "denied"
    ad_personalization?: "granted" | "denied"
  }): void
}

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: Gtag
  }
}

function gtagAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.gtag === "function";
}


export const trackPageview = ( url: string ) => {
  if( !gtagAvailable() ) return;
  window.gtag( "config", GOOGLE_ANALYTICS_ID, {
    page_path: url,
  });
};

export const trackEvent = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category?: string;
  label?: string;
  value?: number;
}) => {
  if( !gtagAvailable() ) return;
  window.gtag( "event", action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

export function updateConsent( granted: boolean ): void {
  if( !gtagAvailable() ) return;
  window.gtag( "consent", "update", {
    analytics_storage: granted ? "granted" : "denied",
  });
}
