# Pioneer Square Art Walk Blog Post — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create and publish the "First Thursday Art Walk at The North West Clothing — May 2013" blog post in Contentful, including a renamed gallery of 55 images and an inlined cover image in the body.

**Architecture:** Pure content operation — no application code changes except a CLAUDE.md update. Images are renamed locally via shell, then uploaded to Contentful as assets via MCP tools. The blog post entry is created with all fields populated, reviewed, then published.

**Tech Stack:** Contentful MCP tools, Bash (file rename), Contentful Management API (via MCP)

---

## Reference

**Spec:** `docs/superpowers/specs/2026-04-11-blog-post-creation-workflow-design.md`

**Contentful:**
- Space ID: `pvyz1kbxgmyk`
- Environment: `master`
- Author entry ID: `3UiOelIV233YDeKGYplmIN`
- Content type: `blogPost`

**Local files:**
- Cover image: `/Users/benny/Downloads/artwalk-flyer-may-2013.jpg`
- Gallery folder: `/Users/benny/Downloads/ART WALK - MAY 2013/`

---

## Task 1: Rename gallery images

**Files:**
- Modify (in-place): all 55 files in `/Users/benny/Downloads/ART WALK - MAY 2013/`

- [ ] **Step 1: Preview the rename mapping**

Run this to verify the sort order and count before renaming:

```bash
ls "/Users/benny/Downloads/ART WALK - MAY 2013/" | sort | nl
```

Expected: 55 lines, starting with `2013-05-02 190640_12966233654_o.jpg`, then `IMG_0059.JPG` through `IMG_0203.JPG`.

- [ ] **Step 2: Rename all files**

```bash
cd "/Users/benny/Downloads/ART WALK - MAY 2013"
counter=1
for filename in $(ls | sort); do
  ext="${filename##*.}"
  new_name="2013-05-02 Pioneer Square Art Walk at The North West Clothing in Seattle - Image ${counter}.${ext,,}"
  mv "$filename" "$new_name"
  counter=$((counter + 1))
done
```

- [ ] **Step 3: Verify rename**

```bash
ls "/Users/benny/Downloads/ART WALK - MAY 2013/" | sort
```

Expected: 55 files named `2013-05-02 Pioneer Square Art Walk at The North West Clothing in Seattle - Image 1.jpg` through `Image 55.jpg`. All extensions should be lowercase `.jpg`.

---

## Task 2: Upload cover image to Contentful

**Files:** None (Contentful asset operation)

- [ ] **Step 1: Upload the cover image asset**

Call `mcp__contentful__upload_asset` with:
- `spaceId`: `pvyz1kbxgmyk`
- `environmentId`: `master`
- `filePath`: `/Users/benny/Downloads/artwalk-flyer-may-2013.jpg`
- `title`: `Art Walk Flyer — May 2, 2013 at The North West Clothing, Pioneer Square, Seattle`
- `description`: `Event flyer for the First Thursday Art Walk at The North West Clothing, 216 Alaskan Way South, Seattle — May 2, 2013`
- `contentType`: `image/jpeg`

- [ ] **Step 2: Record the asset ID and URL**

From the response, capture:
- Asset ID (e.g. `abc123`) — needed for the `image` field on the entry
- Asset URL (e.g. `//images.ctfassets.net/pvyz1kbxgmyk/abc123/...`) — needed for the body markdown

Write both values down before proceeding to Task 3.

- [ ] **Step 3: Verify the asset is published**

Confirm the asset was published (status: published) in the upload response. If not, call `mcp__contentful__publish_asset` with the asset ID.

---

## Task 3: Upload gallery images (55 images)

**Files:** None (Contentful asset operations)

> **Note:** Upload in batches of 5 to stay within Contentful MCP limits. Each batch follows the same pattern.

- [ ] **Step 1: Upload Images 1–5**

