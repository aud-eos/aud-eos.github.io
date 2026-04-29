# Categorization (Spec A) — Design Spec

## Problem

The site's tag taxonomy has grown to 10 tags. Tags are useful for cross-cutting drill-down ("show me all `radio` posts") but they're not a good primary navigation: the home page shipped one section per tag (10 sections), which is a lot of vertical real estate, and editors carry the descriptive copy on tags that's really category-level information.

We need a higher-level grouping — categories — that:

- Each post belongs to **exactly one** category.
- Categories carry the descriptive copy (title, description, OG image) that's currently spread across all 10 tags.
- Categories become the primary navigation axis (in Spec B); tags become incidental "extra sugar" on cards.

This spec covers the **data layer only** — adding the field, regenerating types, configuring metadata, backfilling existing posts. The UI rework that consumes the new field is a separate spec (Spec B). At the end of Spec A, every published post has a `category` value but the site renders identically to today.

## Solution

Add a required `category` Symbol field to the Contentful `blogPost` content type with validation `["music", "events", "lifestyle"]`. Maintain category metadata (title, description, OG image) in `data/categories.json`. Build-time validation cross-checks that every published post's category is a key in the JSON config. Existing posts get categorized by a one-time `.mjs` script that maps each post's highest-priority tag to its category.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Spec scope | Data only — no user-visible UI change | Lower risk; cleaner two-step rollout (Spec A ships data, Spec B ships UI) |
| Number of categories | 3: `music`, `events`, `lifestyle` | Matches editorial intent; ~4 sections is the home-page target |
| Category-tag relationship | Independent — each post has 1 category, 0+ tags; tags can span categories | Maximally flexible; matches user mental model |
| Where `category` lives | Contentful field on the post (`Symbol` with validation list) | Single source of truth for which category a post is in; editors set at post time |
| Where category metadata lives | Local `data/categories.json` (hybrid pattern) | Mirrors the `data/tags.json` pattern; copy stays under code review |
| Required vs optional in Contentful | Required | Strongest guarantee against forgotten categorization |
| Backfill conflict resolution | Category-priority order: `music > events > lifestyle` | Editorial weight; trivial to override post-hoc in Contentful |
| Backfill publishing strategy | Dry-run by default; `--apply` writes + auto-publishes | Standard safety pattern; dry-run table is the human review gate |
| Source-of-truth strategy | `data/categories.json` keys ARE the canonical category list; build-time `validateCategoryConfig` enforces every published post's category is a key | Single source of truth in repo; Contentful's field validation list is manually kept in sync (documented) |
| Script language | Plain Node ESM (`.mjs`) | Matches `scripts/upload-images.mjs` precedent |

## Tag → category mapping

The backfill script applies this mapping. The category for a post is the category of its highest-priority tag, where priority is the array order: `music > events > lifestyle`.

| Tag | Category |
|---|---|
| `releases` | music |
| `edits` | music |
| `radio` | music |
| `playlists` | music |
| `dj` | events |
| `nightlife` | events |
| `plantlife` | lifestyle |
| `merch` | lifestyle |
| `graphics` | lifestyle |
| `technology` | lifestyle |

Algorithm: for each post, walk through its tags in any order; find each tag's category in the map above; among those categories, return the one with the highest priority (`music` beats `events` beats `lifestyle`).

Examples:
- Post tagged `[dj, releases]` → `music` (releases is in music; music beats events).
- Post tagged `[nightlife, graphics]` → `events` (events beats lifestyle).
- Post tagged `[plantlife, merch]` → `lifestyle` (both are lifestyle).

## Architecture

### File / data layout

**New files:**

- **`data/categories.json`** — canonical category list + metadata. Keys ARE the source of truth for the allowed category set:

  ```json
  {
    "music": {
      "title": "Music",
      "description": "Releases, edits, mixes, and curated playlists by DJ Audeos.",
      "ogImage": null
    },
    "events": {
      "title": "Events",
      "description": "DJ performances, nightlife recaps, and event promotion.",
      "ogImage": null
    },
    "lifestyle": {
      "title": "Lifestyle",
      "description": "Visual art, merch, plants, and other interests.",
      "ogImage": null
    }
  }
  ```

- **`src/types/categoryConfig.ts`** — types mirroring `src/types/tagConfig.ts`:

  ```typescript
  export interface CategoryConfig {
    title: string;
    description: string;
    ogImage: string | null;
  }

  export type CategoryConfigMap = Record<string, CategoryConfig>;
  ```

