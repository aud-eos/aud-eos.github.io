# Category UI (Spec B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reshape the home page into 3 category sections, add `/category/[slug]` routes, replace the tag nav with a category nav, and refactor `BlogArchive` into a generic `FilteredArchive` driven by a discriminated `ArchiveFilter` prop.

**Architecture:** Strategy pattern. `FilteredArchive` is a presentational component receiving a pre-built `filter: ArchiveFilter` and `seo: ArchiveSeo`. Three static-props helpers (`getAllStaticProps`, `getTagStaticProps`, `getCategoryStaticProps`) own the per-route filter and SEO construction. The home's `TaggedPostSections` is replaced by `CategoryPostSections`, iterating the fixed 3 categories. `data/tags.json` and supporting code are deleted; tag pages use generic SEO. `buildHomepageSchema` is refactored to produce nested `CollectionPage` JSON-LD (top-level + 3 inner per category).

**Tech Stack:** Next.js (`output: "export"`), TypeScript (with discriminated unions for compile-time exhaustiveness), Vitest, SCSS modules.

**Spec:** `docs/superpowers/specs/2026-04-29-category-ui-design.md`

**Branch:** `category-ui` (already created, off `main` at `66b4550`).

---

### Task 1: Add constants and types

**Files:**
- Modify: `src/constants.ts`
- Create: `src/types/archiveFilter.ts`

The constants pin the 3-category list and the post-per-section count. The discriminated `ArchiveFilter` type is the centerpiece of the strategy pattern — its compile-time exhaustiveness check is what makes the refactor safe.

- [ ] **Step 1: Append to `src/constants.ts`**

Append (after the existing `POSTS_PER_TAG_SECTION = 3` line):

```typescript
export const POSTS_PER_CATEGORY_SECTION = 6;
export const CATEGORY_IDS = [ "music", "events", "lifestyle" ] as const;
```

- [ ] **Step 2: Create `src/types/archiveFilter.ts`**

```typescript
export type ArchiveFilter =
  | { kind: "all" }
  | { kind: "tag"; id: string }
  | { kind: "category"; id: string };

export interface ArchiveSeo {
  title: string
  description: string
  ogImage: string
  canonical: string
}
```

- [ ] **Step 3: Run typecheck**

Run: `yarn typecheck`
Expected: PASS — no consumers yet, just additions.

- [ ] **Step 4: Commit**

```bash
git add src/constants.ts src/types/archiveFilter.ts
git commit -m "feat: add CATEGORY_IDS, POSTS_PER_CATEGORY_SECTION, ArchiveFilter types"
```

---

### Task 2: Add `CategoryNav` component + tests

**Files:**
- Create: `src/components/CategoryNav.tsx`
- Create: `src/__tests__/components/CategoryNav.test.tsx`
- Modify: `src/styles/Home.module.scss` (add new classes — see code below; do NOT delete the old `.tagNav`/`.tag`/`.tagActive` rules in this task; that happens in Task 12)

`CategoryNav` is the 3-item primary nav that appears at the top of every archive page. Labels come from `data/categories.json`; iteration order is fixed by `CATEGORY_IDS`.

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/components/CategoryNav.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

vi.mock( "next/link", () => ({
  default: ({ children, href, className }: React.ComponentProps<"a"> ) => (
    <a href={ href } className={ className }>{ children }</a>
  ),
}) );

import CategoryNav from "@/components/CategoryNav";

