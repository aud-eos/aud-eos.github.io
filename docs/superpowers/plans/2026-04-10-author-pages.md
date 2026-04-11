# Author Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add public author profile pages at `/author/[slug]` showing avatar, name, and markdown bio, and update blog post pages to link to them.

**Architecture:** The Contentful `author` content type gets two new fields (`slug`, `bio`). Two new data-layer functions (`getAuthors`, `getAuthor`) follow the same pattern as the existing `getBlogPosts`/`getBlogPost` pair. A new Next.js page at `pages/author/[slug].tsx` handles static path generation and rendering; the existing blog post page's hardcoded `href="/"` author link is updated to point to the real author URL.

**Tech Stack:** Next.js (static export), Contentful CMS, TypeScript, SCSS Modules, `react-markdown` (via existing `<Markdown>` component)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| Contentful CMS | Manual edit | Add `slug` + `bio` fields to `author` content type |
| `src/types/contentful/TypeAuthor.ts` | Auto-regenerated | TypeScript shape for author entries |
| `src/constants.ts` | Modify | Add `CONTENT_TYPE_AUTHOR` constant |
| `src/utils/contentfulUtils.ts` | Modify | Add `Author`, `AuthorCollection` types + `getAuthors()`, `getAuthor()` |
| `src/pages/author/[slug].tsx` | Create | Author page component + `getStaticProps` + `getStaticPaths` |
| `src/styles/Author.module.scss` | Create | Scoped styles for the author page |
| `src/pages/post/[slug].tsx` | Modify | Update hardcoded `href="/"` author link to `/author/[slug]` |

---

## Task 1: Add Contentful fields and regenerate types

**Files:**
- Manual: Contentful CMS — `author` content type
- Auto-modified: `src/types/contentful/TypeAuthor.ts`

This task is manual (Contentful web app) plus one terminal command. All later tasks depend on it — the types will not compile until `slug` and `bio` exist on the `TypeAuthorFields` interface.

- [ ] **Step 1: Add `slug` field in Contentful**

  In the Contentful web app, open **Content model → Author → Add field**:
  - Type: **Short text**
  - Field name: `slug`
  - Field ID: `slug`
  - Mark as **Required**
  - Enable **Unique** validation

- [ ] **Step 2: Add `bio` field in Contentful**

  Still in **Content model → Author → Add field**:
  - Type: **Long text**
  - Field name: `bio`
  - Field ID: `bio`
  - Leave optional (no required check)

- [ ] **Step 3: Populate slug and bio for all existing author entries**

  In **Content → Author**, open each author entry and fill in:
  - `slug`: URL-safe lowercase string, e.g. `benny-stein` (no spaces, no special chars)
  - `bio`: Markdown text (optional — can be left empty for now)

  **Important:** `fallback: false` in `getStaticPaths` means the build will fail if any author entry has no slug. All entries must be populated before running `yarn build`.

- [ ] **Step 4: Regenerate TypeScript types**

  ```bash
  yarn cf-content-types-generator \
    --spaceId $CONTENTFUL_SPACE_ID \
    --token $CONTENTFUL_MANAGEMENT_API_ACCESS_TOKEN \
    --out src/types/contentful
  ```

- [ ] **Step 5: Verify the regenerated type contains the new fields**

  Open `src/types/contentful/TypeAuthor.ts` and confirm `TypeAuthorFields` now includes:

  ```ts
  slug: EntryFieldTypes.Symbol;
  bio?: EntryFieldTypes.Text;
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add src/types/contentful/TypeAuthor.ts
  git commit -m "chore: regenerate Contentful types with author slug and bio fields"
  ```

---

## Task 2: Add constant and data utilities

**Files:**
- Modify: `src/constants.ts`
- Modify: `src/utils/contentfulUtils.ts`

- [ ] **Step 1: Add the author content type constant**

  In `src/constants.ts`, add after the `CONTENT_TYPE_BLOG_POST` line:

  ```ts
  export const CONTENT_TYPE_AUTHOR = "author";
  ```

- [ ] **Step 2: Add Author types and functions to contentfulUtils.ts**

  The current imports in `src/utils/contentfulUtils.ts` are:

  ```ts
  import { strict as assert } from "assert";
  import { createClient, Entry, EntryCollection, EntryFields, TagCollection } from "contentful";
  import { TypeBlogPostSkeleton } from "@/types";
  import { CONTENT_TYPE_BLOG_POST } from "@/constants";
  ```

  Update to:

  ```ts
  import { strict as assert } from "assert";
  import { createClient, Entry, EntryCollection, EntryFields, TagCollection } from "contentful";
  import { TypeAuthorSkeleton, TypeBlogPostSkeleton } from "@/types";
  import { CONTENT_TYPE_AUTHOR, CONTENT_TYPE_BLOG_POST } from "@/constants";
  ```

- [ ] **Step 3: Add the exported types and functions**

  After the existing `export type BlogPost = ...` lines (around line 24), add:

  ```ts
  export type AuthorCollection = EntryCollection<TypeAuthorSkeleton, "WITHOUT_UNRESOLVABLE_LINKS", string>;
  export type Author = Entry<TypeAuthorSkeleton, "WITHOUT_UNRESOLVABLE_LINKS", string>;
  ```

  After the `getTags` function at the end of the file, add:

  ```ts
  export const getAuthors = async (): Promise<AuthorCollection> => {
    const response = await client.withoutUnresolvableLinks.getEntries<TypeAuthorSkeleton>({
      content_type: CONTENT_TYPE_AUTHOR,
    });
    return response;
  };

  export const getAuthor = async (slug: string): Promise<Author | undefined> => {
    const response = await client.withoutUnresolvableLinks.getEntries<TypeAuthorSkeleton>({
      content_type: CONTENT_TYPE_AUTHOR,
      "fields.slug": slug,
    });
    return response.items[0];
  };
  ```