- **`src/utils/categoryConfig.ts`** — validator:

  ```typescript
  export function validateCategoryConfig(
    config: CategoryConfigMap,
    publishedPostCategories: ( string | undefined )[],
  ): CategoryConfigMap
  ```

  Behavior:
  - Throws if any element of `publishedPostCategories` is `undefined`.
  - Throws if any element isn't a key of `config`.
  - Returns `config` unchanged on success (matches `validateTagSeoConfig` pattern).

- **`scripts/backfill-categories.mjs`** — one-time migration script (Node ESM). Hardcodes:

  ```javascript
  const CATEGORY_PRIORITY = ["music", "events", "lifestyle"];
  const TAG_TO_CATEGORY = {
    releases: "music", edits: "music", radio: "music", playlists: "music",
    dj: "events", nightlife: "events",
    plantlife: "lifestyle", merch: "lifestyle", graphics: "lifestyle", technology: "lifestyle",
  };
  ```

  Reads `CONTENTFUL_SPACE_ID`, `CONTENTFUL_MANAGEMENT_API_ACCESS_TOKEN`, and `CONTENTFUL_ENVIRONMENT` from process env (loaded by Makefile from `.env`). Uses `contentful-management` (already a dependency).

- **`src/__tests__/utils/categoryConfig.test.ts`** — Vitest unit tests for the validator.

**Modified files:**

- **`Makefile`** — adds two targets:

  ```makefile
  # Dry-run the category backfill (prints planned mapping; no writes)
  backfill-categories:
  	@node scripts/backfill-categories.mjs

  # Apply the category backfill (writes + republishes every entry)
  backfill-categories-apply:
  	@node scripts/backfill-categories.mjs --apply
  ```

- **`src/types/contentful/TypeBlogPost.ts`** — regenerated by `make types` after the field is added in Contentful. The new line is `category: EntryFieldTypes.Symbol;` inside `TypeBlogPostFields`. Do not hand-edit; commit the regenerated output.

- **`src/pages/index.tsx`** — `getStaticProps` adds `validateCategoryConfig` next to the existing `validateTagSeoConfig`:

  ```typescript
  import categoriesData from "../../data/categories.json";
  import { validateCategoryConfig } from "@/utils/categoryConfig";
  // ...
  const categoryConfig: CategoryConfigMap = categoriesData satisfies CategoryConfigMap;
  validateCategoryConfig(
    categoryConfig,
    posts.items.map( post => post.fields.category ),
  );
  ```

- **`src/components/BlogArchive/getStaticProps.ts`** — same `validateCategoryConfig` addition.

### Contentful schema change (manual step)

In the Contentful UI:

1. Open the `blogPost` content type.
2. Add a new field:
   - Name: `Category`
   - Field ID: `category`
   - Type: Symbol (short text)
3. Field settings:
   - **Required**: yes
   - **Validation**: "Accept only specified values" = `["music", "events", "lifestyle"]`
   - **Appearance**: dropdown
4. Save the content type.

Existing entries continue to publish via the Delivery API. Any save/publish on existing entries fails until the field is set — this is what triggers the need for the backfill script.

## Deploy / migration sequence

The order matters. Between step 1 and step 4, no editor should attempt to save or publish an entry.

1. **Contentful UI:** Add the `category` field with validation as described above. Save.
2. **Local:** Run `make types`. Commit the regenerated `src/types/contentful/TypeBlogPost.ts`.
3. **Local:** Run `make backfill-categories` (dry-run). Review the planned mapping table:
   - Confirm all posts get a sensible category.
   - Confirm there are zero `unmapped` rows (script aborts before applying if any exist).
   - Spot-check ~3–5 cross-category posts.
4. **Local:** Run `make backfill-categories-apply`. Script processes ~80 posts in ~12s. On finish, every Contentful entry has `category` set and is republished.
5. **Local:** Run `yarn build`. Confirm `validateCategoryConfig` passes — every published post's category is a key in `data/categories.json`.
6. **PR:** Commit all new files + the regenerated types + Makefile + the two `getStaticProps` updates. Open PR.
7. **Merge:** No user-visible change. Site continues to render the tag-sectioned home from Spec [tag-sections-index]. Spec B picks up the new field for the UI rework.

## Backfill script contract

**Output (dry-run mode):**