describe( "CategoryNav", () => {
  it( "renders three links in CATEGORY_IDS order", () => {
    const { container } = render( <CategoryNav currentCategory={ null } /> );
    const links = container.querySelectorAll( "a" );
    expect( links ).toHaveLength( 3 );
    expect( links[0].getAttribute( "href" ) ).toBe( "/category/music" );
    expect( links[1].getAttribute( "href" ) ).toBe( "/category/events" );
    expect( links[2].getAttribute( "href" ) ).toBe( "/category/lifestyle" );
  });

  it( "uses the title from categories.json for each label", () => {
    const { container } = render( <CategoryNav currentCategory={ null } /> );
    const links = container.querySelectorAll( "a" );
    expect( links[0].textContent ).toBe( "Music" );
    expect( links[1].textContent ).toBe( "Events" );
    expect( links[2].textContent ).toBe( "Lifestyle" );
  });

  it( "highlights only the current category's link", () => {
    const { container } = render( <CategoryNav currentCategory="music" /> );
    const links = container.querySelectorAll( "a" );
    expect( links[0].className ).toContain( "categoryActive" );
    expect( links[1].className ).not.toContain( "categoryActive" );
    expect( links[2].className ).not.toContain( "categoryActive" );
  });

  it( "highlights none when currentCategory is null", () => {
    const { container } = render( <CategoryNav currentCategory={ null } /> );
    const links = container.querySelectorAll( "a" );
    for( const link of links ) {
      expect( link.className ).not.toContain( "categoryActive" );
    }
  });

  it( "highlights none when currentCategory is unknown", () => {
    const { container } = render( <CategoryNav currentCategory="unknown" /> );
    const links = container.querySelectorAll( "a" );
    for( const link of links ) {
      expect( link.className ).not.toContain( "categoryActive" );
    }
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn test src/__tests__/components/CategoryNav.test.tsx`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `CategoryNav`**

Create `src/components/CategoryNav.tsx`:

```typescript
import Link from "next/link";
import { CATEGORY_IDS } from "@/constants";
import { CategoryConfigMap } from "@/types/categoryConfig";
import categoriesData from "../../data/categories.json";
import styles from "@/styles/Home.module.scss";

export interface CategoryNavProps {
  currentCategory: string | null;
}

export default function CategoryNav({ currentCategory }: CategoryNavProps ) {
  const config: CategoryConfigMap = categoriesData satisfies CategoryConfigMap;
  return (
    <nav className={ styles.categoryNav }>
      {
        CATEGORY_IDS.map( categoryId => {
          const isActive = categoryId === currentCategory;
          return (
            <Link
              key={ categoryId }
              href={ `/category/${categoryId}` }
              className={ isActive ? styles.categoryActive : styles.category }
            >
              { config[categoryId].title }
            </Link>
          );
        })
      }
    </nav>
  );
}
```

- [ ] **Step 4: Add SCSS classes**

Append to `src/styles/Home.module.scss` (do NOT remove existing `.tagNav`/`.tag`/`.tagActive` — those are removed in Task 12):

```scss
.categoryNav {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 0;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(128, 128, 128, 0.2);
  view-transition-name: tag-nav;
}

.category {
  display: inline-block;
  padding: 0.6rem 1rem;
  font-size: 1rem;
  font-weight: 500;
  text-decoration: none;
  border-bottom: 2px solid transparent;
  transition: border-color 0.2s ease, opacity 0.2s ease;
  opacity: 0.6;

  &:hover {
    opacity: 1;
    border-bottom-color: rgba(255, 255, 255, 0.3);
  }
}

.categoryActive {
  composes: category;
  opacity: 1;
  font-weight: 700;
  border-bottom-color: currentColor;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `yarn test src/__tests__/components/CategoryNav.test.tsx`
Expected: PASS — all 5 tests green.

- [ ] **Step 6: Run lint + typecheck + full suite**

Run: `yarn lint && yarn typecheck && yarn test`
Expected: PASS, no regressions.

- [ ] **Step 7: Commit**

```bash
git add src/components/CategoryNav.tsx src/__tests__/components/CategoryNav.test.tsx src/styles/Home.module.scss
git commit -m "feat: add CategoryNav component"
```

---

### Task 3: Add `CategoryPostSections` component + tests

**Files:**
- Create: `src/components/Home/CategoryPostSections.tsx`
- Create: `src/__tests__/components/CategoryPostSections.test.tsx`

Iterates `CATEGORY_IDS` in fixed order, filters posts by `post.fields.category === id`, sorts by date, slices to `POSTS_PER_CATEGORY_SECTION` (6). Replaces `TaggedPostSections` on the home page in Task 5; the old component stays in place until Task 12's cleanup.

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/components/CategoryPostSections.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

vi.mock( "@/constants", async importOriginal => ({
  ...( await importOriginal<typeof import( "@/constants" )>() ),
  POSTS_PER_CATEGORY_SECTION: 6,
}) );
vi.mock( "@/utils/contentfulUtils", () => ({}) );
vi.mock( "next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a"> ) => (
    <a href={ href } { ...props }>{ children }</a>
  ),
}) );
vi.mock( "@/components/Home/BlogPostList", () => ({
  default: ({
    posts,
    firstCardPriority,
  }: {
    posts: { fields: { slug: string } }[];
    firstCardPriority?: boolean;
  }) => (
    <ul
      data-testid={ `bpl-${posts[0]?.fields.slug ?? "empty"}` }
      data-priority={ firstCardPriority ? "true" : "false" }
      data-count={ posts.length }
    >
      { posts.map( post => <li key={ post.fields.slug }>{ post.fields.slug }</li> ) }
    </ul>
  ),
}) );

import CategoryPostSections from "@/components/Home/CategoryPostSections";

const categoryConfig = {
  music: { title: "Music", description: "music", ogImage: null },
  events: { title: "Events", description: "events", ogImage: null },
  lifestyle: { title: "Lifestyle", description: "lifestyle", ogImage: null },
};

const makePost = ({
  slug,
  date,
  category,
}: {
  slug: string;
  date: string;
  category: string;
}) => ({
  sys: { id: slug, createdAt: date },
  fields: { slug, title: slug, date, category, image: undefined },
  metadata: { tags: [] },
});

beforeEach( () => {
  vi.stubGlobal( "matchMedia", ( query: string ) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) );
});

describe( "CategoryPostSections", () => {
  it( "renders three sections in CATEGORY_IDS order", () => {
    const posts = {
      items: [
        makePost({ slug: "m1", date: "2026-04-01", category: "music" }),
        makePost({ slug: "e1", date: "2026-04-02", category: "events" }),
        makePost({ slug: "l1", date: "2026-04-03", category: "lifestyle" }),
      ],
    };
    const { container } = render(
      <CategoryPostSections
        posts={ posts as never }
        categoryConfig={ categoryConfig as never }
      />,
    );
    const sections = container.querySelectorAll( "section" );
    expect( sections ).toHaveLength( 3 );
    expect( sections[0].id ).toBe( "category-music" );
    expect( sections[1].id ).toBe( "category-events" );
    expect( sections[2].id ).toBe( "category-lifestyle" );
  });

  it( "caps each section at POSTS_PER_CATEGORY_SECTION (6) most recent posts", () => {
    const posts = {
      items: [
        makePost({ slug: "m1", date: "2026-04-01", category: "music" }),
        makePost({ slug: "m2", date: "2026-04-02", category: "music" }),
        makePost({ slug: "m3", date: "2026-04-03", category: "music" }),
        makePost({ slug: "m4", date: "2026-04-04", category: "music" }),
        makePost({ slug: "m5", date: "2026-04-05", category: "music" }),
        makePost({ slug: "m6", date: "2026-04-06", category: "music" }),
        makePost({ slug: "m7", date: "2026-04-07", category: "music" }),
        makePost({ slug: "m8", date: "2026-04-08", category: "music" }),
      ],
    };
    const { getByTestId } = render(
      <CategoryPostSections
        posts={ posts as never }
        categoryConfig={ categoryConfig as never }
      />,
    );
    const list = getByTestId( "bpl-m8" );
    expect( list.getAttribute( "data-count" ) ).toBe( "6" );
    const slugs = Array.from( list.querySelectorAll( "li" ) ).map( item => item.textContent );
    expect( slugs ).toEqual([ "m8", "m7", "m6", "m5", "m4", "m3" ]);
  });

  it( "omits sections with zero posts", () => {
    const posts = {
      items: [ makePost({ slug: "m1", date: "2026-04-01", category: "music" }) ],
    };
    const { container } = render(
      <CategoryPostSections
        posts={ posts as never }
        categoryConfig={ categoryConfig as never }
      />,
    );
    const sections = container.querySelectorAll( "section" );
    expect( sections ).toHaveLength( 1 );
    expect( sections[0].id ).toBe( "category-music" );
  });

  it( "links section header to /category/[id] with config title", () => {
    const posts = {
      items: [ makePost({ slug: "m1", date: "2026-04-01", category: "music" }) ],
    };
    const { container } = render(
      <CategoryPostSections
        posts={ posts as never }
        categoryConfig={ categoryConfig as never }
      />,
    );
    const heading = container.querySelector( "h2 a" );
    expect( heading?.getAttribute( "href" ) ).toBe( "/category/music" );
    expect( heading?.textContent ).toBe( "Music" );
  });

  it( "passes firstCardPriority only to the first non-empty section", () => {
    const posts = {
      items: [
        makePost({ slug: "e1", date: "2026-04-02", category: "events" }),
        makePost({ slug: "l1", date: "2026-04-03", category: "lifestyle" }),
      ],
    };
    const { getByTestId } = render(
      <CategoryPostSections
        posts={ posts as never }
        categoryConfig={ categoryConfig as never }
      />,
    );
    expect( getByTestId( "bpl-e1" ).getAttribute( "data-priority" ) ).toBe( "true" );
    expect( getByTestId( "bpl-l1" ).getAttribute( "data-priority" ) ).toBe( "false" );
  });

  it( "throws if a post category is missing from categoryConfig", () => {
    const posts = {
      items: [ makePost({ slug: "x1", date: "2026-04-01", category: "music" }) ],
    };
    const partialConfig = {
      events: { title: "Events", description: "events", ogImage: null },
      lifestyle: { title: "Lifestyle", description: "lifestyle", ogImage: null },
    };
    expect( () =>
      render(
        <CategoryPostSections
          posts={ posts as never }
          categoryConfig={ partialConfig as never }
        />,
      ),
    ).toThrow( /no categoryConfig entry for "music"/ );
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn test src/__tests__/components/CategoryPostSections.test.tsx`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `CategoryPostSections`**

Create `src/components/Home/CategoryPostSections.tsx`:

```typescript
import Link from "next/link";
import { BlogPosts } from "@/utils/contentfulUtils";
import BlogPostList from "@/components/Home/BlogPostList";
import { CATEGORY_IDS, POSTS_PER_CATEGORY_SECTION } from "@/constants";
import { sortBlogPostsByDate } from "@/utils/blogPostUtils";
import { CategoryConfigMap } from "@/types/categoryConfig";
import styles from "@/styles/Home.module.scss";

export interface CategoryPostSectionsProps {
  posts: BlogPosts;
  categoryConfig: CategoryConfigMap;
}

export default function CategoryPostSections({ posts, categoryConfig }: CategoryPostSectionsProps ) {
  const sections = CATEGORY_IDS
    .map( categoryId => {
      const categoryPosts = posts.items
        .filter( post => post.fields.category === categoryId )
        .sort( sortBlogPostsByDate )
        .slice( 0, POSTS_PER_CATEGORY_SECTION );
      return { categoryId, categoryPosts };
    })
    .filter( section => section.categoryPosts.length > 0 );

  return (
    <>
      { sections.map( ( section, sectionIndex ) => {
        const config = categoryConfig[section.categoryId];
        if( !config ) {
          throw new Error( `CategoryPostSections: no categoryConfig entry for "${section.categoryId}"` );
        }
        return (
          <section
            key={ section.categoryId }
            id={ `category-${section.categoryId}` }
            className={ styles.tagSection }
          >
            <header className={ styles.tagSectionHeader }>
              <h2>
                <Link href={ `/category/${section.categoryId}` }>{ config.title }</Link>
              </h2>
              <Link
                href={ `/category/${section.categoryId}` }
                className={ styles.seeAll }
                aria-hidden="true"
                tabIndex={ -1 }
              >
                See all →
              </Link>
            </header>
            <BlogPostList
              posts={ section.categoryPosts }
              page={ 1 }
              firstCardPriority={ sectionIndex === 0 }
            />
          </section>
        );
      }) }
    </>
  );
}
```

The `.tagSection`, `.tagSectionHeader`, `.seeAll` SCSS classes are reused (the visual layout matches `TaggedPostSections`). No new SCSS in this task.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn test src/__tests__/components/CategoryPostSections.test.tsx`
Expected: PASS — all 6 tests green.

- [ ] **Step 5: Run lint + full suite**

Run: `yarn lint && yarn test`
Expected: PASS, no regressions.

- [ ] **Step 6: Commit**

```bash
git add src/components/Home/CategoryPostSections.tsx src/__tests__/components/CategoryPostSections.test.tsx
git commit -m "feat: add CategoryPostSections component"
```

---

### Task 4: Update `buildHomepageSchema` for nested shape

**Files:**
- Modify: `src/lib/homepageSchema.ts`
- Modify: `src/__tests__/lib/homepageSchema.test.ts`

`buildHomepageSchema` becomes a nested `CollectionPage` (top-level + 3 inner per category). Signature changes: `buildHomepageSchema(posts, categoryConfig)`. Tests are updated to assert the new shape. The home page's call site (`pages/index.tsx`) is updated in Task 5.

- [ ] **Step 1: Replace the test file with the new expected shape**

Replace the entire contents of `src/__tests__/lib/homepageSchema.test.ts` with:

```typescript
import { describe, it, expect } from "vitest";
import { buildHomepageSchema } from "@/lib/homepageSchema";
import { CategoryConfigMap } from "@/types/categoryConfig";

const categoryConfig: CategoryConfigMap = {
  music: { title: "Music", description: "Music posts", ogImage: null },
  events: { title: "Events", description: "Event posts", ogImage: null },
  lifestyle: { title: "Lifestyle", description: "Lifestyle posts", ogImage: null },
};

const makePost = ({
  id,
  slug,
  title,
  date,
  category,
  imageUrl,
}: {
  id: string;
  slug: string;
  title: string;
  date: string;
  category: string;
  imageUrl?: string;
}) => ({
  sys: { id, createdAt: date },
  fields: {
    slug,
    title,
    date,
    category,
    image: imageUrl
      ? { fields: { file: { url: imageUrl }, description: "" } }
      : undefined,
  },
  metadata: { tags: [] },
});

describe( "buildHomepageSchema", () => {
  it( "returns a top-level CollectionPage with site metadata", () => {
    const schema = buildHomepageSchema(
      { items: [
        makePost({ id: "1", slug: "m1", title: "M1", date: "2026-04-01", category: "music" }),
      ] } as never,
      categoryConfig,
    );
    expect( schema[ "@context" ] ).toBe( "https://schema.org" );
    expect( schema[ "@type" ] ).toBe( "CollectionPage" );
    expect( schema.name ).toBeDefined();
    expect( schema.description ).toBeDefined();
    expect( schema.url ).toBeDefined();
    expect( schema.isPartOf ).toMatchObject({ "@type": "WebSite" });
  });

  it( "has hasPart with three inner CollectionPages in CATEGORY_IDS order", () => {
    const schema = buildHomepageSchema(
      { items: [
        makePost({ id: "1", slug: "m1", title: "M1", date: "2026-04-01", category: "music" }),
        makePost({ id: "2", slug: "e1", title: "E1", date: "2026-04-02", category: "events" }),
        makePost({ id: "3", slug: "l1", title: "L1", date: "2026-04-03", category: "lifestyle" }),
      ] } as never,
      categoryConfig,
    );
    expect( schema.hasPart ).toHaveLength( 3 );
    expect( schema.hasPart[0] ).toMatchObject({
      "@type": "CollectionPage",
      "name": "Music",
      "description": "Music posts",
      "url": "https://www.audeos.com/category/music",
    });
    expect( schema.hasPart[1] ).toMatchObject({
      "@type": "CollectionPage",
      "name": "Events",
      "url": "https://www.audeos.com/category/events",
    });
    expect( schema.hasPart[2] ).toMatchObject({
      "@type": "CollectionPage",
      "name": "Lifestyle",
      "url": "https://www.audeos.com/category/lifestyle",
    });
  });

  it( "includes up to POSTS_PER_CATEGORY_SECTION posts per category, newest first", () => {
    const items = [];
    for( let dayIndex = 1; dayIndex <= 8; dayIndex++ ) {
      const day = String( dayIndex ).padStart( 2, "0" );
      items.push( makePost({
        id: `m${dayIndex}`,
        slug: `m${dayIndex}`,
        title: `M${dayIndex}`,
        date: `2026-04-${day}`,
        category: "music",
      }) );
    }
    const schema = buildHomepageSchema( { items } as never, categoryConfig );
    const musicSection = schema.hasPart[0];
    expect( musicSection.hasPart ).toHaveLength( 6 );
    const slugs = musicSection.hasPart.map( ( post: { url: string } ) => post.url );
    expect( slugs[0] ).toContain( "m8" );
    expect( slugs[5] ).toContain( "m3" );
  });

  it( "produces an inner BlogPosting per post with required fields", () => {
    const schema = buildHomepageSchema(
      { items: [
        makePost({
          id: "1",
          slug: "with-img",
          title: "With Image",
          date: "2026-04-01",
          category: "music",
          imageUrl: "//img/1.jpg",
        }),
        makePost({
          id: "2",
          slug: "no-img",
          title: "No Image",
          date: "2026-04-02",
          category: "music",
        }),
      ] } as never,
      categoryConfig,
    );
    const musicSection = schema.hasPart[0];
    expect( musicSection.hasPart[0] ).toMatchObject({
      "@type": "BlogPosting",
      "headline": "No Image",
      "url": "https://www.audeos.com/post/no-img",
      "datePublished": "2026-04-02",
    });
    expect( musicSection.hasPart[0].image ).toBeUndefined();
    expect( musicSection.hasPart[1] ).toMatchObject({
      "@type": "BlogPosting",
      "headline": "With Image",
      "image": "https://img/1.jpg",
    });
  });

  it( "renders inner CollectionPage with empty hasPart for empty categories", () => {
    const schema = buildHomepageSchema(
      { items: [
        makePost({ id: "1", slug: "m1", title: "M1", date: "2026-04-01", category: "music" }),
      ] } as never,
      categoryConfig,
    );
    expect( schema.hasPart[1].hasPart ).toEqual( [] );
    expect( schema.hasPart[2].hasPart ).toEqual( [] );
  });

  it( "does not include posts from other categories in a section's hasPart", () => {
    const schema = buildHomepageSchema(
      { items: [
        makePost({ id: "1", slug: "m1", title: "M1", date: "2026-04-01", category: "music" }),
        makePost({ id: "2", slug: "e1", title: "E1", date: "2026-04-01", category: "events" }),
      ] } as never,
      categoryConfig,
    );
    const musicSection = schema.hasPart[0];
    const eventsSection = schema.hasPart[1];
    expect( musicSection.hasPart ).toHaveLength( 1 );
    expect( musicSection.hasPart[0].url ).toContain( "m1" );
    expect( eventsSection.hasPart ).toHaveLength( 1 );
    expect( eventsSection.hasPart[0].url ).toContain( "e1" );
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn test src/__tests__/lib/homepageSchema.test.ts`
Expected: FAIL — old `buildHomepageSchema` returns flat `hasPart`, signature is wrong, etc.

- [ ] **Step 3: Replace `buildHomepageSchema` implementation**

Replace the contents of `src/lib/homepageSchema.ts` with:

```typescript
import { BlogPosts } from "@/utils/contentfulUtils";
import { resolvePostDate, sortBlogPostsByDate } from "@/utils/blogPostUtils";
import { CategoryConfigMap } from "@/types/categoryConfig";
import {
  CATEGORY_IDS,
  META_DESCRIPTION,
  META_TITLE,
  POSTS_PER_CATEGORY_SECTION,
  SITE_URL,
} from "@/constants";

export function buildHomepageSchema( posts: BlogPosts, categoryConfig: CategoryConfigMap ) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": META_TITLE,
    "description": META_DESCRIPTION,
    "url": SITE_URL,
    "isPartOf": {
      "@type": "WebSite",
      "name": META_TITLE,
      "url": SITE_URL,
    },
    "hasPart": CATEGORY_IDS.map( categoryId => {
      const config = categoryConfig[categoryId];
      const categoryPosts = posts.items
        .filter( post => post.fields.category === categoryId )
        .sort( sortBlogPostsByDate )
        .slice( 0, POSTS_PER_CATEGORY_SECTION );
      return {
        "@type": "CollectionPage",
        "name": config.title,
        "description": config.description,
        "url": `${SITE_URL}/category/${categoryId}`,
        "hasPart": categoryPosts.map( post => {
          const imageUrl = post.fields.image?.fields.file?.url;
          return {
            "@type": "BlogPosting",
            "headline": post.fields.title,
            "url": `${SITE_URL}/post/${post.fields.slug}`,
            "datePublished": resolvePostDate( post ),
            "image": imageUrl ? `https:${imageUrl}` : undefined,
          };
        }),
      };
    }),
  };
}
```

The previous `dedupeBySlug` helper is removed — no longer needed because each post has exactly one category.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn test src/__tests__/lib/homepageSchema.test.ts`
Expected: PASS — all 7 tests green.

- [ ] **Step 5: Run typecheck**

Run: `yarn typecheck`
Expected: FAIL with one error in `src/pages/index.tsx` (the home page calls `buildHomepageSchema(posts)` with the old signature). This is expected — Task 5 fixes it.

If typecheck shows other errors, STOP and investigate.

- [ ] **Step 6: Commit**

```bash
git add src/lib/homepageSchema.ts src/__tests__/lib/homepageSchema.test.ts
git commit -m "feat: nested CollectionPage shape in buildHomepageSchema"
```

(Note: the branch's typecheck is broken between this commit and the next. The next task fixes it.)

---

### Task 5: Update `pages/index.tsx` to use category components

**Files:**
- Modify: `src/pages/index.tsx`

Replace `TaggedPostSections` with `CategoryPostSections`. Drop the `tagSeoConfig` flow (no more `validateTagSeoConfig` call, no more `tagSeoConfig` prop). Update the `buildHomepageSchema` call to pass `categoryConfig`.

- [ ] **Step 1: Read the current `pages/index.tsx`**

Read `src/pages/index.tsx`. The current shape is:
- Imports include `TaggedPostSections`, `tagSeoConfigData`, `validateTagSeoConfig`, `categoriesData`, `validateCategoryConfig`.
- `HomeProps` includes `tagSeoConfig: TagSeoConfigMap`.
- `getStaticProps` validates both tag and category configs, calls `buildHomepageSchema(posts)`, returns `{ posts, tags, tagSeoConfig, schema }`.

- [ ] **Step 2: Replace the file**

Replace the entire contents of `src/pages/index.tsx` with:

```typescript
import Link from "next/link";
import styles from "@/styles/Home.module.scss";
import { BlogPosts, getBlogPosts } from "@/utils/contentfulUtils";
import { Layout } from "@/components/Layout/Layout";
import CategoryPostSections from "@/components/Home/CategoryPostSections";
import { generateFeeds } from "@/lib/generateFeeds";
import { buildHomepageSchema } from "@/lib/homepageSchema";
import { JsonLd } from "@/components/JsonLd";
import { META_DESCRIPTION, META_IMAGE, META_TITLE, SITE_URL } from "@/constants";
import { SeoHead } from "@/components/SeoHead";
import { CategoryConfigMap } from "@/types/categoryConfig";
import categoriesData from "../../data/categories.json";
import { validateCategoryConfig } from "@/utils/categoryConfig";

export interface HomeProps {
  posts: BlogPosts;
  categoryConfig: CategoryConfigMap;
  schema: ReturnType<typeof buildHomepageSchema>;
}

export default function Home({ posts, categoryConfig, schema }: HomeProps ) {
  return (
    <>
      <SeoHead
        title={ META_TITLE }
        canonicalUrl={ SITE_URL }
        description={ META_DESCRIPTION }
        ogImage={ META_IMAGE }
      >
        <link rel="alternate" type="application/rss+xml" href="/rss.xml" />
        <link rel="alternate" type="application/atom+xml" href="/atom.xml" />
        <link rel="alternate" type="application/feed+json" href="/feed.json" />
        <JsonLd schema={ schema } />
      </SeoHead>
      <Layout isFullwidth>
        <main className={ styles.main }>
          <CategoryPostSections
            posts={ posts }
            categoryConfig={ categoryConfig }
          />
          <Link href="/page/2" className={ styles.allPostsLink }>
            Browse all posts →
          </Link>
        </main>
      </Layout>
    </>
  );
}

export async function getStaticProps() {
  const posts = await getBlogPosts();

  const categoryConfig: CategoryConfigMap = categoriesData satisfies CategoryConfigMap;
  validateCategoryConfig(
    categoryConfig,
    posts.items.map( post => post.fields.category ),
  );

  generateFeeds( posts.items );
  const schema = buildHomepageSchema( posts, categoryConfig );

  return {
    props: {
      posts,
      categoryConfig,
      schema,
    },
  };
}
```

Note: `getTags()` is no longer called — the home doesn't need tags, only categories. `tagSeoConfig` is gone from props.

- [ ] **Step 3: Run typecheck**

Run: `yarn typecheck`
Expected: PASS.

- [ ] **Step 4: Run the build**

Run: `yarn build`
Expected: PASS — the home page renders categories; archive routes still render via the unchanged `BlogArchive`.

- [ ] **Step 5: Run the test suite**

Run: `yarn test`
Expected: PASS, no regressions.

- [ ] **Step 6: Run lint**

Run: `yarn lint`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/pages/index.tsx
git commit -m "feat: use CategoryPostSections on home page"
```

---

### Task 6: Update `Pagination` to use `ArchiveFilter` prop

**Files:**
- Modify: `src/components/Home/Pagination.tsx`
- Modify: `src/__tests__/components/Pagination.test.tsx`
- Modify: `src/components/BlogArchive/BlogArchive.tsx`

`Pagination`'s `tagId?: string` prop is replaced with `filter: ArchiveFilter`. The `getPaginatorUrl` helper uses the discriminated union to generate `/page/N`, `/tags/X/page/N`, or `/category/X/page/N` links. `BlogArchive` (which still exists in this task — gets deleted in Task 11) is updated to construct the filter from its current `tagId` prop.

- [ ] **Step 1: Update the test file with the new API**

Replace the contents of `src/__tests__/components/Pagination.test.tsx` with:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock( "@/constants", async importOriginal => ({
  ...( await importOriginal<typeof import( "@/constants" )>() ),
  PAGE_SIZE: 3,
}) );
vi.mock( "@/utils/contentfulUtils", () => ({}) );
vi.mock( "next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a"> ) => (
    <a href={ href } { ...props }>{ children }</a>
  ),
}) );

import Pagination from "@/components/Home/Pagination";

const makePosts = ( count: number ) =>
  Array.from({ length: count }, ( _, index ) => ({
    sys: { id: String( index ) },
    fields: { title: `Post ${ index }`, slug: `post-${ index }` },
  }) );

describe( "Pagination", () => {
  it( "renders nothing when all posts fit on one page", () => {
    const { container } = render(
      <Pagination posts={ makePosts( 3 ) as never[] } page={ 1 } filter={ { kind: "all" } } />,
    );
    expect( container.firstChild ).toBeNull();
  });

  it( "renders page number links for filter kind 'all'", () => {
    render( <Pagination posts={ makePosts( 7 ) as never[] } page={ 1 } filter={ { kind: "all" } } /> );
    expect( screen.getByText( "1" ).getAttribute( "href" ) ).toBe( "/" );
    expect( screen.getByText( "2" ).getAttribute( "href" ) ).toBe( "/page/2" );
    expect( screen.getByText( "3" ).getAttribute( "href" ) ).toBe( "/page/3" );
  });

  it( "renders tag-prefixed links for filter kind 'tag'", () => {
    render(
      <Pagination
        posts={ makePosts( 7 ) as never[] }
        page={ 1 }
        filter={ { kind: "tag", id: "dj" } }
      />,
    );
    expect( screen.getByText( "1" ).getAttribute( "href" ) ).toBe( "/tags/dj" );
    expect( screen.getByText( "2" ).getAttribute( "href" ) ).toBe( "/tags/dj/page/2" );
  });

  it( "renders category-prefixed links for filter kind 'category'", () => {
    render(
      <Pagination
        posts={ makePosts( 7 ) as never[] }
        page={ 1 }
        filter={ { kind: "category", id: "music" } }
      />,
    );
    expect( screen.getByText( "1" ).getAttribute( "href" ) ).toBe( "/category/music" );
    expect( screen.getByText( "2" ).getAttribute( "href" ) ).toBe( "/category/music/page/2" );
  });

  it( "does not render a prev link on the first page", () => {
    render(
      <Pagination posts={ makePosts( 7 ) as never[] } page={ 1 } filter={ { kind: "all" } } />,
    );
    expect( screen.queryByText( "prev" ) ).toBeNull();
  });

  it( "renders a prev link on later pages", () => {
    render(
      <Pagination posts={ makePosts( 7 ) as never[] } page={ 2 } filter={ { kind: "all" } } />,
    );
    const prevLink = screen.getByText( "prev" );
    expect( prevLink ).toBeInTheDocument();
    expect( prevLink.getAttribute( "href" ) ).toBe( "/" );
  });

  it( "renders a next link when there are more pages", () => {
    render(
      <Pagination posts={ makePosts( 7 ) as never[] } page={ 1 } filter={ { kind: "all" } } />,
    );
    expect( screen.queryByText( "next" ) ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn test src/__tests__/components/Pagination.test.tsx`
Expected: FAIL — `Pagination` doesn't accept `filter` prop yet.

- [ ] **Step 3: Replace `Pagination.tsx`**

Replace the contents of `src/components/Home/Pagination.tsx` with:

```typescript
import { PAGE_SIZE } from "@/constants";
import Link from "next/link";
import styles from "@/styles/Home.module.scss";
import { BlogPost } from "@/utils/contentfulUtils";
import { ArchiveFilter } from "@/types/archiveFilter";


interface PaginationProps {
  posts: BlogPost[]
  page: number
  filter: ArchiveFilter
}


function getPaginatorBase( filter: ArchiveFilter ): string {
  switch( filter.kind ) {
    case "all": return "/";
    case "tag": return `/tags/${filter.id}/`;
    case "category": return `/category/${filter.id}/`;
  }
}


function getPaginatorUrl( pageNumber: number, filter: ArchiveFilter ): string {
  const base = getPaginatorBase( filter );
  if( pageNumber === 1 ) {
    return base === "/" ? "/" : base.replace( /\/$/, "" );
  }
  return `${base}page/${pageNumber}`;
}


export default function Pagination({ posts, page, filter }: PaginationProps ) {
  const numPages = Math.ceil( posts.length / PAGE_SIZE );
  if( numPages <= 1 ) {
    return null;
  }
  return (
    <nav className={ styles.pagination }>
      {
        Boolean( page > 1 ) &&
          <Link
            href={ getPaginatorUrl( page - 1, filter ) }
            rel="prev"
          >prev</Link>
      }
      {
        Array
          .from({ length: numPages }, ( _, idx ) => idx + 1 )
          .map( pageNumber => {
            const isCurrentPage: boolean = pageNumber === page;
            const href: string = getPaginatorUrl( pageNumber, filter );
            const className: string|undefined = isCurrentPage ? styles.isCurrentPage : undefined;
            return (
              <Link
                key={ pageNumber }
                href={ href }
                className={ className }
              >{ pageNumber }
              </Link>
            );
          })
      }
      {
        Boolean( page < numPages ) &&
          <Link
            href={ getPaginatorUrl( page + 1, filter ) }
            rel="next"
          >next</Link>
      }
    </nav>
  );
}
```

- [ ] **Step 4: Update `BlogArchive` to construct the filter**

In `src/components/BlogArchive/BlogArchive.tsx`, update the two `<Pagination>` call sites and add the filter import.

Find the existing line:

```typescript
import { sortTagsById } from "@/utils/blogPostUtils";
```

Add this import below it:

```typescript
import { ArchiveFilter } from "@/types/archiveFilter";
```

Then find the `<BlogPostList ... />` and `<Pagination ... />` block (currently lines ~88-97), and replace the `<Pagination>` element:

Before:
```typescript
<Pagination
  posts={ filteredBlogPosts }
  page={ page }
  tagId={ tagId ?? undefined }
/>
```

After:
```typescript
<Pagination
  posts={ filteredBlogPosts }
  page={ page }
  filter={ tagId ? { kind: "tag", id: tagId } : { kind: "all" } satisfies ArchiveFilter }
/>
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `yarn test src/__tests__/components/Pagination.test.tsx`
Expected: PASS — all 7 tests green.

- [ ] **Step 6: Run typecheck + full suite + build**

Run: `yarn typecheck && yarn test && yarn build`
Expected: PASS — Pagination supports the new API; BlogArchive constructs the filter; both builds produce identical output to before.

- [ ] **Step 7: Run lint**

Run: `yarn lint`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/Home/Pagination.tsx src/__tests__/components/Pagination.test.tsx src/components/BlogArchive/BlogArchive.tsx
git commit -m "refactor: Pagination takes ArchiveFilter prop"
```

---

### Task 7: Add `FilteredArchive` component

**Files:**
- Create: `src/components/FilteredArchive/FilteredArchive.tsx`

The presentational component for all archive routes. Takes `posts`, `filter`, `page`, `seo` and renders SeoHead + Layout + CategoryNav + BlogPostList + Pagination. No business logic — just rendering.

The existing `BlogArchive` is left in place; it gets deleted in Task 11 once routes are migrated.

- [ ] **Step 1: Create the file**

Create `src/components/FilteredArchive/FilteredArchive.tsx`:

```typescript
import styles from "@/styles/Home.module.scss";
import { BlogPosts } from "@/utils/contentfulUtils";
import BlogPostList from "@/components/Home/BlogPostList";
import { Layout } from "@/components/Layout/Layout";
import Pagination from "@/components/Home/Pagination";
import CategoryNav from "@/components/CategoryNav";
import { SeoHead } from "@/components/SeoHead";
import { ArchiveFilter, ArchiveSeo } from "@/types/archiveFilter";

export interface FilteredArchiveProps {
  posts: BlogPosts
  filter: ArchiveFilter
  page: number
  seo: ArchiveSeo
}

function filterPosts( posts: BlogPosts, filter: ArchiveFilter ) {
  switch( filter.kind ) {
    case "all":
      return posts.items;
    case "tag":
      return posts.items.filter( post =>
        post.metadata.tags.some( tag => tag.sys.id === filter.id ) );
    case "category":
      return posts.items.filter( post => post.fields.category === filter.id );
  }
}

export default function FilteredArchive({ posts, filter, page, seo }: FilteredArchiveProps ) {
  const filteredPosts = filterPosts( posts, filter );
  const tagId = filter.kind === "tag" ? filter.id : undefined;
  const currentCategory = filter.kind === "category" ? filter.id : null;

  return (
    <>
      <SeoHead
        title={ seo.title }
        canonicalUrl={ seo.canonical }
        description={ seo.description }
        ogImage={ seo.ogImage }
      >
        <link rel="alternate" type="application/rss+xml" href="/rss.xml" />
        <link rel="alternate" type="application/atom+xml" href="/atom.xml" />
        <link rel="alternate" type="application/feed+json" href="/feed.json" />
      </SeoHead>
      <Layout isFullwidth>
        <main className={ styles.main }>
          <CategoryNav currentCategory={ currentCategory } />
          <BlogPostList
            posts={ filteredPosts }
            page={ page }
            tagId={ tagId }
          />
          <Pagination
            posts={ filteredPosts }
            page={ page }
            filter={ filter }
          />
        </main>
      </Layout>
    </>
  );
}
```

- [ ] **Step 2: Run typecheck + lint**

Run: `yarn typecheck && yarn lint`
Expected: PASS — new file compiles, no callers yet.

- [ ] **Step 3: Run the full test suite**

Run: `yarn test`
Expected: PASS, no regressions.

- [ ] **Step 4: Commit**

```bash
git add src/components/FilteredArchive/FilteredArchive.tsx
git commit -m "feat: add FilteredArchive presentational component"
```

---

### Task 8: Add three static-props helpers

**Files:**
- Create: `src/components/FilteredArchive/getAllStaticProps.ts`
- Create: `src/components/FilteredArchive/getTagStaticProps.ts`
- Create: `src/components/FilteredArchive/getCategoryStaticProps.ts`

Each helper builds the filter and SEO for one route axis. All three call `validateCategoryConfig` (build fails if any post lacks a category).

- [ ] **Step 1: Create `getAllStaticProps.ts`**

Create `src/components/FilteredArchive/getAllStaticProps.ts`:

```typescript
import { GetStaticPropsContext } from "next";
import { getBlogPosts } from "@/utils/contentfulUtils";
import { CategoryConfigMap } from "@/types/categoryConfig";
import categoriesData from "../../../data/categories.json";
import { validateCategoryConfig } from "@/utils/categoryConfig";
import { ArchiveFilter, ArchiveSeo } from "@/types/archiveFilter";
import { META_DESCRIPTION, META_IMAGE, META_TITLE, SITE_URL } from "@/constants";

export async function getAllStaticProps( context: GetStaticPropsContext ) {
  const page: number = Number( context.params?.page ) || 1;
  const posts = await getBlogPosts();

  const categoryConfig: CategoryConfigMap = categoriesData satisfies CategoryConfigMap;
  validateCategoryConfig(
    categoryConfig,
    posts.items.map( post => post.fields.category ),
  );

  const seo: ArchiveSeo = {
    title: page > 1 ? `Blog — Page ${page} | Audeos.com` : META_TITLE,
    description: META_DESCRIPTION,
    ogImage: META_IMAGE,
    canonical: page > 1 ? `${SITE_URL}/page/${page}` : SITE_URL,
  };

  const filter: ArchiveFilter = { kind: "all" };

  return {
    props: { posts, page, filter, seo },
  };
}
```

- [ ] **Step 2: Create `getTagStaticProps.ts`**

Create `src/components/FilteredArchive/getTagStaticProps.ts`:

```typescript
import { GetStaticPropsContext } from "next";
import { getBlogPosts } from "@/utils/contentfulUtils";
import { CategoryConfigMap } from "@/types/categoryConfig";
import categoriesData from "../../../data/categories.json";
import { validateCategoryConfig } from "@/utils/categoryConfig";
import { ArchiveFilter, ArchiveSeo } from "@/types/archiveFilter";
import { META_DESCRIPTION, META_IMAGE, SITE_URL } from "@/constants";

export async function getTagStaticProps( context: GetStaticPropsContext ) {
  const tagIdParam = context.params?.tagId;
  if( typeof tagIdParam !== "string" ) {
    throw new Error( "getTagStaticProps: tagId param missing or not a string" );
  }
  const page: number = Number( context.params?.page ) || 1;
  const posts = await getBlogPosts();

  const categoryConfig: CategoryConfigMap = categoriesData satisfies CategoryConfigMap;
  validateCategoryConfig(
    categoryConfig,
    posts.items.map( post => post.fields.category ),
  );

  const seo: ArchiveSeo = {
    title: page > 1
      ? `Posts tagged ${tagIdParam} — Page ${page} | Audeos.com`
      : `Posts tagged ${tagIdParam} | Audeos.com`,
    description: META_DESCRIPTION,
    ogImage: META_IMAGE,
    canonical: `${SITE_URL}/tags/${tagIdParam}${page > 1 ? `/page/${page}` : ""}`,
  };

  const filter: ArchiveFilter = { kind: "tag", id: tagIdParam };

  return {
    props: { posts, page, filter, seo },
  };
}
```

- [ ] **Step 3: Create `getCategoryStaticProps.ts`**

Create `src/components/FilteredArchive/getCategoryStaticProps.ts`:

```typescript
import { GetStaticPropsContext } from "next";
import { getBlogPosts } from "@/utils/contentfulUtils";
import { CategoryConfigMap } from "@/types/categoryConfig";
import categoriesData from "../../../data/categories.json";
import { validateCategoryConfig } from "@/utils/categoryConfig";
import { ArchiveFilter, ArchiveSeo } from "@/types/archiveFilter";
import { META_DESCRIPTION, META_IMAGE, SITE_URL } from "@/constants";

export async function getCategoryStaticProps( context: GetStaticPropsContext ) {
  const slugParam = context.params?.slug;
  if( typeof slugParam !== "string" ) {
    throw new Error( "getCategoryStaticProps: slug param missing or not a string" );
  }
  const categoryConfig: CategoryConfigMap = categoriesData satisfies CategoryConfigMap;
  const config = categoryConfig[slugParam];
  if( !config ) {
    throw new Error( `getCategoryStaticProps: no categoryConfig entry for "${slugParam}"` );
  }
  const page: number = Number( context.params?.page ) || 1;
  const posts = await getBlogPosts();

  validateCategoryConfig(
    categoryConfig,
    posts.items.map( post => post.fields.category ),
  );

  // META_DESCRIPTION/META_IMAGE imported but unused as direct values here;
  // they're available as fallbacks if config.ogImage is null.
  void META_DESCRIPTION;
  const seo: ArchiveSeo = {
    title: page > 1
      ? `${config.title} — Page ${page} | Audeos.com`
      : `${config.title} | Audeos.com`,
    description: config.description,
    ogImage: config.ogImage ?? META_IMAGE,
    canonical: `${SITE_URL}/category/${slugParam}${page > 1 ? `/page/${page}` : ""}`,
  };

  const filter: ArchiveFilter = { kind: "category", id: slugParam };

  return {
    props: { posts, page, filter, seo },
  };
}
```

(Remove the `void META_DESCRIPTION` line and the import of `META_DESCRIPTION` if your editor complains about it being unused — the import isn't actually needed. The `void` statement is shown only as a guard against accidentally importing it.)

Actually, just remove `META_DESCRIPTION` from the import list — the cleaner version:

```typescript
import { META_IMAGE, SITE_URL } from "@/constants";
```

- [ ] **Step 4: Run typecheck + lint**

Run: `yarn typecheck && yarn lint`
Expected: PASS — no consumers yet, all three new files compile.

- [ ] **Step 5: Run the full test suite**

Run: `yarn test`
Expected: PASS, no regressions.

- [ ] **Step 6: Commit**

```bash
git add src/components/FilteredArchive/getAllStaticProps.ts src/components/FilteredArchive/getTagStaticProps.ts src/components/FilteredArchive/getCategoryStaticProps.ts
git commit -m "feat: add FilteredArchive static-props helpers"
```

---

### Task 9: Migrate existing route shells to `FilteredArchive`

**Files:**
- Modify: `src/pages/page/[page].tsx`
- Modify: `src/pages/tags/[tagId].tsx`
- Modify: `src/pages/tags/[tagId]/page/[page].tsx`

Each shell switches from importing `BlogArchive` + `getArchiveStaticProps` to importing `FilteredArchive` + the appropriate new helper. After this task, `BlogArchive` is unused (deleted in Task 11).

- [ ] **Step 1: Replace `pages/page/[page].tsx`**

Replace the entire contents with:

```typescript
import { getBlogPosts } from "@/utils/contentfulUtils";
import FilteredArchive from "@/components/FilteredArchive/FilteredArchive";
import { getAllStaticProps } from "@/components/FilteredArchive/getAllStaticProps";
import { PAGE_SIZE } from "@/constants";


export const getStaticProps = getAllStaticProps;

export async function getStaticPaths() {
  const posts = await getBlogPosts();
  const numPages = Math.ceil( posts.items.length / PAGE_SIZE );
  const paths: { params: { page: string } }[] = [];

  for( let page = 2; page <= numPages; page++ ) {
    paths.push({ params: { page: page.toString() } });
  }

  return {
    paths,
    fallback: false,
  };
}

export default FilteredArchive;
```

- [ ] **Step 2: Replace `pages/tags/[tagId].tsx`**

Replace the entire contents with:

```typescript
import { getTags } from "@/utils/contentfulUtils";
import FilteredArchive from "@/components/FilteredArchive/FilteredArchive";
import { getTagStaticProps } from "@/components/FilteredArchive/getTagStaticProps";


export const getStaticProps = getTagStaticProps;


export async function getStaticPaths() {
  const tags = await getTags();
  const paths = tags.items.map( tag => {
    const tagId = tag.sys.id;
    return { params: { tagId } };
  });

  return {
    paths,
    fallback: false,
  };
}

export default FilteredArchive;
```

- [ ] **Step 3: Replace `pages/tags/[tagId]/page/[page].tsx`**

Replace the entire contents with:

```typescript
import { getBlogPosts, getTags } from "@/utils/contentfulUtils";
import FilteredArchive from "@/components/FilteredArchive/FilteredArchive";
import { getTagStaticProps } from "@/components/FilteredArchive/getTagStaticProps";
import { PAGE_SIZE } from "@/constants";


export const getStaticProps = getTagStaticProps;


export async function getStaticPaths() {
  const tags = await getTags();
  const posts = await getBlogPosts();
  const paths: { params: { tagId: string, page: string }}[] = [];

  tags.items.forEach( tag => {
    const tagId = tag.sys.id;
    const filteredPosts = posts.items
      .filter( post => post.metadata.tags
        .find( postTag => postTag.sys.id === tagId ) );
    const numPages = Math.ceil( filteredPosts.length / PAGE_SIZE );
    for( let page = 2; page <= numPages; page++ ) {
      paths.push({
        params: {
          tagId,
          page: page.toString(),
        },
      });
    }
  });

  return {
    paths,
    fallback: false,
  };
}

export default FilteredArchive;
```

- [ ] **Step 4: Run typecheck**

Run: `yarn typecheck`
Expected: PASS.

- [ ] **Step 5: Run the build**

Run: `yarn build`
Expected: PASS — all three migrated routes still generate static HTML; output is same as before but rendered via `FilteredArchive` with category nav at the top.

- [ ] **Step 6: Run lint + full suite**

Run: `yarn lint && yarn test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/pages/page/[page].tsx src/pages/tags/[tagId].tsx src/pages/tags/[tagId]/page/[page].tsx
git commit -m "refactor: migrate archive route shells to FilteredArchive"
```

---

### Task 10: Add new category route shells

**Files:**
- Create: `src/pages/category/[slug].tsx`
- Create: `src/pages/category/[slug]/page/[page].tsx`

The new routes give each category a landing page and paginated children.

- [ ] **Step 1: Create `pages/category/[slug].tsx`**

Create the file:

```typescript
import FilteredArchive from "@/components/FilteredArchive/FilteredArchive";
import { getCategoryStaticProps } from "@/components/FilteredArchive/getCategoryStaticProps";
import { CategoryConfigMap } from "@/types/categoryConfig";
import categoriesData from "../../../data/categories.json";


export const getStaticProps = getCategoryStaticProps;


export async function getStaticPaths() {
  const categoryConfig: CategoryConfigMap = categoriesData satisfies CategoryConfigMap;
  const paths = Object.keys( categoryConfig ).map( slug => ({ params: { slug } }) );

  return {
    paths,
    fallback: false,
  };
}

export default FilteredArchive;
```

- [ ] **Step 2: Create `pages/category/[slug]/page/[page].tsx`**

Create the file:

```typescript
import { getBlogPosts } from "@/utils/contentfulUtils";
import FilteredArchive from "@/components/FilteredArchive/FilteredArchive";
import { getCategoryStaticProps } from "@/components/FilteredArchive/getCategoryStaticProps";
import { CategoryConfigMap } from "@/types/categoryConfig";
import categoriesData from "../../../../data/categories.json";
import { PAGE_SIZE } from "@/constants";


export const getStaticProps = getCategoryStaticProps;


export async function getStaticPaths() {
  const categoryConfig: CategoryConfigMap = categoriesData satisfies CategoryConfigMap;
  const posts = await getBlogPosts();
  const paths: { params: { slug: string, page: string } }[] = [];

  for( const slug of Object.keys( categoryConfig ) ) {
    const filteredPosts = posts.items.filter( post => post.fields.category === slug );
    const numPages = Math.ceil( filteredPosts.length / PAGE_SIZE );
    for( let page = 2; page <= numPages; page++ ) {
      paths.push({ params: { slug, page: page.toString() } });
    }
  }

  return {
    paths,
    fallback: false,
  };
}

export default FilteredArchive;
```

Note the path depth: `categoriesData` is `../../../../data/categories.json` (four levels up from `src/pages/category/[slug]/page/[page].tsx`).

- [ ] **Step 3: Run typecheck**

Run: `yarn typecheck`
Expected: PASS.

- [ ] **Step 4: Run the build**

Run: `yarn build`
Expected: PASS — 3 new base category pages (`/category/music`, `/category/events`, `/category/lifestyle`) plus paginated children if any category exceeds `PAGE_SIZE` (12 posts).

- [ ] **Step 5: Verify the new routes exist in `dist/`**

Run: `ls dist/category/`
Expected: Three directories — `events/`, `lifestyle/`, `music/`.

Run: `cat dist/category/music/index.html | head -5`
Expected: HTML content (not empty, not error).

- [ ] **Step 6: Run lint + full suite**

Run: `yarn lint && yarn test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/pages/category/
git commit -m "feat: add /category/[slug] routes"
```

---

### Task 11: Delete `BlogArchive` component + getStaticProps

**Files:**
- Delete: `src/components/BlogArchive/BlogArchive.tsx`
- Delete: `src/components/BlogArchive/getStaticProps.ts`
- Delete: `src/components/BlogArchive/` directory (after both files are gone)

After Task 9, no route shell imports from `BlogArchive`. The component is dead code. Time to remove it.

- [ ] **Step 1: Confirm no consumers**

Run: `grep -rn "BlogArchive" src/`
Expected: No results (or only matches inside paths that themselves get deleted in this task, like the `BlogArchive/` directory).

If any source file still imports `BlogArchive`, STOP — Task 9 didn't fully migrate.

- [ ] **Step 2: Delete the directory**

```bash
git rm -r src/components/BlogArchive/
```

- [ ] **Step 3: Run typecheck + build + lint + tests**

Run: `yarn typecheck && yarn lint && yarn test && yarn build`
Expected: PASS — nothing referenced the deleted code.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: delete BlogArchive (replaced by FilteredArchive)"
```

---

### Task 12: Update SCSS — add category nav styles, remove tag nav styles

**Files:**
- Modify: `src/styles/Home.module.scss`

The `.tagNav`, `.tag`, `.tagActive` classes have no consumer (the only one was `BlogArchive`, deleted in Task 11). Remove them. The `.categoryNav`, `.category`, `.categoryActive` were added in Task 2 — keep them.

- [ ] **Step 1: Remove the old tag-nav rules**

In `src/styles/Home.module.scss`, find and DELETE these three blocks (they live near the top of the file):

```scss
.tagNav {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 0;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(128, 128, 128, 0.2);
  view-transition-name: tag-nav;
}

.tag {
  display: inline-block;
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  border-bottom: 2px solid transparent;
  transition: border-color 0.2s ease, opacity 0.2s ease;
  opacity: 0.6;

  &:hover {
    opacity: 1;
    border-bottom-color: rgba(255, 255, 255, 0.3);
  }
}

.tagActive {
  composes: tag;
  opacity: 1;
  font-weight: 700;
  border-bottom-color: currentColor;
}
```

Note: the new `.categoryNav` rule's `view-transition-name: tag-nav` value intentionally matches the old `.tagNav` rule's value — that's so cross-route navigations (home → category page) reuse the existing view transition. Keep it.

- [ ] **Step 2: Run lint**

Run: `yarn lint`
Expected: PASS.

- [ ] **Step 3: Run the build**

Run: `yarn build`
Expected: PASS — no SCSS errors; the home and archive pages render.

- [ ] **Step 4: Commit**

```bash
git add src/styles/Home.module.scss
git commit -m "chore: remove unused tag-nav SCSS classes"
```

---

### Task 13: Delete obsolete tag-config files

**Files:**
- Delete: `data/tags.json`
- Delete: `src/types/tagConfig.ts`
- Delete: `src/utils/tagSeoConfig.ts`
- Delete: `src/__tests__/utils/tagSeoConfig.test.ts`
- Delete: `src/components/Home/TaggedPostSections.tsx`
- Delete: `src/__tests__/components/TaggedPostSections.test.tsx`

After Tasks 5 (home updated), 9 (archive routes migrated), and 11 (`BlogArchive` deleted), nothing imports from these files. Verify and delete.

- [ ] **Step 1: Confirm no consumers**

Run these commands and confirm each returns empty (or only the file being deleted):

```bash
grep -rn "tagSeoConfig\|tagConfig" src/
grep -rn "tags\.json" src/
grep -rn "TaggedPostSections" src/
```

Expected: All three return no results (the consuming code is all gone after the prior tasks).

If any return matches in source files, STOP and investigate.

- [ ] **Step 2: Delete the files**

```bash
git rm data/tags.json
git rm src/types/tagConfig.ts
git rm src/utils/tagSeoConfig.ts
git rm src/__tests__/utils/tagSeoConfig.test.ts
git rm src/components/Home/TaggedPostSections.tsx
git rm src/__tests__/components/TaggedPostSections.test.tsx
```

- [ ] **Step 3: Run typecheck + lint + full suite + build**

Run: `yarn typecheck && yarn lint && yarn test && yarn build`
Expected: PASS — no broken imports, all test files self-contained.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: delete obsolete tag-config files and TaggedPostSections"
```

---

### Task 14: Final verification + PR

**Files:**
- (No file changes — verification + PR creation only.)

- [ ] **Step 1: Run the full test suite**

Run: `yarn test`
Expected: PASS — 5 tests deleted (`tagSeoConfig.test.ts`) + 6 tests deleted (`TaggedPostSections.test.tsx`) = -11 tests; 5 added (`CategoryNav.test.tsx`) + 6 added (`CategoryPostSections.test.tsx`) = +11 tests; `homepageSchema.test.ts` rewritten with 7 tests (was 3) = +4. Net change: roughly the same count, slightly higher.

If the count drifted significantly from expected, investigate.

- [ ] **Step 2: Run lint**

Run: `yarn lint`
Expected: PASS.

- [ ] **Step 3: Run the production build**

Run: `yarn build`
Expected: PASS. Now there are 5 archive route patterns (was 3): `/page/[page]`, `/tags/[tagId]`, `/tags/[tagId]/page/[page]`, `/category/[slug]`, `/category/[slug]/page/[page]`.

- [ ] **Step 4: Spot-check `dist/` output**

```bash
ls dist/category/
```
Expected: `events`, `lifestyle`, `music` directories.

```bash
head -50 dist/index.html | grep -E '(application/ld\+json|category-)' || true
```
Expected: At least one `<script type="application/ld+json">` line and `id="category-music"` (or similar) in the section.

```bash
node -e "
const fs = require('fs');
const html = fs.readFileSync('dist/index.html', 'utf8');
const match = html.match(/<script type=\"application\/ld\+json\">([\s\S]*?)<\/script>/);
const parsed = JSON.parse( match[1] );
console.log( 'top:', parsed['@type'], '| inner count:', parsed.hasPart.length, '| inner types:', parsed.hasPart.map( inner => inner['@type'] ).join( ',' ) );
console.log( 'music posts:', parsed.hasPart[0].hasPart.length );
"
```
Expected output similar to:
```
top: CollectionPage | inner count: 3 | inner types: CollectionPage,CollectionPage,CollectionPage
music posts: 6
```

If JSON.parse throws or counts look wrong, investigate.

- [ ] **Step 5: Verify a category page generated correctly**

```bash
head -30 dist/category/music/index.html | grep -E '(<title>|categoryActive|loading=|fetchpriority=)' || true
```
Expected:
- `<title>Music | Audeos.com</title>`
- A `<a>` with `categoryActive` in its className (the active Music link in the nav).
- A `loading="lazy"` (and possibly `loading="eager"` on the first card).

- [ ] **Step 6: Verify a tag page still works**

```bash
ls dist/tags/
head -10 dist/tags/dj/index.html | grep -E '(<title>|categoryNav)' || true
```
Expected:
- The `dj` directory exists (and other tags).
- The tag page's title contains `Posts tagged dj` (generic SEO).
- The `categoryNav` class appears (the new nav is rendered at the top).

- [ ] **Step 7: Verify CLAUDE.md is still accurate**

Skim `CLAUDE.md`'s Architecture → Routing table. The `/category/[slug]` and `/category/[slug]/page/[page]` routes are NEW and should be added. Find the table and add two rows:

```markdown
| `/category/[slug]` | `pages/category/[slug].tsx` | Category landing page (3 categories) |
| `/category/[slug]/page/[page]` | `pages/category/[slug]/page/[page].tsx` | Paginated category listing |
```

Also update the `/` row description if it changed (it was set to "Tag-sectioned overview..." in the prior PR; now it's "Category-sectioned overview"):

```markdown
| `/` | `pages/index.tsx` | Category-sectioned overview (6 most recent posts per category) with nested CollectionPage JSON-LD |
```

If these updates are needed, make them and commit:

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md routing table for category routes"
```

If `CLAUDE.md` is already accurate, skip this commit.

- [ ] **Step 8: Push the branch**

```bash
git push -u origin category-ui
```

- [ ] **Step 9: Open the PR**

```bash
gh pr create --title "feat: category UI — sections, nav, /category routes" --body "$(cat <<'EOF'
## Summary
- Home page reshapes from 10 tag sections to **3 category sections** (6 posts each, newest first).
- Archive top nav swaps from 10 tag chips to a **3-item category nav** (`Music | Events | Lifestyle`).
- New routes: `/category/[slug]` and `/category/[slug]/page/[page]` (full pagination).
- Refactor: `BlogArchive` → `FilteredArchive` driven by a discriminated `ArchiveFilter` prop. Three static-props helpers (`getAllStaticProps`, `getTagStaticProps`, `getCategoryStaticProps`) own per-route filter + SEO construction.
- Tags survive only via per-card chips. `data/tags.json`, `src/types/tagConfig.ts`, `src/utils/tagSeoConfig.ts`, and their test deleted. Tag pages use generic SEO.
- Home JSON-LD becomes a nested `CollectionPage` (top-level + 3 inner per category, each with its own posts in `hasPart`).

## Test plan
- [x] `yarn test` — `CategoryNav` (5), `CategoryPostSections` (6), `homepageSchema` rewritten (7), `Pagination` updated for `filter` prop (7); full suite passes.
- [x] `yarn lint` — clean.
- [x] `yarn build` — succeeds; 3 new base category pages + paginated children. Build-time validators run against real Contentful data.
- [x] `dist/index.html` JSON-LD parses as nested `CollectionPage` with 3 inner sections; counts and types match.
- [x] `dist/category/music/index.html` renders with active category nav.
- [x] `dist/tags/dj/index.html` still works, with category nav at top and `Posts tagged dj` title.
- [ ] Reviewer: walk the home in a browser; confirm 3 sections look right and "See all →" links go to `/category/[slug]`.

Spec: `docs/superpowers/specs/2026-04-29-category-ui-design.md`
Plan: `docs/superpowers/plans/2026-04-29-category-ui.md`
EOF
)"
```

- [ ] **Step 10: Return the PR URL**

The output of `gh pr create` is the PR URL. Report it back.

---

## Self-review

**Spec coverage** — every section of the spec maps to one or more tasks:

| Spec section | Task |
|---|---|
| Constants (`CATEGORY_IDS`, `POSTS_PER_CATEGORY_SECTION`) | 1 |
| Types (`ArchiveFilter`, `ArchiveSeo`) | 1 |
| `CategoryNav` component + tests + SCSS | 2 |
| `CategoryPostSections` component + tests | 3 |
| Nested `CollectionPage` JSON-LD | 4 |
| Home page consumes new components | 5 |
| `Pagination` API change to `filter` | 6 |
| `FilteredArchive` presentational component | 7 |
| Three static-props helpers | 8 |
| Existing route shells migrated | 9 |
| New `/category/[slug]` routes | 10 |
| `BlogArchive` deletion | 11 |
| SCSS cleanup (tag nav rules) | 12 |
| `data/tags.json` + tagConfig + `TaggedPostSections` deletion | 13 |
| Final verify + PR (incl. CLAUDE.md) | 14 |

**Type consistency** — `ArchiveFilter` shape (`{kind, id?}`) is consistent across Tasks 1, 6, 7, 8, 9, 10. `ArchiveSeo` shape consistent across 7, 8. `FilteredArchiveProps` matches the helpers' return types. `Pagination`'s `filter` prop matches the union exhaustively (TypeScript catches gaps in the switch).

**Placeholder scan** — no TBDs/TODOs. Every code step has the actual code. Manual verification commands in Task 14 are concrete.

**Note about Task 4 → Task 5 build state:** Between commits, `yarn typecheck` fails because `pages/index.tsx` still calls the old `buildHomepageSchema(posts)` signature. Task 4's commit message and Step 5 explicitly call this out; Task 5 fixes it in the next commit. Engineers running tasks sequentially won't notice. Anyone running tasks out-of-order needs to be aware.

**Note about Task 8 unused-import:** In `getCategoryStaticProps.ts`, `META_DESCRIPTION` is imported but unused (the helper sources description from `config.description`, not the site default). Step 3 calls this out and instructs the engineer to remove it from the import list.
