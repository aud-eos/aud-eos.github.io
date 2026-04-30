import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

const livePayload = {
  channel: { slug: "main", name: "Audeos", description: "Live broadcasts and curated playlist" },
  source: "live" as const,
  track: {
    title: "Day Party vol. 1",
    artist: "DJ Audeos",
    started_at: "2026-04-30T02:08:52Z",
    duration_ms: 6552000,
    position_ms: 3370644,
  },
  next_track: { title: "droptop hotbox", artist: "DJ Audeos" },
  listener_count: 5,
};

function mockFetchOnce( body: unknown, ok = true ) {
  const response = {
    ok,
    status: ok ? 200 : 500,
    json: async () => body,
  };
  vi.stubGlobal( "fetch", vi.fn( async () => response ) );
}

beforeEach( () => {
  Object.defineProperty( document, "visibilityState", {
    value: "visible",
    configurable: true,
  });
});

afterEach( () => {
  vi.unstubAllGlobals();
});

import NowPlayingCard from "@/components/NowPlaying/NowPlayingCard";

describe( "NowPlayingCard", () => {
  it( "renders the loading skeleton on first render", () => {
    mockFetchOnce( livePayload );
    render( <NowPlayingCard /> );
    expect( screen.getByTestId( "now-playing-skeleton" ) ).toBeInTheDocument();
  });

  it( "fetches the now-playing endpoint on mount", () => {
    const fetchMock = vi.fn( async () => ({ ok: true, status: 200, json: async () => livePayload }) );
    vi.stubGlobal( "fetch", fetchMock );
    render( <NowPlayingCard /> );
    expect( fetchMock ).toHaveBeenCalledWith( "https://play.audeos.com/api/now-playing/main" );
  });

  it( "renders the track title and artist after the fetch resolves", async () => {
    mockFetchOnce( livePayload );
    render( <NowPlayingCard /> );
    expect( await screen.findByText( "Day Party vol. 1" ) ).toBeInTheDocument();
    expect( screen.getByText( "DJ Audeos" ) ).toBeInTheDocument();
  });

  it( "renders the source label for source=live", async () => {
    mockFetchOnce({ ...livePayload, source: "live" });
    render( <NowPlayingCard /> );
    expect( await screen.findByText( "● Live now" ) ).toBeInTheDocument();
  });

  it( "renders the source label for source=scheduled", async () => {
    mockFetchOnce({ ...livePayload, source: "scheduled" });
    render( <NowPlayingCard /> );
    expect( await screen.findByText( "Scheduled show" ) ).toBeInTheDocument();
  });

  it( "renders the source label for source=loop_fallback", async () => {
    mockFetchOnce({ ...livePayload, source: "loop_fallback" });
    render( <NowPlayingCard /> );
    expect( await screen.findByText( "On rotation" ) ).toBeInTheDocument();
  });

  it( "renders 'No metadata available.' when track is null", async () => {
    mockFetchOnce({ ...livePayload, track: null });
    render( <NowPlayingCard /> );
    expect( await screen.findByText( "No metadata available." ) ).toBeInTheDocument();
  });

  it( "skips the artist line when track.artist is null", async () => {
    mockFetchOnce({ ...livePayload, track: { ...livePayload.track, artist: null } });
    render( <NowPlayingCard /> );
    await screen.findByText( "Day Party vol. 1" );
    expect( screen.queryByText( "DJ Audeos" ) ).toBeNull();
  });

  it( "renders the listener count and Tune in CTA", async () => {
    mockFetchOnce( livePayload );
    render( <NowPlayingCard /> );
    expect( await screen.findByText( /5 listening/ ) ).toBeInTheDocument();
    expect( screen.getByText( /Tune in/ ) ).toBeInTheDocument();
  });

  it( "renders the channel name and description in the footer", async () => {
    mockFetchOnce( livePayload );
    render( <NowPlayingCard /> );
    expect( await screen.findByText( /Audeos · Live broadcasts and curated playlist/ ) ).toBeInTheDocument();
  });

  it( "renders only the channel name when description is null", async () => {
    mockFetchOnce({ ...livePayload, channel: { ...livePayload.channel, description: null } });
    render( <NowPlayingCard /> );
    const footer = await screen.findByTestId( "now-playing-channel-info" );
    expect( footer.textContent ).toBe( "Audeos" );
  });

  it( "renders the up-next line when next_track is present", async () => {
    mockFetchOnce( livePayload );
    render( <NowPlayingCard /> );
    expect( await screen.findByText( /Up next · droptop hotbox · DJ Audeos/ ) ).toBeInTheDocument();
  });

  it( "skips the up-next line when next_track is null", async () => {
    mockFetchOnce({ ...livePayload, next_track: null });
    render( <NowPlayingCard /> );
    await screen.findByText( "Day Party vol. 1" );
    expect( screen.queryByText( /Up next/ ) ).toBeNull();
  });

  it( "renders up-next without artist when next_track.artist is null", async () => {
    mockFetchOnce({
      ...livePayload,
      next_track: { title: "droptop hotbox", artist: null },
    });
    render( <NowPlayingCard /> );
    expect( await screen.findByText( "Up next · droptop hotbox" ) ).toBeInTheDocument();
  });
});