- [ ] **Step 4: Format and typecheck**

  ```bash
  yarn format && yarn typecheck
  ```

  Expected: no errors.

- [ ] **Step 5: Commit**

  ```bash
  git add src/constants.ts src/utils/contentfulUtils.ts
  git commit -m "feat: add getAuthors and getAuthor data utilities"
  ```

---

## Task 3: Create the author page and styles

**Files:**
- Create: `src/pages/author/[slug].tsx`
- Create: `src/styles/Author.module.scss`

- [ ] **Step 1: Create `src/styles/Author.module.scss`**

  ```scss
  .main {
    display: flex;
    flex-direction: column;
    margin-bottom: 1rem;

    > article {
      > header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 2rem;

        > img {
          border-radius: 100%;
          border: 0.2rem solid gold;
          flex-shrink: 0;
        }

        > h1 {
          font-size: xx-large;
          margin: 0;
        }
      }
    }
  }
  ```

- [ ] **Step 2: Create `src/pages/author/[slug].tsx`**

  ```tsx
  import { FC } from "react";
  import { GetStaticPropsContext } from "next";
  import Head from "next/head";
  import Image from "next/image";
  import { Author, getAuthor, getAuthors } from "@/utils/contentfulUtils";
  import { SITE_URL } from "@/constants";
  import styles from "@/styles/Author.module.scss";
  import { Layout } from "@/components/Layout/Layout";
  import { Markdown } from "@/components/Markdown";

  const AVATAR_SIZE = 80;

  export interface AuthorPageProps {
    author: Author
  }

  export const AuthorPage: FC<AuthorPageProps> = ({ author }) => {
    const authorName = author.fields.name;
    const avatarUrl = author.fields.image?.fields.file?.url;
    const avatarSrc = avatarUrl ? `https:${avatarUrl}?w=${AVATAR_SIZE}` : null;
    const bio = author.fields.bio || "";
    const metaDescription = bio.slice( 0, 160 ) || `Posts by ${authorName} on Audeos.com`;
    const metaTitle = `${authorName} | Audeos.com`;
    const canonicalUrl = `${SITE_URL}/author/${author.fields.slug}`;

    return (
      <>
        <Head>
          <title>{ metaTitle }</title>
          <link rel="canonical" href={ canonicalUrl } />
          <meta name="description" content={ metaDescription } key="desc" />
          <meta property="og:type" content="profile" />
          <meta property="og:url" content={ canonicalUrl } />
          <meta property="og:title" content={ metaTitle } />
          <meta property="og:description" content={ metaDescription } />
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:title" content={ metaTitle } />
          <meta name="twitter:description" content={ metaDescription } />
        </Head>
        <Layout>
          <main className={ styles.main }>
            <article>
              <header>
                { avatarSrc && (
                  <Image
                    src={ avatarSrc }
                    alt={ authorName }
                    width={ AVATAR_SIZE }
                    height={ AVATAR_SIZE }
                    priority
                  />
                ) }
                <h1>{ authorName }</h1>
              </header>
              <Markdown>{ bio }</Markdown>
            </article>
          </main>
        </Layout>
      </>
    );
  };

  export async function getStaticProps( context: GetStaticPropsContext ) {
    const slug = context.params?.slug;
    if( typeof slug !== "string" ) {
      return { notFound: true };
    }
    const author = await getAuthor( slug );
    if( !author ) {
      return { notFound: true };
    }
    return {
      props: { author },
    };
  }

  export async function getStaticPaths() {
    const authors = await getAuthors();
    const paths = authors.items.map( author => ({
      params: { slug: author.fields.slug as string },
    }));
    return {
      paths,
      fallback: false,
    };
  }

  export default AuthorPage;
  ```

- [ ] **Step 3: Format and typecheck**

  ```bash
  yarn format && yarn typecheck
  ```

  Expected: no errors.

- [ ] **Step 4: Commit**

  ```bash
  git add src/pages/author/[slug].tsx src/styles/Author.module.scss
  git commit -m "feat: add author profile page at /author/[slug]"
  ```

---

## Task 4: Update the blog post author link

**Files:**
- Modify: `src/pages/post/[slug].tsx`

The author byline currently links to `href="/"` (line ~116). Update it to link to the author's profile page.

- [ ] **Step 1: Update the author link href**

  In `src/pages/post/[slug].tsx`, find this block (around line 114–118):

  ```tsx
  !!authorName &&
    <b>
      By <Link rel="author" href="/">{ authorName }</Link>
      { ` on ` } <DateTimeFormat timestamp={ post.fields.date || post.sys.createdAt } />
    </b>
  ```

  Replace with:

  ```tsx
  !!authorName &&
    <b>
      By <Link rel="author" href={ `/author/${post.fields.author?.fields.slug}` }>{ authorName }</Link>
      { ` on ` } <DateTimeFormat timestamp={ post.fields.date || post.sys.createdAt } />
    </b>
  ```

- [ ] **Step 2: Format and typecheck**

  ```bash
  yarn format && yarn typecheck
  ```

  Expected: no errors.

- [ ] **Step 3: Verify with a build**

  ```bash
  yarn build
  ```

  Expected: build completes, `dist/author/` directory contains one subdirectory per author slug (e.g. `dist/author/benny-stein/index.html`).

- [ ] **Step 4: Commit**

  ```bash
  git add src/pages/post/[slug].tsx
  git commit -m "feat: link author byline on post pages to /author/[slug]"
  ```
