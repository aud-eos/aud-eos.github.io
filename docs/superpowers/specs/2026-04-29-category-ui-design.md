# Category UI (Spec B) — Design Spec

## Problem

Spec A landed the `category` field on every blog post but no UI consumes it. The home page still renders 10 tag sections; the archive nav still shows 10 tag chips; tag pages still own per-tag SEO copy. Categories are the new primary axis but invisible to readers.

This spec is the UI rework. Categories become primary navigation, the home page reshapes into 3 category sections, dedicated `/category/[slug]` routes give each category a landing page, and tags are demoted to per-card chips with no per-tag editorial copy.

## Solution

A strategy-pattern refactor: `BlogArchive` becomes a generic `FilteredArchive` that takes a discriminated `ArchiveFilter` prop and pre-built SEO. Three static-props helpers — one per route axis (`all`, `tag`, `category`) — own the route-specific filter construction and SEO. New `/category/[slug]` and `/category/[slug]/page/[page]` routes mirror the tag routes' shape. The home's `TaggedPostSections` is replaced by `CategoryPostSections`, iterating the fixed 3 categories. A new `CategoryNav` component replaces the inline tag-nav block in the archive component. `data/tags.json` and its supporting types/validator are deleted; tag pages use generic SEO.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Section count on home | 3 (one per category) | Matches the new taxonomy; ~3-4 sections was the user target |
| Posts per category section | 6 | 2x3 grid feel per section at desktop; ~18 cards on home is medium density |
| Section ordering | Fixed `CATEGORY_PRIORITY` order: `music > events > lifestyle` | Reuses the constant from Spec A; editorial weight |
| Within-section ordering | Newest first (`sortBlogPostsByDate`) | User-stated requirement |
| Category-detail routes | New `/category/[slug]` + `/category/[slug]/page/[page]` with full pagination | Readers expect "click Music → see all music"; without it, category headers are dead ends |
| Archive top nav | 3-item `CategoryNav` (replaces tag nav entirely) | Categories are primary axis; tags drill via card chips |
| Active state on tag pages | None (no category active) | Tag pages aren't filtered by category; nav stays as a discovery aid |
| Home page nav | None | Category sections themselves are the nav |
| Tag pages | Survive; reachable from card chips only | Tags are useful for cross-cutting drill-down |
| Tag SEO | Generic — `Posts tagged ${id} | Audeos.com`, site-default description and OG image | Categories own editorial copy now |
| `data/tags.json` and supporting code | Deleted entirely | Tag chips already use `tag.sys.id`; no per-tag copy needed |
| Component refactor | Strategy pattern: `FilteredArchive` + 3 static-props helpers | Cleanest separation of "what to filter" from "how to render" |
| Home JSON-LD shape | Nested `CollectionPage` (top-level + 3 inner per category) | Communicates category structure to crawlers |

## Architecture

### File / component layout

**Renamed:**
- `src/components/BlogArchive/` → `src/components/FilteredArchive/`
- `BlogArchive.tsx` → `FilteredArchive.tsx`

**New types — `src/types/archiveFilter.ts`:**

```typescript
export type ArchiveFilter =
  | { kind: "all" }
  | { kind: "tag"; id: string }
  | { kind: "category"; id: string };

export interface ArchiveSeo {
  title: string;
  description: string;
  ogImage: string;
  canonical: string;
}
```

**`src/components/FilteredArchive/FilteredArchive.tsx`** — purely presentational:

