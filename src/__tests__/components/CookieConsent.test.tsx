import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import React from "react";

vi.mock( "next/font/google", () => ({
  VT323: () => ({ className: "mock-vt323" }),
}) );

import CookieConsent, { resetCookieConsent } from "@/components/CookieConsent";
import { COOKIE_CONSENT_KEY } from "@/constants";

describe( "CookieConsent", () => {
  beforeEach( () => {
    localStorage.removeItem( COOKIE_CONSENT_KEY );
    window.gtag = vi.fn();
  });

  it( "shows the modal when no consent is stored", () => {
    render( <CookieConsent /> );
    expect( screen.getByText( "Cookie Preferences" ) ).toBeInTheDocument();
  });

  it( "hides the modal when consent is already stored", () => {
    localStorage.setItem( COOKIE_CONSENT_KEY, "accepted" );
    render( <CookieConsent /> );
    expect( screen.queryByText( "Cookie Preferences" ) ).not.toBeInTheDocument();
  });

  it( "saves 'accepted' and hides the modal when Accept is clicked", () => {
    render( <CookieConsent /> );
    fireEvent.click( screen.getByText( "[ Y ] Accept" ) );
    expect( localStorage.getItem( COOKIE_CONSENT_KEY ) ).toBe( "accepted" );
    expect( screen.queryByText( "Cookie Preferences" ) ).not.toBeInTheDocument();
  });

  it( "saves 'rejected' and hides the modal when Reject is clicked", () => {
    render( <CookieConsent /> );
    fireEvent.click( screen.getByText( "[ N ] Reject" ) );
    expect( localStorage.getItem( COOKIE_CONSENT_KEY ) ).toBe( "rejected" );
    expect( screen.queryByText( "Cookie Preferences" ) ).not.toBeInTheDocument();
  });

  it( "saves 'rejected' and hides the modal when the X button is clicked", () => {
    render( <CookieConsent /> );
    fireEvent.click( screen.getByText( "X" ) );
    expect( localStorage.getItem( COOKIE_CONSENT_KEY ) ).toBe( "rejected" );
    expect( screen.queryByText( "Cookie Preferences" ) ).not.toBeInTheDocument();
  });

  it( "calls gtag consent update with granted when Accept is clicked", () => {
    render( <CookieConsent /> );
    fireEvent.click( screen.getByText( "[ Y ] Accept" ) );
    expect( window.gtag ).toHaveBeenCalledWith( "consent", "update", { analytics_storage: "granted" });
  });

  it( "calls gtag consent update with denied when Reject is clicked", () => {
    render( <CookieConsent /> );
    fireEvent.click( screen.getByText( "[ N ] Reject" ) );
    expect( window.gtag ).toHaveBeenCalledWith( "consent", "update", { analytics_storage: "denied" });
  });

  it( "accepts via the Y keyboard shortcut", () => {
    render( <CookieConsent /> );
    fireEvent.keyDown( window, { key: "y" });
    expect( localStorage.getItem( COOKIE_CONSENT_KEY ) ).toBe( "accepted" );
    expect( screen.queryByText( "Cookie Preferences" ) ).not.toBeInTheDocument();
  });

  it( "accepts via the Enter keyboard shortcut", () => {
    render( <CookieConsent /> );
    fireEvent.keyDown( window, { key: "Enter" });
    expect( localStorage.getItem( COOKIE_CONSENT_KEY ) ).toBe( "accepted" );
  });

  it( "rejects via the N keyboard shortcut", () => {
    render( <CookieConsent /> );
    fireEvent.keyDown( window, { key: "n" });
    expect( localStorage.getItem( COOKIE_CONSENT_KEY ) ).toBe( "rejected" );
    expect( screen.queryByText( "Cookie Preferences" ) ).not.toBeInTheDocument();
  });

  it( "rejects via the Escape keyboard shortcut", () => {
    render( <CookieConsent /> );
    fireEvent.keyDown( window, { key: "Escape" });
    expect( localStorage.getItem( COOKIE_CONSENT_KEY ) ).toBe( "rejected" );
  });

  it( "shows the modal again after resetCookieConsent — even when hasConsented was already false", () => {
    // This is the core regression test: on a return visit, hasConsented starts as
    // false but the modal is hidden because localStorage has a value. The previous
    // implementation called setHasConsented(false) on reset, which was a no-op and
    // never triggered a re-render.
    localStorage.setItem( COOKIE_CONSENT_KEY, "accepted" );
    render( <CookieConsent /> );
    expect( screen.queryByText( "Cookie Preferences" ) ).not.toBeInTheDocument();

    act( () => { resetCookieConsent(); });

    expect( screen.getByText( "Cookie Preferences" ) ).toBeInTheDocument();
  });

  it( "shows the modal again after resetCookieConsent following an in-session accept", () => {
    render( <CookieConsent /> );
    fireEvent.click( screen.getByText( "[ Y ] Accept" ) );
    expect( screen.queryByText( "Cookie Preferences" ) ).not.toBeInTheDocument();

    act( () => { resetCookieConsent(); });

    expect( screen.getByText( "Cookie Preferences" ) ).toBeInTheDocument();
  });

  it( "dismisses the modal with reject when clicking the overlay", () => {
    const { container } = render( <CookieConsent /> );
    const overlay = container.firstChild as HTMLElement;
    fireEvent.click( overlay );
    expect( localStorage.getItem( COOKIE_CONSENT_KEY ) ).toBe( "rejected" );
    expect( screen.queryByText( "Cookie Preferences" ) ).not.toBeInTheDocument();
  });

  it( "does not dismiss the modal when clicking inside the cookie box", () => {
    render( <CookieConsent /> );
    fireEvent.click( screen.getByText( "Cookie Preferences" ) );
    expect( screen.getByText( "Cookie Preferences" ) ).toBeInTheDocument();
  });
});