For each of the 5 images, call `mcp__contentful__upload_asset` with:
- `spaceId`: `pvyz1kbxgmyk`
- `environmentId`: `master`
- `filePath`: `/Users/benny/Downloads/ART WALK - MAY 2013/2013-05-02 Pioneer Square Art Walk at The North West Clothing in Seattle - Image N.jpg`
- `title`: `Pioneer Square Art Walk at The North West Clothing — May 2, 2013 — Image N`
- `description`: `Photo from the First Thursday Art Walk at The North West Clothing, Pioneer Square, Seattle — May 2, 2013`
- `contentType`: `image/jpeg`

Replace `N` with the image number. Collect all 5 asset IDs.

- [ ] **Step 2: Upload Images 6–10**

Same as Step 1, for images 6–10. Collect asset IDs.

- [ ] **Step 3: Upload Images 11–15**

Same pattern. Collect asset IDs.

- [ ] **Step 4: Upload Images 16–20**

Same pattern. Collect asset IDs.

- [ ] **Step 5: Upload Images 21–25**

Same pattern. Collect asset IDs.

- [ ] **Step 6: Upload Images 26–30**

Same pattern. Collect asset IDs.

- [ ] **Step 7: Upload Images 31–35**

Same pattern. Collect asset IDs.

- [ ] **Step 8: Upload Images 36–40**

Same pattern. Collect asset IDs.

- [ ] **Step 9: Upload Images 41–45**

Same pattern. Collect asset IDs.

- [ ] **Step 10: Upload Images 46–50**

Same pattern. Collect asset IDs.

- [ ] **Step 11: Upload Images 51–55**

Same pattern. Collect asset IDs.

- [ ] **Step 12: Verify all 55 asset IDs are collected**

You should have exactly 55 asset IDs from the gallery uploads, plus 1 from the cover image in Task 2. Confirm the count before proceeding.

---

## Task 4: Create the blog post entry

**Files:** None (Contentful entry operation)

- [ ] **Step 1: Build the body with the inlined cover image URL**

Take the cover image URL from Task 2 Step 2 and construct the full body:

```
First Thursday Art Walk came through Pioneer Square last night and The North West Clothing was the spot. OCNotes was on the decks, we had a Super Nintendo set up with a Street Fighter II tournament running all night, and the store was wall to wall.

6PM to 10PM — music, new zip-ups, refreshments, and a crowd that showed up. Pioneer Square Art Walk does it every first Thursday and this one was no exception.

![Art Walk Flyer — May 2, 2013 at The North West Clothing, Pioneer Square, Seattle](https:COVER_IMAGE_URL)

Photos below.
```

Replace `COVER_IMAGE_URL` with the URL captured in Task 2 (prepend `https:` since Contentful URLs are protocol-relative).

- [ ] **Step 2: Create the entry**

Call `mcp__contentful__create_entry` with:
- `spaceId`: `pvyz1kbxgmyk`
- `environmentId`: `master`
- `contentTypeId`: `blogPost`
- `fields`:

```json
{
  "title": { "en-US": "First Thursday Art Walk at The North West Clothing — May 2013" },
  "slug": { "en-US": "art-walk-pioneer-square-north-west-clothing-may-2013" },
  "description": { "en-US": "Recap of the First Thursday Art Walk at The North West Clothing in Pioneer Square, Seattle — DJ OCNotes on the decks, a Super Nintendo Street Fighter II tournament, and good vibes all night." },
  "body": { "en-US": "<BODY FROM STEP 1>" },
  "date": { "en-US": "2013-05-03" },
  "image": {
    "en-US": { "sys": { "type": "Link", "linkType": "Asset", "id": "<COVER_ASSET_ID>" } }
  },
  "gallery": {
    "en-US": [
      { "sys": { "type": "Link", "linkType": "Asset", "id": "<GALLERY_ASSET_ID_1>" } },
      { "sys": { "type": "Link", "linkType": "Asset", "id": "<GALLERY_ASSET_ID_2>" } }
      // ... all 55 gallery asset IDs
    ]
  },
  "author": {
    "en-US": { "sys": { "type": "Link", "linkType": "Entry", "id": "3UiOelIV233YDeKGYplmIN" } }
  }
}
```

