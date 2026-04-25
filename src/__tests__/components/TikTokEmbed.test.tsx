import { describe, it, expect, vi } from "vitest";
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

describe( "TikTokEmbed", () => {
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

});
