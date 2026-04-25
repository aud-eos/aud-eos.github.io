---
name: new-post
description: Use when the user wants to create a new blog post, write an article, or publish content to audeos.com
disable-model-invocation: true
argument-hint: [title]
---

# Create a New Blog Post

Guide the user through creating a blog post for audeos.com and publishing it to Contentful.

## Mode Selection

- If `$ARGUMENTS` is empty: start in **Brainstorm Mode**
- If `$ARGUMENTS` contains a title: start in **Assembly Mode** with that title

## Brainstorm Mode

1. **Load brand voice** — read `.claude/brand-voice.md` if it exists. Use it as a style reference throughout drafting — match the user's sentence structure, vocabulary, tone, and rhythm. If the file doesn't exist, skip this step and let the user drive the voice entirely.
2. **Topic exploration** — ask what the user wants to write about, help refine the angle
3. **Outline** — collaboratively build a section-by-section outline
4. **Drafting** — work through each section iteratively. The user drives the voice; help structure and expand. Apply the brand voice profile when writing or suggesting text. Do not write the entire post yourself — collaborate section by section.
5. Continue to **Image Upload** below

## Assembly Mode

1. **Body** — ask the user to paste or dictate the post content (markdown format)
2. Continue to **Image Upload** below

## Image Upload

Images are uploaded to Contentful via the `make upload-images` command. Always remind the user to rename image files to descriptive filenames before uploading.

1. **Featured image (required)** — ask the user for the image file path. Upload it:

```bash
make upload-images DIR="/path/to/image.jpg"
```

Record the `assetId` from the JSON output — this links to the post's `image` field.

2. **Gallery images (optional)** — ask if there are additional images. If yes, accept a folder path and upload all:

```bash
make upload-images DIR="/path/to/folder"
```

Record all `assetId` values for the `gallery` field.

## Field Assembly

Collect or derive all required fields. Show each to the user for approval:

| Field | How to get it |
|-------|---------------|
| **title** | From brainstorm working title or `$ARGUMENTS` |
| **slug** | Auto-generate from title (lowercase, hyphens, no special chars). Show for approval. |
| **description** | Draft a 1-2 sentence summary from the body (120-160 chars). Show for approval. |
| **body** | The markdown content from brainstorm or assembly |
| **date** | Default to today's date. Ask if a different date is wanted. |
| **author** | Fetch authors via `mcp__contentful__search_entries` with content type `author`. If only one exists, use it. If multiple, ask user to pick. |
| **image** | Asset link from featured image upload (required) |
| **gallery** | Array of asset links from gallery upload (if any) |
| **tags** | Fetch existing tags via `mcp__contentful__list_tags`. Suggest relevant ones. Never suggest creating new tags. |
| **spotifyPlaylistId** | Ask if they want to embed a Spotify playlist (yes/no). Skip if no. |
| **soundcloudUrl** | Ask if they want to embed a SoundCloud track or playlist (yes/no). If yes, collect the full SoundCloud URL. Skip if no. |
| **youtubeUrl** | Ask if they want to embed a YouTube video (yes/no). If yes, collect the full YouTube URL. Skip if no. |
| **tiktokUrl** | Ask if they want to embed a TikTok video (yes/no). If yes, collect the full TikTok URL. Fetch oEmbed data via `curl -s "https://www.tiktok.com/oembed?format=json&url=<encoded-url>"` to get the title and thumbnail. Offer to use the TikTok thumbnail as the featured image — download it with `curl -o`, rename to a descriptive filename, and upload via `make upload-images`. |
| **location** | Ask if they want to add a location (yes/no). Skip if no. |

## SEO Check

Run this automatically after fields are assembled. Flag issues as warnings — the user decides what to act on.

Check these items:
- **Slug**: is it descriptive and URL-friendly? (no generic slugs like "post-1")
- **Title**: under 60 characters for search result display
- **Description**: 120-160 characters, contains key terms from the post
- **Body**: report word count, check for H2/H3 heading structure, check if first paragraph contains key terms
- **Featured image**: filename is descriptive (flag generic names like `IMG_1234.jpg` or `screenshot.png`)
- **Tags**: at least one tag assigned
- **Internal links**: flag if no links to other posts are present in the body

Present all warnings in a list. Do not block on warnings — they are advisory.

## Link & Image Validation

Run this automatically after the SEO check and **before** content review. This step is **blocking** — all URLs must resolve before proceeding to entry creation.

