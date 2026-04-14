import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal( "fetch", mockFetch );

import { getOembed, SoundCloudOembed } from "./getOembed";

const SOUNDCLOUD_TRACK_URL = "https://soundcloud.com/artist/track-name";

const MOCK_OEMBED_RESPONSE: SoundCloudOembed = {
  title: "Test Track",
  author_name: "Test Artist",
  author_url: "https://soundcloud.com/artist",
  html: '<iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/123"></iframe>',
  thumbnail_url: "https://i1.sndcdn.com/artworks-000-t500x500.jpg",
};

describe( "getOembed", () => {
  beforeEach( () => {
    vi.resetAllMocks();
  });

  it( "fetches oEmbed data for a valid SoundCloud URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve( MOCK_OEMBED_RESPONSE ),
    });

    const result = await getOembed( SOUNDCLOUD_TRACK_URL );

    expect( mockFetch ).toHaveBeenCalledWith(
      `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent( SOUNDCLOUD_TRACK_URL )}`,
    );
    expect( result ).toEqual( MOCK_OEMBED_RESPONSE );
  });

  it( "returns null when the fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

    const result = await getOembed( SOUNDCLOUD_TRACK_URL );

    expect( result ).toBeNull();
  });

  it( "returns null when fetch throws a network error", async () => {
    mockFetch.mockRejectedValueOnce( new Error( "Network error" ) );

    const result = await getOembed( SOUNDCLOUD_TRACK_URL );

    expect( result ).toBeNull();
  });
});
