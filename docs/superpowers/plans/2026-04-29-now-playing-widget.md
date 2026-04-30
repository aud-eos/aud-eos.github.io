# Now-Playing Widget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a hero card on the home page that polls `play.audeos.com`'s now-playing API every 30s, renders track info with smooth progress bar + up-next + channel context + listener count, and links to the player in a new tab. Quietly falls back to a "Stream offline" placeholder on fetch error and auto-recovers on the next successful poll.

**Architecture:** Pure client-side React component (`useEffect` + `useState` + `fetch`) — no SSR data, no build-time API calls. Module-level constant for the play origin. Local 1-second timer between polls smooths the progress bar. SCSS module matches the existing post-card aesthetic with `prefers-color-scheme` overrides.

**Tech Stack:** Next.js (Pages Router, `output: "export"`), React 19, TypeScript, SCSS modules, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-04-29-now-playing-widget-design.md`

**Branch:** `now-playing-widget` (already created, off `main`).

---

### Task 1: Add `AUDEOS_PLAY_ORIGIN` constant

**Files:**
- Modify: `src/constants.ts`

- [ ] **Step 1: Append the constant**

Append to the end of `src/constants.ts`:

```typescript
export const AUDEOS_PLAY_ORIGIN = "https://play.audeos.com";
```

- [ ] **Step 2: Run typecheck**

Run: `yarn typecheck`
Expected: PASS — no consumers yet.

- [ ] **Step 3: Commit**

```bash
git add src/constants.ts
git commit -m "feat: add AUDEOS_PLAY_ORIGIN constant"
```

---

### Task 2: Component scaffold — skeleton, initial fetch, track render

**Files:**
- Create: `src/components/NowPlaying/NowPlayingCard.tsx`
- Create: `src/__tests__/components/NowPlayingCard.test.tsx`

The first slice of the component: it mounts, fetches from `/api/now-playing/main`, renders a loading skeleton until data arrives, then renders the source label + track title + artist. Polling, smooth progress, and offline state come in later tasks. The SCSS module is a placeholder for now; styling lands in Task 7.

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/components/NowPlayingCard.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn test src/__tests__/components/NowPlayingCard.test.tsx`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement the component scaffold**

Create `src/components/NowPlaying/NowPlayingCard.tsx`:

```typescript
import { useEffect, useState } from "react";
import { AUDEOS_PLAY_ORIGIN } from "@/constants";
import styles from "./NowPlayingCard.module.scss";

const MAIN_CHANNEL_SLUG = "main";

type Track = {
  title: string;
  artist: string | null;
  started_at: string;
  duration_ms: number;
  position_ms: number;
};

type NowPlaying = {
  channel: { slug: string; name: string; description: string | null };
  source: "live" | "scheduled" | "loop_fallback";
  track: Track | null;
  next_track: { title: string; artist: string | null } | null;
  listener_count: number;
};

const SOURCE_LABEL: Record<NowPlaying["source"], string> = {
  live: "● Live now",
  scheduled: "Scheduled show",
  loop_fallback: "On rotation",
};

export default function NowPlayingCard() {
  const [ data, setData ] = useState<NowPlaying | null>( null );

  useEffect( () => {
    let cancelled = false;
    const fetchOnce = async () => {
      try {
        const response = await fetch(
          `${AUDEOS_PLAY_ORIGIN}/api/now-playing/${MAIN_CHANNEL_SLUG}`,
        );
        if( !response.ok ) throw new Error( `HTTP ${response.status}` );
        const payload = await response.json() as NowPlaying;
        if( !cancelled ) setData( payload );
      } catch {
        // error handling lands in Task 4
      }
    };
    fetchOnce();
    return () => { cancelled = true; };
  }, [] );

  if( !data ) {
    return <div data-testid="now-playing-skeleton" className={ styles.skeleton } />;
  }

  return (
    <a
      href={ `${AUDEOS_PLAY_ORIGIN}/channels/${data.channel.slug}` }
      target="_blank"
      rel="noopener noreferrer"
      className={ styles.card }
    >
      <p className={ styles.sourceLabel }>{ SOURCE_LABEL[data.source] }</p>
      { data.track && (
        <div>
          <h2 className={ styles.trackTitle }>{ data.track.title }</h2>
          { data.track.artist && (
            <p className={ styles.artist }>{ data.track.artist }</p>
          )}
        </div>
      )}
    </a>
  );
}
```

