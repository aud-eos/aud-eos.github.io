# Google Maps Static Map Integration

## Overview

Render a static Google Maps image on blog posts that have a `location` field. The image links to Google Maps for full interactivity. Light and dark themed variants swap via CSS `prefers-color-scheme` media query — no JavaScript needed.

## Decisions

- **Static Maps API** over Embed API or JS API — lightest weight, just an `<img>` tag, fits the static export architecture
- **Build URLs in `getStaticProps`** — follows existing data-resolution pattern, API key in env vars with HTTP referrer restriction
- **CSS-based theme switching** — two `<img>` tags toggled with `display: none`/`display: block` via `prefers-color-scheme`, no hydration concerns
- **Render after all embeds** — map is supplementary context, not primary content
- **Lazy loading** — `loading="lazy"` on both images so the hidden variant doesn't get fetched

## Environment

New required env var: `GOOGLE_MAPS_API_KEY`

- Must have Static Maps API enabled in Google Cloud Console
- HTTP referrer restriction to `audeos.com/*` (key is visible in page source by design)
- Asserted at module level in the map utility using the existing `assert` pattern

Add to GitHub Actions secrets for the build pipeline.

## Map URL Utility

### `src/utils/maps/buildStaticMapUrl.ts`

Pure function: `buildStaticMapUrl( lat: number, lon: number, theme: "light" | "dark" ): string`

**Parameters:**
- `lat`, `lon` — from Contentful location field
- `theme` — determines style params

**Map configuration:**
- Zoom: 15 (neighborhood level)
- Size: `600x300`
- Scale: `2` (retina)
- Marker: red pin at lat/lon
- Dark theme: dark grey land, dark water, light roads, minimal labels (inline style params)
- Light theme: default Google Maps styling (no style params)

Returns the full Static Maps API URL with all parameters.

## Component

### `src/components/LocationMap.tsx`

**Props:**
- `lightMapUrl: string` — Static Maps URL with light theme
- `darkMapUrl: string` — Static Maps URL with dark theme
- `lat: number`
- `lon: number`

**Rendering:**
- `<section>` wrapper with class `locationMap`
- `<header>` with `<h2>`: `Location`
- `<a>` tag linking to `https://www.google.com/maps?q={lat},{lon}`, opens in new tab
- Two `<img>` tags inside the link (light and dark), CSS toggles visibility
- Both images have `loading="lazy"` and descriptive `alt` text

### `src/styles/LocationMap.module.scss`

- `section.locationMap` — `margin-top: 6rem; margin-bottom: 6rem` (matches other embeds)
- `.locationHeader` — `margin-bottom: 1rem`
- `.mapImage` — `width: 100%; border-radius: 4px`
- `.mapLight` — `display: none` by default
- `.mapDark` — `display: block` by default
- `@media (prefers-color-scheme: light)` — swap: `.mapLight { display: block }`, `.mapDark { display: none }`

## Page Integration

### `src/pages/post/[slug].tsx`

**`getStaticProps`:**
- When `post.fields.location` exists, construct both URLs using `buildStaticMapUrl`
- Pass `locationMapLight`, `locationMapDark`, `locationLat`, `locationLon` as props
- When no location, pass `null` for all four

**`BlogPostViewProps`:**
- `locationMapLight?: string | null`
- `locationMapDark?: string | null`
- `locationLat?: number | null`
- `locationLon?: number | null`

**Render position:**
- After all media embeds (TikTok, SoundCloud, YouTube, Spotify), before post nav

## Files to Create

| File | Purpose |
|------|---------|
| `src/utils/maps/buildStaticMapUrl.ts` | URL construction utility |
| `src/components/LocationMap.tsx` | Map component with CSS theme toggle |
| `src/styles/LocationMap.module.scss` | Map styles with prefers-color-scheme swap |

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/post/[slug].tsx` | Add map URL construction, props, and LocationMap render |