```typescript
export interface FilteredArchiveProps {
  posts: BlogPosts;
  filter: ArchiveFilter;
  page: number;
  seo: ArchiveSeo;
}

export default function FilteredArchive({ posts, filter, page, seo }: FilteredArchiveProps ) {
  const filteredPosts = posts.items.filter( post => {
    switch( filter.kind ) {
      case "all": return true;
      case "tag": return post.metadata.tags.some( tag => tag.sys.id === filter.id );
      case "category": return post.fields.category === filter.id;
    }
  });
  const tagId = filter.kind === "tag" ? filter.id : undefined;
  const currentCategory = filter.kind === "category" ? filter.id : null;
  return (
    <>
      <SeoHead title={ seo.title } canonicalUrl={ seo.canonical } description={ seo.description } ogImage={ seo.ogImage }>
        <link rel="alternate" type="application/rss+xml" href="/rss.xml" />
        <link rel="alternate" type="application/atom+xml" href="/atom.xml" />
        <link rel="alternate" type="application/feed+json" href="/feed.json" />
      </SeoHead>
      <Layout isFullwidth>
        <main className={ styles.main }>
          <CategoryNav currentCategory={ currentCategory } />
          <BlogPostList posts={ filteredPosts } page={ page } tagId={ tagId } />
          <Pagination posts={ filteredPosts } page={ page } filter={ filter } />
        </main>
      </Layout>
    </>
  );
}
```

**New: `src/components/CategoryNav.tsx`** — 3-item nav, labels from `data/categories.json`:

```typescript
export interface CategoryNavProps {
  currentCategory: string | null;
}

export default function CategoryNav({ currentCategory }: CategoryNavProps ) {
  const config: CategoryConfigMap = categoriesData satisfies CategoryConfigMap;
  return (
    <nav className={ styles.categoryNav }>
      { CATEGORY_IDS.map( categoryId => {
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
      })}
    </nav>
  );
}
```

**New: `src/components/Home/CategoryPostSections.tsx`** — replaces `TaggedPostSections.tsx`:

```typescript
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
              <h2><Link href={ `/category/${section.categoryId}` }>{ config.title }</Link></h2>
              <Link href={ `/category/${section.categoryId}` } className={ styles.seeAll } aria-hidden="true" tabIndex={ -1 }>See all →</Link>
            </header>
            <BlogPostList
              posts={ section.categoryPosts }
              page={ 1 }
              firstCardPriority={ sectionIndex === 0 }
            />
          </section>
        );
      })}
    </>
  );
}
```

### Static-props helpers

Three files in `src/components/FilteredArchive/`:

**`getAllStaticProps.ts`** — for `/page/[page]`:

```typescript
export async function getAllStaticProps( context: GetStaticPropsContext ) {
  const page = Number( context.params?.page ) || 1;
  const posts = await getBlogPosts();
  const tags = await getTags();

  validateCategoryConfig( categoryConfig, posts.items.map( post => post.fields.category ) );

  const seo: ArchiveSeo = {
    title: page > 1 ? `Blog — Page ${page} | Audeos.com` : META_TITLE,
    description: META_DESCRIPTION,
    ogImage: META_IMAGE,
    canonical: page > 1 ? `${SITE_URL}/page/${page}` : SITE_URL,
  };

  return { props: { posts, page, filter: { kind: "all" } satisfies ArchiveFilter, seo } };
}
```

**`getTagStaticProps.ts`** — for `/tags/[tagId]` and `/tags/[tagId]/page/[page]`:

```typescript
export async function getTagStaticProps( context: GetStaticPropsContext ) {
  const tagIdParam = context.params?.tagId;
  if( typeof tagIdParam !== "string" ) {
    throw new Error( "getTagStaticProps: tagId param missing" );
  }
  const page = Number( context.params?.page ) || 1;
  const posts = await getBlogPosts();

  validateCategoryConfig( categoryConfig, posts.items.map( post => post.fields.category ) );

  const seo: ArchiveSeo = {
    title: page > 1
      ? `Posts tagged ${tagIdParam} — Page ${page} | Audeos.com`
      : `Posts tagged ${tagIdParam} | Audeos.com`,
    description: META_DESCRIPTION,
    ogImage: META_IMAGE,
    canonical: `${SITE_URL}/tags/${tagIdParam}${page > 1 ? `/page/${page}` : ""}`,
  };

  return { props: { posts, page, filter: { kind: "tag", id: tagIdParam } satisfies ArchiveFilter, seo } };
}
```

**`getCategoryStaticProps.ts`** — for `/category/[slug]` and `/category/[slug]/page/[page]`:

