# Spotify Playlist Component Redesign

**Date:** 2026-04-16
**Status:** Draft
**Scope:** Full rewrite of `Playlist.tsx` and `Playlist.module.scss`

## Goal

Replace the current raw list-based Spotify playlist component with a polished Spotify-inspired design featuring a hero header, track rows, expand/collapse, and a footer CTA.

## Design Decisions

| Question | Choice | Rationale |
|---|---|---|
| Layout direction | Spotify-inspired rows | Familiar pattern, polished, good info density |
| Footer | "Listen on Spotify" CTA | Cleaner than repeating the full header |
| Track visibility | Show first 20, expand toggle | Keeps page tight; all tracks in DOM for SEO |

## 1. Hero Header

Replaces the current `PlaylistHeader` component. Rendered once at the top only.

**Layout:**
- Gradient background: `linear-gradient(135deg, rgba(29,185,84,0.2) 0%, rgba(29,185,84,0.02) 100%)`
- Left: playlist cover image from `playlist.images[0]` — 100px square, rounded corners (6px), box-shadow
- Right: playlist name (h2, linked to Spotify), meta line below: owner name (Spotify green, linked) · `{tracks.total} songs` · `{followers.total} followers`
- Spotify logo (existing `/images/spotify.png`) displayed small alongside the meta or in the corner

**Responsive:** On mobile (<600px), stack the cover above the text instead of side-by-side.

## 2. Track Rows

Each track as a horizontal row with:
- **Track number** — muted, right-aligned, fixed width
- **Album art** — 44px rendered size from `track.track.album.images`. Select the image with `width === 64` (Spotify's standard small thumbnail). If no 64px image exists, fall back to the last image in the array (smallest available). Rounded 4px corners.
- **Title + artist** — stacked in a flex column. Title: font-weight 500, normal size. Artist names below: smaller, muted opacity, each linked to their Spotify artist page. Separated by commas.
- **Album name** — linked to Spotify album page. Hidden on mobile (<600px) via `display: none` to save horizontal space.
- **Duration** — formatted from `track.track.duration_ms` as `m:ss` (e.g., `4:21`). Right-aligned, muted.

**Hover:** Rows get `background: rgba(255,255,255,0.07)` on hover with `border-radius: 6px`.

**All links:** Track name → track Spotify URL. Artist names → artist Spotify URLs. Album name → album Spotify URL.

## 3. Expand/Collapse

- Render all tracks in the HTML (full DOM, SEO-friendly)
- First 20 tracks visible; tracks 21+ hidden via CSS (`display: none`) controlled by React state
- Below the visible tracks: a "Show all X tracks" button
- On click: state toggles, all tracks become visible, button text changes to "Show less"
- If playlist has 20 or fewer tracks, no button rendered
- Button styled as a text link, not a heavy button — e.g., centered, muted, with a subtle underline

**Implementation:** `useState<boolean>(false)` for `isExpanded`. Tracks beyond index 20 get a conditional CSS class that hides them when `!isExpanded`.

## 4. Footer CTA

After the track list (and expand button if present):
- "Listen on Spotify" text link pointing to `playlist.external_urls.spotify`
- Styled centered, with the Spotify green color, subtle and non-intrusive
- Replaces the current repeated `PlaylistHeader` and `[ X songs ... Y followers ]` line

## 5. Duration Formatting

Helper function to convert `duration_ms` to `m:ss`:

```typescript
function formatDuration( durationMs: number ): string {
  const totalSeconds = Math.floor( durationMs / 1000 );
  const minutes = Math.floor( totalSeconds / 60 );
  const seconds = totalSeconds % 60;
  return `${minutes}:${String( seconds ).padStart( 2, "0" )}`;
}
```

Defined in `Playlist.tsx` — single use, no need to extract.

## 6. Responsive Behavior

| Breakpoint | Change |
|---|---|
| < 600px | Hero header stacks vertically (cover above text). Album column hidden in track rows. |
| >= 600px | Hero header side-by-side. Full track rows with album column. |

## 7. Reduced Motion

No scroll-triggered animations in this component, so no `prefers-reduced-motion` handling needed. Hover transitions are subtle enough (background color only) to not require a reduced-motion override.

## Files to Modify

| File | Action | Change |
|---|---|---|
| `src/components/Playlist.tsx` | Rewrite | Hero header, track rows with all links, expand/collapse toggle, footer CTA, duration formatting |
| `src/styles/Playlist.module.scss` | Rewrite | Spotify-inspired styles: gradient header, row layout, hover states, responsive breakpoints, expand toggle |

## Not In Scope

- No audio playback or preview functionality
- No changes to data fetching or the `SpotifyPlaylist` type
- No new dependencies
- No changes to how the Playlist component is consumed in `[slug].tsx`
