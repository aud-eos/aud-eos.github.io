# Blog Post Page Updates

**Date:** 2026-04-16
**Status:** Draft
**Scope:** Layout changes to the blog post page header and embed placement

## Goal

Restructure the blog post page header (remove "Last updated", reformat author/date lines) and move SoundCloud/YouTube embeds from the header to below the body content.

## Changes

### 1. Header — Author/Date Restructure

Remove the "Last updated: [date]" line from the `<address>` block. Replace the two-line layout with:

- **Line 1** (normal weight, muted): Publish date only — e.g., `January 5, 2026`
- **Line 2** (bold): `By Author Name` (linked if author has a slug, plain text otherwise)

The publish date uses the existing `resolvePostDate()` logic and `<DateTimeFormat>` component. The avatar remains to the left of both lines.

### 2. Embeds — Move Below Body

Remove `<SoundCloudEmbed>` and `<YouTubeEmbed>` from inside `<header>`. Place them after `<Gallery>` and before `<Playlist>`.

New article content order:
1. `<header>` (hero image, title, author/date, tags, description)
2. `<Markdown>` (body)
3. `<Gallery>` (image gallery)
4. `<SoundCloudEmbed>` (moved from header)
5. `<YouTubeEmbed>` (moved from header)
6. `<Playlist>` (Spotify — unchanged position)
7. `<nav>` (prev/next — unchanged position)

### 3. SEO

- Keep `dateModified` in the JSON-LD schema and `article:modified_time` meta tag — these are for search engines, not user-facing
- No change to any other SEO markup

## Files to Modify

| File | Change |
|---|---|
| `src/pages/post/[slug].tsx` | Move embed JSX from header to after Gallery; restructure `<address>` block to show date on line 1, author on line 2; remove "Last updated" text |

## Not In Scope

- No style changes (existing SCSS handles the layout)
- No new components
- No changes to data fetching or props