Also create an empty `src/components/NowPlaying/NowPlayingCard.module.scss` so the import resolves (full styling lands in Task 7):

```scss
.skeleton {}
.card {}
.sourceLabel {}
.trackTitle {}
.artist {}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn test src/__tests__/components/NowPlayingCard.test.tsx`
Expected: PASS — all 3 tests green.

- [ ] **Step 5: Run lint + full suite**

Run: `yarn lint && yarn test`
Expected: PASS, no regressions.

- [ ] **Step 6: Commit**

```bash
git add src/components/NowPlaying/ src/__tests__/components/NowPlayingCard.test.tsx
git commit -m "feat: add NowPlayingCard scaffold with track render"
```

---

### Task 3: Render variations — source label, no-metadata, channel footer, listener count, up-next

**Files:**
- Modify: `src/components/NowPlaying/NowPlayingCard.tsx`
- Modify: `src/__tests__/components/NowPlayingCard.test.tsx`

Flesh out the live-state JSX to render every property the spec calls for: `SOURCE_LABEL` mapping for all 3 source values, "No metadata available." when `track === null`, channel footer (name + optional description), listener count, "Tune in →" CTA, "Up next" line (skipped when `next_track === null`), and the artist line (skipped when `artist === null`).

- [ ] **Step 1: Append the new tests**

Append to the existing `describe( "NowPlayingCard", ... )` block in `src/__tests__/components/NowPlayingCard.test.tsx`:

```typescript
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn test src/__tests__/components/NowPlayingCard.test.tsx`
Expected: FAIL — most of the new render targets aren't present yet.

- [ ] **Step 3: Update the component**

Replace the JSX inside the `<a>` of `NowPlayingCard.tsx` with:

```typescript
  return (
    <a
      href={ `${AUDEOS_PLAY_ORIGIN}/channels/${data.channel.slug}` }
      target="_blank"
      rel="noopener noreferrer"
      className={ styles.card }
    >
      <p className={ styles.sourceLabel }>{ SOURCE_LABEL[data.source] }</p>
      { data.track ? (
        <div className={ styles.trackInfo }>
          <h2 className={ styles.trackTitle }>{ data.track.title }</h2>
          { data.track.artist && (
            <p className={ styles.artist }>{ data.track.artist }</p>
          )}
        </div>
      ) : (
        <p className={ styles.noMetadata }>No metadata available.</p>
      )}
      { data.next_track && (
        <p className={ styles.upNext }>
          Up next · { data.next_track.title }
          { data.next_track.artist && ` · ${data.next_track.artist}` }
        </p>
      )}
      <div className={ styles.footer }>
        <p data-testid="now-playing-channel-info" className={ styles.channelInfo }>
          { data.channel.name }
          { data.channel.description && ` · ${data.channel.description}` }
        </p>
        <div className={ styles.footerRow }>
          <span className={ styles.listenerCount }>
            { data.listener_count } listening
          </span>
          <span className={ styles.cta }>Tune in →</span>
        </div>
      </div>
    </a>
  );
```

Also add the new SCSS class names to `NowPlayingCard.module.scss` (still empty bodies — Task 7 styles them):

```scss
.skeleton {}
.card {}
.sourceLabel {}
.trackInfo {}
.trackTitle {}
.artist {}
.noMetadata {}
.upNext {}
.footer {}
.channelInfo {}
.footerRow {}
.listenerCount {}
.cta {}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn test src/__tests__/components/NowPlayingCard.test.tsx`
Expected: PASS — all tests (3 from Task 2 + 11 new = 14) green.

- [ ] **Step 5: Run lint + full suite**

Run: `yarn lint && yarn test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/NowPlaying/ src/__tests__/components/NowPlayingCard.test.tsx
git commit -m "feat: render full NowPlayingCard live state"
```

---

### Task 4: Stream offline state + auto-recover

**Files:**
- Modify: `src/components/NowPlaying/NowPlayingCard.tsx`
- Modify: `src/__tests__/components/NowPlayingCard.test.tsx`

