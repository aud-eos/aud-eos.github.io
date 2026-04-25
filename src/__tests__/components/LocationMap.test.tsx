import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { LocationMap } from "@/components/LocationMap";

const MOCK_LAT = 47.6062;
const MOCK_LON = -122.3321;

describe( "LocationMap", () => {
  it( "renders a Location heading", () => {
    render( <LocationMap lat={ MOCK_LAT } lon={ MOCK_LON } /> );

    expect( screen.getByRole( "heading", { name: "Location" }) ).toBeInTheDocument();
  });

  it( "renders an iframe with the correct Google Maps embed URL", () => {
    render( <LocationMap lat={ MOCK_LAT } lon={ MOCK_LON } /> );

    const iframe = screen.getByTitle( "Location map" );
    expect( iframe.tagName ).toBe( "IFRAME" );
    expect( iframe ).toHaveAttribute(
      "src",
      `https://www.google.com/maps?q=${MOCK_LAT},${MOCK_LON}&output=embed`,
    );
  });

  it( "sets loading=lazy on the iframe", () => {
    render( <LocationMap lat={ MOCK_LAT } lon={ MOCK_LON } /> );

    const iframe = screen.getByTitle( "Location map" );
    expect( iframe ).toHaveAttribute( "loading", "lazy" );
  });
});