- `metadata`:
```json
{
  "tags": [
    { "sys": { "type": "Link", "linkType": "Tag", "id": "dj" } },
    { "sys": { "type": "Link", "linkType": "Tag", "id": "nightlife" } },
    { "sys": { "type": "Link", "linkType": "Tag", "id": "merch" } }
  ]
}
```

- [ ] **Step 3: Record the new entry ID**

Capture the entry ID from the create response. Needed for publishing in Task 6.

---

## Task 5: Review before publishing

**Files:** None

- [ ] **Step 1: Fetch the entry and present it for review**

Call `mcp__contentful__get_entry` with the entry ID from Task 4 Step 3.

Display the following for user review:
- Title
- Slug
- Meta description
- Date
- Author
- Tags
- Full body text
- Gallery image count (confirm 55 links)
- Cover image asset ID

- [ ] **Step 2: Wait for explicit user approval**

Do NOT proceed to Task 6 until the user says to publish. If changes are requested, use `mcp__contentful__update_entry` to apply them, then re-display for review.

---

## Task 6: Publish the entry

**Files:** None

- [ ] **Step 1: Publish the entry**

Call `mcp__contentful__publish_entry` with the entry ID from Task 4 Step 3.

- [ ] **Step 2: Verify publication**

Confirm the response shows `publishedVersion` is set. The post is now live.

---

## Task 7: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md` (project root)

- [ ] **Step 1: Add blog post workflow section to CLAUDE.md**

Add the following section to `CLAUDE.md` under the Architecture section:

```markdown
## Blog Post Creation Workflow

To create a new blog post, follow the 10-step workflow documented in:
`docs/superpowers/specs/2026-04-11-blog-post-creation-workflow-design.md`

**Summary:**
1. Gather: topic, date, tone, key details, author, cover image, gallery folder, tags
2. Draft body content (iterate until approved)
3. SEO checklist: slug, title, meta description, tags
4. Rename gallery images: `YYYY-MM-DD [Event Name] - Image N.jpg` (alphabetical sort order)
5. Upload cover image to Contentful → capture URL for body inline
6. Build final body with inlined cover image markdown (`![alt](https://url)`) before "Photos below."
7. Upload all gallery images in batches of 5
8. Create `blogPost` entry in Contentful with all fields
9. Review full entry with user — do NOT publish without explicit approval
10. Publish via Contentful MCP

**Rules:**
- Never create new tags — only use existing tags (check with `mcp__contentful__list_tags`)
- Always show proposed entry for approval before publishing
- Gallery image filenames must be descriptive for SEO (never upload `IMG_XXXX.JPG` as-is)
- Inline the cover image at the end of the body using markdown image syntax — the Markdown component renders standalone image paragraphs as `<MediaFigure>` automatically
```

- [ ] **Step 2: Run format check**

```bash
yarn lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add blog post creation workflow to CLAUDE.md"
```

---

## Self-Review

**Spec coverage:**
- ✅ 10-step workflow → Tasks 1–7
- ✅ Image rename format → Task 1
- ✅ Cover image upload + URL capture → Task 2
- ✅ Gallery batch upload (55 images) → Task 3
- ✅ Inline cover image in body → Task 4 Step 1
- ✅ Entry creation with all fields (title, slug, description, body, date, image, gallery, author, tags) → Task 4 Step 2
- ✅ Review gate before publish → Task 5
- ✅ Publish → Task 6
- ✅ CLAUDE.md update → Task 7

**Placeholder scan:** No TBD or TODO present. Asset ID and URL placeholders are marked clearly with `<ANGLE_BRACKET>` convention and explained in preceding steps.

**Type consistency:** Field structure in Task 4 matches `TypeBlogPostFields` exactly (`title`, `slug`, `description`, `body`, `date`, `image`, `gallery`, `author`). Tag references use Contentful tag link format.