Add an `errored` state that flips to `true` on any fetch failure (network error, non-2xx, parse failure) and renders a static "● Stream offline" placeholder with a "Visit player →" CTA. A subsequent successful fetch flips it back to `false` (auto-recover). Auto-recover is observable here because we trigger it via direct re-mount; full polling-based recovery comes after Task 5 introduces polling.

- [ ] **Step 1: Append the new tests**

Append to the test file:

```typescript
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
    })) );
    render( <NowPlayingCard /> );
    expect( await screen.findByText( "● Stream offline" ) ).toBeInTheDocument();
  });

  it( "renders the offline placeholder when JSON parsing fails", async () => {
    vi.stubGlobal( "fetch", vi.fn( async () => ({
      ok: true,
      status: 200,
      json: async () => { throw new SyntaxError( "bad json" ); },
    })) );
    render( <NowPlayingCard /> );
    expect( await screen.findByText( "● Stream offline" ) ).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn test src/__tests__/components/NowPlayingCard.test.tsx`
Expected: FAIL — "● Stream offline" doesn't render.

- [ ] **Step 3: Add the errored state and offline branch**

Update `NowPlayingCard.tsx`:

Add to state:

```typescript
  const [ errored, setErrored ] = useState( false );
```

Update the `fetchOnce` body inside `useEffect`:

```typescript
    const fetchOnce = async () => {
      try {
        const response = await fetch(
          `${AUDEOS_PLAY_ORIGIN}/api/now-playing/${MAIN_CHANNEL_SLUG}`,
        );
        if( !response.ok ) throw new Error( `HTTP ${response.status}` );
        const payload = await response.json() as NowPlaying;
        if( !cancelled ) {
          setData( payload );
          setErrored( false );
        }
      } catch {
        if( !cancelled ) setErrored( true );
      }
    };
```

Add the offline-render branch BEFORE the `if( !data )` skeleton check:

```typescript
  if( errored ) {
    return (
      <a
        href={ `${AUDEOS_PLAY_ORIGIN}/channels/${MAIN_CHANNEL_SLUG}` }
        target="_blank"
        rel="noopener noreferrer"
        className={ styles.offline }
      >
        <p className={ styles.sourceLabel }>● Stream offline</p>
        <p className={ styles.offlineCta }>Visit player →</p>
      </a>
    );
  }
```

Add the new class names to the SCSS module:

```scss
.offline {}
.offlineCta {}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn test src/__tests__/components/NowPlayingCard.test.tsx`
Expected: PASS — 17 tests green.

- [ ] **Step 5: Run lint + full suite**

Run: `yarn lint && yarn test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/NowPlaying/ src/__tests__/components/NowPlayingCard.test.tsx
git commit -m "feat: render Stream offline placeholder on fetch error"
```

---

### Task 5: Polling timer + visibility-aware refresh + cleanup + auto-recover

**Files:**
- Modify: `src/components/NowPlaying/NowPlayingCard.tsx`
- Modify: `src/__tests__/components/NowPlayingCard.test.tsx`

Add the 30-second polling timer that skips fetches when `document.visibilityState !== "visible"`, a `visibilitychange` listener that triggers an immediate fetch when the tab becomes visible, and cleanup of both on unmount. The auto-recover path (error → success on next poll) is testable here.

- [ ] **Step 1: Append the new tests**

Append to the test file. Note: tests that rely on timers wrap setup in `vi.useFakeTimers()` / `vi.useRealTimers()`.

```typescript
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
      await vi.advanceTimersByTimeAsync( 0 );
      // First poll errored → offline placeholder
      expect( screen.getByText( "● Stream offline" ) ).toBeInTheDocument();
      await vi.advanceTimersByTimeAsync( 30_000 );
      // Second poll succeeded → live render
      expect( screen.getByText( "Day Party vol. 1" ) ).toBeInTheDocument();
      expect( screen.queryByText( "● Stream offline" ) ).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn test src/__tests__/components/NowPlayingCard.test.tsx`
Expected: FAIL — polling, visibility, and auto-recover behaviors don't exist yet.

- [ ] **Step 3: Add polling, visibility listener, cleanup**

