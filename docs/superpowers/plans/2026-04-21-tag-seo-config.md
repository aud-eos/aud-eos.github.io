# Tag SEO Config — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace dynamically generated tag page SEO descriptions with manually authored content stored in a local JSON config file.

**Architecture:** A `data/tags.json` file holds per-tag SEO metadata (title, description, ogImage). A TypeScript interface in `src/types/tagConfig.ts` types the config. The existing `getStaticProps` in `src/pages/index.tsx` imports the config, validates every Contentful tag has an entry, and passes the tag's SEO data as a prop. The component uses it for the page title, meta description, and OG image.

**Tech Stack:** Next.js, TypeScript, Vitest

---

### Task 1: Create the TagSeoConfig type

**Files:**
- Create: `src/types/tagConfig.ts`

- [ ] **Step 1: Create the type file**

```typescript
export interface TagSeoConfig {
  title: string
  description: string
  ogImage: string | null
}

export type TagSeoConfigMap = Record<string, TagSeoConfig>
```

- [ ] **Step 2: Commit**

```bash
git add src/types/tagConfig.ts
git commit -m "feat: add TagSeoConfig type for manual tag SEO metadata"
```

---

### Task 2: Create data/tags.json with placeholder entries

**Files:**
- Create: `data/tags.json`

We need to know the actual tag IDs from Contentful. Run the dev server or build to see which tags exist — they appear in the tag nav on the home page. Alternatively, check the Contentful dashboard.

- [ ] **Step 1: Create the JSON file**

Create `data/tags.json` with an entry for every tag that exists in Contentful. Example structure (replace with real tag IDs and real SEO copy):

```json
{
  "example-tag": {
    "title": "Example Tag",
    "description": "Description for example tag pages on Audeos.com.",
    "ogImage": null
  }
}
```

Every tag ID from Contentful must have an entry. The `ogImage` field should be `null` unless a custom image is desired — `null` falls back to the site-wide `META_IMAGE`.

- [ ] **Step 2: Commit**

```bash
git add data/tags.json
git commit -m "feat: add tag SEO config data file"
```

---

### Task 3: Write validation test

**Files:**
- Create: `src/__tests__/utils/tagSeoConfig.test.ts`

- [ ] **Step 1: Write the test for the validation function**

```typescript
import { describe, it, expect } from "vitest";
import { validateTagSeoConfig } from "@/utils/tagSeoConfig";
import { TagSeoConfigMap } from "@/types/tagConfig";

describe( "validateTagSeoConfig", () => {
  it( "returns the config for a tag ID that exists in the config", () => {
    const config: TagSeoConfigMap = {
      jazz: {
        title: "Jazz Music",
        description: "Jazz posts on Audeos.com",
        ogImage: null,
      },
    };
    const tagIds = ["jazz"];

    const result = validateTagSeoConfig( config, tagIds );

    expect( result ).toEqual( config );
  });

  it( "throws when a tag ID is missing from the config", () => {
    const config: TagSeoConfigMap = {
      jazz: {
        title: "Jazz Music",
        description: "Jazz posts on Audeos.com",
        ogImage: null,
      },
    };
    const tagIds = ["jazz", "ambient"];

    expect( () => validateTagSeoConfig( config, tagIds ) ).toThrowError(
      'Tag "ambient" exists in Contentful but is missing from data/tags.json'
    );
  });

  it( "passes when config has extra entries not in Contentful", () => {
    const config: TagSeoConfigMap = {
      jazz: {
        title: "Jazz Music",
        description: "Jazz posts on Audeos.com",
        ogImage: null,
      },
      ambient: {
        title: "Ambient Music",
        description: "Ambient posts on Audeos.com",
        ogImage: null,
      },
    };
    const tagIds = ["jazz"];

    const result = validateTagSeoConfig( config, tagIds );

    expect( result ).toEqual( config );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/__tests__/utils/tagSeoConfig.test.ts`
Expected: FAIL — `validateTagSeoConfig` does not exist yet.

- [ ] **Step 3: Commit failing test**

```bash
git add src/__tests__/utils/tagSeoConfig.test.ts
git commit -m "test: add failing tests for tag SEO config validation"
```

---

### Task 4: Implement validation function

**Files:**
- Create: `src/utils/tagSeoConfig.ts`

- [ ] **Step 1: Implement validateTagSeoConfig**

```typescript
import { TagSeoConfigMap } from "@/types/tagConfig";

export function validateTagSeoConfig(
  config: TagSeoConfigMap,
  contentfulTagIds: string[]
): TagSeoConfigMap {
  for( const tagId of contentfulTagIds ) {
    if( !( tagId in config ) ) {
      throw new Error(
        `Tag "${tagId}" exists in Contentful but is missing from data/tags.json`
      );
    }
  }
  return config;
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `yarn test src/__tests__/utils/tagSeoConfig.test.ts`
Expected: All 3 tests PASS.

- [ ] **Step 3: Run full test suite**

Run: `yarn test`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/utils/tagSeoConfig.ts
git commit -m "feat: implement tag SEO config validation"
```

