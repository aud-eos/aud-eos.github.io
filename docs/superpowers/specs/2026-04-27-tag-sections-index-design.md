# Tag Sections Index — Design Spec

## Problem

The home page (`/`) currently renders a single chronological list of the most recent posts (PAGE_SIZE per page) with a tag filter nav at the top. Readers can't see what categories the site covers without scanning post tags one card at a time, and tag pages get little promotion from the homepage. The home page should act as a hub: surface every tag, show what's recent in each, and route deeper drill-downs to the existing tag pages.

## Solution

Convert the home page into a sectioned overview. Each Contentful tag becomes a `<section>` containing the 3 most recent posts in that tag, with a header linking to the full tag page (`/tags/[tagId]`). The flat paginated archive remains reachable at `/page/[page]`, linked from a "Browse all posts →" footer link on the home.

The existing `Home` component (which serves four routes today) is split: the index gets its own component, and the three archive routes (`/page/[page]`, `/tags/[tagId]`, `/tags/[tagId]/page/[page]`) share a renamed `BlogArchive` component with today's flat layout intact.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Scope of layout change | Index `/` only; `/page/[page]` stays as flat archive, linked from index footer | Preserves a chronological reader path while making the index a hub |
| Which tags get a section | All 10 tags, render every section with images lazy-loaded below the fold | Every category visible at a glance; image-level laziness keeps initial paint cheap |
| Section ordering | Alphabetical (matches existing tag nav `sortTagsById`) | Predictable, no new ordering logic |
| Posts per section | Most recent 3 (sorted by `resolvePostDate`) | Honest "latest in this tag" snapshot |
| Cross-tag duplicates | Allowed | A cross-tag post legitimately belongs in both categories; dedup logic gets gnarly |
| Tags with <3 posts | Render with whatever exists (1, 2, or 3 cards) | Empty sections look broken; partial sections still useful |
| Tags with 0 posts | Section omitted entirely | Avoids empty-state UI |
| Top tag nav on home | Removed (sections themselves are the navigation) | Avoids redundancy on the index; nav stays on archive routes |
| Archive entry point | "Browse all posts →" footer link to `/page/2` | One predictable link, single destination |
| LCP / CLS | First section's first card image gets `priority`; all other Picture renders use `loading="lazy"` | 30 images vs. today's 10 demands explicit priority |
| Structured data | `CollectionPage` JSON-LD with deduped `BlogPosting` entries in `hasPart` | Helps crawlers see the page-as-hub structure |

## Architecture

### Route → component → static-props mapping

| Route | Page file | Component | Static props |
|---|---|---|---|
| `/` | `src/pages/index.tsx` | `Home` (new, sectioned) | Inline in `pages/index.tsx` |
| `/page/[page]` | `src/pages/page/[page].tsx` | `BlogArchive` | `getArchiveStaticProps` |
| `/tags/[tagId]` | `src/pages/tags/[tagId].tsx` | `BlogArchive` | `getArchiveStaticProps` |
| `/tags/[tagId]/page/[page]` | `src/pages/tags/[tagId]/page/[page].tsx` | `BlogArchive` | `getArchiveStaticProps` |

### Component layout

```
pages/index.tsx
└── Home
    ├── SeoHead (with feed <link>s + JsonLd schema)
    └── Layout
        └── main
            ├── TaggedPostSections
            │   └── For each tag with posts:
            │       └── <section id="tag-{tagId}">
            │           ├── <header>
            │           │   ├── <h2><Link to /tags/[tagId]>{tagSeoConfig.title}</Link></h2>
            │           │   └── <Link to /tags/[tagId]>See all →</Link>
            │           └── BlogPostList (3 posts, firstCardPriority on first section)
            └── <Link to /page/2>Browse all posts →</Link>

pages/page/[page].tsx, pages/tags/[tagId].tsx, pages/tags/[tagId]/page/[page].tsx
└── BlogArchive (today's Home, renamed)
    ├── SeoHead
    └── Layout
        └── main
            ├── tag nav (alphabetical Links to /tags/[tagId])
            ├── BlogPostList (paginated)
            └── Pagination
```

## Files

### New

**`src/components/Home/TaggedPostSections.tsx`**

Renders one `<section>` per tag with posts. Filters and slices internally:

```tsx
posts.items
  .filter( post => post.metadata.tags.some( postTag => postTag.sys.id === tagId ) )
  .sort( sortBlogPostsByDate )
  .slice( 0, POSTS_PER_TAG_SECTION )
```

Tags are iterated in `sortTagsById` order. Sections with zero matching posts are skipped. The component receives `posts`, `tags`, and `tagSeoConfig` as props. Passes `firstCardPriority={true}` to the first rendered section's `BlogPostList`.

**`src/components/BlogArchive/BlogArchive.tsx`**

