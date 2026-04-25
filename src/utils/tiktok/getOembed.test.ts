import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal( "fetch", mockFetch );

import { getOembed, TikTokOembed } from "./getOembed";

const TIKTOK_VIDEO_URL = "https://www.tiktok.com/@testuser/video/1234567890";

const MOCK_OEMBED_RESPONSE: TikTokOembed = {
  title: "Test TikTok Video",
  author_name: "testuser",
  author_url: "https://www.tiktok.com/@testuser",
  html: '<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@testuser/video/1234567890"><section>Test content</section></blockquote><script async src="https://www.tiktok.com/embed.js"></script>',
  thumbnail_url: "https://p16-sign.tiktokcdn.com/obj/test-thumbnail.jpg",
};

describe( "getOembed", () => {
  beforeEach( () => {
    vi.resetAllMocks();
  });

  it( "fetches oEmbed data for a valid TikTok URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve( MOCK_OEMBED_RESPONSE ),
    });

    const result = await getOembed( TIKTOK_VIDEO_URL );

    expect( mockFetch ).toHaveBeenCalledWith(
      `https://www.tiktok.com/oembed?format=json&url=${encodeURIComponent( TIKTOK_VIDEO_URL )}`,
    );
    expect( result ).toEqual( MOCK_OEMBED_RESPONSE );
  });

  it( "returns null when the fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

    const result = await getOembed( TIKTOK_VIDEO_URL );

    expect( result ).toBeNull();
  });

  it( "returns null when fetch throws a network error", async () => {
    mockFetch.mockRejectedValueOnce( new Error( "Network error" ) );

    const result = await getOembed( TIKTOK_VIDEO_URL );

    expect( result ).toBeNull();
  });

  it( "appends dark_mode=1 when darkMode option is true", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve( MOCK_OEMBED_RESPONSE ),
    });

    await getOembed( TIKTOK_VIDEO_URL, { darkMode: true });

    expect( mockFetch ).toHaveBeenCalledWith(
      `https://www.tiktok.com/oembed?format=json&url=${encodeURIComponent( TIKTOK_VIDEO_URL )}&dark_mode=1`,
    );
  });

  it( "does not append dark_mode when darkMode option is false", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve( MOCK_OEMBED_RESPONSE ),
    });

    await getOembed( TIKTOK_VIDEO_URL, { darkMode: false });

    expect( mockFetch ).toHaveBeenCalledWith(
      `https://www.tiktok.com/oembed?format=json&url=${encodeURIComponent( TIKTOK_VIDEO_URL )}`,
    );
  });
});
