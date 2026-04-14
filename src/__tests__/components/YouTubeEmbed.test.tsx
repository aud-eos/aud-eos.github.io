import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock( "next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a"> ) => (
    <a href={ href } { ...props }>{ children }</a>
  ),
}) );

import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import { YouTubeOembed } from "@/utils/youtube/getOembed";

const MOCK_YOUTUBE_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

const MOCK_OEMBED: YouTubeOembed = {
  title: "Test Video",
  author_name: "Test Channel",
  author_url: "https://www.youtube.com/@testchannel",
  html: '<iframe width="200" height="113" src="https://www.youtube.com/embed/dQw4w9WgXcQ?feature=oembed" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen title="Test Video"></iframe>',
  thumbnail_url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
};

describe( "YouTubeEmbed", () => {
  it( "renders an iframe with the src extracted from oEmbed html", () => {
    render( <YouTubeEmbed oembed={ MOCK_OEMBED } url={ MOCK_YOUTUBE_URL } /> );

    const iframe = screen.getByTitle( "Test Video" );
    expect( iframe ).toBeInTheDocument();
    expect( iframe.tagName ).toBe( "IFRAME" );
    expect( iframe ).toHaveAttribute(
      "src",
      "https://www.youtube.com/embed/dQw4w9WgXcQ?feature=oembed",
    );
  });

  it( "renders the video title as a link to the YouTube URL that opens in a new tab", () => {
    render( <YouTubeEmbed oembed={ MOCK_OEMBED } url={ MOCK_YOUTUBE_URL } /> );

    const titleLink = screen.getByRole( "link", { name: /Test Video/i });
    expect( titleLink ).toHaveAttribute( "href", MOCK_YOUTUBE_URL );
    expect( titleLink ).toHaveAttribute( "target", "_blank" );
    expect( titleLink ).toHaveAttribute( "rel", "noopener noreferrer" );
  });

  it( "renders a YouTube link to the channel that opens in a new tab", () => {
    render( <YouTubeEmbed oembed={ MOCK_OEMBED } url={ MOCK_YOUTUBE_URL } /> );

    const youtubeLink = screen.getByRole( "link", { name: /YouTube/i });
    expect( youtubeLink ).toHaveAttribute( "href", "https://www.youtube.com/@testchannel" );
    expect( youtubeLink ).toHaveAttribute( "target", "_blank" );
  });

  it( "does not render an iframe when the src is not from www.youtube.com", () => {
    const maliciousOembed: YouTubeOembed = {
      ...MOCK_OEMBED,
      html: '<iframe src="https://evil.com/exploit"></iframe>',
    };

    render( <YouTubeEmbed oembed={ maliciousOembed } url={ MOCK_YOUTUBE_URL } /> );

    expect( document.querySelector( "iframe" ) ).toBeNull();
  });
});
