# SoundCloud Embed Support

> Date: 2026-04-14
> Status: Approved

## Overview

Add optional SoundCloud track/playlist embedding to blog posts via a dedicated Contentful field and SoundCloud's oEmbed API. Follows the existing Spotify integration pattern — a content model field, build-time data fetch, and a dedicated component rendered in the post view.

## Goals

- Embed individual SoundCloud tracks or playlists on any blog post
- Fetch embed data at build time (no client-side loading)
- Graceful degradation if SoundCloud is unreachable during build
- Support both tracks and playlists via the same field

## Non-Goals

- Inline SoundCloud embeds in markdown body (future enhancement)
- Custom-designed player component (using SoundCloud's official iframe widget)
- SoundCloud API integration (oEmbed only — no API key required)

## Contentful Content Model

Add one optional field to the `blogPost` content type:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `soundcloudUrl` | Symbol | No | Full SoundCloud URL for a track or playlist (e.g., `https://soundcloud.com/artist/track` or `https://soundcloud.com/artist/sets/playlist`) |

After adding the field in the Contentful UI, regenerate types with `make types`.

## oEmbed Integration

### Endpoint

```
GET https://soundcloud.com/oembed?format=json&url={soundcloudUrl}
```

### Response Shape (relevant fields)

```json
{
  "title": "Track or Playlist Name",
  "author_name": "Artist Name",
  "author_url": "https://soundcloud.com/artist",
  "html": "<iframe ...></iframe>",
  "thumbnail_url": "https://i1.sndcdn.com/artworks-...-t500x500.jpg"
}
```

The `html` field contains the ready-to-use iframe embed.

### Utility: `src/utils/soundcloud/getOembed.ts`

- Accepts a SoundCloud URL string
- Fetches the oEmbed endpoint
- Returns typed oEmbed response data
- On fetch failure: returns `null` (post builds without the embed, no build breakage)

## Component: `src/components/SoundCloudEmbed.tsx`

- Receives oEmbed response data as props
- Extracts the iframe `src` URL from the oEmbed `html` field and renders a sanitized `<iframe>` element directly (no `dangerouslySetInnerHTML`) with explicit sandbox and allow attributes
- Wrapped in a styled container with a heading/label section
- Placed in `BlogPostView` alongside the existing `<Playlist>` component (both optional, both can coexist on the same post)

### Rendering Order in Post View

1. Post header (image, title, author, date, tags)
2. Post body (markdown)
3. Gallery (optional)
4. Spotify playlist (optional, existing)
5. SoundCloud embed (optional, new)
6. Post navigation (prev/next)

## Data Flow

```
[slug].tsx getStaticProps
  └─ post.fields.soundcloudUrl exists?
       ├─ yes → getOembed(soundcloudUrl) → pass result as prop
       └─ no  → pass null
```

```
BlogPostView
  └─ soundCloudOembed prop exists?
       ├─ yes → render <SoundCloudEmbed data={soundCloudOembed} />
       └─ no  → skip
```

## New-Post Skill Update

Add `soundcloudUrl` to the field assembly table in `.claude/skills/new-post/SKILL.md`:

| Field | How to get it |
|-------|---------------|
| **soundcloudUrl** | Ask if they want to embed a SoundCloud track or playlist (yes/no). If yes, collect the URL. Skip if no. |

## Files Changed

| File | Change |
|------|--------|
| `src/types/contentful/TypeBlogPost.ts` | Regenerated via `make types` after Contentful field addition |
| `src/utils/soundcloud/getOembed.ts` | New — oEmbed fetch utility with typed response |
| `src/components/SoundCloudEmbed.tsx` | New — embed wrapper component |
| `src/pages/post/[slug].tsx` | Add oEmbed fetch in `getStaticProps`, render `<SoundCloudEmbed>` in view |
| `.claude/skills/new-post/SKILL.md` | Add `soundcloudUrl` to field assembly table |

## Testing

- Unit test for `getOembed` utility: successful fetch, failed fetch (returns null), malformed URL
- Component test for `SoundCloudEmbed`: renders iframe, handles missing data
- Build test: post with `soundcloudUrl` builds correctly, post without it still works

## Security Considerations

- The component parses the oEmbed `html` to extract the iframe `src` URL, then renders a clean `<iframe>` element with explicit `sandbox` and `allow` attributes — no raw HTML injection.
- The iframe `src` is validated to ensure it points to `w.soundcloud.com` before rendering.
- No API keys or secrets are needed — oEmbed is a public endpoint.
