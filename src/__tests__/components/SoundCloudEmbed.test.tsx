import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock( "next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a"> ) => (
    <a href={ href } { ...props }>{ children }</a>
  ),
}) );

import { SoundCloudEmbed } from "@/components/SoundCloudEmbed";
import { SoundCloudOembed } from "@/utils/soundcloud/getOembed";

const MOCK_SOUNDCLOUD_URL = "https://soundcloud.com/test-artist/test-track";

const MOCK_OEMBED: SoundCloudOembed = {
  title: "Test Track",
  author_name: "Test Artist",
  author_url: "https://soundcloud.com/test-artist",
  html: '<iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/123"></iframe>',
  thumbnail_url: "https://i1.sndcdn.com/artworks-000-t500x500.jpg",
};

describe( "SoundCloudEmbed", () => {
  it( "renders an iframe with the src extracted from oEmbed html", () => {
    render( <SoundCloudEmbed oembed={ MOCK_OEMBED } url={ MOCK_SOUNDCLOUD_URL } /> );

    const iframe = screen.getByTitle( "Test Track by Test Artist" );
    expect( iframe ).toBeInTheDocument();
    expect( iframe.tagName ).toBe( "IFRAME" );
    expect( iframe ).toHaveAttribute(
      "src",
      "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/123",
    );
  });

  it( "renders the title as a link to the SoundCloud URL that opens in a new tab", () => {
    render( <SoundCloudEmbed oembed={ MOCK_OEMBED } url={ MOCK_SOUNDCLOUD_URL } /> );

    const titleLink = screen.getByRole( "link", { name: /Test Track/i });
    expect( titleLink ).toHaveAttribute( "href", MOCK_SOUNDCLOUD_URL );
    expect( titleLink ).toHaveAttribute( "target", "_blank" );
    expect( titleLink ).toHaveAttribute( "rel", "noopener noreferrer" );
  });

  it( "renders a SoundCloud link to the author page that opens in a new tab", () => {
    render( <SoundCloudEmbed oembed={ MOCK_OEMBED } url={ MOCK_SOUNDCLOUD_URL } /> );

    const soundcloudLink = screen.getByRole( "link", { name: /SoundCloud/i });
    expect( soundcloudLink ).toHaveAttribute( "href", "https://soundcloud.com/test-artist" );
    expect( soundcloudLink ).toHaveAttribute( "target", "_blank" );
  });

  it( "does not render an iframe when the src is not from w.soundcloud.com", () => {
    const maliciousOembed: SoundCloudOembed = {
      ...MOCK_OEMBED,
      html: '<iframe src="https://evil.com/exploit"></iframe>',
    };

    render( <SoundCloudEmbed oembed={ maliciousOembed } url={ MOCK_SOUNDCLOUD_URL } /> );

    expect( document.querySelector( "iframe" ) ).toBeNull();
  });
});