```
$ make backfill-categories

Backfill plan (157 published posts):

slug                            category    via tag
my-summer-mix                   music       releases
neon-rooftop-recap              events      dj
plantlife-volume-2              lifestyle   plantlife
...

Summary:
  music:    78
  events:   42
  lifestyle: 37
  unmapped:  0    # would error before applying

No changes written. Re-run with --apply to write.
```

If any post can't be mapped (no tags, or only tags not in `TAG_TO_CATEGORY`), the dry-run aborts BEFORE printing the table:

```
Error: 2 posts cannot be categorized:
  some-post-slug    no tags
  another-slug      tags [foo, bar] are not in TAG_TO_CATEGORY

Fix these in Contentful or extend the script's TAG_TO_CATEGORY map, then re-run.
```

**Output (apply mode):**

```
$ make backfill-categories-apply

Applying (157 posts)...
[1/157]   my-summer-mix          → music     ✓
[2/157]   neon-rooftop-recap     → events    ✓
...
[80/157]  edge-case-slug         → events    ✗ rate limit hit, retrying
[80/157]  edge-case-slug         → events    ✓
...
Done. 157 posts updated and republished. 0 failures.
```

If any single post fails after retry:

```
Done. 156 posts updated. 1 failure:
  failed-slug    UPDATE: <error message>

Re-run `make backfill-categories-apply` to retry failed posts (script is idempotent).
```

**Contract details:**

- Dry-run is the default; `--apply` flag is required to write.
- Script processes both **draft** and **published** entries:
  - Draft entries: `update()` only (sets the field on draft state). Editor's normal publish flow takes over.
  - Published entries: `update()` then `publish()`.
- Pacing: ~150ms between writes to stay well below the Management API's ~7 req/s rate limit.
- Idempotent: re-running on a post that already has `category` set just re-sets to the same value; safe to retry.
- Atomic per-post: each post's update + publish is treated as one logical step; if publish fails, log + continue.

## Edge cases

| Case | Behavior |
|---|---|
| Post with zero tags | Dry-run aborts before any writes. Error names the slug. |
| Post with only unmapped tags | Dry-run aborts before any writes. Error names the slug + the unmapped tags. |
| Tag in `TAG_TO_CATEGORY` whose category isn't in `data/categories.json` | Dry-run aborts at startup (sanity check before iterating posts). |
| Single post update/publish fails mid-apply (network / rate limit) | Log error with slug + continue. Final summary lists failed slugs. Re-run is safe. |
| Draft entry | `update()` only; no `publish()`. Editor's normal flow takes over. |
| Already-categorized entry on re-run | Same value re-set; effectively a no-op. |
| Rate limit (~7 req/s ceiling) | ~150ms pacing between writes. ~80 × 150ms ≈ 12s. |
| Published post lacks `category` at build time (defensive) | `validateCategoryConfig` throws — build fails loudly. |
| Editor adds a 4th category in Contentful but forgets `data/categories.json` | Build fails: `validateCategoryConfig` throws when a post uses the unknown category. |
| Editor adds an entry in `data/categories.json` not used by any post | Allowed (silent). The validator only checks that posts' values are CONFIGURED, not that all configured values are USED. |

## Testing

**`src/__tests__/utils/categoryConfig.test.ts`** — Vitest unit tests for `validateCategoryConfig`:

- Returns the config when every post's category is a key in the config.
- Throws when a post category is missing from the config (error message names the missing category).
- Throws when a post has `undefined` category (error message names the slug or the index).
- Returns the config when the post array is empty.

**The backfill script:** no automated tests. Justification:

- Single-use migration; lifecycle ends after first successful apply.
- Dry-run mode IS the test — its tabular output is reviewed by a human before any write occurs.
- Adding Vitest coverage for one-time Node script logic is overkill.

**Type check:** after `make types` regenerates `TypeBlogPost.ts`, `yarn typecheck` covers downstream wiring (the `post.fields.category` access in the validator calls would break the build if the regen failed).

## SEO impact

None — Spec A makes no user-visible change. Title, description, canonical URLs, JSON-LD on the home page are all unchanged. Feeds are unchanged.

## Out of scope (Spec B and later)

The following are intentionally NOT in this spec:

- Reshaping the home page from `TaggedPostSections` → `CategoryPostSections`.
- Updating `BlogArchive`'s top tag nav → category nav.
- New routes for category pages (e.g., `/category/[slug]`).
- Removing `description` and `ogImage` from `data/tags.json` (they may stay for tag pages).
- Cleaning up "technology" posts (a separate editorial task).
- Extending category JSON-LD on the home page.

These all live in Spec B (separate brainstorm session after Spec A ships).
