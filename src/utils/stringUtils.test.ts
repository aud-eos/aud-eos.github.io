import { describe, it, expect } from "vitest";
import { capitalize } from "./stringUtils";

describe( "capitalize", () => {
  it( "capitalizes the first letter of a lowercase string", () => {
    expect( capitalize( "house" ) ).toBe( "House" );
  });

  it( "leaves an already-capitalized string unchanged", () => {
    expect( capitalize( "House" ) ).toBe( "House" );
  });

  it( "capitalizes only the first letter, leaving the rest as-is", () => {
    expect( capitalize( "hOUSE" ) ).toBe( "HOUSE" );
  });

  it( "handles a single character", () => {
    expect( capitalize( "a" ) ).toBe( "A" );
  });

  it( "returns an empty string unchanged", () => {
    expect( capitalize( "" ) ).toBe( "" );
  });
});
