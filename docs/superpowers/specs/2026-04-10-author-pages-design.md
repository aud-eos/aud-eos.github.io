# Author Pages — Design Spec

**Date:** 2026-04-10

## Overview

Add public author profile pages at `/author/[slug]` to the Audeos.com Next.js static site. Each page shows the author's avatar, name, and markdown bio. Blog post pages will link to the author's profile page instead of the current placeholder `href="/"`.

## Contentful Changes

Add two fields to the existing `author` content type:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `slug` | Symbol (short text) | Yes | URL identifier, must be unique across authors |
| `bio` | Text (long text) | No | Markdown format |

After adding the fields and populating them for all existing author entries, regenerate TypeScript types:

```bash
yarn cf-content-types-generator --spaceId $CONTENTFUL_SPACE_ID --token $CONTENTFUL_MANAGEMENT_API_ACCESS_TOKEN --out src/types/contentful
```

## Data Layer

Add two functions to `src/utils/contentfulUtils.ts`:

```ts
getAuthors(): Promise<AuthorCollection>
getAuthor(slug: string): Promise<Author | undefined>
```

- `getAuthors` fetches all `author` entries via the Contentful client
- `getAuthor` queries by `fields.slug` and returns the first match (or `undefined`)
- Export `AuthorCollection` and `Author` types (analogous to `BlogPosts`/`BlogPost`)
- No changes needed to `getBlogPosts` — author data is already embedded via `WITHOUT_UNRESOLVABLE_LINKS` link resolution

## Routing

New page: `src/pages/author/[slug].tsx`

- `getStaticPaths`: calls `getAuthors()`, maps each author's `fields.slug` to a path param
- `getStaticProps`: calls `getAuthor(slug)`, returns the author entry as a prop; returns `{ notFound: true }` if not found
- `fallback: false` (static export requirement)

## Page Component

The `AuthorPage` component renders inside the existing `<Layout>` (narrow, not fullwidth — matching the post page). Structure:

```
<Head> — title, canonical, OG/Twitter meta, description from bio excerpt
<Layout>
  <main>
    <article>
      <header>
        <Image>  — avatar (e.g. 80×80px, rounded)
        <h1>     — author name
      </header>
      <Markdown> — bio (reuses existing Markdown component)
    </article>
  </main>
</Layout>
```

Meta title: `{name} | Audeos.com`
Canonical URL: `{SITE_URL}/author/{slug}`
OG description: first 160 chars of bio, or a fallback like `"Posts by {name} on Audeos.com"`

## Styling

New file: `src/styles/Author.module.scss`

Layout: left-aligned stacked — avatar and name displayed inline in a row (matching the post header byline pattern), bio rendered below as a block. No sidebar, no centering.

## Blog Post Page Update

In `src/pages/post/[slug].tsx`, the author link currently uses `href="/"` as a placeholder. Update it to:

```tsx
href={`/author/${post.fields.author?.fields.slug}`}
```

The link should only render if `post.fields.author?.fields.slug` is defined.

## Out of Scope

- List of posts by author on the author page (not included)
- Extracting a shared `AuthorCard` component (not needed yet)
- Pagination of author pages
