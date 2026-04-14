---
name: describe-assets
description: Add SEO-friendly descriptions to Contentful media assets that are missing them. Picks random assets, shows the image, suggests a description, and lets the user refine before saving.
disable-model-invocation: true
argument-hint: [count]
---

# Describe Media Assets

Help the user add descriptions to Contentful media assets that are missing them. This improves SEO (alt text) and accessibility.

## Setup

- Space ID: `pvyz1kbxgmyk`
- Environment: `master`
- Locale: `en-US`

## Workflow

### 1. Determine batch size

- If `$ARGUMENTS` contains a number, use that as the batch size (how many assets to describe in this session)
- If `$ARGUMENTS` is empty, default to **1**

### 2. Find an asset missing a description

Use `mcp__contentful__list_assets` to find assets without descriptions. The tool returns a max of 3 assets per call.

**Strategy for random selection:**

1. First call `mcp__contentful__list_assets` with `limit: 1` to get the `total` count of assets
2. Generate a random `skip` value between 0 and total - 1
3. Call `mcp__contentful__list_assets` with `skip: <random>`, `limit: 3`
4. Check if any returned asset has an empty description
5. If all have descriptions, try another random skip value
6. After 10 failed attempts, report that most assets appear to have descriptions already

### 3. Show the asset to the user

For each asset missing a description:

1. **Show the image** — download the image and open it in macOS Preview so the user can see it, then read it so Claude can suggest a description:

```bash
curl -s "https:<url>?w=400" -o /tmp/asset-preview.jpg && open /tmp/asset-preview.jpg
```

Then use the `Read` tool on `/tmp/asset-preview.jpg` so Claude can also see the image and draft a description. Also show the full Contentful URL as a fallback.
2. **Show metadata:**
   - Title (filename)
   - Asset ID
   - Contentful URL: `https://app.contentful.com/spaces/pvyz1kbxgmyk/assets/<assetId>`
3. **Suggest a description** — based on what you see in the image, draft an SEO-friendly alt text description (1-2 sentences, 80-160 characters). Consider:
   - What is depicted (people, objects, setting)
   - The context from the filename/title (event names, locations, dates)
   - Keep it descriptive and specific, not generic
4. **Ask the user to approve, edit, or provide their own description** — the user has context you don't (names, event details, inside knowledge)

### 4. Update the asset

Once the user approves a description, update the asset using `mcp__contentful__update_asset`:

```json
{
  "assetId": "<assetId>",
  "fields": {
    "description": {
      "en-US": "<approved description>"
    }
  }
}
```

Then publish the updated asset using `mcp__contentful__publish_asset`.

### 5. Loop or finish

- Show a running count: "Done: 3/5 assets described"
- If batch size is not reached, go back to step 2 for the next random asset
- After completing the batch, report:
  - How many assets were described
  - How many total assets still need descriptions (if known)

## Important Rules

- **Always show the image and suggested description before updating** — never update without user approval
- **Use context from the filename** — filenames are descriptive and contain event names, dates, and locations
- **Keep descriptions concise** — 1-2 sentences, optimized for alt text / SEO
- **Publish after updating** — always publish the asset after updating the description so changes go live
- **Don't skip assets** — if the user says "skip" or "next", move to the next random asset without updating, but still count it toward the batch for UX purposes
