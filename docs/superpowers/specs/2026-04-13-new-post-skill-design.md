# `/new-post` Claude Code Skill — Design Spec

## Purpose

A Claude Code skill that guides users through creating blog posts for audeos.com, from brainstorming through Contentful entry creation. Invoked via `/new-post`. Supports two modes: brainstorm (start from scratch) and assembly (content already ready).

## Skill Location

`.claude/skills/new-post.md` — a prompt-only skill file, no code dependencies. Editable anytime; changes take effect on next invocation.

## Invocation

- **`/new-post`** — brainstorm mode: develop topic, outline, draft collaboratively
- **`/new-post "My Post Title"`** — assembly mode: content is ready, collect fields and create entry

## Brainstorm Mode Flow

Triggered when invoked with no arguments.

1. **Topic exploration** — ask what the user wants to write about, help refine the angle
2. **Outline** — collaboratively build a section-by-section outline
3. **Drafting** — work through each section iteratively (user drives the voice, Claude helps structure and expand)
4. **Featured image** — required. Ask for an image path, upload via `make upload-images`, set as the post's featured image
5. **Gallery images** — ask if there are additional images. Accept a folder path, upload all via `make upload-images`, link as the gallery array
6. **Field assembly** — derive remaining fields from the content:
   - **Title**: from working title
   - **Slug**: auto-generated from title, shown for approval
   - **Description**: drafted as 1-2 sentence summary, shown for approval
   - **Date**: defaults to today
   - **Author**: defaults to the user's author entry (fetched from Contentful); ask only if multiple authors exist
   - **Tags**: suggest from existing tags only (never suggest creating new tags)
7. **SEO check** — automated
8. **Content review** — requires user approval
9. **Entry creation** — draft or publish per user choice

## Assembly Mode Flow

Triggered when invoked with a title argument.

1. **Body** — ask user to paste or dictate content (markdown)
2. **Featured image** — required. Ask for image path, upload via `make upload-images`
3. **Gallery images** — ask if there are additional images. Accept a folder path, upload all via `make upload-images`
4. **Description** — draft a summary from the body, show for approval
5. **Slug** — auto-generated from title, shown for approval
6. **Date** — defaults to today, ask if a different date is wanted
7. **Author** — default to user's author entry
8. **Tags** — suggest from existing tags only
9. **Optional fields** — ask about Spotify playlist and location (quick yes/no, skipped if declined)
10. **SEO check** — automated
11. **Content review** — requires user approval
12. **Entry creation** — draft or publish per user choice

## SEO Check (Automated)

Runs automatically after all fields are assembled. Flags issues as warnings for the user to decide on:

- **Slug**: is it descriptive and URL-friendly?
- **Title**: length under 60 characters for search result display
- **Description**: length 120-160 characters, contains key terms from the post
- **Body**: word count, heading structure (H2/H3 usage), keyword placement in first paragraph
- **Featured image**: filename is descriptive (flag generic names like `IMG_1234.jpg`)
- **Tags**: at least one tag assigned
- **Internal links**: flag if none are present in the body

## Content Review

Shows the user a complete summary before entry creation:

```
Title: ...
Slug: ...
Description: ...
Author: ...
Date: ...
Tags: ...
Featured image: [filename] -> [url]
Gallery: [N images]
Body: [first 200 chars...]
Word count: ...
SEO warnings: [any flagged issues]
```

Then asks: "Create as draft, publish immediately, or make changes?"

## Entry Creation

1. Create the entry in Contentful via `mcp__contentful__create_entry` with all fields:
   - title, slug, description, body, date (localized with `en-US` key)
   - author as entry link
   - featured image as asset link
   - gallery as array of asset links
   - tags via metadata
2. Publish or leave as draft based on user's choice
3. Report back with the entry ID and Contentful UI link
4. If draft, remind user to publish from Contentful UI when ready

## Tools Used

- **`make upload-images DIR="..."`** — upload local images to Contentful (returns `{ filename, assetId, url }`)
- **`mcp__contentful__create_entry`** — create blog post entry
- **`mcp__contentful__publish_entry`** — publish entry (if user chooses)
- **`mcp__contentful__search_entries`** — look up existing authors
- **`mcp__contentful__list_tags`** — fetch available tags for suggestion
- **`mcp__contentful__get_content_type`** — verify blog post field structure

## Content Model Reference

Blog post fields (content type: `blogPost`):

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | Symbol (localized) | Yes | Post heading |
| `slug` | Symbol | Yes | URL-friendly, unique |
| `description` | Text (localized) | Yes | Meta description / preview |
| `author` | Entry Link | Yes | Link to Author entry |
| `image` | Asset Link | Yes* | Featured/cover image (*enforced by skill, not Contentful) |
| `body` | Text | No | Markdown content |
| `date` | Date | No | Publication date; falls back to `sys.createdAt` |
| `gallery` | Array of Asset Links | No | Additional images/videos |
| `spotifyPlaylistId` | Symbol | No | Spotify embed |
| `location` | Location (localized) | No | Geographic metadata |
| `video` | Asset Link | No | Video asset |
| `metadata.tags` | Tag Links | No | Native Contentful tags |

## Constraints

- Never suggest creating new tags — only suggest from existing tags in the space
- Featured image is required before entry creation (enforced by the skill)
- Always show proposed content for user approval before any Contentful write operations
- Always rename images to descriptive filenames before uploading (remind user if needed)
- Author selection: fetch all authors via `mcp__contentful__search_entries`. If only one exists, use it automatically. If multiple, ask the user to pick.
