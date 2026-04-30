# Now-Playing Widget — Design Spec

## Problem

The site advertises DJ Audeos's content but doesn't surface the live broadcast running on `play.audeos.com`. Visitors landing on the home page have no signal that there's an active stream they can tune into. The play platform exposes a JSON API at `https://play.audeos.com/api/now-playing/{slug}`; we need a widget on the home page that consumes it and gives visitors a one-click path to the player.

## Solution

A single client-side React component on the home page that polls the now-playing API every 30 seconds, renders a card with track info + progress bar + up-next + channel context + listener count, and links to `https://play.audeos.com/channels/main` in a new tab. The widget is a hero element above the existing `CategoryPostSections`, native to the site's existing card aesthetic (SCSS modules, `prefers-color-scheme` aware), and silently swaps to a "Stream offline" placeholder when the API is unreachable.

The widget is purely client-side — `useEffect` + `useState` + `fetch`. No SSR data, no build-time API calls. It costs zero against the Contentful API quota and zero build time. The browser hydrates it on page load and starts polling.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Placement on home page | Hero, above `CategoryPostSections` | Stream is a flagship feature; deserves first-thing-you-see prominence |
| Visual treatment | Native card matching existing post-card aesthetic (SCSS module, `prefers-color-scheme` overrides) | Coherent visual language; "● Live now" pulse + "Tune in →" CTA already provide enough distinction |
| Channel slug | Hardcoded `"main"` | Single station for now; YAGNI on prop until multiple stations exist |
| Polling cadence | 30 seconds | Reference value; cheap to poll, fast enough to feel current |
| Error behavior | Quiet "Stream offline" placeholder | User-chosen — preferred over silent hide |
| "Tune in →" link target | New tab (`target="_blank"`) | Visitor stays anchored on the home while the player opens |
| `track === null` case | Render "No metadata available." italic | Honest to underlying state |
| API properties surfaced | `source`, `track.{title, artist, position_ms, duration_ms}`, `next_track.{title, artist}`, `channel.{name, description}`, `listener_count` | Richer than the reference; uses most of the API payload |
| Skipped properties | `track.started_at` | Redundant with progress bar |
| Smooth progress bar between polls | Local 1-second timer increments displayed `position_ms`; resets on each new poll | Avoids the bar jumping every 30s; feels alive |

## API contract

The widget calls `GET https://play.audeos.com/api/now-playing/main` and expects:

```json
{
  "source": "live" | "scheduled" | "loop_fallback",
  "channel": {
    "name": "Audeos",
    "description": "Live broadcasts and curated playlist",
    "slug": "main"
  },
  "track": {
    "started_at": "2026-04-30T02:08:52.118108Z",
    "title": "Day Party vol. 1",
    "artist": "DJ Audeos",
    "duration_ms": 6552000,
    "position_ms": 3370644
  } | null,
  "next_track": {
    "title": "droptop hotbox",
    "artist": "DJ Audeos"
  } | null,
  "listener_count": 0
}
```

The widget treats any non-2xx response, JSON parse error, or network failure as "stream offline."

## Architecture

### Files

**New:**
- `src/components/NowPlaying/NowPlayingCard.tsx` — the component (default export, no props).
- `src/components/NowPlaying/NowPlayingCard.module.scss` — SCSS module.
- `src/__tests__/components/NowPlayingCard.test.tsx` — Vitest tests.

**Modified:**
- `src/constants.ts` — add `AUDEOS_PLAY_ORIGIN = "https://play.audeos.com"`.
- `src/pages/index.tsx` — render `<NowPlayingCard />` inside `<main>`, before `<CategoryPostSections>`.

### Component states

| State | Trigger | Renders |
|---|---|---|
| Loading | Initial mount, no fetch resolved yet | Skeleton matching live-card height (avoids layout shift) |
| Live (track) | Successful fetch, `track !== null` | Source label, track title, artist, progress bar, time display, up-next (if present), channel footer, listener count, "Tune in →" CTA |
| Live (no metadata) | Successful fetch, `track === null` | Source label, italic "No metadata available.", up-next (if present), channel footer, listener count, "Tune in →" CTA |
| Stream offline | Fetch error / non-2xx / parse failure | Static placeholder: "● Stream offline" pill, "Visit player →" CTA. Auto-recovers on next successful poll. |

