import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock( "@/constants", async importOriginal => ({
  ...( await importOriginal<typeof import( "@/constants" )>() ),
  PAGE_SIZE: 3,
}) );
vi.mock( "@/utils/contentfulUtils", () => ({}) );
vi.mock( "next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a"> ) => (
    <a href={ href } { ...props }>{ children }</a>
  ),
}) );

import Pagination from "@/components/Home/Pagination";

const makePosts = ( count: number ) =>
  Array.from({ length: count }, ( _, index ) => ({
    sys: { id: String( index ) },
    fields: { title: `Post ${ index }`, slug: `post-${ index }` },
  }) );

describe( "Pagination", () => {
  it( "renders nothing when all posts fit on one page", () => {
    const { container } = render(
      <Pagination posts={ makePosts( 3 ) as never[] } page={ 1 } filter={ { kind: "all" } } />,
    );
    expect( container.firstChild ).toBeNull();
  });

  it( "renders page number links for filter kind 'all'", () => {
    render( <Pagination posts={ makePosts( 7 ) as never[] } page={ 1 } filter={ { kind: "all" } } /> );
    expect( screen.getByText( "1" ).getAttribute( "href" ) ).toBe( "/page/1" );
    expect( screen.getByText( "2" ).getAttribute( "href" ) ).toBe( "/page/2" );
    expect( screen.getByText( "3" ).getAttribute( "href" ) ).toBe( "/page/3" );
  });

  it( "renders tag-prefixed links for filter kind 'tag'", () => {
    render(
      <Pagination
        posts={ makePosts( 7 ) as never[] }
        page={ 1 }
        filter={ { kind: "tag", id: "dj" } }
      />,
    );
    expect( screen.getByText( "1" ).getAttribute( "href" ) ).toBe( "/tags/dj" );
    expect( screen.getByText( "2" ).getAttribute( "href" ) ).toBe( "/tags/dj/page/2" );
  });

  it( "renders category-prefixed links for filter kind 'category'", () => {
    render(
      <Pagination
        posts={ makePosts( 7 ) as never[] }
        page={ 1 }
        filter={ { kind: "category", id: "music" } }
      />,
    );
    expect( screen.getByText( "1" ).getAttribute( "href" ) ).toBe( "/category/music" );
    expect( screen.getByText( "2" ).getAttribute( "href" ) ).toBe( "/category/music/page/2" );
  });

  it( "does not render a prev link on the first page", () => {
    render(
      <Pagination posts={ makePosts( 7 ) as never[] } page={ 1 } filter={ { kind: "all" } } />,
    );
    expect( screen.queryByText( "prev" ) ).toBeNull();
  });

  it( "renders a prev link on later pages", () => {
    render(
      <Pagination posts={ makePosts( 7 ) as never[] } page={ 2 } filter={ { kind: "all" } } />,
    );
    const prevLink = screen.getByText( "prev" );
    expect( prevLink ).toBeInTheDocument();
    expect( prevLink.getAttribute( "href" ) ).toBe( "/page/1" );
  });

  it( "renders a next link when there are more pages", () => {
    render(
      <Pagination posts={ makePosts( 7 ) as never[] } page={ 1 } filter={ { kind: "all" } } />,
    );
    expect( screen.queryByText( "next" ) ).toBeInTheDocument();
  });
});