```typescript
export async function getCategoryStaticProps( context: GetStaticPropsContext ) {
  const slugParam = context.params?.slug;
  if( typeof slugParam !== "string" ) {
    throw new Error( "getCategoryStaticProps: slug param missing" );
  }
  const config = categoryConfig[slugParam];
  if( !config ) {
    throw new Error( `getCategoryStaticProps: no categoryConfig entry for "${slugParam}"` );
  }
  const page = Number( context.params?.page ) || 1;
  const posts = await getBlogPosts();

  validateCategoryConfig( categoryConfig, posts.items.map( post => post.fields.category ) );

  const seo: ArchiveSeo = {
    title: page > 1
      ? `${config.title} — Page ${page} | Audeos.com`
      : `${config.title} | Audeos.com`,
    description: config.description,
    ogImage: config.ogImage ?? META_IMAGE,
    canonical: `${SITE_URL}/category/${slugParam}${page > 1 ? `/page/${page}` : ""}`,
  };

  return { props: { posts, page, filter: { kind: "category", id: slugParam } satisfies ArchiveFilter, seo } };
}
```

### Route shells

| Route | File | Re-exports |
|---|---|---|
| `/page/[page]` | `pages/page/[page].tsx` | `FilteredArchive` + `getAllStaticProps` |
| `/tags/[tagId]` | `pages/tags/[tagId].tsx` | `FilteredArchive` + `getTagStaticProps` |
| `/tags/[tagId]/page/[page]` | `pages/tags/[tagId]/page/[page].tsx` | `FilteredArchive` + `getTagStaticProps` |
| **NEW** `/category/[slug]` | `pages/category/[slug].tsx` | `FilteredArchive` + `getCategoryStaticProps` |
| **NEW** `/category/[slug]/page/[page]` | `pages/category/[slug]/page/[page].tsx` | `FilteredArchive` + `getCategoryStaticProps` |

**`getStaticPaths` for new routes:**

```typescript
// pages/category/[slug].tsx
export async function getStaticPaths() {
  const paths = Object.keys( categoryConfig ).map( slug => ({ params: { slug } }) );
  return { paths, fallback: false };
}

// pages/category/[slug]/page/[page].tsx
export async function getStaticPaths() {
  const posts = await getBlogPosts();
  const paths: { params: { slug: string; page: string } }[] = [];
  for( const slug of Object.keys( categoryConfig ) ) {
    const filtered = posts.items.filter( post => post.fields.category === slug );
    const numPages = Math.ceil( filtered.length / PAGE_SIZE );
    for( let page = 2; page <= numPages; page++ ) {
      paths.push({ params: { slug, page: page.toString() } });
    }
  }
  return { paths, fallback: false };
}
```

### Modified files

- **`src/pages/index.tsx`** — replaces `TaggedPostSections` with `CategoryPostSections`. Drops `tagSeoConfig` flow (`validateTagSeoConfig` removed). Passes `categoryConfig` to `CategoryPostSections` and to `buildHomepageSchema`.
- **`src/lib/homepageSchema.ts`** — refactored to nested `CollectionPage` shape (see below). Signature changes: `buildHomepageSchema(posts, categoryConfig)`.
- **`src/components/Home/Pagination.tsx`** — gains `filter: ArchiveFilter` prop (replaces `tagId`); generates `/page/N`, `/tags/X/page/N`, or `/category/X/page/N` based on `filter.kind`. Page-1 link always points to the un-paginated route.
- **`src/constants.ts`** — adds:
  ```typescript
  export const POSTS_PER_CATEGORY_SECTION = 6;
  export const CATEGORY_IDS = [ "music", "events", "lifestyle" ] as const;
  ```
- **`src/styles/Home.module.scss`** — adds `.categoryNav`, `.category`, `.categoryActive` rules. The existing `.tagSection`, `.tagSectionHeader`, `.seeAll`, `.allPostsLink` rules stay (reused for category sections). The existing `.tagNav`, `.tag`, `.tagActive` rules are deleted (no consumer).