Replace the existing `useEffect` body in `NowPlayingCard.tsx` with the full version:

```typescript
  useEffect( () => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const fetchOnce = async () => {
      try {
        const response = await fetch(
          `${AUDEOS_PLAY_ORIGIN}/api/now-playing/${MAIN_CHANNEL_SLUG}`,
        );
        if( !response.ok ) throw new Error( `HTTP ${response.status}` );
        const payload = await response.json() as NowPlaying;
        if( !cancelled ) {
          setData( payload );
          setErrored( false );
        }
      } catch {
        if( !cancelled ) setErrored( true );
      }
    };

    const schedule = () => {
      timer = setTimeout( () => {
        if( document.visibilityState === "visible" ) fetchOnce();
        schedule();
      }, POLL_INTERVAL_MS );
    };

    const onVisibility = () => {
      if( document.visibilityState === "visible" ) fetchOnce();
    };

    fetchOnce();
    schedule();
    document.addEventListener( "visibilitychange", onVisibility );

    return () => {
      cancelled = true;
      if( timer ) clearTimeout( timer );
      document.removeEventListener( "visibilitychange", onVisibility );
    };
  }, [] );
```

Add the constant near the top of the file (just below `MAIN_CHANNEL_SLUG`):

```typescript
const POLL_INTERVAL_MS = 30_000;
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn test src/__tests__/components/NowPlayingCard.test.tsx`
Expected: PASS — 22 tests green.

If tests time out, the issue is usually `vi.advanceTimersByTimeAsync` interacting with promise microtasks. The pattern in the tests above (await each advance, await waitFor) handles this.

- [ ] **Step 5: Run lint + full suite**

Run: `yarn lint && yarn test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/NowPlaying/ src/__tests__/components/NowPlayingCard.test.tsx
git commit -m "feat: poll now-playing API every 30s with visibility-aware refresh"
```

---

### Task 6: Smooth progress bar with local 1-second ticking

**Files:**
- Modify: `src/components/NowPlaying/NowPlayingCard.tsx`
- Modify: `src/__tests__/components/NowPlayingCard.test.tsx`

Add a separate `useEffect` keyed on `data` that advances `displayPositionMs` by 1000ms every second, capped at `track.duration_ms`. Resets to `track.position_ms` whenever a new poll lands. Renders a progress bar (filled width = percent through the track) and a `m:ss / m:ss` time display. Includes a `formatMs` helper.

- [ ] **Step 1: Append the new tests**

Append to the test file:

```typescript
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
      await vi.advanceTimersByTimeAsync( 0 );
      expect( screen.getByText( "1:00 / 3:35" ) ).toBeInTheDocument();
      await vi.advanceTimersByTimeAsync( 1_000 );
      expect( screen.getByText( "1:01 / 3:35" ) ).toBeInTheDocument();
      await vi.advanceTimersByTimeAsync( 2_000 );
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
      await vi.advanceTimersByTimeAsync( 0 );
      await vi.advanceTimersByTimeAsync( 5_000 );
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
      await vi.advanceTimersByTimeAsync( 0 );
      expect( screen.getByText( "1:00 / 3:35" ) ).toBeInTheDocument();
      await vi.advanceTimersByTimeAsync( 30_000 );
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn test src/__tests__/components/NowPlayingCard.test.tsx`
Expected: FAIL — progress bar and time display don't render yet.

- [ ] **Step 3: Add `displayPositionMs` state, ticker effect, formatter, JSX**

Update `NowPlayingCard.tsx`:

Add a constant near the existing constants:

```typescript
const PROGRESS_TICK_MS = 1_000;
```

Add the formatter helper above the component:

```typescript
function formatMs( ms: number ): string {
  const totalSeconds = Math.floor( ms / 1000 );
  const hours = Math.floor( totalSeconds / 3600 );
  const minutes = Math.floor( ( totalSeconds % 3600 ) / 60 );
  const seconds = totalSeconds % 60;
  if( hours > 0 ) {
    const minutesPadded = minutes.toString().padStart( 2, "0" );
    const secondsPadded = seconds.toString().padStart( 2, "0" );
    return `${hours}:${minutesPadded}:${secondsPadded}`;
  }
  const secondsPadded = seconds.toString().padStart( 2, "0" );
  return `${minutes}:${secondsPadded}`;
}
```

