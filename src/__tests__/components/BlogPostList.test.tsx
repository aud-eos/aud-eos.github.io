import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

vi.mock( "@/constants", async importOriginal => ({
  ...( await importOriginal<typeof import( "@/constants" )>() ),
  PAGE_SIZE: 10,
}) );
vi.mock( "@/utils/contentfulUtils", () => ({}) );
vi.mock( "next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a"> ) => (
    <a href={ href } { ...props }>{ children }</a>
  ),
}) );
vi.mock( "@/components/Picture", () => ({
  default: ({ alt, priority }: { alt: string; priority?: boolean }) => (
    <img alt={ alt } data-priority={ priority ? "true" : "false" } />
  ),
}) );
vi.mock( "@/components/Tags", () => ({
  Tags: () => <div data-testid="tags" />,
}) );
vi.mock( "@/components/DateTimeFormat", () => ({
  default: () => <time />,
}) );

import BlogPostList from "@/components/Home/BlogPostList";

const makePosts = ( count: number ) =>
  Array.from({ length: count }, ( _unused, index ) => ({
    sys: { id: String( index ), createdAt: `2026-01-0${ index + 1 }T00:00:00Z` },
    fields: {
      title: `Post ${ index }`,
      slug: `post-${ index }`,
      image: { fields: { file: { url: "//img.test/photo.jpg" }, description: `Alt ${ index }` } },
      date: `2026-01-0${ index + 1 }`,
    },
    metadata: { tags: [] },
  }) );

// Mock IntersectionObserver
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();

function makeMockIntersectionObserver() {
  return {
    observe: mockObserve,
    unobserve: mockUnobserve,
    disconnect: mockDisconnect,
  };
}

beforeEach( () => {
  const intersectionObserverSpy = vi.fn( makeMockIntersectionObserver );
  vi.stubGlobal( "IntersectionObserver", intersectionObserverSpy );
  vi.stubGlobal( "matchMedia", ( query: string ) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) );
  mockObserve.mockClear();
  mockUnobserve.mockClear();
  mockDisconnect.mockClear();
});

describe( "BlogPostList", () => {
  it( "renders all posts for the current page", () => {
    const { container } = render(
      <BlogPostList posts={ makePosts( 3 ) as never[] } page={ 1 } />,
    );
    const items = container.querySelectorAll( "li" );
    expect( items ).toHaveLength( 3 );
  });

  it( "sets view-transition-name on each li using the post slug", () => {
    const { container } = render(
      <BlogPostList posts={ makePosts( 2 ) as never[] } page={ 1 } />,
    );
    const items = container.querySelectorAll( "li" );
    expect( ( items[0] as HTMLElement ).style.viewTransitionName ).toBe( "post-post-1" );
    expect( ( items[1] as HTMLElement ).style.viewTransitionName ).toBe( "post-post-0" );
  });

  it( "creates an IntersectionObserver on mount", () => {
    render(
      <BlogPostList posts={ makePosts( 2 ) as never[] } page={ 1 } />,
    );
    expect( IntersectionObserver ).toHaveBeenCalledTimes( 1 );
    expect( mockObserve ).toHaveBeenCalledTimes( 2 );
  });

  it( "immediately shows all cards when prefers-reduced-motion is reduce", () => {
    vi.stubGlobal( "matchMedia", vi.fn( ( query: string ) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) ) );

    // Re-mock IntersectionObserver to not be called
    const observerSpy = vi.fn();
    vi.stubGlobal( "IntersectionObserver", observerSpy );

    const { container } = render(
      <BlogPostList posts={ makePosts( 2 ) as never[] } page={ 1 } />,
    );

    // Observer should not have been constructed
    expect( observerSpy ).not.toHaveBeenCalled();

    // All items should have the visible class
    const items = container.querySelectorAll( "li" );
    items.forEach( item => {
      expect( item.className ).toContain( "visible" );
    });
  });

  it( "renders links with correct hrefs", () => {
    const { container } = render(
      <BlogPostList posts={ makePosts( 1 ) as never[] } page={ 1 } />,
    );
    const links = container.querySelectorAll( "a" );
    const hrefs = Array.from( links ).map( link => link.getAttribute( "href" ) );
    expect( hrefs ).toContain( "/post/post-0" );
  });

  it( "passes priority to the first card image only when firstCardPriority is true", () => {
    const { container } = render(
      <BlogPostList
        posts={ makePosts( 3 ) as never[] }
        page={ 1 }
        firstCardPriority
      />,
    );
    const images = container.querySelectorAll( "img" );
    expect( images[0].getAttribute( "data-priority" ) ).toBe( "true" );
    expect( images[1].getAttribute( "data-priority" ) ).toBe( "false" );
    expect( images[2].getAttribute( "data-priority" ) ).toBe( "false" );
  });

  it( "does not mark any image priority when firstCardPriority is false (default)", () => {
    const { container } = render(
      <BlogPostList posts={ makePosts( 3 ) as never[] } page={ 1 } />,
    );
    const images = container.querySelectorAll( "img" );
    images.forEach( image => {
      expect( image.getAttribute( "data-priority" ) ).toBe( "false" );
    });
  });
});
