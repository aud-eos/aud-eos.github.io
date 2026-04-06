import { describe, it, expect, vi, beforeEach } from "vitest";
import { trackPageview, trackEvent, updateConsent } from "@/lib/google-analytics";
import { GOOGLE_ANALYTICS_ID } from "@/constants";

describe( "google-analytics", () => {
  beforeEach( () => {
    // Reset gtag between tests
    delete ( window as { gtag?: unknown }).gtag;
  });

  describe( "trackPageview", () => {
    it( "is a no-op when gtag is not available", () => {
      expect( () => trackPageview( "/test" ) ).not.toThrow();
    });

    it( "calls gtag config with the page path", () => {
      window.gtag = vi.fn();
      trackPageview( "/about" );
      expect( window.gtag ).toHaveBeenCalledWith( "config", GOOGLE_ANALYTICS_ID, { page_path: "/about" });
    });
  });

  describe( "trackEvent", () => {
    it( "is a no-op when gtag is not available", () => {
      expect( () => trackEvent({ action: "click" }) ).not.toThrow();
    });

    it( "calls gtag event with all provided params", () => {
      window.gtag = vi.fn();
      trackEvent({ action: "click", category: "button", label: "submit", value: 1 });
      expect( window.gtag ).toHaveBeenCalledWith( "event", "click", {
        event_category: "button",
        event_label: "submit",
        value: 1,
      });
    });

    it( "calls gtag event with only action when optional params are omitted", () => {
      window.gtag = vi.fn();
      trackEvent({ action: "view" });
      expect( window.gtag ).toHaveBeenCalledWith( "event", "view", {
        event_category: undefined,
        event_label: undefined,
        value: undefined,
      });
    });
  });

  describe( "updateConsent", () => {
    it( "is a no-op when gtag is not available", () => {
      expect( () => updateConsent( true ) ).not.toThrow();
    });

    it( "calls gtag consent update with granted", () => {
      window.gtag = vi.fn();
      updateConsent( true );
      expect( window.gtag ).toHaveBeenCalledWith( "consent", "update", { analytics_storage: "granted" });
    });

    it( "calls gtag consent update with denied", () => {
      window.gtag = vi.fn();
      updateConsent( false );
      expect( window.gtag ).toHaveBeenCalledWith( "consent", "update", { analytics_storage: "denied" });
    });
  });
});
