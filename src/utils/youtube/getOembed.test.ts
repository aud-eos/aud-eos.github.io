import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal( "fetch", mockFetch );

import { getOembed, YouTubeOembed } from "./getOembed";

const YOUTUBE_VIDEO_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

const MOCK_OEMBED_RESPONSE: YouTubeOembed = {
  title: "Test Video",
  author_name: "Test Channel",
  author_url: "https://www.youtube.com/@testchannel",
  html: '<iframe width="200" height="113" src="https://www.youtube.com/embed/dQw4w9WgXcQ?feature=oembed" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen title="Test Video"></iframe>',
  thumbnail_url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
};

describe( "getOembed", () => {
  beforeEach( () => {
    vi.resetAllMocks();
  });

  it( "fetches oEmbed data for a valid YouTube URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve( MOCK_OEMBED_RESPONSE ),
    });

    const result = await getOembed( YOUTUBE_VIDEO_URL );

    expect( mockFetch ).toHaveBeenCalledWith(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent( YOUTUBE_VIDEO_URL )}`,
    );
    expect( result ).toEqual( MOCK_OEMBED_RESPONSE );
  });

  it( "returns null when the fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

    const result = await getOembed( YOUTUBE_VIDEO_URL );

    expect( result ).toBeNull();
  });

  it( "returns null when fetch throws a network error", async () => {
    mockFetch.mockRejectedValueOnce( new Error( "Network error" ) );

    const result = await getOembed( YOUTUBE_VIDEO_URL );

    expect( result ).toBeNull();
  });
});