---

### Task 5: Integrate tag SEO config into index.tsx

**Files:**
- Modify: `src/pages/index.tsx`

This is the main integration task. Read the current file before editing.

- [ ] **Step 1: Add imports and remove buildTagDescription**

At the top of `src/pages/index.tsx`:

1. Add these imports:
   ```typescript
   import { TagSeoConfig } from "@/types/tagConfig";
   import tagSeoConfigData from "../../data/tags.json";
   import { TagSeoConfigMap } from "@/types/tagConfig";
   import { validateTagSeoConfig } from "@/utils/tagSeoConfig";
   ```

2. Remove the `capitalize` import:
   ```typescript
   // REMOVE this line:
   import { capitalize } from "@/utils/stringUtils";
   ```

3. Remove the entire `buildTagDescription` function (lines 16-21).

- [ ] **Step 2: Update HomeProps interface**

Change `HomeProps` to include the tag SEO config instead of relying on the tag ID for label generation:

```typescript
export interface HomeProps {
  posts: BlogPosts
  tags: TagCollection
  page: number
  tagId?: string
  tagSeoConfig?: TagSeoConfig
}
```

- [ ] **Step 3: Update the Home component**

Replace the tag label, page title, page description, and OG image logic:

```typescript
export default function Home({ posts, page, tags, tagId, tagSeoConfig }: HomeProps ) {
  const filteredBlogPosts = posts.items
    .filter( post => tagId === null || post.metadata.tags
      .find( tag => tag.sys.id === tagId ) );

  const isTagPage = Boolean( tagId );
  const isPaginated = page > 1;

  const tagLabel = tagSeoConfig?.title ?? "";

  const pageTitle = isTagPage && isPaginated
    ? `${tagLabel} — Page ${page} | Audeos.com`
    : isTagPage
      ? `${tagLabel} | Audeos.com`
      : isPaginated
        ? `Blog — Page ${page} | ${META_TITLE}`
        : META_TITLE;

  const pageDescription = isTagPage && tagSeoConfig
    ? tagSeoConfig.description
    : META_DESCRIPTION;

  const ogImage = isTagPage && tagSeoConfig?.ogImage
    ? tagSeoConfig.ogImage
    : META_IMAGE;

  // ... canonicalUrl logic stays the same ...
```

Update the `<SeoHead>` component to use `ogImage`:

```typescript
<SeoHead
  title={ pageTitle }
  canonicalUrl={ canonicalUrl }
  description={ pageDescription }
  ogImage={ ogImage }
>
```

- [ ] **Step 4: Update getStaticProps**

```typescript
export async function getStaticProps( context: GetStaticPropsContext ) {
  const tagId = context.params?.tagId || null;
  const page: number = Number( context.params?.page ) || 1;
  const tags = await getTags();
  const posts = await getBlogPosts();

  const tagConfig = tagSeoConfigData satisfies TagSeoConfigMap;
  const contentfulTagIds = tags.items.map( tag => tag.sys.id );
  validateTagSeoConfig( tagConfig, contentfulTagIds );

  const tagSeoConfig = tagId ? tagConfig[tagId] : null;

  if( !tagId && page === 1 ) {
    generateFeeds( posts.items );
  }
  return {
    props: {
      tagId,
      posts,
      tags,
      page,
      tagSeoConfig,
    },
  };
}
```

Note: `satisfies TagSeoConfigMap` ensures the JSON conforms to the type at build time without using an `as` assertion.

- [ ] **Step 5: Run format and lint**

Run: `yarn format && yarn lint`
Expected: No errors. Fix any formatting issues.

- [ ] **Step 6: Run full test suite**

Run: `yarn test`
Expected: All tests pass.

- [ ] **Step 7: Run build**

Run: `yarn build`
Expected: Build succeeds. Verify that the tag pages are generated without errors.

- [ ] **Step 8: Commit**

```bash
git add src/pages/index.tsx
git commit -m "feat: use manual tag SEO config for title, description, and OG image"
```

---

### Task 6: Final verification

- [ ] **Step 1: Run the dev server and verify tag pages**

Run: `yarn dev`

1. Visit a tag page (e.g., `http://localhost:3000/tags/jazz`)
2. Inspect the page source — confirm `<title>`, `<meta name="description">`, and `<meta property="og:image">` use the values from `data/tags.json`
3. Visit the home page — confirm it still uses the default `META_DESCRIPTION` and `META_IMAGE`

- [ ] **Step 2: Run all checks**

Run: `yarn format && yarn lint && yarn test && yarn build`
Expected: All pass.

- [ ] **Step 3: Commit any remaining changes**

If `yarn format` changed anything, commit it:

```bash
git add -A
git commit -m "style: format"
```
