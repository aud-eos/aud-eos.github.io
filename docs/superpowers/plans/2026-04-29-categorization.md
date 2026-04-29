# Categorization (Spec A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **NOTE — Task 6 is a MANUAL GATE.** It requires the human to log into the Contentful web UI and run two `make` targets locally with live credentials. Subagents cannot complete it. Pause automated execution at Task 6, complete it interactively, then resume with Task 7.

**Goal:** Add a required `category` Symbol field to the Contentful `blogPost` content type, populate it for every existing post via a one-time backfill script, validate it at build time, and ship the data layer with no user-visible UI change.

**Architecture:** Three-category taxonomy (`music`, `events`, `lifestyle`) lives in `data/categories.json` (canonical list = JSON keys; metadata = title/description/ogImage). A new `validateCategoryConfig` helper mirrors the existing `validateTagSeoConfig` pattern. A one-time `.mjs` backfill script (matching the `upload-images.mjs` precedent) maps each existing post to a category by walking its tags through a hardcoded `TAG_TO_CATEGORY` map and resolving conflicts via the priority order `music > events > lifestyle`. Build-time validation in `pages/index.tsx`'s and `BlogArchive`'s `getStaticProps` ensures every published post's category is a configured key.

**Tech Stack:** Next.js (`output: "export"`), TypeScript, Vitest, Contentful (Delivery + Management APIs), Node ESM (`.mjs`), Yarn 4.

**Spec:** `docs/superpowers/specs/2026-04-29-categorization-design.md`

**Branch:** `categorization` (already created, off `main`).

---

### Task 1: Create `data/categories.json`

**Files:**
- Create: `data/categories.json`

The keys of this file are the canonical category list. The validator and the Contentful field's validation rule both reference this set (the latter is kept in sync manually, per spec).

- [ ] **Step 1: Create the JSON file**

Create `data/categories.json`:

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

- [ ] **Step 2: Commit**

```bash
git add data/categories.json
git commit -m "feat: add categories.json config"
```

---

### Task 2: Create `src/types/categoryConfig.ts`

**Files:**
- Create: `src/types/categoryConfig.ts`

Mirrors `src/types/tagConfig.ts` exactly — same shape, different name.

- [ ] **Step 1: Create the type file**

Create `src/types/categoryConfig.ts`:

```typescript
export interface CategoryConfig {
  title: string
  description: string
  ogImage: string | null
}

export type CategoryConfigMap = Record<string, CategoryConfig>
```

- [ ] **Step 2: Run typecheck**

Run: `yarn typecheck`
Expected: PASS — no consumers yet, just a type definition.

- [ ] **Step 3: Commit**

```bash
git add src/types/categoryConfig.ts
git commit -m "feat: add CategoryConfig type"
```

---

### Task 3: Create `validateCategoryConfig` helper + tests

**Files:**
- Create: `src/utils/categoryConfig.ts`
- Create: `src/__tests__/utils/categoryConfig.test.ts`

The validator throws if any post's category is missing from the config OR is `undefined`. Returns the config unchanged on success.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/utils/categoryConfig.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { validateCategoryConfig } from "@/utils/categoryConfig";
import { CategoryConfigMap } from "@/types/categoryConfig";

const exampleConfig: CategoryConfigMap = {
  music: { title: "Music", description: "music posts", ogImage: null },
  events: { title: "Events", description: "events posts", ogImage: null },
  lifestyle: { title: "Lifestyle", description: "lifestyle posts", ogImage: null },
};

