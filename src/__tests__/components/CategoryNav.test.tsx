import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

vi.mock( "next/link", () => ({
  default: ({ children, href, className }: React.ComponentProps<"a"> ) => (
    <a href={ href } className={ className }>{ children }</a>
  ),
}) );

import CategoryNav from "@/components/CategoryNav";

describe( "CategoryNav", () => {
  it( "renders three links in CATEGORY_IDS order", () => {
    const { container } = render( <CategoryNav currentCategory={ null } /> );
    const links = container.querySelectorAll( "a" );
    expect( links ).toHaveLength( 3 );
    expect( links[0].getAttribute( "href" ) ).toBe( "/category/music" );
    expect( links[1].getAttribute( "href" ) ).toBe( "/category/events" );
    expect( links[2].getAttribute( "href" ) ).toBe( "/category/lifestyle" );
  });

  it( "uses the title from categories.json for each label", () => {
    const { container } = render( <CategoryNav currentCategory={ null } /> );
    const links = container.querySelectorAll( "a" );
    expect( links[0].textContent ).toBe( "Music" );
    expect( links[1].textContent ).toBe( "Events" );
    expect( links[2].textContent ).toBe( "Lifestyle" );
  });

  it( "highlights only the current category's link", () => {
    const { container } = render( <CategoryNav currentCategory="music" /> );
    const links = container.querySelectorAll( "a" );
    expect( links[0].className ).toContain( "categoryActive" );
    expect( links[1].className ).not.toContain( "categoryActive" );
    expect( links[2].className ).not.toContain( "categoryActive" );
  });

  it( "highlights none when currentCategory is null", () => {
    const { container } = render( <CategoryNav currentCategory={ null } /> );
    const links = container.querySelectorAll( "a" );
    for( const link of links ) {
      expect( link.className ).not.toContain( "categoryActive" );
    }
  });

  it( "highlights none when currentCategory is unknown", () => {
    const { container } = render( <CategoryNav currentCategory="unknown" /> );
    const links = container.querySelectorAll( "a" );
    for( const link of links ) {
      expect( link.className ).not.toContain( "categoryActive" );
    }
  });
});
