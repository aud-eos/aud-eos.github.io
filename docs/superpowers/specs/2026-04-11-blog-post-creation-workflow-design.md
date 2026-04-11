# Blog Post Creation Workflow — Design Spec
**Date:** 2026-04-11
**Status:** Approved

---

## Overview

This spec covers two things:

1. A reusable workflow for creating blog posts on audeos.com via Claude + Contentful MCP tools
2. The specific implementation plan for the first post using this workflow: the May 2013 Pioneer Square Art Walk

Content is managed in Contentful. Claude creates entries directly using the Contentful MCP tools — no manual steps in the Contentful UI are required.

---

## Reusable Blog Post Creation Workflow

Every blog post follows these steps in order:

### Step 1 — Gather content inputs
Collect from the user:
- Topic and key details (people, places, events worth mentioning)
- Tone (casual/personal, editorial, etc.)
- Post date (may differ from today if writing retroactively)
- Author (verify against existing Contentful author entries)
- Cover image file path (local)
- Gallery image folder path (local), if any
- Tags (must already exist in Contentful — do not create new tags)
- Body content preference: draft it, or user provides existing text

### Step 2 — Draft body content
If drafting:
- Write in the established tone
- Keep it short and authentic — avoid AI-sounding filler phrases
- Iterate with the user until approved

### Step 3 — SEO checklist
Before creating the entry, confirm:
- [ ] Slug: lowercase, hyphenated, descriptive, includes key terms and year
- [ ] Title: clear, includes event name and date
- [ ] Meta description: under 155 characters, summarises the post accurately
- [ ] Body word count: sufficient for the post type
- [ ] Tags: appropriate existing tags selected (no new tags)

### Step 4 — Rename gallery images
If a gallery folder is provided, rename all images before uploading:
- Format: `YYYY-MM-DD [Descriptive Event Name] - Image N.jpg`
- Example: `2013-05-02 Pioneer Square Art Walk at The North West Clothing in Seattle - Image 1.jpg`
- Numbering follows alphabetical sort order of original filenames
- Use a shell loop to rename in-place; do not move files out of the folder

### Step 5 — Upload cover image
- Upload the cover image to Contentful as an asset
- Capture the resulting Contentful asset ID and URL
- If the cover image will also be inlined in the body (before the gallery), hold the URL for Step 6

### Step 6 — Draft final body with inline image (if applicable)
If the user wants the cover image inlined before the gallery:
- Append `![Alt text](https://contentful-asset-url)` at the end of the body, before any "Photos below" line
- The Markdown renderer converts standalone image paragraphs into `<MediaFigure>` components automatically

### Step 7 — Upload gallery images
- Upload all renamed gallery images to Contentful as assets
- Collect all resulting asset IDs for the `gallery` field

### Step 8 — Create the Contentful entry
Create a `blogPost` entry with:
| Field | Value |
|---|---|
| `title` | Post title (localized: `en-US`) |
| `slug` | URL slug |
| `description` | Meta description (localized: `en-US`) |
| `body` | Markdown body text |
| `date` | ISO date string (YYYY-MM-DD) |
| `image` | Link to cover asset |
| `gallery` | Array of links to gallery assets |
| `author` | Link to author entry |
| `metadata.tags` | Array of tag references |

### Step 9 — Review before publish
Present a full summary of the entry to the user for approval:
- Title, slug, description, date, tags, author
- Full body text
- List of gallery image filenames

**Do not publish until the user explicitly approves.**

### Step 10 — Publish
Publish the entry via Contentful MCP. Confirm success.

---

## Contentful Space Details

| Key | Value |
|---|---|
| Space ID | `pvyz1kbxgmyk` |
| Environment | `master` |
| Author entry ID (Audeos) | `3UiOelIV233YDeKGYplmIN` |
| Blog post content type | `blogPost` |

### Available tags (as of 2026-04-11)
`graphics`, `merch`, `plantlife`, `edits`, `records`, `radio`, `technology`, `playlists`, `dj`, `nightlife`

---

## First Post: Pioneer Square Art Walk — May 2013

### Content

**Title:** `First Thursday Art Walk at The North West Clothing — May 2013`

**Slug:** `art-walk-pioneer-square-north-west-clothing-may-2013`

**Meta description:** `Recap of the First Thursday Art Walk at The North West Clothing in Pioneer Square, Seattle — DJ OCNotes on the decks, a Super Nintendo Street Fighter II tournament, and the last night out before Japan.`

**Date:** `2013-05-03`

**Author:** Audeos (`3UiOelIV233YDeKGYplmIN`)

**Tags:** `dj`, `nightlife`, `merch`

**Body (approved):**
```
First Thursday Art Walk came through Pioneer Square last night and The North West Clothing was the spot. OCNotes was on the decks, we had a Super Nintendo set up with a Street Fighter II tournament running all night, and the store was wall to wall.

6PM to 10PM — music, new zip-ups, refreshments, and a crowd that showed up. Pioneer Square Art Walk does it every first Thursday and this one was no exception.

![Art Walk Flyer — May 2, 2013 at The North West Clothing, Pioneer Square, Seattle](COVER_IMAGE_URL)

Photos below.
```
*(Replace `COVER_IMAGE_URL` with the Contentful asset URL after upload)*

### Images

**Cover image (local path):** `/Users/benny/Downloads/artwalk-flyer-may-2013.jpg`

**Gallery folder (local path):** `/Users/benny/Downloads/ART WALK - MAY 2013/`

**Gallery rename format:** `2013-05-02 Pioneer Square Art Walk at The North West Clothing in Seattle - Image N.jpg`

**Total gallery images:** 55

Rename order follows alphabetical sort of original filenames:
1. `2013-05-02 190640_12966233654_o.jpg` → Image 1
2. `IMG_0059.JPG` → Image 2
3. `IMG_0060.JPG` → Image 3
4. ... and so on through Image 55

---

## CLAUDE.md Update

Add a "Blog Post Workflow" section to `CLAUDE.md` that references this spec and summarises the 10-step workflow. Future sessions should invoke this workflow whenever a new blog post is requested.