### Render layout (live state)

```
┌──────────────────────────────────────────────┐
│ ● Live now                                   │ ← source label, accent color
│                                              │
│ Day Party vol. 1                             │ ← track.title, h2-sized
│ DJ Audeos                                    │ ← track.artist, smaller, muted
│                                              │
│ ████████░░░░░░░░░░  0:56 / 1:49              │ ← progress bar + time mm:ss
│                                              │
│ Up next · droptop hotbox · DJ Audeos         │ ← next_track (skipped if null)
│                                              │
│ ─────────────────────────────────────────── │
│ Audeos · Live broadcasts and curated…        │ ← channel.name + description
│ 0 listening                       Tune in → │ ← listener count + CTA
└──────────────────────────────────────────────┘
```

The whole card is wrapped in a single `<a target="_blank" rel="noopener noreferrer" href="https://play.audeos.com/channels/main">`, so the entire surface is clickable.

### Source label mapping

| `source` value | Displayed label |
|---|---|
| `"live"` | `● Live now` |
| `"scheduled"` | `Scheduled show` |
| `"loop_fallback"` | `On rotation` |

Stored in a `Record<NowPlaying["source"], string>` constant inside the component.

### Behavior

- **Initial fetch on mount.** No special handling — `useEffect(() => { fetchOnce(); ... }, [])`.
- **Polling.** A `setTimeout` fires every `POLL_INTERVAL_MS = 30_000`. Each tick checks `document.visibilityState` and skips the fetch if the tab isn't visible.
- **Visibility-aware refresh.** A `visibilitychange` listener triggers an immediate fetch when the tab becomes visible (covers the case where polling was paused while the tab was hidden).
- **Smooth progress.** While `track !== null`, a separate `setInterval(1_000)` increments a local `displayPositionMs` state by 1000. Resets to `track.position_ms` whenever a new poll lands. Caps at `track.duration_ms` (don't render `> 100%`).
- **Error.** Any fetch failure sets `errored=true`, render "Stream offline" placeholder. A subsequent successful poll sets `errored=false` (auto-recover).
- **Cleanup.** Unmount clears the polling timer, the progress timer, and removes the `visibilitychange` listener.

### Constants

- `AUDEOS_PLAY_ORIGIN` in `src/constants.ts` — used for both the API URL and the channel link.
- `MAIN_CHANNEL_SLUG = "main"` — local to the component; not used elsewhere yet.
- `POLL_INTERVAL_MS = 30_000` — local.
- `PROGRESS_TICK_MS = 1_000` — local.
- `SOURCE_LABEL` — local `Record<NowPlaying["source"], string>`.

### Type definitions

Defined inside the component file (no shared use elsewhere):

```typescript
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
```

### Time formatting

A small inline `formatMs(ms: number): string` helper produces `m:ss` (e.g., `3:45`). For tracks over an hour, falls through to `h:mm:ss` (uncommon but defended).

## Visual / SCSS

- Match the existing post-card pattern from `Home.module.scss`:
  - `border-radius: 10px`
  - `box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25)` (slightly stronger to read as hero)
  - `prefers-color-scheme: light` overrides the dark defaults.
- Padding: a touch more generous than post cards (e.g., `1.5rem 1.75rem`) to read as hero.
- Source label: small uppercase letter-spaced text in `currentColor` accent (matches `.tagActive` border style).
- Track title: `1.5rem`/`1.75rem`, semi-bold.
- Artist: `1rem`, muted (`opacity: 0.7`).
- Progress bar: `4px` tall, fully rounded, `currentColor` fill on a low-opacity track.
- Time display: monospace digits, `0.85rem`, muted.
- Up-next: `0.85rem`, italic, muted.
- Channel footer: `0.8rem`, muted, separated by a thin top border.
- "Tune in →" CTA: accent color, semibold.
- Hover: subtle `box-shadow` increase + `transform: translateY(-1px)` matches the post-card hover.
- Reduced motion (`@media (prefers-reduced-motion: reduce)`) disables the progress bar's transitions and the hover transform.

## Tests

`src/__tests__/components/NowPlayingCard.test.tsx` — Vitest + Testing Library. `fetch` stubbed via `vi.stubGlobal`; timers controlled with `vi.useFakeTimers()`.

1. **Loading state on first render.** Before the initial fetch resolves, renders the skeleton (asserted via a stable test ID or role).
2. **Live state with track.** After successful fetch returns a payload with `track`, renders the title, artist, source label, listener count, and "Tune in →" CTA.
3. **`source` label mapping.** Three cases — `live`, `scheduled`, `loop_fallback` — render their respective labels.
4. **`track === null` case.** Renders "No metadata available." instead of title/artist.
5. **`next_track === null` case.** No "Up next" line is rendered.
6. **Stream offline state.** Fetch rejects → renders "● Stream offline" placeholder with "Visit player →" link.
7. **Auto-recover.** On error, then a subsequent successful poll, the card re-renders with track data (no manual reload).
8. **Polling.** After 30s tick (with `document.visibilityState === "visible"`), a second fetch fires.
9. **Polling skips when hidden.** With `document.visibilityState === "hidden"`, the 30s tick does NOT fire a fetch.
10. **`visibilitychange` triggers fetch.** Manually firing the event with `visibilityState === "visible"` triggers an immediate fetch.
11. **Cleanup.** Unmount clears both timers and removes the listener (asserted via spies on `clearTimeout` / `clearInterval` / `removeEventListener`, or by re-firing the event after unmount and asserting no further fetches).
12. **Smooth progress.** With `track.position_ms = 1000` and `track.duration_ms = 10000`, after `vi.advanceTimersByTime(2_000)` the displayed time has advanced by ~2 seconds (e.g., `0:03 / 0:10`).
13. **Progress caps at duration.** Local position never exceeds `track.duration_ms` even if the timer overshoots before the next poll arrives.

## Edge cases

| Case | Behavior |
|---|---|
| Initial mount before any fetch | Render skeleton (avoids layout shift on first paint) |
| Network failure | Show "Stream offline" placeholder, keep polling, auto-recover |
| Non-2xx HTTP response | Same as network failure |
| Malformed JSON response | Same as network failure |
| `track.duration_ms === 0` | Progress bar renders at 0%, time as `0:00 / 0:00`. Don't divide by zero. |
| `track.position_ms > track.duration_ms` | Render at 100% (don't overflow the bar) |
| `next_track === null` | Skip the "Up next" line entirely |
| `channel.description === null` | Render only `channel.name` in the footer |
| `track.artist === null` | Render only the title (no artist row) |
| `next_track.artist === null` | Render "Up next · {title}" without the trailing artist segment |
| Tab hidden when poll fires | Skip the fetch; resume on next visible state |
| Tab restored after long absence | `visibilitychange` triggers immediate fetch |
| Component unmounts mid-fetch | Cancellation flag (`cancelled = true`) prevents `setState` after unmount |

## Performance / cost notes

- **Zero build-time impact.** No SSR data; no Contentful API call; no extra static path generation.
- **Zero impact on Contentful quota.** The widget calls `play.audeos.com`, a separate API.
- **Cost on `play.audeos.com`.** One fetch per visitor every 30s while the home tab is visible. For low-traffic sites this is trivial; if traffic spikes, the API can implement caching headers and the browser will respect them.
- **No `setInterval`-related leaks.** All timers + listeners cleaned up in the `useEffect` return.

## Out of scope

- Multiple stations (no `slug` prop yet).
- Embedded audio player on the card (clicking goes to `play.audeos.com` instead).
- Analytics on widget interactions.
- Server-side data prefetch (the widget is intentionally client-only — keeps the static export clean and the browser handles freshness).
- Customizing the "Up next" preview to show more than one upcoming track (API doesn't return a queue).
- Persisting `errored=true` across reloads (would mask the fact that the widget hasn't fetched yet).
