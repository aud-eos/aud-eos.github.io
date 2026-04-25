# Mapbox Static Map Integration

## Overview

Render a static Mapbox map image on blog posts that have a `location` field. The image links to Google Maps for full interactivity. Light and dark themed variants swap via CSS `prefers-color-scheme` media query — no JavaScript needed.

## Decisions

- **Mapbox Static Images API** over Google Maps — free tier (50,000 req/month), no billing account required
- **Build URLs in `getStaticProps`** — follows existing data-resolution pattern, access token in env vars
- **CSS-based theme switching** — two `<img>` tags toggled with `display: none`/`display: block` via `prefers-color-scheme`, no hydration concerns
- **Render after all embeds** — map is supplementary context, not primary content
- **Lazy loading** — `loading="lazy"` on both images so the hidden variant doesn't get fetched
- **Link to Google Maps** — clicking the map opens Google Maps (better UX than Mapbox for directions/navigation)

## Environment

New required env var: `MAPBOX_ACCESS_TOKEN`

- Free Mapbox account, no billing required
- Asserted at module level in the map utility using the existing `assert` pattern
- Token is visible in page source (standard for static map URLs)

Add to GitHub Actions secrets for the build pipeline.

## Map URL Utility

### `src/utils/maps/buildStaticMapUrl.ts`

Pure function: `buildStaticMapUrl( lat: number, lon: number, theme: "light" | "dark" ): string`

**Parameters:**
- `lat`, `lon` — from Contentful location field
- `theme` — determines which Mapbox style to use

**Mapbox Static Images URL format:**
```
https://api.mapbox.com/styles/v1/{style_id}/static/pin-s+e74c3c({lon},{lat})/{lon},{lat},{zoom},0/{width}x{height}@2x?access_token={token}
```

**Map configuration:**
- Zoom: 15 (neighborhood level)
- Size: `600x300` with `@2x` for retina
- Marker: small red pin (`pin-s+e74c3c`) at lat/lon
- Dark theme: `mapbox/dark-v11` style
- Light theme: `mapbox/streets-v12` style

Returns the full Mapbox Static Images API URL.

## Component

### `src/components/LocationMap.tsx`

**Props:**
- `lightMapUrl: string` — Static map URL with light theme
- `darkMapUrl: string` — Static map URL with dark theme
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