Verbatim today's `Home` component renamed. Same props (`posts`, `tags`, `page`, `tagId`, `tagSeoConfig`), same SEO branching, same tag nav + `BlogPostList` + `Pagination` layout.

**`src/components/BlogArchive/getStaticProps.ts`**

Verbatim today's `getStaticProps` minus the `generateFeeds( posts.items )` call. Exported as `getArchiveStaticProps`. Re-exported by all three archive route shells.

**`src/lib/homepageSchema.ts`**

```ts
export function buildHomepageSchema( posts: BlogPosts ) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": META_TITLE,
    "description": META_DESCRIPTION,
    "url": SITE_URL,
    "isPartOf": { "@type": "WebSite", "name": "Audeos.com", "url": SITE_URL },
    "hasPart": dedupeBySlug( posts.items ).map( post => ({
      "@type": "BlogPosting",
      "headline": post.fields.title,
      "url": `${SITE_URL}/post/${post.fields.slug}`,
      "datePublished": resolvePostDate( post ),
      "image": post.fields.image?.fields.file?.url
        ? `https:${post.fields.image.fields.file.url}`
        : undefined,
    }))
  };
}
```

The `hasPart` array contains the union of posts shown across all sections, deduplicated by slug. (Even though the rendered DOM allows duplicates per Q4b-i, schema dedup is data hygiene — one canonical entry per post.)

**`src/components/JsonLd.tsx`**

Encapsulates the unsafe-by-default React injection API behind an escaped helper. Centralises the `<` → `\u003c` substitution so a malicious title like `</script><script>` cannot break out of the JSON-LD script tag. Single allowed call site for raw JSON-LD injection — every other surface that needs structured data uses this component.

```tsx
export interface JsonLdProps { schema: object }

export function JsonLd({ schema }: JsonLdProps ) {
  const json = JSON.stringify( schema ).replace( /</g, "\\u003c" );
  return <script type="application/ld+json">{ json }</script>;
}
```

(React renders text children with HTML-escaping, so the `<script>` body is safe; the `<` escape inside the JSON string defends against `</script>` sequences inside post titles.)

### Replaced

**`src/pages/index.tsx`** — replaced with the new sectioned `Home`:

```tsx
export default function Home({ posts, tags, tagSeoConfig, schema }: HomeProps ) {
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
          <TaggedPostSections
            posts={ posts }
            tags={ tags }
            tagSeoConfig={ tagSeoConfig }
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
  const tags = await getTags();
  const tagSeoConfig: TagSeoConfigMap = tagSeoConfigData satisfies TagSeoConfigMap;
  validateTagSeoConfig( tagSeoConfig, tags.items.map( tag => tag.sys.id ) );
  generateFeeds( posts.items );
  const schema = buildHomepageSchema( posts );
  return { props: { posts, tags, tagSeoConfig, schema } };
}
```

No `tagId`, no `page`, no SEO branching. The `generateFeeds` gate is dropped — this code path only fires from `/`.

### Modified

**`src/pages/page/[page].tsx`**, **`src/pages/tags/[tagId].tsx`**, **`src/pages/tags/[tagId]/page/[page].tsx`** — each updates its imports to point at `BlogArchive` and `getArchiveStaticProps` instead of `Home` and `getStaticProps` from `@/pages`. `getStaticPaths` definitions stay intact.

**`src/components/Picture.tsx`** — gains a `priority?: boolean` prop:

- `priority=true` → `<img>` gets `loading="eager"` and `fetchpriority="high"`.
- `priority=false` (default) → `<img>` gets `loading="lazy"`.

**`src/components/Home/BlogPostList.tsx`** — gains a `firstCardPriority?: boolean` prop (default `false`). When `true`, the first rendered card's `Picture` receives `priority={true}`. All other cards' `Picture` calls receive no `priority` prop (defaulting to lazy).

**`src/styles/Home.module.scss`** — adds `.tagSection`, `.tagSectionHeader`, `.seeAll`, `.allPostsLink`. Existing `.tagNav`/`.tagActive`/`.tag`/`.imageGallery` classes stay (still used by `BlogArchive`).

**`src/constants.ts`** — adds `export const POSTS_PER_TAG_SECTION = 3;`.

### Audited

Every other call site of `Picture` outside the home (post detail page hero, author profile avatar, embedded image components, etc.) needs an explicit `priority={true}` for that page's LCP image. The implementation plan will enumerate each call site with the chosen value. Without this audit, those pages regress from eager (today's default) to lazy, hurting LCP on every page that isn't the home.

## Data flow

