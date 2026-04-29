import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import Picture from "@/components/Picture";

describe( "Picture", () => {
  it( "lazy-loads the image by default", () => {
    const { container } = render(
      <Picture url="//img.test/photo.jpg" alt="alt" />,
    );
    const img = container.querySelector( "img" );
    expect( img?.getAttribute( "loading" ) ).toBe( "lazy" );
    expect( img?.getAttribute( "fetchpriority" ) ).toBeNull();
  });

  it( "marks the image as priority when priority is true", () => {
    const { container } = render(
      <Picture url="//img.test/photo.jpg" alt="alt" priority />,
    );
    const img = container.querySelector( "img" );
    expect( img?.getAttribute( "loading" ) ).toBe( "eager" );
    expect( img?.getAttribute( "fetchpriority" ) ).toBe( "high" );
  });
});
