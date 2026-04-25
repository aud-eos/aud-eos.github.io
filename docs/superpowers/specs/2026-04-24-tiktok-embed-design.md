# TikTok oEmbed Integration

## Overview

Add TikTok video embedding to blog posts using TikTok's oEmbed API. The embed renders TikTok's native player widget with likes, comments, and social metadata. oEmbed data is fetched at build time; TikTok's `embed.js` script hydrates the player client-side.

## Decisions

- **oEmbed (script-based)** over iframe — TikTok's native widget shows likes, comments, and social metadata that an iframe embed does not
- **Single URL field** — one `tiktokUrl` per post, consistent with `youtubeUrl` and `soundcloudUrl`
- **Render before body** — TikTok video is primary content, not supplementary like music embeds
- **Header with link** — `Watch "Title" on TikTok` for SEO (crawlable `<h2>` text + outbound link)
- **Thumbnail as manual upload** — grab the thumbnail from oEmbed response and upload to Contentful as the post's `image` field; no automatic thumbnail fetching in list pages

## Contentful Content Model

Add an optional `tiktokUrl` field to the BlogPost content type:

- **Field ID:** `tiktokUrl`
- **Display name:** TikTok URL
- **Type:** Symbol (short text)
- **Required:** No
- **Validation:** URL pattern matching `https://www.tiktok.com/@*/video/*` or `https://vm.tiktok.com/*`

After adding the field, run `make types` to regenerate TypeScript types.

## Data Fetching

### `src/utils/tiktok/getOembed.ts`

```typescript
interface TikTokOembed {
  title: string;
  author_name: string;
  author_url: string;
  html: string;
  thumbnail_url: string;
}
```

- **Endpoint:** `https://www.tiktok.com/oembed?format=json&url={encodedUrl}`
- **Returns:** `TikTokOembed | null`
- **Error handling:** Returns `null` on fetch failure (same as YouTube/SoundCloud)
- **Called from:** `getStaticProps` in `src/pages/post/[slug].tsx` at build time

## Component

### `src/components/TikTokEmbed.tsx`

**Props:**
- `oembed: TikTokOembed` — the oEmbed response data
- `url: string` — the raw TikTok URL

**Rendering:**
- `<section>` wrapper with class `tiktokEmbed`
- `<header>` with `<h2>`: `Watch "Title" on TikTok` — title links to the TikTok URL, "TikTok" links to the author's profile (`author_url`)
- `<div>` container with oEmbed `html` rendered via `dangerouslySetInnerHTML`

**Script loading:**
- `useEffect` creates a `<script>` element with `src="https://www.tiktok.com/embed.js"`
- Script is appended to the component's container `<div>` (not `<head>`) so embed.js finds and hydrates the blockquote
- Cleanup function removes the script on unmount

**Security considerations:**
- The oEmbed HTML is fetched at build time from TikTok's official oEmbed API endpoint — this is a trusted first-party source, not user-supplied input
- This is the same trust model used by the existing YouTube and SoundCloud embed components
- Script src is hardcoded to `https://www.tiktok.com/embed.js` — no dynamic script URLs
- The `dangerouslySetInnerHTML` usage is safe here because the content is build-time static output from a trusted API, never runtime user input

**Graceful degradation:**
- If embed.js fails to load, the blockquote remains visible with video caption and a link to TikTok

## Styles

### `src/styles/TikTokEmbed.module.scss`

- `section.tiktokEmbed` — `margin-top: 2rem; margin-bottom: 4rem` (tighter spacing than post-body embeds since it sits between header and body)
- `.tiktokHeader` — `margin-bottom: 1rem`
- `.embedContainer` — centers the TikTok embed (renders as a fixed-width ~325px block by default)

## Page Integration

### `src/pages/post/[slug].tsx`

**`getStaticProps`:**
- Fetch TikTok oEmbed when `post.fields.tiktokUrl` is present
- Add `tikTokOembed` to returned props

**`BlogPostViewProps`:**
- Add `tikTokOembed?: TikTokOembed | null`

**Render position — before markdown body:**
```
</header>
{ tikTokOembed && post.fields.tiktokUrl && <TikTokEmbed ... /> }
<Markdown>{ post.fields.body || "" }</Markdown>
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/utils/tiktok/getOembed.ts` | oEmbed API fetch utility |
| `src/components/TikTokEmbed.tsx` | Embed component with client-side script loader |
| `src/styles/TikTokEmbed.module.scss` | Embed styles |

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/post/[slug].tsx` | Add oEmbed fetch, props, and render TikTokEmbed before body |
| `src/types/contentful/TypeBlogPost.ts` | Regenerated via `make types` after Contentful field addition |