1. **Build time** — `pages/index.tsx`'s `getStaticProps` runs:
   - Fetches all posts and tags from Contentful.
   - Validates tag config (existing `validateTagSeoConfig`, throws on mismatch).
   - Generates RSS/Atom/JSON feeds via `generateFeeds( posts.items )`.
   - Builds `CollectionPage` JSON-LD via `buildHomepageSchema( posts )`.
   - Returns `{ posts, tags, tagSeoConfig, schema }`.
2. **Render** — `Home` passes `posts`/`tags`/`tagSeoConfig` to `TaggedPostSections` and embeds `schema` via the `<JsonLd>` component. The "Browse all posts →" link points to `/page/2`.
3. **`TaggedPostSections`** — for each tag (in `sortTagsById` order), filters and sorts posts in-component (a one-liner). Renders one `<section>` per non-empty tag, delegating the card grid to `BlogPostList`.
4. **`BlogPostList`** — receives 3 pre-filtered posts, sorts and slices internally (no-op for already-sorted, length-3 input). The IntersectionObserver fade-in and long-press preview hooks both still work per-instance.

Archive routes (`/page/[page]`, `/tags/*`) flow unchanged — they share `getArchiveStaticProps` and render `BlogArchive`.

## Edge cases

| Case | Behavior |
|---|---|
| Tag has 0 posts | Section omitted. |
| Tag has 1 or 2 posts | Section renders with 1 or 2 cards; no padding. |
| Tag in Contentful but missing from `data/tags.json` | `validateTagSeoConfig` throws at build (existing fail-fast). |
| Tag in `data/tags.json` but missing from Contentful | `validateTagSeoConfig` throws at build. |
| Post tagged with multiple tags | Appears in each tag's section. |
| Post has no tags | Doesn't appear on home. Still reachable via `/page/[page]`. |
| Post has no image | Existing `BlogPostList` already handles `pictureUrl = post.fields.image?.fields.file?.url \|\| ""`. |
| `/page/1` accessed directly | `getStaticPaths` already skips `page=1` — unchanged. |
| Post title contains `</script>` | `JsonLd` escapes `<` to `\u003c`, preventing script-tag breakout. |

## Testing

Vitest unit tests:

- **`TaggedPostSections.test.tsx`**
  - Renders one section per tag with at least one post.
  - Sections with zero matching posts are omitted.
  - Each section caps at `POSTS_PER_TAG_SECTION` (3).
  - A post tagged with two tags appears in both sections.
  - Section header links to `/tags/[tagId]`.
  - Only the first section receives `firstCardPriority={true}`.
- **`homepageSchema.test.ts`**
  - Returns `@type: "CollectionPage"` with `name`, `description`, `url`, `isPartOf`.
  - `hasPart` deduplicates posts even when they span multiple tags.
  - Each `BlogPosting` has `headline`, `url`, `datePublished`, and (when image exists) `image`.
- **`Picture.test.tsx`**
  - `priority={true}` → `<img>` has `loading="eager"` and `fetchpriority="high"`.
  - `priority={false}` (default) → `<img>` has `loading="lazy"`.
- **`JsonLd.test.tsx`**
  - Renders a `<script type="application/ld+json">` element.
  - Escapes `<` characters in stringified JSON to `\u003c` (verified by feeding a schema whose string contains `</script>`).

Existing `Home`/`BlogPostList` tests get re-pointed at `BlogArchive` (renamed component, identical behavior).

## SEO impact

**Positives**

- More descriptive anchor text for tag links (full titles vs. short IDs).
- More internal links from homepage (up to 30 posts vs. 10) plus 10 prominent tag-page links.
- Cleaner heading hierarchy: each section gets `<h2>` (tag) wrapping post `<h3>`s.
- `CollectionPage` JSON-LD declares the page-as-hub structure.

**Non-regressions**

- Title, description, canonical URL, and feed `<link rel="alternate">` headers unchanged for `/`.
- Feeds (`generateFeeds`) build from full post list, unaffected by layout.
- Sitemap (`next-sitemap`) enumerates routes — unaffected.
- No new fragment URLs exposed (no anchor nav).
- Cross-section duplicate posts: each post's canonical is `/post/[slug]`; homepage references aren't duplicate content.
- `rel=next`/`rel=prev` not in use today — nothing to break.

**Mitigations baked in**

- LCP: `Picture.priority` + `BlogPostList.firstCardPriority` ensure exactly one above-the-fold image is eager + high-priority; rest are lazy.
- CLS: verification step in implementation — confirm `Picture` reserves space at all breakpoints.
- XSS: JSON-LD injection routes through `<JsonLd>`, which escapes `<` to neutralise `</script>` sequences in Contentful-sourced strings.

## Migration / deploy

- Static export → URLs unchanged → no redirects, no sitemap churn.
- First deploy after merge: visitors to `/` see the new layout; archive routes look identical.
- No Contentful schema changes, no env var changes, no build script changes.
