/**
 * Google Analytics Helper
 */

import { GOOGLE_ANALYTICS_ID } from "@/constants";

declare global {
  interface Window {
    gtag: ( ...args: any[] ) => void;
  }
}

export const pageview = ( url: string ) => {
  window.gtag( "config", GOOGLE_ANALYTICS_ID, {
    page_path: url,
  });
};

export const event = ({
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
  window.gtag( "event", action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};