### Deleted files (cleanup)

- `data/tags.json`
- `src/types/tagConfig.ts`
- `src/utils/tagSeoConfig.ts`
- `src/__tests__/utils/tagSeoConfig.test.ts`
- `src/components/Home/TaggedPostSections.tsx`
- `src/__tests__/components/TaggedPostSections.test.tsx`

## Home page JSON-LD (nested)

`buildHomepageSchema(posts, categoryConfig)` produces:

```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Audeos.com",
  "description": "Official website of DJ Audeos",
  "url": "https://www.audeos.com",
  "isPartOf": { "@type": "WebSite", "name": "Audeos.com", "url": "https://www.audeos.com" },
  "hasPart": [
    {
      "@type": "CollectionPage",
      "name": "Music",
      "description": "Releases, edits, mixes, and curated playlists by DJ Audeos.",
      "url": "https://www.audeos.com/category/music",
      "hasPart": [
        { "@type": "BlogPosting", "headline": "...", "url": "...", "datePublished": "...", "image": "..." }
      ]
    },
    { "@type": "CollectionPage", "name": "Events", "url": "https://www.audeos.com/category/events", "hasPart": [...] },
    { "@type": "CollectionPage", "name": "Lifestyle", "url": "https://www.audeos.com/category/lifestyle", "hasPart": [...] }
  ]
}
```

Each inner `CollectionPage`'s `hasPart` mirrors what's actually rendered on the home (up to `POSTS_PER_CATEGORY_SECTION = 6` most recent per category). Empty categories produce `hasPart: []` (still a valid `CollectionPage` reference). No cross-section dedup needed — each post has exactly one category.

## Edge cases

| Case | Behavior |
|---|---|
| Category with 0 posts on home | Section omitted (matches existing empty-filter pattern in `TaggedPostSections`). |
| `/category/[slug]` for empty category | Page is generated by `getStaticPaths` (3 paths always emitted). Renders title + description from config and an empty `BlogPostList`; no `Pagination`. |
| Paginated category page beyond the post count | `getStaticPaths` only emits page=2+ when there's content. Direct hit on out-of-range page → Next.js 404 (`fallback: false`). |
| Post with `undefined` `category` at build | `validateCategoryConfig` throws — build fails. Wired into all three static-props helpers. |
| Post category not in `data/categories.json` | Same — `validateCategoryConfig` throws. |
| Unknown tag id at URL | `getStaticPaths` only emits known tags → 404. |
| Unknown category slug at URL | `getStaticPaths` only emits configured slugs → 404. |
| `currentCategory` is `null` on `CategoryNav` | No item highlighted. Used on `/page/[page]` and tag pages. |
| Pagination `filter.kind === "all"` and `page === 1` | Page-1 link goes to `/`, not `/page/1` (matches existing behavior). |
| Pagination `filter.kind === "category"` and `page === 1` | Page-1 link goes to `/category/${id}`, not `/category/${id}/page/1`. |
| Pagination `filter.kind === "tag"` and `page === 1` | Page-1 link goes to `/tags/${id}`, not `/tags/${id}/page/1`. |

## Testing

**`src/__tests__/components/CategoryPostSections.test.tsx`** (~6 tests, mirrors `TaggedPostSections.test.tsx`):
- Renders 3 sections in `CATEGORY_IDS` order.
- Each section caps at `POSTS_PER_CATEGORY_SECTION` (6) most recent posts.
- Section omitted when category has 0 posts.
- Section header links to `/category/[slug]` with config title.
- `firstCardPriority={true}` on the first non-empty section's `BlogPostList` only.
- Throws if a category id used by posts is missing from `categoryConfig` (defense-in-depth).

**`src/__tests__/components/CategoryNav.test.tsx`** (~5 tests):
- Renders 3 links in `CATEGORY_IDS` order using `categoryConfig[slug].title`.
- Each link's `href` is `/category/${slug}`.
- `currentCategory="music"` adds active class to Music's link only.
- `currentCategory={null}` adds no active class.
- `currentCategory="unknown"` adds no active class (defensive — no crash).

