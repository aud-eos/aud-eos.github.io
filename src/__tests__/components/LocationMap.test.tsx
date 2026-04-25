import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { LocationMap } from "@/components/LocationMap";

const MOCK_GOOGLE_MAPS_URL = "https://www.google.com/maps/place/Gan+Bei+Eatery+and+Bar/@47.597685,-122.3267081,17z/data=!3m1!4b1";

describe( "LocationMap", () => {
  it( "renders a Location heading", () => {
    render( <LocationMap googleMapsUrl={ MOCK_GOOGLE_MAPS_URL } /> );

    expect( screen.getByRole( "heading", { name: "Location" }) ).toBeInTheDocument();
  });

  it( "renders an iframe with coordinates extracted from the Google Maps URL", () => {
    render( <LocationMap googleMapsUrl={ MOCK_GOOGLE_MAPS_URL } /> );

    const iframe = screen.getByTitle( "Location map" );
    expect( iframe.tagName ).toBe( "IFRAME" );
    expect( iframe ).toHaveAttribute(
      "src",
      "https://www.google.com/maps?q=47.597685,-122.3267081&output=embed",
    );
  });

  it( "sets loading=lazy on the iframe", () => {
    render( <LocationMap googleMapsUrl={ MOCK_GOOGLE_MAPS_URL } /> );

    const iframe = screen.getByTitle( "Location map" );
    expect( iframe ).toHaveAttribute( "loading", "lazy" );
  });

  it( "renders the address as a link to the Google Maps URL when both are provided", () => {
    render( <LocationMap googleMapsUrl={ MOCK_GOOGLE_MAPS_URL } address="614 S Jackson St, Seattle, WA 98104" /> );

    const link = screen.getByRole( "link", { name: "614 S Jackson St, Seattle, WA 98104" });
    expect( link ).toHaveAttribute( "href", MOCK_GOOGLE_MAPS_URL );
    expect( link ).toHaveAttribute( "target", "_blank" );
    expect( link ).toHaveAttribute( "rel", "noopener noreferrer" );
  });

  it( "renders the address as plain text when no Google Maps URL is provided", () => {
    render( <LocationMap address="614 S Jackson St, Seattle, WA 98104" /> );

    expect( screen.getByText( "614 S Jackson St, Seattle, WA 98104" ) ).toBeInTheDocument();
    expect( screen.queryByRole( "link" ) ).toBeNull();
  });

  it( "does not render an iframe when Google Maps URL has no valid coordinates", () => {
    render( <LocationMap googleMapsUrl="https://www.google.com/maps/some-bad-url" address="123 Test St" /> );

    expect( screen.queryByTitle( "Location map" ) ).toBeNull();
    expect( screen.getByText( "123 Test St" ) ).toBeInTheDocument();
  });

  it( "does not render an iframe when only address is provided", () => {
    render( <LocationMap address="614 S Jackson St, Seattle, WA 98104" /> );

    expect( screen.queryByTitle( "Location map" ) ).toBeNull();
  });
});