1. **Extract all URLs** from the post body — both markdown images (`![alt](url)`) and inline links (`[text](url)`)
2. **Validate each URL** by fetching it with `WebFetch` and checking that it loads successfully
3. **Check for malformed URLs** — common issues include:
   - Contentful image URLs using `https://images.ctfassets.net/...` instead of `//images.ctfassets.net/...` (must be protocol-relative)
   - Missing colon in protocol (`https//` instead of `https://`)
   - Double slashes or missing slashes
   - Truncated or incomplete URLs
   - Relative paths that should be absolute
4. **Report results** in a table:

```
| URL | Type | Status |
|-----|------|--------|
| https://example.com/image.jpg | image | ✓ OK |
| https//broken.com/img.jpg | image | ✗ Malformed protocol |
```

5. **If any URL fails**: show the broken URLs, suggest fixes, and ask the user to confirm corrections before proceeding. Do not continue to Content Review until all URLs are valid.

## Content Review

Present the complete entry summary for user approval:

```
Title: ...
Slug: ...
Description: ...
Author: ...
Date: ...
Tags: ...
Featured image: [filename] -> [assetId]
Gallery: [N images]
Body preview: [first 200 chars]...
Word count: ...
SEO warnings: [list any flagged issues]
```

Ask: **"Create as draft, publish immediately, or make changes?"**

If "make changes" — ask what to change, update, and re-present the review.

## Entry Creation

Create the blog post entry in Contentful. The content type ID is `blogPost`. All text fields use locale `en-US`.

Use `mcp__contentful__create_entry` with:

```json
{
  "contentTypeId": "blogPost",
  "fields": {
    "title": { "en-US": "<title>" },
    "slug": { "en-US": "<slug>" },
    "description": { "en-US": "<description>" },
    "body": { "en-US": "<body>" },
    "date": { "en-US": "<YYYY-MM-DD>" },
    "author": { "en-US": { "sys": { "type": "Link", "linkType": "Entry", "id": "<authorId>" } } },
    "image": { "en-US": { "sys": { "type": "Link", "linkType": "Asset", "id": "<imageAssetId>" } } },
    "gallery": { "en-US": [{ "sys": { "type": "Link", "linkType": "Asset", "id": "<assetId>" } }] },
    "spotifyPlaylistId": { "en-US": "<playlistId>" },
    "soundcloudUrl": { "en-US": "<soundcloudUrl>" },
    "youtubeUrl": { "en-US": "<youtubeUrl>" },
    "tiktokUrl": { "en-US": "<tiktokUrl>" }
  },
  "metadata": {
    "tags": [{ "sys": { "type": "Link", "linkType": "Tag", "id": "<tagId>" } }]
  }
}
```

Omit optional fields that were not provided (gallery, spotifyPlaylistId, soundcloudUrl, youtubeUrl, tiktokUrl, location). Tags go in `metadata`, not `fields`.

If the user chose **publish immediately**, follow up with `mcp__contentful__publish_entry`.

If the user chose **draft**, remind them to publish from the Contentful UI when ready.

Report back with:
- The entry ID
- The Contentful entry URL: `https://app.contentful.com/spaces/<spaceId>/entries/<entryId>`
- The live post URL (once published): `https://www.audeos.com/post/<slug>`

## Important Rules

- **Never suggest creating new tags** — only suggest from existing tags in the space
- **Featured image is required** — do not proceed to entry creation without one
- **Always show content for approval** before any Contentful write operation
- **Remind about descriptive filenames** before image uploads
- **Author defaults to sole author** — only ask for selection if multiple exist
- **Apply brand voice when writing** — always read `.claude/brand-voice.md` before drafting or suggesting text. Match the documented style patterns. If the profile doesn't exist yet, suggest running `/brand-voice` first to build one.
- **Embed the featured image in the body** — the cover image should always appear inline somewhere in the post body as a markdown image (`![alt](url)`). Place it where it fits naturally (e.g., near the top or after the intro).
- **Use protocol-relative URLs for Contentful images** — inline images in the body must use `//images.ctfassets.net/...` (no `https:`). The site's `Picture` component prepends `https:`, so a full `https://` URL results in a broken `https://https//...` double protocol. This matches how Contentful's own markdown editor inserts images.
- **Validate all URLs before publishing** — every inline link and image in the body must be fetched and confirmed working. Do not proceed to entry creation with broken URLs.
