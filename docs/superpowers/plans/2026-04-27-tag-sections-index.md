# Tag Sections Index — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the home page (`/`) into a sectioned overview where each Contentful tag gets a section showing its 3 most recent posts. The flat paginated archive remains at `/page/[page]`, linked from a footer link on the home.

**Architecture:** The existing `Home` component (which serves four routes via re-export) is split. `pages/index.tsx` becomes a new sectioned `Home` with its own `getStaticProps` and a `TaggedPostSections` component. The three archive routes (`/page/[page]`, `/tags/[tagId]`, `/tags/[tagId]/page/[page]`) re-export a renamed `BlogArchive` component preserving today's flat-list behavior. A `<JsonLd>` component renders `CollectionPage` structured data, and a `priority` flag is threaded through `Picture` to control LCP behavior in a 30-image layout.

**Tech Stack:** Next.js (`output: "export"`), TypeScript, SCSS modules, Vitest, Contentful CMS.

**Spec:** `docs/superpowers/specs/2026-04-27-tag-sections-index-design.md`

---

### Task 1: Add `POSTS_PER_TAG_SECTION` constant

**Files:**
- Modify: `src/constants.ts`

- [ ] **Step 1: Add the constant**

Append to `src/constants.ts`:

```typescript
export const POSTS_PER_TAG_SECTION = 3;
```

- [ ] **Step 2: Run typecheck**

Run: `yarn typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/constants.ts
git commit -m "feat: add POSTS_PER_TAG_SECTION constant"
```

---

### Task 2: Add `priority` prop to `Picture`

**Files:**
- Modify: `src/components/Picture.tsx`
- Create: `src/__tests__/components/Picture.test.tsx`

The `Picture` component currently emits `<img>` with no `loading` attribute, which the browser treats as eager. The new sectioned home will render up to 30 cards — most of them off-screen — so we want lazy loading by default with an opt-in priority flag for the LCP image.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/Picture.test.tsx`:

```typescript
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import Picture from "@/components/Picture";

