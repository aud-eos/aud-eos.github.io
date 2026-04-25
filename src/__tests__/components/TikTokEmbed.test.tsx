import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock( "next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a"> ) => (
    <a href={ href } { ...props }>{ children }</a>
  ),
}) );

import { TikTokEmbed } from "@/components/TikTokEmbed";
import { TikTokOembed } from "@/utils/tiktok/getOembed";

const MOCK_TIKTOK_URL = "https://www.tiktok.com/@testuser/video/1234567890";

const MOCK_OEMBED: TikTokOembed = {
  title: "Test TikTok Video",
  author_name: "testuser",
  author_url: "https://www.tiktok.com/@testuser",
  html: '<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@testuser/video/1234567890"><section>Test content</section></blockquote>',
  thumbnail_url: "https://p16-sign.tiktokcdn.com/obj/test-thumbnail.jpg",
};

const MOCK_OEMBED_DARK: TikTokOembed = {
  ...MOCK_OEMBED,
  html: '<blockquote class="tiktok-embed" data-dark="1"><section>Dark content</section></blockquote>',
};

function mockMatchMedia( matches: boolean ) {
  Object.defineProperty( window, "matchMedia", {
    writable: true,
    value: vi.fn().mockReturnValue({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  });
}

describe( "TikTokEmbed", () => {
  beforeEach( () => {
    mockMatchMedia( false );
  });
  it( "renders the oEmbed HTML content", () => {
    render( <TikTokEmbed oembed={ MOCK_OEMBED } url={ MOCK_TIKTOK_URL } /> );

    expect( screen.getByText( "Test content" ) ).toBeInTheDocument();
  });

  it( "renders the video title as a link to the TikTok URL that opens in a new tab", () => {
    render( <TikTokEmbed oembed={ MOCK_OEMBED } url={ MOCK_TIKTOK_URL } /> );

    const titleLink = screen.getByRole( "link", { name: /Test TikTok Video/i });
    expect( titleLink ).toHaveAttribute( "href", MOCK_TIKTOK_URL );
    expect( titleLink ).toHaveAttribute( "target", "_blank" );
    expect( titleLink ).toHaveAttribute( "rel", "noopener noreferrer" );
  });

  it( "renders a TikTok link to the author profile that opens in a new tab", () => {
    render( <TikTokEmbed oembed={ MOCK_OEMBED } url={ MOCK_TIKTOK_URL } /> );

    const tiktokLink = screen.getByRole( "link", { name: "TikTok" });
    expect( tiktokLink ).toHaveAttribute( "href", "https://www.tiktok.com/@testuser" );
    expect( tiktokLink ).toHaveAttribute( "target", "_blank" );
  });

  it( "appends the TikTok embed.js script to the container on mount", () => {
    render( <TikTokEmbed oembed={ MOCK_OEMBED } url={ MOCK_TIKTOK_URL } /> );

    const script = document.querySelector( 'script[src="https://www.tiktok.com/embed.js"]' );
    expect( script ).not.toBeNull();
  });

  it( "removes the script on unmount", () => {
    const { unmount } = render( <TikTokEmbed oembed={ MOCK_OEMBED } url={ MOCK_TIKTOK_URL } /> );

    unmount();

    const script = document.querySelector( 'script[src="https://www.tiktok.com/embed.js"]' );
    expect( script ).toBeNull();
  });

  it( "strips script tags from oEmbed HTML to avoid double-loading embed.js", () => {
    const oembedWithScript: TikTokOembed = {
      ...MOCK_OEMBED,
      html: '<blockquote class="tiktok-embed"><section>Test content</section></blockquote><script async src="https://www.tiktok.com/embed.js"></script>',
    };

    render( <TikTokEmbed oembed={ oembedWithScript } url={ MOCK_TIKTOK_URL } /> );

    const scripts = document.querySelectorAll( 'script[src="https://www.tiktok.com/embed.js"]' );
    expect( scripts ).toHaveLength( 1 );
  });
});

describe( "TikTokEmbed — dark mode", () => {
  it( "renders dark oEmbed HTML when prefers-color-scheme is dark", () => {
    mockMatchMedia( false );

    render( <TikTokEmbed oembed={ MOCK_OEMBED } oembedDark={ MOCK_OEMBED_DARK } url={ MOCK_TIKTOK_URL } /> );

    expect( screen.getByText( "Dark content" ) ).toBeInTheDocument();
  });

  it( "renders light oEmbed HTML when prefers-color-scheme is light", () => {
    mockMatchMedia( true );

    render( <TikTokEmbed oembed={ MOCK_OEMBED } oembedDark={ MOCK_OEMBED_DARK } url={ MOCK_TIKTOK_URL } /> );

    expect( screen.getByText( "Test content" ) ).toBeInTheDocument();
  });

  it( "falls back to light oEmbed when oembedDark is not provided", () => {
    mockMatchMedia( false );

    render( <TikTokEmbed oembed={ MOCK_OEMBED } url={ MOCK_TIKTOK_URL } /> );

    expect( screen.getByText( "Test content" ) ).toBeInTheDocument();
  });
});
