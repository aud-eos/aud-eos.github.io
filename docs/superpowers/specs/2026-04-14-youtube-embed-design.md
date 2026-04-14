# YouTube Video Embed Support

> Date: 2026-04-14
> Status: Approved

## Overview

Add optional YouTube video embedding to blog posts via a dedicated Contentful field and YouTube's oEmbed API. Follows the same pattern as the SoundCloud embed feature.

## Goals

- Embed YouTube videos on any blog post
- Fetch embed data at build time (no client-side loading)
- Graceful degradation if YouTube oEmbed is unreachable during build
- First-class placement in the post header after the description

## Non-Goals

- Inline YouTube embeds in markdown body
- Custom video player (using YouTube's official iframe widget)
- YouTube Data API integration (oEmbed only — no API key required)

## Contentful Content Model

Add one optional field to the `blogPost` content type:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `youtubeUrl` | Symbol | No | Full YouTube URL (e.g., `https://www.youtube.com/watch?v=abc123` or `https://youtu.be/abc123`) |

After adding the field in the Contentful UI, regenerate types with `make types`.

## oEmbed Integration

### Endpoint

```
GET https://www.youtube.com/oembed?format=json&url={youtubeUrl}
```

### Response Shape (relevant fields)

```json
{
  "title": "Video Title",
  "author_name": "Channel Name",
  "author_url": "https://www.youtube.com/@channel",
  "html": "<iframe ...></iframe>",
  "thumbnail_url": "https://i.ytimg.com/vi/abc123/hqdefault.jpg"
}
```

### Utility: `src/utils/youtube/getOembed.ts`

- Accepts a YouTube URL string
- Fetches the oEmbed endpoint
- Returns typed oEmbed response data
- On fetch failure: returns `null` (post builds without the embed)

## Component: `src/components/YouTubeEmbed.tsx`

- Receives oEmbed response data and the original YouTube URL as props
- Extracts the iframe `src` from the oEmbed `html` field
- Validates the `src` host is `www.youtube.com` before rendering
- Renders a heading with the video title linked to the original YouTube URL (opens in new tab)
- Renders the iframe in a responsive container

### Rendering Order in Post Header

```
description
→ SoundCloud embed (if any, existing)
→ YouTube embed (if any, new)
→ </header>
→ body
```

## Data Flow

```
[slug].tsx getStaticProps
  └─ post.fields.youtubeUrl exists?
       ├─ yes → getOembed(youtubeUrl) → pass result as prop
       └─ no  → pass null
```

```
BlogPostView
  └─ youTubeOembed prop exists?
       ├─ yes → render <YouTubeEmbed data={youTubeOembed} url={youtubeUrl} />
       └─ no  → skip
```

## New-Post Skill Update

Add `youtubeUrl` to the field assembly table in `.claude/skills/new-post/SKILL.md`.

## Files Changed

| File | Change |
|------|--------|
| `src/types/contentful/TypeBlogPost.ts` | Regenerated via `make types` after Contentful field addition |
| `src/utils/youtube/getOembed.ts` | New — oEmbed fetch utility with typed response |
| `src/utils/youtube/getOembed.test.ts` | New — utility tests |
| `src/components/YouTubeEmbed.tsx` | New — embed wrapper component |
| `src/styles/YouTubeEmbed.module.scss` | New — styles |
| `src/__tests__/components/YouTubeEmbed.test.tsx` | New — component tests |
| `src/pages/post/[slug].tsx` | Add oEmbed fetch in `getStaticProps`, render `<YouTubeEmbed>` in view |
| `src/__tests__/pages/post/slug.test.tsx` | Add integration tests |
| `.claude/skills/new-post/SKILL.md` | Add `youtubeUrl` to field assembly table and entry creation JSON |

## Testing

- Unit test for `getOembed` utility: successful fetch, failed fetch (returns null), network error
- Component test for `YouTubeEmbed`: renders iframe with correct src, title links to YouTube URL in new tab, rejects non-youtube.com iframe src
- Integration test for `getStaticProps`: fetches oEmbed when youtubeUrl present, passes null when absent

## Security Considerations

- The component parses the oEmbed `html` to extract the iframe `src` URL, then renders a clean `<iframe>` element — no raw HTML injection.
- The iframe `src` is validated to ensure it points to `www.youtube.com` before rendering.
- No API keys or secrets needed — oEmbed is a public endpoint.