Add `displayPositionMs` state near `data`:

```typescript
  const [ displayPositionMs, setDisplayPositionMs ] = useState( 0 );
```

Add a new `useEffect` keyed on `data` AFTER the polling `useEffect`:

```typescript
  useEffect( () => {
    const track = data?.track;
    if( !track ) {
      setDisplayPositionMs( 0 );
      return;
    }
    setDisplayPositionMs( track.position_ms );
    const interval = setInterval( () => {
      setDisplayPositionMs( previous =>
        Math.min( previous + PROGRESS_TICK_MS, track.duration_ms )
      );
    }, PROGRESS_TICK_MS );
    return () => clearInterval( interval );
  }, [ data ] );
```

Update the JSX inside the `data.track` branch to include the progress bar between the title/artist and the up-next line:

```typescript
      { data.track ? (
        <div className={ styles.trackInfo }>
          <h2 className={ styles.trackTitle }>{ data.track.title }</h2>
          { data.track.artist && (
            <p className={ styles.artist }>{ data.track.artist }</p>
          )}
          <div className={ styles.progress }>
            <div className={ styles.progressTrack }>
              <div
                data-testid="now-playing-progress-fill"
                className={ styles.progressFill }
                style={ {
                  width: data.track.duration_ms > 0
                    ? `${Math.min( 100, ( displayPositionMs / data.track.duration_ms ) * 100 )}%`
                    : "0%",
                } }
              />
            </div>
            <span className={ styles.progressTime }>
              { formatMs( displayPositionMs ) } / { formatMs( data.track.duration_ms ) }
            </span>
          </div>
        </div>
      ) : (
        <p className={ styles.noMetadata }>No metadata available.</p>
      )}
```

Add the new class names to the SCSS module:

```scss
.progress {}
.progressTrack {}
.progressFill {}
.progressTime {}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn test src/__tests__/components/NowPlayingCard.test.tsx`
Expected: PASS — 28 tests green.

- [ ] **Step 5: Run lint + full suite**

Run: `yarn lint && yarn test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/NowPlaying/ src/__tests__/components/NowPlayingCard.test.tsx
git commit -m "feat: smooth progress bar with 1s local ticking"
```

---

### Task 7: SCSS module — final visual treatment

**Files:**
- Modify: `src/components/NowPlaying/NowPlayingCard.module.scss`

Replace the placeholder empty rules with the full SCSS that matches the existing post-card aesthetic. Light/dark mode via `prefers-color-scheme`. Reduced motion override.

- [ ] **Step 1: Replace the SCSS file contents**

Replace the entire contents of `src/components/NowPlaying/NowPlayingCard.module.scss` with:

```scss
.card,
.offline {
  display: block;
  width: 100%;
  max-width: 64rem;
  margin: 0 auto 4rem;
  padding: 1.5rem 1.75rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;

  &:hover {
    box-shadow: 0 10px 32px rgba(0, 0, 0, 0.4);
    border-color: rgba(255, 255, 255, 0.16);
    transform: translateY(-1px);
  }

  @media (prefers-color-scheme: light) {
    background: rgba(0, 0, 0, 0.04);
    border-color: rgba(0, 0, 0, 0.08);
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.1);

    &:hover {
      box-shadow: 0 8px 26px rgba(0, 0, 0, 0.16);
      border-color: rgba(0, 0, 0, 0.16);
    }
  }
}

.skeleton {
  composes: card;
  min-height: 12rem;
  pointer-events: none;
  cursor: default;
  animation: pulse 1.6s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.9; }
}

.sourceLabel {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  opacity: 0.85;
}

.trackInfo {
  margin: 0.6rem 0 0;
}

.trackTitle {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1.2;
}

.artist {
  margin: 0.2rem 0 0;
  font-size: 1rem;
  opacity: 0.7;
}

.noMetadata {
  margin: 0.6rem 0 0;
  font-style: italic;
  opacity: 0.6;
}

.progress {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progressTrack {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;

  @media (prefers-color-scheme: light) {
    background: rgba(0, 0, 0, 0.12);
  }
}

.progressFill {
  height: 100%;
  background: currentColor;
  transition: width 0.4s linear;
}

.progressTime {
  font-family: ui-monospace, "SFMono-Regular", Menlo, monospace;
  font-size: 0.85rem;
  opacity: 0.7;
  white-space: nowrap;
}

.upNext {
  margin: 0.85rem 0 0;
  font-size: 0.9rem;
  font-style: italic;
  opacity: 0.7;
}

.footer {
  margin-top: 1.25rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);

  @media (prefers-color-scheme: light) {
    border-top-color: rgba(0, 0, 0, 0.08);
  }
}

.channelInfo {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.6;
}

.footerRow {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.9rem;
}

.listenerCount {
  opacity: 0.7;
}

.cta {
  font-weight: 600;
}

.offlineCta {
  margin: 0.6rem 0 0;
  font-size: 0.95rem;
  font-weight: 600;
  opacity: 0.8;
}

@media (prefers-reduced-motion: reduce) {
  .card,
  .offline {
    transition: none;

    &:hover {
      transform: none;
    }
  }

  .progressFill {
    transition: none;
  }

  .skeleton {
    animation: none;
  }
}
```