describe( "validateCategoryConfig", () => {
  it( "returns the config when every post category is a key in the config", () => {
    const result = validateCategoryConfig( exampleConfig, [ "music", "events", "music", "lifestyle" ] );
    expect( result ).toEqual( exampleConfig );
  });

  it( "throws when a post category is missing from the config", () => {
    expect( () =>
      validateCategoryConfig( exampleConfig, [ "music", "deep-cuts" ] ),
    ).toThrowError(
      'Category "deep-cuts" is set on a published post but is missing from data/categories.json',
    );
  });

  it( "throws when a post has an undefined category", () => {
    expect( () =>
      validateCategoryConfig( exampleConfig, [ "music", undefined ] ),
    ).toThrowError(
      "A published post is missing a category. Run the backfill script and ensure the Contentful field is required.",
    );
  });

  it( "returns the config when the post array is empty", () => {
    const result = validateCategoryConfig( exampleConfig, [] );
    expect( result ).toEqual( exampleConfig );
  });

  it( "passes when the config has extra entries not used by any post", () => {
    const result = validateCategoryConfig( exampleConfig, [ "music" ] );
    expect( result ).toEqual( exampleConfig );
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn test src/__tests__/utils/categoryConfig.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement the validator**

Create `src/utils/categoryConfig.ts`:

```typescript
import { CategoryConfigMap } from "@/types/categoryConfig";

export function validateCategoryConfig(
  config: CategoryConfigMap,
  publishedPostCategories: ( string | undefined )[],
): CategoryConfigMap {
  for( const category of publishedPostCategories ) {
    if( category === undefined ) {
      throw new Error(
        "A published post is missing a category. Run the backfill script and ensure the Contentful field is required.",
      );
    }
    if( !( category in config ) ) {
      throw new Error(
        `Category "${category}" is set on a published post but is missing from data/categories.json`,
      );
    }
  }
  return config;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn test src/__tests__/utils/categoryConfig.test.ts`
Expected: PASS — all five tests green.

- [ ] **Step 5: Run lint + full suite**

Run: `yarn lint && yarn test`
Expected: PASS, no regressions.

- [ ] **Step 6: Commit**

```bash
git add src/utils/categoryConfig.ts src/__tests__/utils/categoryConfig.test.ts
git commit -m "feat: add validateCategoryConfig helper"
```

---

### Task 4: Create the backfill script + unit tests for the pure resolver

**Files:**
- Create: `scripts/backfill-categories.mjs`
- Create: `scripts/backfill-categories.test.mjs`

The script has two parts: a **pure** function `resolveCategoryForTags(tagIds)` that's unit-tested, and the **driver** (env handling, Contentful API calls, dry-run/apply modes) which is exercised manually via the dry-run output.

The script does NOT execute against live Contentful in this task — that happens in Task 6. Here we only ensure the code is in place and the pure resolver is correct.

- [ ] **Step 1: Write the failing tests for the resolver**

Create `scripts/backfill-categories.test.mjs`:

```javascript
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { resolveCategoryForTags } from "./backfill-categories.mjs";

describe( "resolveCategoryForTags", () => {
  it( "returns the category when there is a single mapped tag", () => {
    expect( resolveCategoryForTags( [ "releases" ] ) ).toBe( "music" );
    expect( resolveCategoryForTags( [ "dj" ] ) ).toBe( "events" );
    expect( resolveCategoryForTags( [ "plantlife" ] ) ).toBe( "lifestyle" );
  });

  it( "applies music > events > lifestyle priority on cross-category tags", () => {
    expect( resolveCategoryForTags( [ "dj", "releases" ] ) ).toBe( "music" );
    expect( resolveCategoryForTags( [ "nightlife", "graphics" ] ) ).toBe( "events" );
    expect( resolveCategoryForTags( [ "plantlife", "merch" ] ) ).toBe( "lifestyle" );
    expect( resolveCategoryForTags( [ "graphics", "playlists", "dj" ] ) ).toBe( "music" );
  });

  it( "is independent of input order", () => {
    expect( resolveCategoryForTags( [ "releases", "dj" ] ) ).toBe( "music" );
    expect( resolveCategoryForTags( [ "dj", "releases" ] ) ).toBe( "music" );
  });

  it( "ignores unknown tags", () => {
    expect( resolveCategoryForTags( [ "unknown-tag", "releases" ] ) ).toBe( "music" );
    expect( resolveCategoryForTags( [ "unknown-a", "unknown-b", "graphics" ] ) ).toBe( "lifestyle" );
  });

  it( "returns null when no tags are mapped", () => {
    expect( resolveCategoryForTags( [] ) ).toBeNull();
    expect( resolveCategoryForTags( [ "unknown-only" ] ) ).toBeNull();
    expect( resolveCategoryForTags( [ "unknown-a", "unknown-b" ] ) ).toBeNull();
  });

  it( "maps every tag from the spec's TAG_TO_CATEGORY table", () => {
    expect( resolveCategoryForTags( [ "releases" ] ) ).toBe( "music" );
    expect( resolveCategoryForTags( [ "edits" ] ) ).toBe( "music" );
    expect( resolveCategoryForTags( [ "radio" ] ) ).toBe( "music" );
    expect( resolveCategoryForTags( [ "playlists" ] ) ).toBe( "music" );
    expect( resolveCategoryForTags( [ "dj" ] ) ).toBe( "events" );
    expect( resolveCategoryForTags( [ "nightlife" ] ) ).toBe( "events" );
    expect( resolveCategoryForTags( [ "plantlife" ] ) ).toBe( "lifestyle" );
    expect( resolveCategoryForTags( [ "merch" ] ) ).toBe( "lifestyle" );
    expect( resolveCategoryForTags( [ "graphics" ] ) ).toBe( "lifestyle" );
    expect( resolveCategoryForTags( [ "technology" ] ) ).toBe( "lifestyle" );
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn test scripts/backfill-categories.test.mjs`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement the script**

Create `scripts/backfill-categories.mjs`:

```javascript
#!/usr/bin/env node

import { fileURLToPath } from "url";
import { createClient } from "contentful-management";

const CATEGORY_PRIORITY = [ "music", "events", "lifestyle" ];

const TAG_TO_CATEGORY = {
  releases: "music",
  edits: "music",
  radio: "music",
  playlists: "music",
  dj: "events",
  nightlife: "events",
  plantlife: "lifestyle",
  merch: "lifestyle",
  graphics: "lifestyle",
  technology: "lifestyle",
};

const LOCALE = "en-US";
const PACING_MS = 150;
const CATEGORY_FIELD = "category";

export function resolveCategoryForTags( tagIds ) {
  const candidateCategories = new Set();
  for( const tagId of tagIds ) {
    const category = TAG_TO_CATEGORY[tagId];
    if( category ) candidateCategories.add( category );
  }
  for( const priority of CATEGORY_PRIORITY ) {
    if( candidateCategories.has( priority ) ) return priority;
  }
  return null;
}

async function fetchAllEntries( client ) {
  const all = [];
  let skip = 0;
  const limit = 100;
  while( true ) {
    const page = await client.entry.getMany({
      query: { content_type: "blogPost", limit, skip, order: "sys.createdAt" },
    });
    all.push( ...page.items );
    if( page.items.length < limit ) break;
    skip += limit;
  }
  return all;
}

function planFor( entry ) {
  const slug = entry.fields.slug?.[LOCALE] ?? entry.sys.id;
  const tagIds = ( entry.metadata?.tags ?? [] ).map( tag => tag.sys.id );
  const category = resolveCategoryForTags( tagIds );
  return { slug, tagIds, category, entry };
}

function printDryRun( plans ) {
  const unmapped = plans.filter( plan => plan.category === null );
  if( unmapped.length > 0 ) {
    process.stderr.write( `\nError: ${unmapped.length} post(s) cannot be categorized:\n` );
    for( const plan of unmapped ) {
      const reason = plan.tagIds.length === 0
        ? "no tags"
        : `tags [${plan.tagIds.join( ", " )}] are not in TAG_TO_CATEGORY`;
      process.stderr.write( `  ${plan.slug.padEnd( 40 )} ${reason}\n` );
    }
    process.stderr.write( "\nFix these in Contentful or extend the script's TAG_TO_CATEGORY map, then re-run.\n" );
    process.exit( 1 );
  }

  process.stdout.write( `Backfill plan (${plans.length} posts):\n\n` );
  process.stdout.write( "slug".padEnd( 40 ) + "category".padEnd( 12 ) + "via tag\n" );
  for( const plan of plans ) {
    const sourceTag = Object
      .entries( TAG_TO_CATEGORY )
      .find( ([ tagId, category ]) => category === plan.category && plan.tagIds.includes( tagId ) )?.[0]
      ?? "?";
    process.stdout.write(
      plan.slug.padEnd( 40 ) + plan.category.padEnd( 12 ) + sourceTag + "\n",
    );
  }

  const counts = { music: 0, events: 0, lifestyle: 0 };
  for( const plan of plans ) counts[plan.category]++;
  process.stdout.write( "\nSummary:\n" );
  for( const category of CATEGORY_PRIORITY ) {
    process.stdout.write( `  ${category.padEnd( 10 )} ${counts[category]}\n` );
  }
  process.stdout.write( "\nNo changes written. Re-run with --apply to write.\n" );
}

async function applyBackfill( client, plans ) {
  process.stdout.write( `Applying (${plans.length} posts)...\n` );
  const failures = [];
  for( const [ index, plan ] of plans.entries() ) {
    const label = `[${index + 1}/${plans.length}] ${plan.slug.padEnd( 40 )} → ${plan.category.padEnd( 10 )}`;
    try {
      const fresh = await client.entry.get({ entryId: plan.entry.sys.id });
      fresh.fields[CATEGORY_FIELD] = { ...( fresh.fields[CATEGORY_FIELD] ?? {}), [LOCALE]: plan.category };
      const updated = await client.entry.update(
        { entryId: fresh.sys.id },
        fresh,
      );
      const wasPublished = plan.entry.sys.publishedVersion !== undefined;
      if( wasPublished ) {
        await client.entry.publish( { entryId: updated.sys.id }, updated );
      }
      process.stdout.write( `${label} ✓\n` );
    } catch ( error ) {
      process.stdout.write( `${label} ✗ ${error.message}\n` );
      failures.push({ slug: plan.slug, error: error.message });
    }
    await new Promise( resolve => setTimeout( resolve, PACING_MS ) );
  }

  process.stdout.write( `\nDone. ${plans.length - failures.length} posts updated. ${failures.length} failures.\n` );
  if( failures.length > 0 ) {
    for( const failure of failures ) {
      process.stderr.write( `  - ${failure.slug}: ${failure.error}\n` );
    }
    process.stderr.write( "\nRe-run `make backfill-categories-apply` to retry failed posts (script is idempotent).\n" );
    process.exit( 1 );
  }
}

export async function main( args ) {
  const apply = args.includes( "--apply" );

  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const accessToken = process.env.CONTENTFUL_MANAGEMENT_API_ACCESS_TOKEN;
  const environmentId = process.env.CONTENTFUL_ENVIRONMENT;

  if( !spaceId || !accessToken || !environmentId ) {
    process.stderr.write(
      "Missing required env vars: CONTENTFUL_SPACE_ID, CONTENTFUL_MANAGEMENT_API_ACCESS_TOKEN, CONTENTFUL_ENVIRONMENT\n",
    );
    process.exit( 1 );
    return;
  }

  const client = createClient(
    { accessToken },
    { type: "plain", defaults: { spaceId, environmentId } },
  );

  process.stderr.write( "Fetching all blog post entries...\n" );
  const entries = await fetchAllEntries( client );
  process.stderr.write( `Fetched ${entries.length} entries.\n\n` );

  const plans = entries.map( planFor );

  if( !apply ) {
    printDryRun( plans );
    return;
  }

  const unmapped = plans.filter( plan => plan.category === null );
  if( unmapped.length > 0 ) {
    process.stderr.write( `Error: ${unmapped.length} post(s) cannot be categorized. Run dry-run first to see details.\n` );
    process.exit( 1 );
    return;
  }

  await applyBackfill( client, plans );
}

if( process.argv[1] === fileURLToPath( import.meta.url ) ) {
  main( process.argv.slice( 2 ) );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn test scripts/backfill-categories.test.mjs`
Expected: PASS — all six tests green.

- [ ] **Step 5: Run the full test suite**

Run: `yarn test`
Expected: PASS, no regressions.

- [ ] **Step 6: Run lint**

Run: `yarn lint`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add scripts/backfill-categories.mjs scripts/backfill-categories.test.mjs
git commit -m "feat: add categorization backfill script"
```

---

### Task 5: Add Makefile targets

**Files:**
- Modify: `Makefile`

The targets load `.env` (the existing Makefile already has `-include .env` at the top, so env vars flow into the subshell).

- [ ] **Step 1: Read the current Makefile to confirm `-include .env` is present**

Run: `head -1 Makefile`
Expected: `-include .env`

If absent, do not proceed — escalate. The script depends on env vars being available.

- [ ] **Step 2: Append the two new targets**

Append to the end of `Makefile`:

```makefile

# Dry-run the category backfill — prints planned mapping; no Contentful writes
backfill-categories:
	@node scripts/backfill-categories.mjs

# Apply the category backfill — writes + republishes every blog post entry
backfill-categories-apply:
	@node scripts/backfill-categories.mjs --apply
```

- [ ] **Step 3: Verify Makefile parses**

Run: `make -n backfill-categories`
Expected: prints `node scripts/backfill-categories.mjs` (no execution because of `-n`).

- [ ] **Step 4: Commit**

```bash
git add Makefile
git commit -m "feat: add backfill-categories Makefile targets"
```

---

### Task 6: MANUAL GATE — Contentful schema + types regen + backfill apply

> ⚠️ **MANUAL — REQUIRES HUMAN INTERACTION.** This task involves the Contentful web UI and live API calls. A subagent CANNOT complete it. Pause automated execution here.

This task transitions the data layer from "code-only" to "Contentful + code in sync." After completion, every published post has a `category` value and the regenerated types reflect the new field.

- [ ] **Step 1: Add the `category` field in the Contentful UI**

1. Log into Contentful → Content model → `Blog Post` (id: `blogPost`).
2. Add a new field:
   - **Type:** Symbol (short text)
   - **Name:** `Category`
   - **Field ID:** `category`
3. Settings:
   - **Required:** yes (toggle on the "Required field" switch under the field's Validations).
   - **Validations → Accept only specified values:** check the box, enter `music`, `events`, `lifestyle` (one per line or as configured by the UI).
   - **Appearance:** Dropdown.
4. Save the content type.

Verification: in the Contentful UI, open any existing entry. The `Category` field should appear (probably empty / requires a value to save). Do NOT save the entry — the backfill script will populate it. Do NOT publish anything else.

- [ ] **Step 2: Regenerate Contentful types**

Locally:

```bash
make types
```

Expected:
- `contentful/export.json` is regenerated (gitignored, don't commit).
- `src/types/contentful/TypeBlogPost.ts` is regenerated and includes `category: EntryFieldTypes.Symbol;` in `TypeBlogPostFields`.

Verify the line is present:

```bash
grep -n "category" src/types/contentful/TypeBlogPost.ts
```

Expected output includes a line like `category: EntryFieldTypes.Symbol;`.

- [ ] **Step 3: Commit the regenerated types**

```bash
git add src/types/contentful/TypeBlogPost.ts
git commit -m "feat: regenerate Contentful types with category field"
```

- [ ] **Step 4: Run the backfill dry-run**

```bash
make backfill-categories
```

Expected output (counts will vary based on actual post count):

```
Fetching all blog post entries...
Fetched 157 entries.

Backfill plan (157 posts):

slug                                    category    via tag
some-post-slug                          music       releases
another-slug                            events      dj
...

Summary:
  music      78
  events     42
  lifestyle  37

No changes written. Re-run with --apply to write.
```

If the script aborts with "X post(s) cannot be categorized", investigate each one in Contentful:
- If it's a draft you forgot to publish: leave it for now (the script processes drafts too).
- If it has no tags or only unknown tags: tag it appropriately, then re-run.
- If it has a tag missing from `TAG_TO_CATEGORY`: extend the script (a code change in `scripts/backfill-categories.mjs`), commit, and re-run.

Do NOT proceed to Step 5 until the dry-run succeeds with zero unmapped posts.

- [ ] **Step 5: Apply the backfill**

```bash
make backfill-categories-apply
```

Expected:

```
Applying (157 posts)...
[1/157]   some-post-slug                       → music      ✓
[2/157]   another-slug                         → events     ✓
...
Done. 157 posts updated. 0 failures.
```

If failures occur, the script lists them and exits with code 1. Re-run the same command — the script is idempotent.

- [ ] **Step 6: Verify in Contentful**

Open Contentful → Content → pick any 3 posts at random. Confirm each has `Category` set to one of `music | events | lifestyle`. Confirm the entries are still published (no draft warnings).

- [ ] **Step 7: Resume automated execution**

The branch state is now: regenerated types committed; Contentful state has been mutated; no other commits. Continue with Task 7.

---

### Task 7: Wire `validateCategoryConfig` into `pages/index.tsx::getStaticProps`

**Files:**
- Modify: `src/pages/index.tsx`

`getStaticProps` currently calls `validateTagSeoConfig`. Add a parallel `validateCategoryConfig` call so build fails if any post lacks a configured category.

- [ ] **Step 1: Read the current `pages/index.tsx`** to confirm import and getStaticProps shape

Run: `grep -n "validateTagSeoConfig\|getStaticProps\|tagSeoConfig" src/pages/index.tsx`

Expected: lines like `import { validateTagSeoConfig } from "@/utils/tagSeoConfig";`, `validateTagSeoConfig( tagSeoConfig, contentfulTagIds );`, etc.

- [ ] **Step 2: Add the imports**

In `src/pages/index.tsx`, add these two imports next to the existing tag-config imports:

```typescript
import categoriesData from "../../data/categories.json";
import { CategoryConfigMap } from "@/types/categoryConfig";
import { validateCategoryConfig } from "@/utils/categoryConfig";
```

- [ ] **Step 3: Wire the validator into `getStaticProps`**

In `getStaticProps`, after the existing `validateTagSeoConfig` call, add:

```typescript
const categoryConfig: CategoryConfigMap = categoriesData satisfies CategoryConfigMap;
validateCategoryConfig(
  categoryConfig,
  posts.items.map( post => post.fields.category ),
);
```

The full updated `getStaticProps` should look like (do not blindly paste — preserve any existing logic; this is illustrative):

```typescript
export async function getStaticProps() {
  const posts = await getBlogPosts();
  const tags = await getTags();

  const tagSeoConfig: TagSeoConfigMap = tagSeoConfigData satisfies TagSeoConfigMap;
  const contentfulTagIds = tags.items.map( tag => tag.sys.id );
  validateTagSeoConfig( tagSeoConfig, contentfulTagIds );

  const categoryConfig: CategoryConfigMap = categoriesData satisfies CategoryConfigMap;
  validateCategoryConfig(
    categoryConfig,
    posts.items.map( post => post.fields.category ),
  );

  generateFeeds( posts.items );
  const schema = buildHomepageSchema( posts );

  return {
    props: {
      posts,
      tags,
      tagSeoConfig,
      schema,
    },
  };
}
```

- [ ] **Step 4: Run typecheck**

Run: `yarn typecheck`
Expected: PASS — `post.fields.category` is now typed as `string` (since the regenerated `TypeBlogPostFields.category` is `EntryFieldTypes.Symbol`, which resolves to `string`).

- [ ] **Step 5: Run the build**

Run: `yarn build`
Expected: PASS — every published post has a category (set by Task 6's backfill), and that category is a key in `data/categories.json`. If the build fails with `Category "X" is set on a published post but is missing from data/categories.json`, that means a post somehow has a category not in your config — investigate (rare, only happens if Contentful's validation list and `data/categories.json` keys diverged).

- [ ] **Step 6: Run the full test suite**

Run: `yarn test`
Expected: PASS, no regressions.

- [ ] **Step 7: Run lint**

Run: `yarn lint`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/pages/index.tsx
git commit -m "feat: validate category config in home page getStaticProps"
```

---

### Task 8: Wire `validateCategoryConfig` into `BlogArchive/getStaticProps.ts`

**Files:**
- Modify: `src/components/BlogArchive/getStaticProps.ts`

Same wiring as Task 7, but in the archive routes' shared `getStaticProps` helper. Build runs validation here too — covering `/page/[page]`, `/tags/[tagId]`, and `/tags/[tagId]/page/[page]`.

- [ ] **Step 1: Read the current file**

Run: `grep -n "validateTagSeoConfig\|tagSeoConfig\|tagConfig" src/components/BlogArchive/getStaticProps.ts`

Expected: shows the existing imports and validator call.

- [ ] **Step 2: Add the imports**

Add to `src/components/BlogArchive/getStaticProps.ts`:

```typescript
import categoriesData from "../../../data/categories.json";
import { CategoryConfigMap } from "@/types/categoryConfig";
import { validateCategoryConfig } from "@/utils/categoryConfig";
```

Note the THREE `..` levels for the JSON import (the file lives at `src/components/BlogArchive/getStaticProps.ts`).

- [ ] **Step 3: Wire the validator**

In `getArchiveStaticProps`, after the existing `validateTagSeoConfig` call, add:

```typescript
const categoryConfig: CategoryConfigMap = categoriesData satisfies CategoryConfigMap;
validateCategoryConfig(
  categoryConfig,
  posts.items.map( post => post.fields.category ),
);
```

- [ ] **Step 4: Run typecheck**

Run: `yarn typecheck`
Expected: PASS.

- [ ] **Step 5: Run the build**

Run: `yarn build`
Expected: PASS — same logic as Task 7, applied to the archive routes.

- [ ] **Step 6: Run the full test suite**

Run: `yarn test`
Expected: PASS.

- [ ] **Step 7: Run lint**

Run: `yarn lint`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/BlogArchive/getStaticProps.ts
git commit -m "feat: validate category config in archive getStaticProps"
```

---

### Task 9: Final verification + PR

**Files:**
- (No file changes — verification + PR creation only.)

- [ ] **Step 1: Run the full test suite**

Run: `yarn test`
Expected: PASS — all existing tests plus the two new test files (`categoryConfig.test.ts`, `backfill-categories.test.mjs`) green. Total test count should be ~158 + 5 (validator) + 6 (resolver) ≈ 169.

- [ ] **Step 2: Run lint**

Run: `yarn lint`
Expected: PASS.

- [ ] **Step 3: Run the production build**

Run: `yarn build`
Expected: PASS — Next.js export succeeds. All four route patterns generate without error.

- [ ] **Step 4: Sanity-check that no UI regressed**

The site renders identically to before (this is a data-only change). Open `dist/index.html` and confirm the tag-sectioned home is unchanged. Spot-check a tag page (e.g., `dist/tags/dj/index.html`) and a paginated archive page (e.g., `dist/page/2/index.html`).

If anything looks different, investigate before opening the PR — the validators might have inadvertently changed serialised props.

- [ ] **Step 5: Verify CLAUDE.md is still accurate**

Skim `CLAUDE.md`. Categorization is invisible to the user, so the routing table and existing data-flow descriptions still apply. The "Environment variables" section already requires `CONTENTFUL_MANAGEMENT_API_ACCESS_TOKEN` and `CONTENTFUL_ENVIRONMENT` (used by the backfill script), so no addition needed there.

If you find anything stale, update it in this same task with a separate small commit.

- [ ] **Step 6: Push the branch**

```bash
git push -u origin categorization
```

- [ ] **Step 7: Open the PR**

```bash
gh pr create --title "feat: add category field, backfill existing posts" --body "$(cat <<'EOF'
## Summary
- Adds a required `category` Symbol field to the Contentful `blogPost` content type with validation `["music", "events", "lifestyle"]`.
- Adds `data/categories.json` (canonical category list + title/description/ogImage metadata).
- Adds `validateCategoryConfig` (mirrors `validateTagSeoConfig`) wired into both `pages/index.tsx::getStaticProps` and `BlogArchive`'s shared `getArchiveStaticProps`.
- Adds a one-time `scripts/backfill-categories.mjs` script that maps each existing post to a category by walking its tags through `TAG_TO_CATEGORY` with priority `music > events > lifestyle`.
- Adds two Makefile targets: `backfill-categories` (dry-run) and `backfill-categories-apply` (writes + republishes).

**No user-visible UI change.** Spec B (separate brainstorm) consumes the new field for the home-page rework.

## Test plan
- [x] `yarn test` — `validateCategoryConfig` (5 tests) and `resolveCategoryForTags` (6 tests) added; full suite passes.
- [x] `yarn lint` — clean.
- [x] `yarn build` — succeeds; build-time validators throw if any published post is missing a configured category.
- [x] `make backfill-categories` (dry-run) — printed planned mapping for all posts; reviewed cross-category resolutions.
- [x] `make backfill-categories-apply` — populated `category` on every published post.
- [x] Spot-checked 3 random Contentful entries → each has `Category` set correctly.
- [ ] Reviewer: confirm the spec's tag→category mapping table matches your editorial intent.

Spec: `docs/superpowers/specs/2026-04-29-categorization-design.md`
EOF
)"
```

- [ ] **Step 8: Return the PR URL**

The output of `gh pr create` is the PR URL. Report it back.

---

## Self-review

**Spec coverage** — every section of the spec maps to a task:

| Spec section | Task |
|---|---|
| `data/categories.json` shape | 1 |
| `src/types/categoryConfig.ts` types | 2 |
| `src/utils/categoryConfig.ts` validator + tests | 3 |
| `scripts/backfill-categories.mjs` + pure-resolver tests | 4 |
| Makefile targets | 5 |
| Contentful schema field add | 6 (manual gate) |
| `make types` regeneration | 6 (manual gate) |
| Backfill dry-run + apply | 6 (manual gate) |
| `validateCategoryConfig` wired into home `getStaticProps` | 7 |
| `validateCategoryConfig` wired into archive `getStaticProps` | 8 |
| `yarn build` succeeds (validator running against real data) | 7, 8, 9 |
| Edge case: post with no tags / unmapped tags | Task 4 (`unmapped` filter in `applyBackfill` + dry-run abort) |
| Edge case: rate limiting | Task 4 (`PACING_MS = 150`) |
| Edge case: drafts vs published | Task 4 (`wasPublished` check before `publish()`) |
| Edge case: idempotent re-run | Task 4 (script overwrites; same value is a no-op) |
| Out-of-scope items (UI, tag nav, category routes) | None — explicitly excluded |

**Type consistency** — `validateCategoryConfig`'s signature (`(config: CategoryConfigMap, publishedPostCategories: (string | undefined)[]) => CategoryConfigMap`) is used identically in Tasks 3, 7, and 8. `resolveCategoryForTags(tagIds: string[])` returns `string | null` consistently in Task 4. The `category` field on `TypeBlogPostFields` (added by Task 6's `make types`) is referenced as `post.fields.category` in Tasks 7 and 8 — typed as `string` post-regeneration.

**Placeholder scan** — no TBDs / TODOs. Every code step has the actual code an engineer can paste. Manual steps in Task 6 are spelled out concretely (which menu, which validation rule, which command).

**Manual gate handling** — Task 6 is clearly flagged as MANUAL with a banner at the top of the plan. Subagent runners should detect the banner and pause before dispatching.

**Test count math** — current branch baseline: 158. After:
- Task 3 adds 5 tests (`categoryConfig.test.ts`).
- Task 4 adds 6 tests (`backfill-categories.test.mjs`).
- Total: 169 tests across 24 files.
