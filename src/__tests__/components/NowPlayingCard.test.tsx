import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";

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

  it( "renders the offline placeholder when the fetch rejects", async () => {
    vi.stubGlobal( "fetch", vi.fn( async () => {
      throw new Error( "network failure" );
    }) );
    render( <NowPlayingCard /> );
    expect( await screen.findByText( "● Stream offline" ) ).toBeInTheDocument();
    expect( screen.getByText( /Visit player/ ) ).toBeInTheDocument();
  });

  it( "renders the offline placeholder when fetch returns non-2xx", async () => {
    vi.stubGlobal( "fetch", vi.fn( async () => ({
      ok: false,
      status: 500,
      json: async () => ({}),
    }) ) );
    render( <NowPlayingCard /> );
    expect( await screen.findByText( "● Stream offline" ) ).toBeInTheDocument();
  });

  it( "renders the offline placeholder when JSON parsing fails", async () => {
    vi.stubGlobal( "fetch", vi.fn( async () => ({
      ok: true,
      status: 200,
      json: async () => { throw new SyntaxError( "bad json" ); },
    }) ) );
    render( <NowPlayingCard /> );
    expect( await screen.findByText( "● Stream offline" ) ).toBeInTheDocument();
  });

  it( "polls every 30 seconds when the tab is visible", async () => {
    const fetchMock = vi.fn( async () => ({
      ok: true, status: 200, json: async () => livePayload,
    }) );
    vi.stubGlobal( "fetch", fetchMock );
    vi.useFakeTimers();
    try {
      render( <NowPlayingCard /> );
      await vi.advanceTimersByTimeAsync( 0 );
      expect( fetchMock ).toHaveBeenCalledTimes( 1 );
      await vi.advanceTimersByTimeAsync( 30_000 );
      expect( fetchMock ).toHaveBeenCalledTimes( 2 );
      await vi.advanceTimersByTimeAsync( 30_000 );
      expect( fetchMock ).toHaveBeenCalledTimes( 3 );
    } finally {
      vi.useRealTimers();
    }
  });

  it( "skips the polled fetch when the tab is hidden", async () => {
    const fetchMock = vi.fn( async () => ({
      ok: true, status: 200, json: async () => livePayload,
    }) );
    vi.stubGlobal( "fetch", fetchMock );
    vi.useFakeTimers();
    try {
      render( <NowPlayingCard /> );
      await vi.advanceTimersByTimeAsync( 0 );
      expect( fetchMock ).toHaveBeenCalledTimes( 1 );
      Object.defineProperty( document, "visibilityState", {
        value: "hidden",
        configurable: true,
      });
      await vi.advanceTimersByTimeAsync( 30_000 );
      expect( fetchMock ).toHaveBeenCalledTimes( 1 );
    } finally {
      Object.defineProperty( document, "visibilityState", {
        value: "visible",
        configurable: true,
      });
      vi.useRealTimers();
    }
  });

  it( "fetches immediately when visibilitychange fires with visible", async () => {
    const fetchMock = vi.fn( async () => ({
      ok: true, status: 200, json: async () => livePayload,
    }) );
    vi.stubGlobal( "fetch", fetchMock );
    Object.defineProperty( document, "visibilityState", {
      value: "hidden",
      configurable: true,
    });
    render( <NowPlayingCard /> );
    await waitFor( () => expect( fetchMock ).toHaveBeenCalledTimes( 1 ) );
    Object.defineProperty( document, "visibilityState", {
      value: "visible",
      configurable: true,
    });
    document.dispatchEvent( new Event( "visibilitychange" ) );
    await waitFor( () => expect( fetchMock ).toHaveBeenCalledTimes( 2 ) );
  });

  it( "clears polling and listener on unmount", async () => {
    const fetchMock = vi.fn( async () => ({
      ok: true, status: 200, json: async () => livePayload,
    }) );
    vi.stubGlobal( "fetch", fetchMock );
    vi.useFakeTimers();
    try {
      const { unmount } = render( <NowPlayingCard /> );
      await vi.advanceTimersByTimeAsync( 0 );
      expect( fetchMock ).toHaveBeenCalledTimes( 1 );
      unmount();
      await vi.advanceTimersByTimeAsync( 60_000 );
      document.dispatchEvent( new Event( "visibilitychange" ) );
      expect( fetchMock ).toHaveBeenCalledTimes( 1 );
    } finally {
      vi.useRealTimers();
    }
  });

  it( "auto-recovers from error on a subsequent successful poll", async () => {
    let callCount = 0;
    vi.stubGlobal( "fetch", vi.fn( async () => {
      callCount++;
      if( callCount === 1 ) throw new Error( "network failure" );
      return { ok: true, status: 200, json: async () => livePayload };
    }) );
    vi.useFakeTimers();
    try {
      render( <NowPlayingCard /> );
      await act( async () => { await vi.advanceTimersByTimeAsync( 0 ); });
      expect( screen.getByText( "● Stream offline" ) ).toBeInTheDocument();
      await act( async () => { await vi.advanceTimersByTimeAsync( 30_000 ); });
      expect( screen.getByText( "Day Party vol. 1" ) ).toBeInTheDocument();
      expect( screen.queryByText( "● Stream offline" ) ).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it( "renders the initial position and duration formatted as m:ss", async () => {
    mockFetchOnce({
      ...livePayload,
      track: { ...livePayload.track, position_ms: 95_000, duration_ms: 215_000 },
    });
    render( <NowPlayingCard /> );
    expect( await screen.findByText( "1:35 / 3:35" ) ).toBeInTheDocument();
  });

  it( "formats hour-long durations as h:mm:ss", async () => {
    mockFetchOnce({
      ...livePayload,
      track: { ...livePayload.track, position_ms: 0, duration_ms: 3_725_000 },
    });
    render( <NowPlayingCard /> );
    expect( await screen.findByText( "0:00 / 1:02:05" ) ).toBeInTheDocument();
  });

  it( "advances the displayed position locally every second", async () => {
    mockFetchOnce({
      ...livePayload,
      track: { ...livePayload.track, position_ms: 60_000, duration_ms: 215_000 },
    });
    vi.useFakeTimers();
    try {
      render( <NowPlayingCard /> );
      await act( async () => { await vi.advanceTimersByTimeAsync( 0 ); });
      expect( screen.getByText( "1:00 / 3:35" ) ).toBeInTheDocument();
      await act( async () => { await vi.advanceTimersByTimeAsync( 1_000 ); });
      expect( screen.getByText( "1:01 / 3:35" ) ).toBeInTheDocument();
      await act( async () => { await vi.advanceTimersByTimeAsync( 2_000 ); });
      expect( screen.getByText( "1:03 / 3:35" ) ).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it( "caps the displayed position at duration", async () => {
    mockFetchOnce({
      ...livePayload,
      track: { ...livePayload.track, position_ms: 9_000, duration_ms: 10_000 },
    });
    vi.useFakeTimers();
    try {
      render( <NowPlayingCard /> );
      await act( async () => { await vi.advanceTimersByTimeAsync( 0 ); });
      await act( async () => { await vi.advanceTimersByTimeAsync( 5_000 ); });
      expect( screen.getByText( "0:10 / 0:10" ) ).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it( "resets the progress to track.position_ms on a new poll", async () => {
    let callCount = 0;
    vi.stubGlobal( "fetch", vi.fn( async () => {
      callCount++;
      const position = callCount === 1 ? 60_000 : 90_000;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ...livePayload,
          track: { ...livePayload.track, position_ms: position, duration_ms: 215_000 },
        }),
      };
    }) );
    vi.useFakeTimers();
    try {
      render( <NowPlayingCard /> );
      await act( async () => { await vi.advanceTimersByTimeAsync( 0 ); });
      expect( screen.getByText( "1:00 / 3:35" ) ).toBeInTheDocument();
      await act( async () => { await vi.advanceTimersByTimeAsync( 30_000 ); });
      expect( screen.getByText( "1:30 / 3:35" ) ).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it( "renders progress bar at 0% when duration_ms is 0", async () => {
    mockFetchOnce({
      ...livePayload,
      track: { ...livePayload.track, position_ms: 0, duration_ms: 0 },
    });
    render( <NowPlayingCard /> );
    const bar = await screen.findByTestId( "now-playing-progress-fill" );
    expect( bar.style.width ).toBe( "0%" );
  });
});