Note: `composes: card` in `.skeleton` uses CSS modules' composition — `.skeleton` inherits all `.card` properties and adds the skeleton-specific ones.

- [ ] **Step 2: Run the build and check the SCSS compiles**

Run: `yarn lint && yarn test`
Expected: PASS — SCSS compiles via the existing pipeline.

- [ ] **Step 3: Commit**

```bash
git add src/components/NowPlaying/NowPlayingCard.module.scss
git commit -m "feat: style NowPlayingCard to match site card aesthetic"
```

---

### Task 8: Render `<NowPlayingCard />` on the home page

**Files:**
- Modify: `src/pages/index.tsx`

Add the import and render `<NowPlayingCard />` inside `<main>`, BEFORE `<CategoryPostSections>`.

- [ ] **Step 1: Add the import**

In `src/pages/index.tsx`, add to the existing import block:

```typescript
import NowPlayingCard from "@/components/NowPlaying/NowPlayingCard";
```

- [ ] **Step 2: Render inside `<main>`**

Find the `<main className={ styles.main }>` block. Add `<NowPlayingCard />` as the first child:

```typescript
        <main className={ styles.main }>
          <NowPlayingCard />
          <CategoryPostSections
            posts={ posts }
            categoryConfig={ categoryConfig }
          />
          <Link href="/page/1" className={ styles.allPostsLink }>
            Browse all posts →
          </Link>
        </main>
```

- [ ] **Step 3: Run typecheck + lint + full suite**

Run: `yarn typecheck && yarn lint && yarn test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.tsx
git commit -m "feat: render NowPlayingCard on the home page"
```

---

### Task 9: Final verification + PR

**Files:**
- (No file changes — verification + PR creation only.)

- [ ] **Step 1: Run the full test suite**

Run: `yarn test`
Expected: PASS — 28 new tests on `NowPlayingCard` plus prior baseline. Total around 197 tests across 25 files.

- [ ] **Step 2: Run lint**

Run: `yarn lint`
Expected: PASS.

- [ ] **Step 3: Run the production build**

Run: `yarn build`
Expected: PASS — the home page builds with the widget rendering its skeleton state in the static HTML (the actual data fetch happens client-side at runtime).

NOTE: this build hits Contentful for the static export. If you've recently merged the memoization PR (#92), it should consume only ~3 CDA calls.

- [ ] **Step 4: Verify the widget appears in dist/index.html**

```bash
node -e "
const fs = require('fs');
const html = fs.readFileSync('dist/index.html', 'utf8');
const hasSkeleton = /now-playing-skeleton/.test( html );
const hasCategoryNav = /category-music/.test( html );
console.log('skeleton present:', hasSkeleton);
console.log('home still has category sections:', hasCategoryNav);
"
```

Expected: Both `true`. The skeleton is what's in the SSR output; the live card materializes after hydration.

- [ ] **Step 5: Push the branch**

```bash
git push -u origin now-playing-widget
```

- [ ] **Step 6: Open the PR**

