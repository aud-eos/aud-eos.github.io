# `/new-post` Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a Claude Code skill that guides users through creating blog posts for audeos.com, from brainstorming through Contentful entry creation.

**Architecture:** A single SKILL.md file in `.claude/skills/new-post/` that instructs Claude how to behave when `/new-post` is invoked. The skill uses the Contentful MCP tools for entry creation and the existing `make upload-images` script for asset uploads. No code dependencies — it's a prompt file.

**Tech Stack:** Claude Code skills (markdown), Contentful MCP tools, `make upload-images`

---

## File Structure

```
.claude/skills/new-post/SKILL.md    # The skill file (create)
CLAUDE.md                           # Update with /new-post docs (modify)
```

---

### Task 1: Create the skill directory and SKILL.md

**Files:**
- Create: `.claude/skills/new-post/SKILL.md`

- [ ] **Step 1: Create the skill file**

Create `.claude/skills/new-post/SKILL.md` with the following content:

````markdown
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

1. **Topic exploration** — ask what the user wants to write about, help refine the angle
2. **Outline** — collaboratively build a section-by-section outline
3. **Drafting** — work through each section iteratively. The user drives the voice; help structure and expand. Do not write the entire post yourself — collaborate section by section.
4. Continue to **Image Upload** below

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
    "spotifyPlaylistId": { "en-US": "<playlistId>" }
  },
  "metadata": {
    "tags": [{ "sys": { "type": "Link", "linkType": "Tag", "id": "<tagId>" } }]
  }
}
```

Omit optional fields that were not provided (gallery, spotifyPlaylistId, location). Tags go in `metadata`, not `fields`.

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
````

- [ ] **Step 2: Verify the skill file is valid**

```bash
head -5 .claude/skills/new-post/SKILL.md
```

Expected: Shows the YAML frontmatter with `name: new-post`.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/new-post/SKILL.md
git commit -m "feat: add /new-post skill for blog post creation workflow"
```

---

### Task 2: Update CLAUDE.md documentation

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add /new-post documentation to CLAUDE.md**

Add a new section after the "Contentful asset management" section in CLAUDE.md:

```markdown
Blog post creation (Claude Code skill):

```bash
/new-post                    # Brainstorm mode: develop topic, outline, and draft collaboratively
/new-post "My Post Title"    # Assembly mode: content ready, collect fields and create entry
```

Walks through content creation, image upload, SEO check, and Contentful entry creation. See `.claude/skills/new-post/SKILL.md` for the full workflow.
```

- [ ] **Step 2: Run format**

```bash
yarn format
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add /new-post skill to CLAUDE.md"
```

---

### Task 3: Manual test — invoke the skill

- [ ] **Step 1: Test skill discovery**

In Claude Code, type `/new-post` and verify it appears in autocomplete and can be invoked.

- [ ] **Step 2: Test assembly mode**

Invoke `/new-post "Test Post"` and verify Claude follows the assembly mode flow: asks for body, featured image, etc.

- [ ] **Step 3: Test brainstorm mode**

Invoke `/new-post` with no arguments and verify Claude starts in brainstorm mode: asks about topic.

- [ ] **Step 4: Verify Contentful MCP integration**

During either test, verify that Claude correctly:
- Fetches authors via `mcp__contentful__search_entries`
- Fetches tags via `mcp__contentful__list_tags`
- Runs `make upload-images` for image upload

If the skill needs adjustments based on testing, edit `.claude/skills/new-post/SKILL.md` and re-test.
