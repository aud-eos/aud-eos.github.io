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
      <Pagination posts={ makePosts( 3 ) as never[] } page={ 1 } />,
    );
    expect( container.firstChild ).toBeNull();
  });

  it( "renders page number links when posts span multiple pages", () => {
    render( <Pagination posts={ makePosts( 7 ) as never[] } page={ 1 } /> );
    expect( screen.getByText( "1" ) ).toBeInTheDocument();
    expect( screen.getByText( "2" ) ).toBeInTheDocument();
    expect( screen.getByText( "3" ) ).toBeInTheDocument();
  });

  it( "does not render a prev link on the first page", () => {
    render( <Pagination posts={ makePosts( 7 ) as never[] } page={ 1 } /> );
    expect( screen.queryByText( "prev" ) ).not.toBeInTheDocument();
  });

  it( "renders a prev link when not on the first page", () => {
    render( <Pagination posts={ makePosts( 7 ) as never[] } page={ 2 } /> );
    expect( screen.getByText( "prev" ) ).toBeInTheDocument();
  });

  it( "does not render a next link on the last page", () => {
    render( <Pagination posts={ makePosts( 7 ) as never[] } page={ 3 } /> );
    expect( screen.queryByText( "next" ) ).not.toBeInTheDocument();
  });

  it( "renders a next link when not on the last page", () => {
    render( <Pagination posts={ makePosts( 7 ) as never[] } page={ 1 } /> );
    expect( screen.getByText( "next" ) ).toBeInTheDocument();
  });

  it( "links page 1 to the root path, not /page/1", () => {
    render( <Pagination posts={ makePosts( 7 ) as never[] } page={ 2 } /> );
    const prevLink = screen.getByText( "prev" );
    expect( prevLink ).toHaveAttribute( "href", "/" );
  });

  it( "links subsequent pages to /page/<n>", () => {
    render( <Pagination posts={ makePosts( 7 ) as never[] } page={ 1 } /> );
    const nextLink = screen.getByText( "next" );
    expect( nextLink ).toHaveAttribute( "href", "/page/2" );
  });

  it( "uses tag-scoped URLs when tagId is provided", () => {
    render( <Pagination posts={ makePosts( 7 ) as never[] } page={ 1 } tagId="house" /> );
    expect( screen.getByText( "next" ) ).toHaveAttribute( "href", "/tags/house/page/2" );
  });

  it( "links tag page 1 to /tags/<tagId>/, not /tags/<tagId>/page/1", () => {
    render( <Pagination posts={ makePosts( 7 ) as never[] } page={ 2 } tagId="house" /> );
    expect( screen.getByText( "prev" ) ).toHaveAttribute( "href", "/tags/house/" );
  });
});
