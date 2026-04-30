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
});
