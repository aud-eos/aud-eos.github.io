# Google Maps Embed Integration

## Overview

Render an embedded Google Map on blog posts that have a `location` field. Uses the free Google Maps Embed (no API key, no billing). Clicking the map opens full Google Maps.

## Decisions

- **Google Maps Embed (iframe)** — completely free, no API key, no billing, no account needed
- **No theme switching** — Google controls the iframe content (same situation as TikTok embeds)
- **Render after all embeds** — map is supplementary context, not primary content
- **No env var needed** — the embed URL is constructed from lat/lon with no authentication

## Component

### `src/components/LocationMap.tsx`

**Props:**
- `lat: number`
- `lon: number`

**Rendering:**
- `<section>` wrapper with class `locationMap`
- `<header>` with `<h2>`: `Location`
- `<div>` with responsive iframe wrapper (same pattern as YouTube embed)
- `<iframe>` with `src="https://www.google.com/maps?q={lat},{lon}&output=embed"`, no border
- `loading="lazy"` on the iframe

### `src/styles/LocationMap.module.scss`

- `section.locationMap` — `margin-top: 6rem; margin-bottom: 6rem` (matches other embeds)
- `.locationHeader` — `margin-bottom: 1rem`
- `.iframeWrapper` — responsive 16:9 container (same pattern as YouTubeEmbed)

## Page Integration

### `src/pages/post/[slug].tsx`

**`getStaticProps`:**
- When `post.fields.location` exists, pass `locationLat` and `locationLon` as props
- When no location, pass `null` for both

**`BlogPostViewProps`:**
- `locationLat?: number | null`
- `locationLon?: number | null`

**Render position:**
- After all media embeds (TikTok, SoundCloud, YouTube, Spotify), before post nav

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/LocationMap.tsx` | Map embed component |
| `src/styles/LocationMap.module.scss` | Map styles |

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/post/[slug].tsx` | Pass location props and render LocationMap |
