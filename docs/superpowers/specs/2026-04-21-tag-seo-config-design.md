# Tag SEO Config — Design Spec

## Problem

Tag pages currently use dynamically generated meta descriptions like:
> "5 Jazz posts on Audeos.com — including Title A, Title B, Title C"

These are formulaic and don't convey the editorial voice of the site. Manual control over SEO metadata per tag allows for more intentional, higher-quality descriptions.

## Solution

Store per-tag SEO configuration in a local JSON file (`data/tags.json`). Each tag gets a custom title label, meta description, and optional OG image. The build validates that every Contentful tag has a corresponding entry in the config — missing entries fail the build.

## Data File

**`data/tags.json`** — flat object keyed by Contentful tag ID:

```json
{
  "jazz": {
    "title": "Jazz Music",
    "description": "Explore jazz DJ mixes, album reviews, and curated playlists.",
    "ogImage": "https://www.audeos.com/images/jazz.jpg"
  },
  "electronic": {
    "title": "Electronic Music",
    "description": "Electronic music mixes, production insights, and artist spotlights.",
    "ogImage": null
  }
}
```

### Fields

| Field | Type | Required | Purpose |
|---|---|---|---|
| `title` | `string` | Yes | Label portion of the page title. Code appends ` \| Audeos.com` or ` — Page N \| Audeos.com`. |
| `description` | `string` | Yes | Meta description for SEO (also used for OG/Twitter descriptions). |
| `ogImage` | `string \| null` | Yes | Custom OG image URL. Falls back to `META_IMAGE` when `null`. |

## Type Definition

**New file: `src/types/tagConfig.ts`**

```typescript
export interface TagSeoConfig {
  title: string
  description: string
  ogImage: string | null
}

export type TagSeoConfigMap = Record<string, TagSeoConfig>
```

## Build-Time Validation

In `getStaticProps` (`src/pages/index.tsx`), after fetching tags from Contentful:

1. Import `data/tags.json` and cast to `TagSeoConfigMap`.
2. For each tag returned by `getTags()`, assert that `tags.json` contains a matching key.
3. If a tag is missing, throw an error:
   > `Tag "ambient" exists in Contentful but is missing from data/tags.json`

This ensures the build fails fast when a new tag is added to the CMS but not configured locally.

## Changes to `src/pages/index.tsx`

### Removed

- `buildTagDescription()` function
- `capitalize` import (if unused elsewhere)

### Modified — `getStaticProps`

- Import `tagSeoConfig` from `data/tags.json`
- Validate all Contentful tags have config entries
- Pass the matching `TagSeoConfig` (or `null` for non-tag pages) as a prop

### Modified — `Home` component

- `pageTitle`: uses `tagConfig.title` for the label portion (replaces `capitalize(tagId)`)
- `pageDescription`: uses `tagConfig.description` directly (replaces `buildTagDescription()`)
- `ogImage` prop on `<SeoHead>`: uses `tagConfig.ogImage ?? META_IMAGE`

### Unchanged

- Tag nav labels in `<nav>` continue to render `tag.sys.id` as-is
- `[tagId].tsx` and `[tagId]/page/[page].tsx` are unchanged (they delegate to the shared `getStaticProps`)

## Files Changed

| File | Action |
|---|---|
| `data/tags.json` | **Create** — SEO config per tag |
| `src/types/tagConfig.ts` | **Create** — TypeScript interfaces |
| `src/pages/index.tsx` | **Modify** — remove dynamic description, use config, validate |