```bash
gh pr create --title "feat: add now-playing widget on home page" --body "$(cat <<'EOF'
## Summary

Hero card on the home page that polls `play.audeos.com`'s now-playing API every 30 seconds and links to the player. Renders track info, smooth progress bar (with local 1-second ticking between polls), up-next preview, channel context, and listener count. Falls back to a quiet "● Stream offline" placeholder on fetch error and auto-recovers on the next successful poll.

Pure client-side — `useEffect` + `useState` + `fetch`. No SSR data, no build-time API calls. Doesn't touch Contentful or any other quota.

## Behavior

- 30s polling cadence with visibility-aware refresh (skips when tab is hidden, fires immediately when tab becomes visible).
- Smooth progress bar uses a separate 1s local timer that resets on each new poll.
- Whole card is a single `<a target="_blank">` to `https://play.audeos.com/channels/main`.

## Verified

- `yarn test` — 28 new tests on NowPlayingCard; full suite passes.
- `yarn lint` — clean.
- `yarn build` — succeeds; `dist/index.html` contains the skeleton placeholder (rendered server-side); the live card materializes after hydration.

## Test plan

- [ ] Load `/` in a browser — see the live card (or skeleton briefly first).
- [ ] Verify track title, artist, progress bar, time display, up-next line, channel footer, listener count.
- [ ] Click the card — opens `play.audeos.com/channels/main` in a new tab.
- [ ] Open dev tools → Network → throttle to offline → wait 30s. Card should swap to "Stream offline".
- [ ] Re-enable network → wait up to 30s → card should swap back to live.
- [ ] Switch to another tab for >30s, switch back. Card refreshes immediately.

Spec: `docs/superpowers/specs/2026-04-29-now-playing-widget-design.md`
Plan: `docs/superpowers/plans/2026-04-29-now-playing-widget.md`
EOF
)"
```

- [ ] **Step 7: Return the PR URL**

The output of `gh pr create` is the PR URL. Report it back.

---

## Self-review

**Spec coverage** — every spec section maps to a task:

| Spec section | Task |
|---|---|
| `AUDEOS_PLAY_ORIGIN` constant | 1 |
| Component scaffold + skeleton + initial fetch + track render | 2 |
| Source label mapping (live / scheduled / loop_fallback) | 3 |
| `track === null` → "No metadata available." | 3 |
| `track.artist === null` skips artist line | 3 |
| `next_track === null` skips Up-next line | 3 |
| `next_track.artist === null` renders without artist | 3 |
| `channel.description === null` renders only `channel.name` | 3 |
| Listener count + "Tune in →" CTA | 3 |
| Stream offline placeholder + Visit player CTA | 4 |
| Auto-recover on subsequent successful poll | 5 |
| 30s polling + visibility-skip + visibilitychange immediate fetch | 5 |
| Cleanup on unmount | 5 |
| Smooth progress with 1s ticking | 6 |
| Progress capped at duration_ms | 6 |
| `formatMs` (m:ss and h:mm:ss) | 6 |
| `duration_ms === 0` → 0% bar | 6 |
| SCSS visual treatment (light/dark, reduced-motion) | 7 |
| Wire into home page | 8 |
| Final verification + PR | 9 |

**Type consistency** — `NowPlaying`, `Track`, `SOURCE_LABEL` defined once in `NowPlayingCard.tsx` and referenced consistently across tasks. `MAIN_CHANNEL_SLUG`, `POLL_INTERVAL_MS`, `PROGRESS_TICK_MS` are local constants. `AUDEOS_PLAY_ORIGIN` is the only export to `src/constants.ts`. `data-testid` values (`now-playing-skeleton`, `now-playing-channel-info`, `now-playing-progress-fill`) are used identically across tests.

**Placeholder scan** — every step has the actual code an engineer can paste. No "TBD" / "implement later" / "add appropriate error handling". Test code shows full assertions, not "test this behavior."

**Note on intermediate states** — between Tasks 2-6, the SCSS module has empty rules (placeholder bodies). Components render but with no visual styling. Tests use text/role-based queries, so they don't depend on styles. Task 7 fills in the visual treatment in one sweep.

**Test count math** — current baseline 169 tests across 24 files. After all tasks: 169 + 28 = 197 tests across 25 files (the new `NowPlayingCard.test.tsx`).