**`src/__tests__/lib/homepageSchema.test.ts`** (UPDATE — replace existing tests for the new nested shape):
- Returns top-level `@type: "CollectionPage"`.
- `hasPart` contains exactly 3 inner `CollectionPage`s, in `CATEGORY_IDS` order.
- Each inner has correct `name`, `description`, `url` derived from `categoryConfig`.
- Each inner's `hasPart` contains up to 6 `BlogPosting`s sorted newest first.
- Each inner's posts all have `category === slug` (no cross-section leakage).
- Empty-category inner has `hasPart: []`.
- Posts without an image produce `image: undefined`.

**`src/__tests__/components/Pagination.test.tsx`** (UPDATE):
- Existing tests adapted to the new `filter: ArchiveFilter` prop.
- Adds: `filter: {kind: "all"}` generates `/page/N` links; page-1 → `/`.
- Adds: `filter: {kind: "tag", id}` generates `/tags/${id}/page/N`; page-1 → `/tags/${id}`.
- Adds: `filter: {kind: "category", id}` generates `/category/${id}/page/N`; page-1 → `/category/${id}`.

**No direct unit tests for:**
- `FilteredArchive.tsx` — matches existing project convention (today's `BlogArchive` has no test).
- `getAllStaticProps`, `getTagStaticProps`, `getCategoryStaticProps` — Contentful integration; tested via `yarn build` in the verification task.

**Type safety guarantees from the discriminated union:**
- The `switch (filter.kind)` exhaustiveness in `FilteredArchive` is verified by TypeScript at compile time. Adding a fourth filter kind without updating the switch would fail typecheck.
- `Pagination`'s page-link generation must also handle every filter kind exhaustively.

## SEO impact

**Positives:**
- Three new descriptive, indexable URLs (`/category/music`, `/category/events`, `/category/lifestyle`) with editorial copy and OG images, plus their paginated cousins.
- Nested `CollectionPage` JSON-LD on the home page communicates the category taxonomy to crawlers.
- `CategoryNav` adds a stable, descriptive primary nav present on every archive page — strong internal linking with semantic anchor text.
- Tag-page generic SEO is slightly weaker than today's per-tag descriptions, but tags weren't accumulating significant traffic anyway (and the description editorial cost has moved up to categories).

**Non-regressions:**
- Home page title, description, canonical, and feed `<link rel="alternate">` headers unchanged at the top level.
- Existing `/page/[page]` and `/tags/[tagId]` URLs continue to resolve and render identical content (filter logic same; only the nav at the top changes).
- Sitemap (`next-sitemap`) auto-includes the new category routes via the postbuild step.

**Mitigations baked in:**
- LCP discipline preserved — first card of first section on home gets `firstCardPriority`; archive pages' first card on the cards grid keeps current behavior.

## Migration / deploy

- **No Contentful schema change** (the `category` field already exists from Spec A).
- **No data migration** (all posts categorized).
- **No env var changes.**
- **Static routes added:** 3 base category pages + paginated children if any category exceeds `PAGE_SIZE` (12 posts). With ~85 posts split across 3 categories, expect 3-9 new static pages total.
- **Sitemap auto-updates** via `next-sitemap` postbuild.
- **Reader-visible changes:**
  - Home page reshapes (10 tag sections → 3 category sections).
  - Archive top nav swaps (10 tag chips → 3 category links).
  - New `/category/[slug]` URLs accessible.
  - Tag chips on cards continue to drill into `/tags/[tagId]`.
  - Tag pages render with generic titles instead of editorial copy.
- **First deploy after merge:** PR ships in one go. No staged rollout needed because no irreversible state changes.

## Out of scope

- No editorial copy changes to `data/categories.json` (set in Spec A; kept as-is).
- No new Contentful content types.
- No JSON-LD additions on category landing pages or tag pages (home gets the nested shape; archive pages stay unstructured).
- No 301 redirects from old tag URLs (URL space is unchanged — tag pages still exist at the same paths).