describe( "Picture", () => {
  it( "lazy-loads the image by default", () => {
    const { container } = render(
      <Picture url="//img.test/photo.jpg" alt="alt" />,
    );
    const img = container.querySelector( "img" );
    expect( img?.getAttribute( "loading" ) ).toBe( "lazy" );
    expect( img?.getAttribute( "fetchpriority" ) ).toBeNull();
  });

  it( "marks the image as priority when priority is true", () => {
    const { container } = render(
      <Picture url="//img.test/photo.jpg" alt="alt" priority />,
    );
    const img = container.querySelector( "img" );
    expect( img?.getAttribute( "loading" ) ).toBe( "eager" );
    expect( img?.getAttribute( "fetchpriority" ) ).toBe( "high" );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/__tests__/components/Picture.test.tsx`
Expected: FAIL — both assertions fail because `loading` and `fetchpriority` are not set.

- [ ] **Step 3: Implement the priority prop**

Modify `src/components/Picture.tsx`:

```typescript
import { CONTENT_IMAGE_WIDTH } from "@/constants";

export interface PictureProps {
  url: string;
  alt: string;
  maxWidth?: number;
  breakpoints?: number[],
  priority?: boolean;
}

export default function Picture({
  url,
  maxWidth = CONTENT_IMAGE_WIDTH,
  alt,
  breakpoints = [ 749, 600, 350 ],
  priority = false,
}: PictureProps ) {
  return (
    <picture>
      {
        breakpoints
          .filter( breakpoint => breakpoint < maxWidth )
          .map( breakpoint =>
            <source
              key={ breakpoint }
              media={ `(max-width: ${ breakpoint }px)` }
              srcSet={ getImgSrc( url, { width: breakpoint, format: "webp" }) }
              type={ "image/webp" }
            />,
          )
      }
      <source
        srcSet={ getImgSrc( url, { width: maxWidth, format: "webp" }) }
        type="image/webp"
      />
      <img
        src={ getImgSrc( url, { width: maxWidth }) }
        alt={ alt }
        loading={ priority ? "eager" : "lazy" }
        { ...( priority ? { fetchPriority: "high" } : {}) }
      />
    </picture>
  );
}
```

(Leave the `ImageSourceOptions` type and `getImgSrc` function below it untouched.)

Note: React 19 / Next.js 15 supports `fetchPriority` (camelCase) as a JSX prop that emits `fetchpriority` (lowercase) on the DOM. If the project's React version is older, use a spread approach with the lowercase `fetchpriority` to satisfy TypeScript.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn test src/__tests__/components/Picture.test.tsx`
Expected: PASS — both tests green.

- [ ] **Step 5: Run the full test suite for regressions**

Run: `yarn test`
Expected: PASS — `BlogPostList.test.tsx` mocks `Picture`, so changes to the real component don't affect it.

- [ ] **Step 6: Run lint + typecheck**

Run: `yarn lint`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/Picture.tsx src/__tests__/components/Picture.test.tsx
git commit -m "feat: add priority prop to Picture for LCP control"
```

---

### Task 3: Add `firstCardPriority` prop to `BlogPostList`

**Files:**
- Modify: `src/components/Home/BlogPostList.tsx`
- Modify: `src/__tests__/components/BlogPostList.test.tsx`

`BlogPostList` is reused by both the new sectioned home and the existing archive routes. We want a flag that marks the first rendered card as priority — but only when the consumer opts in. Default behavior stays lazy across the board (matching today's effective behavior after Task 2 lands).

- [ ] **Step 1: Add the failing test**

Append to `src/__tests__/components/BlogPostList.test.tsx` inside the `describe( "BlogPostList", ... )` block. Adjust the `Picture` mock at the top of the file to forward the `priority` prop so the test can observe it:

Replace the existing mock:

```typescript
vi.mock( "@/components/Picture", () => ({
  default: ({ alt }: { alt: string }) => <img alt={ alt } />,
}) );
```

with:

```typescript
vi.mock( "@/components/Picture", () => ({
  default: ({ alt, priority }: { alt: string; priority?: boolean }) => (
    <img alt={ alt } data-priority={ priority ? "true" : "false" } />
  ),
}) );
```

Then add the new test:

```typescript
it( "passes priority to the first card image only when firstCardPriority is true", () => {
  const { container } = render(
    <BlogPostList
      posts={ makePosts( 3 ) as never[] }
      page={ 1 }
      firstCardPriority
    />,
  );
  const images = container.querySelectorAll( "img" );
  expect( images[0].getAttribute( "data-priority" ) ).toBe( "true" );
  expect( images[1].getAttribute( "data-priority" ) ).toBe( "false" );
  expect( images[2].getAttribute( "data-priority" ) ).toBe( "false" );
});

it( "does not mark any image priority when firstCardPriority is false (default)", () => {
  const { container } = render(
    <BlogPostList posts={ makePosts( 3 ) as never[] } page={ 1 } />,
  );
  const images = container.querySelectorAll( "img" );
  images.forEach( image => {
    expect( image.getAttribute( "data-priority" ) ).toBe( "false" );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/__tests__/components/BlogPostList.test.tsx`
Expected: FAIL — `firstCardPriority` is not yet a prop.

- [ ] **Step 3: Implement the prop**

Modify `src/components/Home/BlogPostList.tsx`:

Update the `BlogPostListProps` interface:

```typescript
export interface BlogPostListProps {
  posts: BlogPost[]
  page: number
  tagId?: string
  firstCardPriority?: boolean
}
```

Update the function signature:

```typescript
export default function BlogPostList({ posts, page, tagId, firstCardPriority = false }: BlogPostListProps ) {
```

The map callback already produces cards in render order. Track the index (already provided by the existing structure — re-derive via `.map` with two args) and pass `priority` to `Picture` only on the first card. Replace the `.map( post => {` line with:

```typescript
.map( ( post, cardIndex ) => {
```

And replace the `<Picture` JSX block with:

```typescript
<Picture
  url={ pictureUrl }
  maxWidth={ IMAGE_WIDTH }
  alt={ altText }
  priority={ firstCardPriority && cardIndex === 0 }
/>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn test src/__tests__/components/BlogPostList.test.tsx`
Expected: PASS — all existing tests plus the two new ones green.

- [ ] **Step 5: Run lint + typecheck**

Run: `yarn lint`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/Home/BlogPostList.tsx src/__tests__/components/BlogPostList.test.tsx
git commit -m "feat: add firstCardPriority prop to BlogPostList"
```

---

### Task 4: Create `JsonLd` component

**Files:**
- Create: `src/components/JsonLd.tsx`
- Create: `src/__tests__/components/JsonLd.test.tsx`

Encapsulates JSON-LD script injection with a `<` → `\u003c` escape so a malicious post title containing `</script>` cannot break out of the script tag. This is the **only** allowed call site for raw JSON-LD injection in the codebase.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/JsonLd.test.tsx`:

```typescript
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { JsonLd } from "@/components/JsonLd";

describe( "JsonLd", () => {
  it( "renders a script tag with type application/ld+json", () => {
    const { container } = render( <JsonLd schema={ { "@type": "WebSite" } } /> );
    const script = container.querySelector( "script" );
    expect( script?.getAttribute( "type" ) ).toBe( "application/ld+json" );
  });

  it( "stringifies the schema as the script body", () => {
    const { container } = render(
      <JsonLd schema={ { "@type": "WebSite", "name": "Audeos" } } />,
    );
    const script = container.querySelector( "script" );
    expect( script?.textContent ).toContain( "\"@type\":\"WebSite\"" );
    expect( script?.textContent ).toContain( "\"name\":\"Audeos\"" );
  });

  it( "escapes < to \\u003c so </script> in strings cannot break out", () => {
    const malicious = { "@type": "WebSite", "headline": "Hi </script><script>alert(1)</script>" };
    const { container } = render( <JsonLd schema={ malicious } /> );
    const script = container.querySelector( "script" );
    expect( script?.textContent ).not.toContain( "</script>" );
    expect( script?.textContent ).toContain( "\\u003c/script\\u003e" );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/__tests__/components/JsonLd.test.tsx`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement the component**

Create `src/components/JsonLd.tsx`:

```typescript
export interface JsonLdProps {
  schema: object;
}

export function JsonLd({ schema }: JsonLdProps ) {
  const json = JSON.stringify( schema ).replace( /</g, "\\u003c" );
  return <script type="application/ld+json">{ json }</script>;
}
```

React renders text children with HTML-escaping, so the `<script>` body itself is safe; the `<` substitution defends against `</script>` sequences inside Contentful-sourced strings.

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn test src/__tests__/components/JsonLd.test.tsx`
Expected: PASS — all three tests green.

- [ ] **Step 5: Run lint + typecheck**

Run: `yarn lint`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/JsonLd.tsx src/__tests__/components/JsonLd.test.tsx
git commit -m "feat: add JsonLd component with script-breakout escape"
```

---

### Task 5: Create `homepageSchema` builder

**Files:**
- Create: `src/lib/homepageSchema.ts`
- Create: `src/__tests__/lib/homepageSchema.test.ts`

Builds a `CollectionPage` JSON-LD object referencing every post shown on the home page (deduped by slug). Called from `pages/index.tsx`'s `getStaticProps`.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/lib/homepageSchema.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { buildHomepageSchema } from "@/lib/homepageSchema";

const makePost = ({
  id,
  slug,
  title,
  date,
  imageUrl,
}: {
  id: string;
  slug: string;
  title: string;
  date: string;
  imageUrl?: string;
}) => ({
  sys: { id, createdAt: date },
  fields: {
    slug,
    title,
    date,
    image: imageUrl
      ? { fields: { file: { url: imageUrl }, description: "" } }
      : undefined,
  },
  metadata: { tags: [] },
});

describe( "buildHomepageSchema", () => {
  it( "returns a CollectionPage with site-level metadata", () => {
    const schema = buildHomepageSchema({
      items: [ makePost({ id: "1", slug: "post-1", title: "Post 1", date: "2026-04-01" }) ],
    } as never );
    expect( schema[ "@context" ] ).toBe( "https://schema.org" );
    expect( schema[ "@type" ] ).toBe( "CollectionPage" );
    expect( schema.name ).toBeDefined();
    expect( schema.description ).toBeDefined();
    expect( schema.url ).toBeDefined();
    expect( schema.isPartOf ).toEqual({
      "@type": "WebSite",
      "name": "Audeos.com",
      "url": "https://www.audeos.com",
    });
  });

  it( "includes one BlogPosting per post in hasPart", () => {
    const schema = buildHomepageSchema({
      items: [
        makePost({ id: "1", slug: "post-1", title: "Post 1", date: "2026-04-01", imageUrl: "//img/1.jpg" }),
        makePost({ id: "2", slug: "post-2", title: "Post 2", date: "2026-04-02" }),
      ],
    } as never );
    expect( schema.hasPart ).toHaveLength( 2 );
    expect( schema.hasPart[0] ).toMatchObject({
      "@type": "BlogPosting",
      "headline": "Post 1",
      "url": "https://www.audeos.com/post/post-1",
      "datePublished": "2026-04-01",
      "image": "https://img/1.jpg",
    });
    expect( schema.hasPart[1] ).toMatchObject({
      "@type": "BlogPosting",
      "headline": "Post 2",
      "url": "https://www.audeos.com/post/post-2",
      "datePublished": "2026-04-02",
    });
    expect( schema.hasPart[1].image ).toBeUndefined();
  });

  it( "deduplicates posts by slug", () => {
    const post = makePost({ id: "1", slug: "post-1", title: "Post 1", date: "2026-04-01" });
    const schema = buildHomepageSchema({
      items: [ post, post, post ],
    } as never );
    expect( schema.hasPart ).toHaveLength( 1 );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/__tests__/lib/homepageSchema.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement the builder**

Create `src/lib/homepageSchema.ts`:

```typescript
import { BlogPost, BlogPosts } from "@/utils/contentfulUtils";
import { resolvePostDate } from "@/utils/blogPostUtils";
import { META_DESCRIPTION, META_TITLE, SITE_URL } from "@/constants";

function dedupeBySlug( posts: BlogPost[] ): BlogPost[] {
  const seen = new Set<string>();
  const unique: BlogPost[] = [];
  posts.forEach( post => {
    const slug = post.fields.slug;
    if( !seen.has( slug ) ) {
      seen.add( slug );
      unique.push( post );
    }
  });
  return unique;
}

export function buildHomepageSchema( posts: BlogPosts ) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": META_TITLE,
    "description": META_DESCRIPTION,
    "url": SITE_URL,
    "isPartOf": {
      "@type": "WebSite",
      "name": "Audeos.com",
      "url": SITE_URL,
    },
    "hasPart": dedupeBySlug( posts.items ).map( post => {
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
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn test src/__tests__/lib/homepageSchema.test.ts`
Expected: PASS — all three tests green.

- [ ] **Step 5: Run lint + typecheck**

Run: `yarn lint`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/homepageSchema.ts src/__tests__/lib/homepageSchema.test.ts
git commit -m "feat: add homepageSchema builder for CollectionPage JSON-LD"
```

---

### Task 6: Extract `BlogArchive` component

**Files:**
- Create: `src/components/BlogArchive/BlogArchive.tsx`
- Create: `src/components/BlogArchive/getStaticProps.ts`

Move today's `Home` component out of `pages/index.tsx` and into a reusable `BlogArchive` component. The three archive routes will re-export it. `pages/index.tsx` is left untouched in this task — Task 9 replaces it.

- [ ] **Step 1: Create `BlogArchive.tsx`**

Create `src/components/BlogArchive/BlogArchive.tsx` with the contents of today's `Home` component (the JSX render in `src/pages/index.tsx`), renamed:

```typescript
import Link from "next/link";
import styles from "@/styles/Home.module.scss";
import { BlogPosts } from "@/utils/contentfulUtils";
import BlogPostList from "@/components/Home/BlogPostList";
import { Layout } from "@/components/Layout/Layout";
import { TagCollection } from "contentful";
import { sortTagsById } from "@/utils/blogPostUtils";
import Pagination from "@/components/Home/Pagination";
import { META_DESCRIPTION, META_IMAGE, META_TITLE, SITE_URL } from "@/constants";
import { SeoHead } from "@/components/SeoHead";
import { TagSeoConfig } from "@/types/tagConfig";

export interface BlogArchiveProps {
  posts: BlogPosts
  tags: TagCollection
  page: number
  tagId?: string
  tagSeoConfig?: TagSeoConfig
}

export default function BlogArchive({ posts, page, tags, tagId, tagSeoConfig }: BlogArchiveProps ) {
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

  const canonicalUrl = isTagPage && isPaginated
    ? `${SITE_URL}/tags/${tagId}/page/${page}`
    : isTagPage
      ? `${SITE_URL}/tags/${tagId}`
      : isPaginated
        ? `${SITE_URL}/page/${page}`
        : SITE_URL;

  return (
    <>
      <SeoHead
        title={ pageTitle }
        canonicalUrl={ canonicalUrl }
        description={ pageDescription }
        ogImage={ ogImage }
      >
        <link rel="alternate" type="application/rss+xml" href="/rss.xml" />
        <link rel="alternate" type="application/atom+xml" href="/atom.xml" />
        <link rel="alternate" type="application/feed+json" href="/feed.json" />
      </SeoHead>
      <Layout isFullwidth>
        <main className={ styles.main }>
          <nav className={ styles.tagNav }>
            {
              tags.items
                .sort( sortTagsById )
                .map( tag => {
                  const isActive = tag.sys.id === tagId;
                  const href = isActive ? "/" : `/tags/${tag.sys.id}`;
                  return (
                    <Link
                      key={ tag.sys.id }
                      href={ href }
                      className={ isActive ? styles.tagActive : styles.tag }
                    >
                      { tag.sys.id }
                    </Link>
                  );
                })
            }
          </nav>
          <BlogPostList
            posts={ filteredBlogPosts }
            tagId={ tagId }
            page={ page }
          />
          <Pagination
            posts={ filteredBlogPosts }
            page={ page }
            tagId={ tagId }
          />
        </main>
      </Layout>
    </>
  );
}
```

- [ ] **Step 2: Create `getStaticProps.ts`**

Create `src/components/BlogArchive/getStaticProps.ts` with today's `getStaticProps` minus the `generateFeeds` call (which never fires from archive routes):

```typescript
import { GetStaticPropsContext } from "next";
import { getBlogPosts, getTags } from "@/utils/contentfulUtils";
import { TagSeoConfigMap } from "@/types/tagConfig";
import tagSeoConfigData from "../../../data/tags.json";
import { validateTagSeoConfig } from "@/utils/tagSeoConfig";

export async function getArchiveStaticProps( context: GetStaticPropsContext ) {
  const tagId = context.params?.tagId || null;
  const page: number = Number( context.params?.page ) || 1;
  const tags = await getTags();
  const posts = await getBlogPosts();

  const tagConfig: TagSeoConfigMap = tagSeoConfigData satisfies TagSeoConfigMap;
  const contentfulTagIds = tags.items.map( tag => tag.sys.id );
  validateTagSeoConfig( tagConfig, contentfulTagIds );

  const resolvedTagId = Array.isArray( tagId ) ? tagId[0] : tagId;
  const tagSeoConfig = resolvedTagId ? tagConfig[resolvedTagId] : null;

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

- [ ] **Step 3: Run typecheck**

Run: `yarn typecheck`
Expected: PASS — both new files compile, no callers yet.

- [ ] **Step 4: Run lint**

Run: `yarn lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/BlogArchive/BlogArchive.tsx src/components/BlogArchive/getStaticProps.ts
git commit -m "feat: extract BlogArchive component from Home"
```

---

### Task 7: Repoint archive route shells at `BlogArchive`

**Files:**
- Modify: `src/pages/page/[page].tsx`
- Modify: `src/pages/tags/[tagId].tsx`
- Modify: `src/pages/tags/[tagId]/page/[page].tsx`

The three archive routes currently re-export `Home` and `getStaticProps` from `@/pages`. After this task, they re-export `BlogArchive` and `getArchiveStaticProps` from the new location. `pages/index.tsx` is still untouched — that's Task 9.

- [ ] **Step 1: Update `pages/page/[page].tsx`**

Replace the file with:

```typescript
import { getBlogPosts } from "@/utils/contentfulUtils";
import BlogArchive from "@/components/BlogArchive/BlogArchive";
import { getArchiveStaticProps } from "@/components/BlogArchive/getStaticProps";
import { PAGE_SIZE } from "@/constants";


export const getStaticProps = getArchiveStaticProps;

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

export default BlogArchive;
```

- [ ] **Step 2: Update `pages/tags/[tagId].tsx`**

Replace the file with:

```typescript
import { getTags } from "@/utils/contentfulUtils";
import BlogArchive from "@/components/BlogArchive/BlogArchive";
import { getArchiveStaticProps } from "@/components/BlogArchive/getStaticProps";


export const getStaticProps = getArchiveStaticProps;


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

export default BlogArchive;
```

- [ ] **Step 3: Update `pages/tags/[tagId]/page/[page].tsx`**

Replace the file with:

```typescript
import { getBlogPosts, getTags } from "@/utils/contentfulUtils";
import BlogArchive from "@/components/BlogArchive/BlogArchive";
import { getArchiveStaticProps } from "@/components/BlogArchive/getStaticProps";
import { PAGE_SIZE } from "@/constants";


export const getStaticProps = getArchiveStaticProps;


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

export default BlogArchive;
```

- [ ] **Step 4: Run typecheck**

Run: `yarn typecheck`
Expected: PASS — `pages/index.tsx` still exports today's `Home` + `getStaticProps`, which the three shells no longer reference.

- [ ] **Step 5: Run lint**

Run: `yarn lint`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/pages/page/[page].tsx src/pages/tags/[tagId].tsx src/pages/tags/[tagId]/page/[page].tsx
git commit -m "refactor: route archive pages through BlogArchive"
```

---

### Task 8: Create `TaggedPostSections` component

**Files:**
- Create: `src/components/Home/TaggedPostSections.tsx`
- Create: `src/__tests__/components/TaggedPostSections.test.tsx`

Renders one `<section>` per tag with at least one post, in `sortTagsById` order. Each section has a header (linked to `/tags/[tagId]`) and a `BlogPostList` rendering up to `POSTS_PER_TAG_SECTION` (3) most recent posts. Only the first rendered section receives `firstCardPriority`.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/TaggedPostSections.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

vi.mock( "@/constants", async importOriginal => ({
  ...( await importOriginal<typeof import( "@/constants" )>() ),
  POSTS_PER_TAG_SECTION: 3,
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
    tagId,
  }: {
    posts: { fields: { slug: string } }[];
    firstCardPriority?: boolean;
    tagId?: string;
  }) => (
    <ul
      data-testid={ `bpl-${tagId}` }
      data-priority={ firstCardPriority ? "true" : "false" }
      data-count={ posts.length }
    >
      { posts.map( post => <li key={ post.fields.slug }>{ post.fields.slug }</li> ) }
    </ul>
  ),
}) );

import TaggedPostSections from "@/components/Home/TaggedPostSections";

const tagAlpha = { sys: { id: "alpha" } };
const tagBeta = { sys: { id: "beta" } };
const tagEmpty = { sys: { id: "empty" } };

const tagSeoConfig = {
  alpha: { title: "Alpha Title", description: "", ogImage: null },
  beta: { title: "Beta Title", description: "", ogImage: null },
  empty: { title: "Empty Title", description: "", ogImage: null },
};

const makePost = ({
  slug,
  date,
  tagIds,
}: {
  slug: string;
  date: string;
  tagIds: string[];
}) => ({
  sys: { id: slug, createdAt: date },
  fields: { slug, title: slug, date, image: undefined },
  metadata: { tags: tagIds.map( id => ({ sys: { id, type: "Link", linkType: "Tag" } }) ) },
});

beforeEach( () => {
  vi.stubGlobal( "matchMedia", ( query: string ) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) );
});

describe( "TaggedPostSections", () => {
  it( "renders one section per tag that has at least one post", () => {
    const posts = {
      items: [
        makePost({ slug: "a1", date: "2026-04-01", tagIds: [ "alpha" ] }),
        makePost({ slug: "b1", date: "2026-04-02", tagIds: [ "beta" ] }),
      ],
    };
    const { container } = render(
      <TaggedPostSections
        posts={ posts as never }
        tags={ { items: [ tagAlpha, tagBeta, tagEmpty ] } as never }
        tagSeoConfig={ tagSeoConfig as never }
      />,
    );
    const sections = container.querySelectorAll( "section" );
    expect( sections ).toHaveLength( 2 );
    expect( sections[0].id ).toBe( "tag-alpha" );
    expect( sections[1].id ).toBe( "tag-beta" );
  });

  it( "iterates tags alphabetically by id", () => {
    const posts = {
      items: [
        makePost({ slug: "b1", date: "2026-04-01", tagIds: [ "beta" ] }),
        makePost({ slug: "a1", date: "2026-04-01", tagIds: [ "alpha" ] }),
      ],
    };
    const { container } = render(
      <TaggedPostSections
        posts={ posts as never }
        tags={ { items: [ tagBeta, tagAlpha ] } as never }
        tagSeoConfig={ tagSeoConfig as never }
      />,
    );
    const sections = container.querySelectorAll( "section" );
    expect( sections[0].id ).toBe( "tag-alpha" );
    expect( sections[1].id ).toBe( "tag-beta" );
  });

  it( "caps each section at POSTS_PER_TAG_SECTION (3) most recent posts", () => {
    const posts = {
      items: [
        makePost({ slug: "a1", date: "2026-04-01", tagIds: [ "alpha" ] }),
        makePost({ slug: "a2", date: "2026-04-02", tagIds: [ "alpha" ] }),
        makePost({ slug: "a3", date: "2026-04-03", tagIds: [ "alpha" ] }),
        makePost({ slug: "a4", date: "2026-04-04", tagIds: [ "alpha" ] }),
        makePost({ slug: "a5", date: "2026-04-05", tagIds: [ "alpha" ] }),
      ],
    };
    const { getByTestId } = render(
      <TaggedPostSections
        posts={ posts as never }
        tags={ { items: [ tagAlpha ] } as never }
        tagSeoConfig={ tagSeoConfig as never }
      />,
    );
    const list = getByTestId( "bpl-alpha" );
    expect( list.getAttribute( "data-count" ) ).toBe( "3" );
    const slugs = Array.from( list.querySelectorAll( "li" ) ).map( item => item.textContent );
    expect( slugs ).toEqual([ "a5", "a4", "a3" ]);
  });

  it( "shows a post tagged with two tags in both sections", () => {
    const posts = {
      items: [ makePost({ slug: "shared", date: "2026-04-01", tagIds: [ "alpha", "beta" ] }) ],
    };
    const { getByTestId } = render(
      <TaggedPostSections
        posts={ posts as never }
        tags={ { items: [ tagAlpha, tagBeta ] } as never }
        tagSeoConfig={ tagSeoConfig as never }
      />,
    );
    expect( getByTestId( "bpl-alpha" ).getAttribute( "data-count" ) ).toBe( "1" );
    expect( getByTestId( "bpl-beta" ).getAttribute( "data-count" ) ).toBe( "1" );
  });

  it( "links the section header to /tags/[tagId] using tagSeoConfig.title", () => {
    const posts = {
      items: [ makePost({ slug: "a1", date: "2026-04-01", tagIds: [ "alpha" ] }) ],
    };
    const { container } = render(
      <TaggedPostSections
        posts={ posts as never }
        tags={ { items: [ tagAlpha ] } as never }
        tagSeoConfig={ tagSeoConfig as never }
      />,
    );
    const heading = container.querySelector( "h2 a" );
    expect( heading?.getAttribute( "href" ) ).toBe( "/tags/alpha" );
    expect( heading?.textContent ).toBe( "Alpha Title" );
  });

  it( "passes firstCardPriority only to the first rendered section", () => {
    const posts = {
      items: [
        makePost({ slug: "a1", date: "2026-04-01", tagIds: [ "alpha" ] }),
        makePost({ slug: "b1", date: "2026-04-01", tagIds: [ "beta" ] }),
      ],
    };
    const { getByTestId } = render(
      <TaggedPostSections
        posts={ posts as never }
        tags={ { items: [ tagAlpha, tagBeta ] } as never }
        tagSeoConfig={ tagSeoConfig as never }
      />,
    );
    expect( getByTestId( "bpl-alpha" ).getAttribute( "data-priority" ) ).toBe( "true" );
    expect( getByTestId( "bpl-beta" ).getAttribute( "data-priority" ) ).toBe( "false" );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/__tests__/components/TaggedPostSections.test.tsx`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement the component**

Create `src/components/Home/TaggedPostSections.tsx`:

```typescript
import Link from "next/link";
import { TagCollection } from "contentful";
import { BlogPosts } from "@/utils/contentfulUtils";
import BlogPostList from "@/components/Home/BlogPostList";
import { POSTS_PER_TAG_SECTION } from "@/constants";
import { sortBlogPostsByDate, sortTagsById } from "@/utils/blogPostUtils";
import { TagSeoConfigMap } from "@/types/tagConfig";
import styles from "@/styles/Home.module.scss";

export interface TaggedPostSectionsProps {
  posts: BlogPosts;
  tags: TagCollection;
  tagSeoConfig: TagSeoConfigMap;
}

export default function TaggedPostSections({ posts, tags, tagSeoConfig }: TaggedPostSectionsProps ) {
  const sections = [ ...tags.items ]
    .sort( sortTagsById )
    .map( tag => {
      const tagId = tag.sys.id;
      const tagPosts = posts.items
        .filter( post => post.metadata.tags.some( postTag => postTag.sys.id === tagId ) )
        .sort( sortBlogPostsByDate )
        .slice( 0, POSTS_PER_TAG_SECTION );
      return { tagId, tagPosts };
    })
    .filter( section => section.tagPosts.length > 0 );

  return (
    <>
      { sections.map( ( section, sectionIndex ) => {
        const config = tagSeoConfig[section.tagId];
        return (
          <section
            key={ section.tagId }
            id={ `tag-${section.tagId}` }
            className={ styles.tagSection }
          >
            <header className={ styles.tagSectionHeader }>
              <h2>
                <Link href={ `/tags/${section.tagId}` }>{ config.title }</Link>
              </h2>
              <Link href={ `/tags/${section.tagId}` } className={ styles.seeAll }>
                See all →
              </Link>
            </header>
            <BlogPostList
              posts={ section.tagPosts }
              page={ 1 }
              tagId={ section.tagId }
              firstCardPriority={ sectionIndex === 0 }
            />
          </section>
        );
      })}
    </>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn test src/__tests__/components/TaggedPostSections.test.tsx`
Expected: PASS — all six tests green.

- [ ] **Step 5: Run lint + typecheck**

Run: `yarn lint`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/Home/TaggedPostSections.tsx src/__tests__/components/TaggedPostSections.test.tsx
git commit -m "feat: add TaggedPostSections component"
```

---

### Task 9: Replace `pages/index.tsx` with sectioned `Home`

**Files:**
- Modify: `src/pages/index.tsx` (full replacement)

Wires `TaggedPostSections`, `JsonLd`, and `homepageSchema` together. Owns its own `getStaticProps` that calls `generateFeeds` unconditionally (this code path only fires from `/`).

- [ ] **Step 1: Replace `pages/index.tsx`**

Replace the entire file with:

```typescript
import Link from "next/link";
import styles from "@/styles/Home.module.scss";
import { BlogPosts, getBlogPosts, getTags } from "@/utils/contentfulUtils";
import { Layout } from "@/components/Layout/Layout";
import { TagCollection } from "contentful";
import TaggedPostSections from "@/components/Home/TaggedPostSections";
import { generateFeeds } from "@/lib/generateFeeds";
import { buildHomepageSchema } from "@/lib/homepageSchema";
import { JsonLd } from "@/components/JsonLd";
import { META_DESCRIPTION, META_IMAGE, META_TITLE, SITE_URL } from "@/constants";
import { SeoHead } from "@/components/SeoHead";
import { TagSeoConfigMap } from "@/types/tagConfig";
import tagSeoConfigData from "../../data/tags.json";
import { validateTagSeoConfig } from "@/utils/tagSeoConfig";

export interface HomeProps {
  posts: BlogPosts;
  tags: TagCollection;
  tagSeoConfig: TagSeoConfigMap;
  schema: ReturnType<typeof buildHomepageSchema>;
}

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
  const contentfulTagIds = tags.items.map( tag => tag.sys.id );
  validateTagSeoConfig( tagSeoConfig, contentfulTagIds );

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

- [ ] **Step 2: Run typecheck**

Run: `yarn typecheck`
Expected: PASS — every consumer of `Home` now imports from a different path; the three archive shells import `BlogArchive` instead.

- [ ] **Step 3: Run lint**

Run: `yarn lint`
Expected: PASS

- [ ] **Step 4: Run the test suite**

Run: `yarn test`
Expected: PASS — no Home/index test exists; TaggedPostSections, BlogPostList, Picture, JsonLd, homepageSchema tests all pass.

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.tsx
git commit -m "feat: convert home page to tag-section layout"
```

---

### Task 10: Add SCSS for the new section styles

**Files:**
- Modify: `src/styles/Home.module.scss`

Add styling for `.tagSection`, `.tagSectionHeader`, `.seeAll`, `.allPostsLink`. Existing classes (`.tagNav`, `.tag`, `.tagActive`, `.imageGallery`, `.pagination`) stay — they're still used by `BlogArchive`.

- [ ] **Step 1: Append the new styles**

Append to `src/styles/Home.module.scss` (after the existing rules):

```scss
.tagSection {
  width: 100%;
  margin-bottom: 4rem;

  &:last-of-type {
    margin-bottom: 2rem;
  }
}

.tagSectionHeader {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  width: 100%;
  padding: 0 0.75rem;
  margin-bottom: 1.5rem;

  @media (min-width: 800px) {
    padding-left: 2rem;
    padding-right: 2rem;
  }

  @media (min-width: 872px) {
    padding-left: 2.5rem;
    padding-right: 2.5rem;
  }

  @media (min-width: 1100px) {
    padding-left: 3.5rem;
    padding-right: 3.5rem;
  }

  @media (min-width: 1600px) {
    padding-left: 4.5rem;
    padding-right: 4.5rem;
  }

  > h2 {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 700;

    > a {
      text-decoration: none;
      color: inherit;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}

.seeAll {
  font-size: 0.95rem;
  font-weight: 500;
  text-decoration: none;
  opacity: 0.7;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
}

.allPostsLink {
  display: inline-block;
  margin: 3rem auto 4rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 8px;
  transition: background 0.2s ease, border-color 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.4);
  }

  @media (prefers-color-scheme: light) {
    border-color: rgba(0, 0, 0, 0.25);

    &:hover {
      background: rgba(0, 0, 0, 0.05);
      border-color: rgba(0, 0, 0, 0.4);
    }
  }
}
```

The padding values on `.tagSectionHeader` mirror the breakpoint progression already used by `.imageGallery` so the section heading aligns with the cards below it.

- [ ] **Step 2: Run lint**

Run: `yarn lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/styles/Home.module.scss
git commit -m "feat: style tag sections and Browse all posts link"
```

---

### Task 11: Final verification

**Files:**
- (No file changes — verification only.)

- [ ] **Step 1: Run the full test suite**

Run: `yarn test`
Expected: PASS — every existing test (BlogPostList, Pagination, generateFeeds, etc.) plus the four new tests (Picture, JsonLd, homepageSchema, TaggedPostSections) green.

- [ ] **Step 2: Run lint**

Run: `yarn lint`
Expected: PASS — ESLint + TypeScript typecheck.

- [ ] **Step 3: Run the production build**

Run: `yarn build`
Expected: PASS — Next.js export succeeds. All four route patterns (`/`, `/page/[page]`, `/tags/[tagId]`, `/tags/[tagId]/page/[page]`) generate without error. `public/rss.xml`, `public/atom.xml`, `public/feed.json`, and `public/sitemap*.xml` exist.

- [ ] **Step 4: Spot-check the generated home HTML**

Run: `head -200 dist/index.html | grep -E '(application/ld\+json|tag-section|loading=|fetchpriority=|Browse all posts)' || true`

Expected output contains:
- `<script type="application/ld+json">` line with the schema body.
- One `<img>` with `loading="eager"` and `fetchpriority="high"` (the first card of the first section).
- Multiple `<img>` with `loading="lazy"` (every other card).
- `Browse all posts →` link text.

If any expectation is missing, fix the underlying issue before proceeding.

- [ ] **Step 5: Verify the JSON-LD parses as valid JSON**

Extract the `application/ld+json` block from `dist/index.html` and pipe through `python3 -c "import json,sys;json.loads(sys.stdin.read())"` (or any JSON validator). The fact that no parsing error occurs confirms the `<` escape did not corrupt the JSON.

- [ ] **Step 6: Confirm CLAUDE.md is still accurate**

Skim `CLAUDE.md`'s Architecture → Routing table. The four route patterns and their files haven't changed at the URL level, so the table needs no update. Confirm this; if anything is now stale, fix it in this same task.

- [ ] **Step 7: Push the branch and open the PR**

```bash
git push -u origin tag-sections-index
gh pr create --title "feat: convert home page to tag-section layout" --body "$(cat <<'EOF'
## Summary
- Home page (`/`) now renders one section per Contentful tag with the 3 most recent posts in each, instead of a flat paginated list.
- The flat paginated archive remains at `/page/[page]`, reachable via a "Browse all posts →" link at the bottom of the home page.
- Tag pages (`/tags/[tagId]` and `/tags/[tagId]/page/[page]`) render unchanged via a new shared `BlogArchive` component.
- Adds `CollectionPage` JSON-LD on the home page and threads a `priority` flag through `Picture` so only the LCP image loads eagerly.

## Test plan
- [ ] `yarn test` — all suites pass (Picture, JsonLd, homepageSchema, TaggedPostSections, BlogPostList, etc.)
- [ ] `yarn lint` — clean
- [ ] `yarn build` — succeeds; `dist/index.html` contains JSON-LD, exactly one eager image, and lazy attributes on the rest.
- [ ] Visit `/` — see 10 tag sections (or fewer if some tags are empty), each with up to 3 cards.
- [ ] Visit `/page/2` — flat archive view unchanged.
- [ ] Visit `/tags/dj` — tag page unchanged.
- [ ] Verify JSON-LD parses (Google's Rich Results Test, or `python3 -c "json.loads(...)"`).

Spec: `docs/superpowers/specs/2026-04-27-tag-sections-index-design.md`
EOF
)"
```

---

## Self-review

**Spec coverage** — every decision row in the spec maps to a task:

| Spec decision | Task |
|---|---|
| Index → sectioned, `/page/[page]` stays flat | 6, 7, 9 |
| All tags get a section (lazy below the fold) | 2, 3, 8 |
| Alphabetical section ordering | 8 |
| Most recent 3 posts per section | 8 |
| Cross-tag duplicates allowed | 8 |
| Tags with <3 posts render with what exists | 8 |
| Tags with 0 posts omitted | 8 |
| No tag nav on home | 9 |
| "Browse all posts" footer link | 9, 10 |
| LCP / CLS handling | 2, 3 |
| `CollectionPage` JSON-LD | 4, 5, 9 |
| `JsonLd` component centralises raw injection | 4 |
| `BlogArchive` extraction | 6, 7 |
| `getArchiveStaticProps` shared by archive routes | 6, 7 |
| `POSTS_PER_TAG_SECTION` constant | 1 |
| New SCSS classes | 10 |

**Files mentioned in the spec, mapped to tasks:**
- `src/components/Home/TaggedPostSections.tsx` → Task 8
- `src/components/BlogArchive/BlogArchive.tsx` → Task 6
- `src/components/BlogArchive/getStaticProps.ts` → Task 6
- `src/lib/homepageSchema.ts` → Task 5
- `src/components/JsonLd.tsx` → Task 4
- `src/pages/index.tsx` → Task 9
- `src/pages/page/[page].tsx`, `src/pages/tags/[tagId].tsx`, `src/pages/tags/[tagId]/page/[page].tsx` → Task 7
- `src/components/Picture.tsx` → Task 2
- `src/components/Home/BlogPostList.tsx` → Task 3
- `src/styles/Home.module.scss` → Task 10
- `src/constants.ts` → Task 1

**`Picture` audit note** — the spec calls for an audit of every `Picture` call site outside the home. Survey result: `Picture` is imported in exactly two places — `src/components/Home/BlogPostList.tsx` (handled by Task 3's `firstCardPriority` flag) and `src/components/MediaFigure.tsx` (used inside `Markdown` rendering for in-content post body images, which are correctly served lazy). The post detail page (`src/pages/post/[slug].tsx`) uses `next/image` directly, not the local `Picture` component — its LCP is unaffected. No additional audit changes needed; the spec's audit obligation is discharged by this survey.

**CLS** — `src/styles/Home.module.scss:175` already sets `aspect-ratio: 4/3` on `.imageGallery li figure picture > img`, so the multi-image layout is CLS-stable without further work.

**Type consistency** — `BlogPostList`'s new `firstCardPriority` prop is named identically across Tasks 3 and 8. `Picture`'s new `priority` prop is named identically across Tasks 2 and 3. `JsonLd`'s `schema` prop matches across Tasks 4 and 9. `buildHomepageSchema` matches across Tasks 5 and 9.

**Placeholders** — none. Every code step contains the actual code.

**Scope** — single-feature change. Fits one plan.
